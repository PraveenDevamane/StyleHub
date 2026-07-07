import { useQuery } from '@tanstack/react-query';
import { db } from '@/services/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as firestoreLimit, addDoc } from 'firebase/firestore';
import { Product, Category } from '@/types';

const DEFAULT_CATEGORIES = [
  'Footwear',
  'Dress',
  'Saree',
  'Accessories',
  'T-Shirts',
  'Jeans',
  'Kurta',
  'Lehenga',
  'Shirts',
  'Jackets',
  'Sportswear',
  'Winterwear',
  'Kids Wear',
  'Bags',
  'Watches',
];

// Helper to resolve categories and products together
async function getCategoriesMap(): Promise<Map<string, string>> {
  const catSnap = await getDocs(collection(db, 'categories'));
  const map = new Map<string, string>();
  catSnap.forEach((doc) => {
    map.set(doc.id, doc.data().name || '');
  });
  return map;
}

// Fetch all categories
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const q = query(collection(db, 'categories'), orderBy('name'));
      let snap = await getDocs(q);

      if (snap.empty) {
        const now = new Date().toISOString();
        const promises = DEFAULT_CATEGORIES.map((name) =>
          addDoc(collection(db, 'categories'), {
            name,
            image_url: null,
            created_at: now,
          })
        );
        await Promise.all(promises);
        snap = await getDocs(q);
      }

      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
    },
  });
}

interface ProductFilters {
  categoryId?: string;
  subcategory?: string;
  searchQuery?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
  featured?: boolean;
  limit?: number;
}

// Fetch products based on filters
export function useProducts(filters: ProductFilters = {}) {
  return useQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: async () => {
      const categoriesMap = await getCategoriesMap();
      let q = query(collection(db, 'products'));

      const snap = await getDocs(q);
      let productsList = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          categories: {
            name: categoriesMap.get(data.category_id) || 'Unknown',
          },
          product_images: (data.image_urls || []).map((url: string) => ({
            image_url: url,
          })),
        } as any;
      });

      // Apply client-side filters to avoid missing index errors
      if (filters.categoryId) {
        productsList = productsList.filter((p) => p.category_id === filters.categoryId);
      }
      if (filters.subcategory) {
        productsList = productsList.filter((p) => p.subcategory === filters.subcategory);
      }
      if (filters.featured !== undefined) {
        productsList = productsList.filter((p) => p.featured === filters.featured);
      }
      if (filters.searchQuery) {
        const term = filters.searchQuery.toLowerCase();
        productsList = productsList.filter((p) => p.name.toLowerCase().includes(term));
      }

      // Sort
      if (filters.sortBy === 'price_asc') {
        productsList.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === 'price_desc') {
        productsList.sort((a, b) => b.price - a.price);
      } else {
        // newest
        productsList.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      }

      if (filters.limit) {
        productsList = productsList.slice(0, filters.limit);
      }

      return productsList;
    },
  });
}

// Fetch a single product by ID
export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Product not found');

      const data = docSnap.data();
      const categoriesMap = await getCategoriesMap();

      return {
        id: docSnap.id,
        ...data,
        categories: {
          name: categoriesMap.get(data.category_id) || 'Unknown',
        },
        product_images: (data.image_urls || []).map((url: string) => ({
          image_url: url,
        })),
      } as any;
    },
    enabled: !!id,
  });
}

// Fetch featured products
export function useFeaturedProducts() {
  return useProducts({ featured: true, limit: 6 });
}

// Fetch new arrivals
export function useNewArrivals() {
  return useProducts({ limit: 6 });
}

// Fetch trending products (simulated order by lower stock)
export function useTrendingProducts() {
  return useQuery<Product[]>({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      const categoriesMap = await getCategoriesMap();
      const snap = await getDocs(query(collection(db, 'products'), orderBy('stock_quantity', 'asc'), firestoreLimit(6)));
      return snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          categories: {
            name: categoriesMap.get(data.category_id) || 'Unknown',
          },
          product_images: (data.image_urls || []).map((url: string) => ({
            image_url: url,
          })),
        } as any;
      });
    },
  });
}

// Fetch similar products in the same category
export function useSimilarProducts(categoryId: string, excludeProductId: string) {
  return useQuery<Product[]>({
    queryKey: ['products', 'similar', categoryId, excludeProductId],
    queryFn: async () => {
      if (!categoryId) return [];
      const categoriesMap = await getCategoriesMap();
      const snap = await getDocs(query(collection(db, 'products'), where('category_id', '==', categoryId), firestoreLimit(5)));
      const list = snap.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            categories: {
              name: categoriesMap.get(data.category_id) || 'Unknown',
            },
            product_images: (data.image_urls || []).map((url: string) => ({
              image_url: url,
            })),
          } as any;
        })
        .filter((p) => p.id !== excludeProductId)
        .slice(0, 4);

      return list;
    },
    enabled: !!categoryId,
  });
}
