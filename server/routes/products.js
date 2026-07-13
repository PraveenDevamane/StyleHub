const express = require('express');
const router = express.Router();
const { db } = require('../firebase-config');
const { requireAdmin } = require('../services/authService');
const {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit: firestoreLimit
} = require('firebase/firestore');
const { classifyStorageLocation } = require('../services/locationClassifier');
const {
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
} = require('../services/firestoreRest');

// Helper to resolve categories
async function getCategoriesMap() {
  try {
    const catSnap = await getDocs(collection(db, 'categories'));
    const map = new Map();
    catSnap.forEach((doc) => {
      map.set(doc.id, doc.data().name || '');
    });
    return map;
  } catch (err) {
    console.error('Error fetching categories map:', err);
    return new Map();
  }
}

// Normalize search text
function normalizeSearchTerm(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// GET all products (with optional filtering, sorting, and limit)
router.get('/', async (req, res) => {
  try {
    const { categoryId, subcategory, searchQuery, sortBy, featured, limit: limitVal } = req.query;

    const categoriesMap = await getCategoriesMap();
    const q = query(collection(db, 'products'));
    const snap = await getDocs(q);

    let products = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        categories: {
          name: categoriesMap.get(data.category_id) || 'Unknown',
        },
        product_images: (data.image_urls || []).map((url) => ({
          image_url: url,
        })),
      };
    });

    // Apply filters
    if (categoryId) {
      products = products.filter((p) => p.category_id === categoryId);
    }
    if (subcategory) {
      products = products.filter((p) => p.subcategory === subcategory);
    }
    if (featured !== undefined) {
      const isFeatured = featured === 'true';
      products = products.filter((p) => p.featured === isFeatured);
    }
    if (searchQuery) {
      const term = searchQuery.trim().toLowerCase();
      const compactTerm = normalizeSearchTerm(searchQuery);

      products = products.filter((p) => {
        const searchableValues = [
          p.name,
          p.product_code,
          p.subcategory,
          p.categories?.name,
          ...(p.tags || []),
        ].filter(Boolean);

        const searchableText = searchableValues.join(' ').toLowerCase();
        const searchableCompact = normalizeSearchTerm(searchableValues.join(' '));

        return searchableText.includes(term) || searchableCompact.includes(compactTerm);
      });
    }

    // Apply sorting
    if (sortBy === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else {
      // Default: newest
      products.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    // Apply limit
    if (limitVal) {
      const parsedLimit = parseInt(limitVal, 10);
      if (!isNaN(parsedLimit)) {
        products = products.slice(0, parsedLimit);
      }
    }

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST to classify location for product editor
router.post('/classify', requireAdmin, (req, res) => {
  try {
    const { name, description, categoryName, subcategoryName } = req.body;
    const suggestions = classifyStorageLocation(name, description, categoryName, subcategoryName);
    res.json(suggestions);
  } catch (err) {
    console.error('Classification error:', err);
    res.status(500).json({ error: 'Failed to classify location' });
  }
});

// GET recent inventory logs
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const logs = (await listDocuments('inventory_logs', req.firebaseIdToken, {
      orderBy: 'created_at desc',
      pageSize: 5,
    })).map((data) => ({
      id: data.id,
      ...data,
      products: {
        name: data.product_name || 'Unknown Product',
      },
    }));

    res.json(logs);
  } catch (err) {
    console.error('Error fetching inventory logs:', err);
    res.status(500).json({ error: 'Failed to fetch inventory logs' });
  }
});

// GET single product by ID (including similar products)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Product ID is required' });

    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const data = docSnap.data();
    const categoriesMap = await getCategoriesMap();

    const product = {
      id: docSnap.id,
      ...data,
      categories: {
        name: categoriesMap.get(data.category_id) || 'Unknown',
      },
      product_images: (data.image_urls || []).map((url) => ({
        image_url: url,
      })),
    };

    // Fetch similar products (same category, limit 4, exclude current)
    let similarProducts = [];
    if (data.category_id) {
      const q = query(
        collection(db, 'products'),
        where('category_id', '==', data.category_id),
        firestoreLimit(5)
      );
      const similarSnap = await getDocs(q);
      similarProducts = similarSnap.docs
        .map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            categories: {
              name: categoriesMap.get(d.category_id) || 'Unknown',
            },
            product_images: (d.image_urls || []).map((url) => ({
              image_url: url,
            })),
          };
        })
        .filter((p) => p.id !== id)
        .slice(0, 4);
    }

    res.json({ product, similarProducts });
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Whitelist of allowed product fields to prevent mass assignment
const ALLOWED_PRODUCT_FIELDS = [
  'name', 'description', 'price', 'discounted_price',
  'stock_quantity', 'featured', 'category_id', 'subcategory',
  'product_code', 'tags', 'storage_location', 'image_urls'
];

function sanitizeProductData(body) {
  const clean = {};
  for (const key of ALLOWED_PRODUCT_FIELDS) {
    if (body[key] !== undefined) {
      clean[key] = body[key];
    }
  }
  // Normalize numeric and boolean fields
  clean.price = parseFloat(clean.price) || 0;
  clean.discounted_price = clean.discounted_price ? parseFloat(clean.discounted_price) : null;
  clean.stock_quantity = parseInt(clean.stock_quantity, 10) || 0;
  clean.featured = !!clean.featured;
  return clean;
}

// POST to create a product
router.post('/', requireAdmin, async (req, res) => {
  try {
    const productData = sanitizeProductData(req.body);
    productData.created_at = new Date().toISOString();

    const createdProduct = await createDocument('products', productData, req.firebaseIdToken);
    res.status(201).json(createdProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT to update a product
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = sanitizeProductData(req.body);

    await updateDocument('products', id, updateData, req.firebaseIdToken);

    res.json({ success: true, id });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE a product
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDocument('products', id, req.firebaseIdToken);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
