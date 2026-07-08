import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Camera, X, Plus } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useCategories, useProduct } from '@/hooks/useProducts';
import { db } from '@/services/firebase';
import { uploadToGoogleDrive } from '@/services/googleDrive';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/Button';
import CachedImage from '@/components/CachedImage';
import { classifyStorageLocation, LocationSuggestion } from '@/services/locationClassifier';

// Default categories to auto-seed if Firestore categories collection is empty
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

const SUBCATEGORIES: Record<string, string[]> = {
  footwear: ['Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Sports Shoes', 'Boots', 'Loafers', 'Heels', 'Bellies', 'Kolhapuri'],
  dress: ['Maxi Dress', 'A-Line Dress', 'Bodycon', 'Wrap Dress', 'Shirt Dress', 'Off-Shoulder', 'Cocktail Dress', 'Evening Gown'],
  saree: ['Silk Saree', 'Cotton Saree', 'Chiffon Saree', 'Georgette Saree', 'Banarasi Saree', 'Kanjeevaram', 'Linen Saree', 'Designer Saree'],
  accessories: ['Watches', 'Belts', 'Bags', 'Wallets', 'Sunglasses', 'Hats', 'Jewelry', 'Scarves', 'Hair Accessories', 'Bangles'],
  't-shirts': ['Round Neck', 'V-Neck', 'Polo', 'Oversized', 'Graphic Tees', 'Printed', 'Plain', 'Henley'],
  jeans: ['Slim Fit', 'Straight Fit', 'Skinny', 'Bootcut', 'Wide Leg', 'Ripped', 'High Waist', 'Mom Jeans'],
  kurta: ['Straight Kurta', 'A-Line Kurta', 'Anarkali', 'Kurta Set', 'Pathani', 'Nehru Jacket', 'Sherwani'],
  lehenga: ['Bridal Lehenga', 'Party Wear', 'A-Line Lehenga', 'Circular Lehenga', 'Lehenga Choli', 'Half Saree'],
  shirts: ['Formal Shirts', 'Casual Shirts', 'Linen Shirts', 'Denim Shirts', 'Checked Shirts', 'Printed Shirts'],
  jackets: ['Denim Jacket', 'Leather Jacket', 'Bomber Jacket', 'Windcheater', 'Blazer', 'Puffer Jacket'],
  sportswear: ['Jerseys', 'Track Pants', 'Sports Bra', 'Compression Wear', 'Gym Wear', 'Yoga Wear'],
  winterwear: ['Sweaters', 'Hoodies', 'Coats', 'Thermals', 'Gloves', 'Mufflers', 'Shawls'],
  'kids wear': ['Boys Clothing', 'Girls Clothing', 'Baby Rompers', 'Kids Ethnic', 'School Uniforms', 'Kids Footwear'],
  bags: ['Handbags', 'Backpacks', 'Sling Bags', 'Tote Bags', 'Clutches', 'Laptop Bags', 'Travel Bags'],
  watches: ['Analog', 'Digital', 'Smart Watches', 'Luxury Watches', 'Sports Watches', 'Casual Watches'],
};

interface LocationArea {
  code: string;
  name: string;
  description: string;
  zones: {
    code: string;
    name: string;
    shelves: { code: string; label: string }[];
  }[];
}

const LOCATION_PLAN: LocationArea[] = [
  {
    code: 'LS',
    name: 'Left Storage Room',
    description: 'Main back-stock storage for garments',
    zones: [
      {
        code: 'L',
        name: 'Left Storage Rack',
        shelves: [
          { code: '01', label: 'Shelf 1' },
          { code: '02', label: 'Shelf 2' },
          { code: '03', label: 'Shelf 3' },
          { code: '04', label: 'Shelf 4' },
          { code: 'BT', label: 'Bottom Storage' },
        ],
      },
      {
        code: 'R',
        name: 'Right Storage Rack',
        shelves: [
          { code: '01', label: 'Shelf 1' },
          { code: '02', label: 'Shelf 2' },
          { code: '03', label: 'Shelf 3' },
          { code: '04', label: 'Shelf 4' },
        ],
      },
      {
        code: 'TS',
        name: 'Top Wall Shelf',
        shelves: [{ code: 'TS', label: 'Top Wall Shelf' }],
      },
    ],
  },
  {
    code: 'RS',
    name: 'Right Storage Room',
    description: 'Accessories and small packaged items',
    zones: [
      {
        code: 'AR',
        name: 'Accessory Rack',
        shelves: [
          { code: '01', label: 'Shelf 1' },
          { code: '02', label: 'Shelf 2' },
          { code: '03', label: 'Shelf 3' },
          { code: '04', label: 'Shelf 4' },
          { code: '05', label: 'Shelf 5' },
          { code: 'BT', label: 'Bottom Storage' },
        ],
      },
      {
        code: 'TS',
        name: 'Top Shelf Reserve',
        shelves: [{ code: 'TS', label: 'Top Shelf' }],
      },
    ],
  },
  {
    code: 'SR',
    name: 'Main Showroom',
    description: 'Customer display area',
    zones: [
      {
        code: 'FR',
        name: 'Front Display Rack',
        shelves: [
          { code: '01', label: 'Level 1' },
          { code: '02', label: 'Level 2' },
          { code: '03', label: 'Level 3' },
          { code: '04', label: 'Level 4' },
          { code: '05', label: 'Level 5' },
          { code: '06', label: 'Level 6' },
        ],
      },
      {
        code: 'DT',
        name: 'Center Display Table',
        shelves: [{ code: 'DT', label: 'Main Table Surface' }],
      },
      {
        code: 'DB',
        name: 'Under Display Table',
        shelves: [{ code: 'DB', label: 'Under Table Backup' }],
      },
      {
        code: 'WD',
        name: 'Window Display',
        shelves: [{ code: 'WD', label: 'Window Display' }],
      },
      {
        code: 'FL',
        name: 'Floor Display',
        shelves: [{ code: 'FL', label: 'Floor Display' }],
      },
    ],
  },
  {
    code: 'GD',
    name: 'Glass Display Section',
    description: 'Premium customer-facing display',
    zones: [
      {
        code: 'L',
        name: 'Left Glass Display',
        shelves: [{ code: 'L', label: 'Left Glass Display' }],
      },
      {
        code: 'R',
        name: 'Right Glass Display',
        shelves: [{ code: 'R', label: 'Right Glass Display' }],
      },
      {
        code: 'FW',
        name: 'Footwear Storage',
        shelves: [{ code: 'FW', label: 'Footwear Section' }],
      },
    ],
  },
  {
    code: 'CR',
    name: 'Category Rack',
    description: 'Rack with levels & compartments',
    zones: [
      {
        code: '00',
        name: 'Left Rack',
        shelves: [
          { code: '1', label: 'Compartment 1' },
          { code: '2', label: 'Compartment 2' },
          { code: '3', label: 'Compartment 3' },
        ],
      },
      {
        code: '01',
        name: 'Level 1 (Top)',
        shelves: [{ code: 'Top', label: 'Top Shelf (Garments)' }],
      },
      {
        code: '02',
        name: 'Level 2',
        shelves: [
          { code: 'A', label: 'Dhoti Section (02A)' },
          { code: 'B', label: 'Jeans Bottom (02B)' },
        ],
      },
      {
        code: '03',
        name: 'Level 3',
        shelves: [
          { code: 'A', label: 'Boys Wear (03A)' },
          { code: 'B', label: 'Sarees (03B)' },
        ],
      },
      {
        code: '04',
        name: 'Level 4',
        shelves: [
          { code: 'A', label: 'Girls Wear (04A)' },
          { code: 'B', label: 'Children\'s (04B)' },
        ],
      },
    ],
  },
];

function parseLocationCode(code: string) {
  if (!code) return null;
  const parts = code.split('-');
  if (parts.length < 2) return null;

  const area = parts[0];

  if (area === 'GD') {
    if (parts[1] === 'FW') return { area: 'GD', zone: 'FW', shelf: 'FW' };
    if (parts[1] === 'L') return { area: 'GD', zone: 'L', shelf: 'L' };
    if (parts[1] === 'R') return { area: 'GD', zone: 'R', shelf: 'R' };
  }

  if (area === 'CR') {
    const zoneAndShelf = parts[1];
    // e.g. "02A" -> zone: "02", shelf: "A"
    if (zoneAndShelf.length === 3) {
      return { area: 'CR', zone: zoneAndShelf.substring(0, 2), shelf: zoneAndShelf.substring(2) };
    }
    if (parts.length === 3) {
      return { area: 'CR', zone: parts[1], shelf: parts[2] };
    }
    return { area: 'CR', zone: zoneAndShelf, shelf: zoneAndShelf };
  }

  if (parts.length === 2) {
    return { area: parts[0], zone: parts[1], shelf: parts[1] };
  }

  if (parts.length === 3) {
    return { area: parts[0], zone: parts[1], shelf: parts[2] };
  }

  return null;
}

const productFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Please select a category'),
  subcategory: z.string().min(1, 'Please select or enter a subcategory'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Price must be a positive number'),
  discounted_price: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Discount price must be a positive number'),
  stock_quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) % 1 === 0, 'Stock must be an integer'),
  featured: z.boolean().default(false),
  storage_location: z.string().min(1, 'Please specify where this item is kept in the physical store'),
});

type ProductFormSchema = z.infer<typeof productFormSchema>;

export default function AdminProductEditorScreen() {
  const router = useRouter();
  const { id, locationCode } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const isEditMode = !!id;
  // Existing Drive URLs (already uploaded, used in edit mode)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  // Pending local URIs (not yet uploaded to Drive)
  const [pendingImages, setPendingImages] = useState<{ uri: string; filename: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState('');
  const [selectedAreaCode, setSelectedAreaCode] = useState<string | null>(null);
  const [selectedZoneCode, setSelectedZoneCode] = useState<string | null>(null);
  const [selectedShelfCode, setSelectedShelfCode] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState('');
  const [isCustomLocation, setIsCustomLocation] = useState(false);

  // Load categories and product details (if editing)
  const { data: categories, isLoading: catsLoading, refetch: refetchCats } = useCategories();
  const [seeding, setSeeding] = useState(false);

  // Auto-seed default categories if none exist in Firestore
  useEffect(() => {
    const seedCategories = async () => {
      if (catsLoading || seeding) return;
      if (categories && categories.length === 0) {
        setSeeding(true);
        try {
          const now = new Date().toISOString();
          for (const name of DEFAULT_CATEGORIES) {
            await addDoc(collection(db, 'categories'), {
              name,
              image_url: null,
              created_at: now,
            });
          }
          // Refresh categories after seeding
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          refetchCats();
        } catch (err) {
          console.error('Failed to seed default categories:', err);
        } finally {
          setSeeding(false);
        }
      }
    };
    seedCategories();
  }, [categories, catsLoading]);
  const { data: product, isLoading: productLoading } = useProduct(id as string);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      subcategory: '',
      price: '',
      discounted_price: '',
      stock_quantity: '0',
      featured: false,
      storage_location: '',
    },
  });

  const selectedCategoryId = watch('category_id');
  const nameVal = watch('name');
  const descriptionVal = watch('description');
  const subcategoryVal = watch('subcategory');

  // Case-insensitive lookup: normalize the category name to find subcategories
  const selectedCategoryName = categories?.find((c) => c.id === selectedCategoryId)?.name?.toLowerCase().trim() || '';
  const subcategoryOptions = SUBCATEGORIES[selectedCategoryName] || [];
  const hasPresetSubcategories = subcategoryOptions.length > 0;

  const suggestions = classifyStorageLocation(
    nameVal || '',
    descriptionVal || '',
    selectedCategoryName || '',
    subcategoryVal || ''
  );

  // Populate form in Edit mode or pre-fill location if provided via query param
  useEffect(() => {
    if (isEditMode && product) {
      setValue('name', product.name);
      setValue('description', product.description || '');
      setValue('category_id', product.category_id);
      setValue('subcategory', product.subcategory);
      setValue('price', product.price.toString());
      setValue('discounted_price', product.discounted_price?.toString() || '');
      setValue('stock_quantity', product.stock_quantity.toString());
      setValue('featured', product.featured);
      setValue('storage_location', product.storage_location || '');

      if (product.storage_location) {
        const parsed = parseLocationCode(product.storage_location);
        if (parsed) {
          setSelectedAreaCode(parsed.area);
          setSelectedZoneCode(parsed.zone);
          setSelectedShelfCode(parsed.shelf);
          setIsCustomLocation(false);
        } else {
          setCustomLocation(product.storage_location);
          setIsCustomLocation(true);
        }
      }

      if (product.product_images) {
        setExistingImageUrls(product.product_images.map((img) => img.image_url));
      } else if (product.image_urls) {
        setExistingImageUrls(product.image_urls);
      }
    } else if (!isEditMode && locationCode) {
      setValue('storage_location', locationCode as string);
      const parsed = parseLocationCode(locationCode as string);
      if (parsed) {
        setSelectedAreaCode(parsed.area);
        setSelectedZoneCode(parsed.zone);
        setSelectedShelfCode(parsed.shelf);
        setIsCustomLocation(false);
      } else {
        setCustomLocation(locationCode as string);
        setIsCustomLocation(true);
      }
    }
  }, [isEditMode, product, locationCode]);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to upload product images.');
        return false;
      }
    }
    return true;
  };

  const handlePickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop() || `prod_${Date.now()}.jpg`;
        // Store locally — do NOT upload to Drive yet
        setPendingImages((prev) => [...prev, { uri: localUri, filename }]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An error occurred during image selection.');
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemovePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Total images count (existing + pending)
  const totalImages = existingImageUrls.length + pendingImages.length;

  const handleSelectArea = (areaCode: string) => {
    setSelectedAreaCode(areaCode);
    setSelectedZoneCode(null);
    setSelectedShelfCode(null);
    setValue('storage_location', '');
  };

  const handleSelectZone = (zoneCode: string) => {
    setSelectedZoneCode(zoneCode);
    setSelectedShelfCode(null);

    const area = LOCATION_PLAN.find((a) => a.code === selectedAreaCode);
    const zone = area?.zones.find((z) => z.code === zoneCode);

    if (zone && zone.shelves.length === 1) {
      const singleShelfCode = zone.shelves[0].code;
      setSelectedShelfCode(singleShelfCode);
      const combinedCode = buildLocationCode(selectedAreaCode!, zoneCode, singleShelfCode);
      setValue('storage_location', combinedCode, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue('storage_location', '');
    }
  };

  const handleSelectShelf = (shelfCode: string) => {
    setSelectedShelfCode(shelfCode);
    const combinedCode = buildLocationCode(selectedAreaCode!, selectedZoneCode!, shelfCode);
    setValue('storage_location', combinedCode, { shouldValidate: true, shouldDirty: true });
  };

  const buildLocationCode = (area: string, zone: string, shelf: string): string => {
    if (area === 'GD') {
      return `GD-${shelf}`;
    }
    if (area === 'CR') {
      if (zone === '01') return 'CR-01';
      if (zone === '00') return `CR-00-${shelf}`;
      return `CR-${zone}${shelf}`;
    }
    if (zone === shelf) {
      return `${area}-${zone}`;
    }
    return `${area}-${zone}-${shelf}`;
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setIsCustomLocation(false);
    setSelectedAreaCode(suggestion.areaCode);
    setSelectedZoneCode(suggestion.zoneCode);
    setSelectedShelfCode(suggestion.shelfCode);
    setValue('storage_location', suggestion.code, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data: any) => {
    if (totalImages === 0) {
      Alert.alert('Images Required', 'Please add at least one product image.');
      return;
    }

    setSaving(true);
    try {
      // Upload all pending local images to Google Drive now
      const uploadedUrls: string[] = [];
      for (const img of pendingImages) {
        const driveUrl = await uploadToGoogleDrive(img.uri, img.filename);
        if (driveUrl) {
          uploadedUrls.push(driveUrl);
        } else {
          console.warn(`Failed to upload "${img.filename}" to Google Drive. Falling back to local URI.`);
          uploadedUrls.push(img.uri); // Fallback to local image URL so local testing works seamlessly
        }
      }

      // Merge existing Drive URLs with newly uploaded ones
      const allImageUrls = [...existingImageUrls, ...uploadedUrls];

      const productPayload: any = {
        name: data.name,
        description: data.description || null,
        category_id: data.category_id,
        subcategory: data.subcategory,
        price: parseFloat(data.price),
        discounted_price: data.discounted_price ? parseFloat(data.discounted_price) : null,
        stock_quantity: parseInt(data.stock_quantity),
        featured: data.featured,
        storage_location: data.storage_location || null,
        image_urls: allImageUrls, // Store image URLs directly in the product document
        updated_at: new Date().toISOString(),
      };

      let productId = id as string;

      if (isEditMode) {
        productPayload.product_code = product?.product_code || `SH-${Math.floor(10000 + Math.random() * 90000)}`;
        // Update product metadata in Firestore
        const docRef = doc(db, 'products', productId);
        
        // Log inventory changes client-side if stock modified
        const previousStock = product ? product.stock_quantity : 0;
        const newStock = parseInt(data.stock_quantity);

        await updateDoc(docRef, productPayload);

        if (previousStock !== newStock) {
          const actionType = newStock > previousStock ? 'RESTOCK' : 'SALE';
          await addDoc(collection(db, 'inventory_logs'), {
            product_id: productId,
            product_name: data.name,
            previous_stock: previousStock,
            new_stock: newStock,
            action_type: actionType,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        // Insert new product document in Firestore
        productPayload.product_code = `SH-${Math.floor(10000 + Math.random() * 90000)}`;
        const docRef = await addDoc(collection(db, 'products'), {
          ...productPayload,
          created_at: new Date().toISOString(),
        });
        productId = docRef.id;

        // Log initial inventory entry client-side
        const initialStock = parseInt(data.stock_quantity);
        await addDoc(collection(db, 'inventory_logs'), {
          product_id: productId,
          product_name: data.name,
          previous_stock: 0,
          new_stock: initialStock,
          action_type: 'INITIAL',
          created_at: new Date().toISOString(),
        });
      }

      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['product', productId] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory_logs'] });

      Alert.alert('Success', `Product ${isEditMode ? 'updated' : 'created'} successfully!`, [
        { text: 'OK', onPress: () => router.replace('/admin/products') },
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'An error occurred while saving the product.');
    } finally {
      setSaving(false);
    }
  };

  if (isEditMode && productLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.backgroundSelected }]}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditMode ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Images Picker section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>PRODUCT IMAGES</Text>
        <View style={styles.imageGrid}>
          {/* Show existing Drive images (already uploaded) */}
          {existingImageUrls.map((url, idx) => (
            <View key={`existing-${idx}`} style={[styles.imageThumbWrapper, { borderColor: colors.border }]}>
              <CachedImage source={{ uri: url }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveExistingImage(idx)}>
                <X size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
          ))}
          {/* Show pending local images (not yet uploaded to Drive) */}
          {pendingImages.map((img, idx) => (
            <View key={`pending-${idx}`} style={[styles.imageThumbWrapper, { borderColor: colors.accent }]}>
              <CachedImage source={{ uri: img.uri }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemovePendingImage(idx)}>
                <X size={12} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>LOCAL</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addImageCard, { backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}
            onPress={handlePickImage}
            disabled={saving}
          >
            <Camera size={20} color={colors.text} />
            <Text style={[styles.addImageLabel, { color: colors.textSecondary }]}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Product Details Form */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 24 }]}>PRODUCT METADATA</Text>

        <View style={styles.form}>
          {/* Unique Product ID */}
          {isEditMode && product?.product_code ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>PRODUCT ID CODE</Text>
              <View style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: colors.backgroundSelected,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent }}>
                  {product.product_code}
                </Text>
              </View>
            </View>
          ) : !isEditMode ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>PRODUCT ID CODE</Text>
              <View style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: colors.backgroundSelected,
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                  ✨ Will be automatically assigned upon creation
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={[styles.label, { color: colors.textSecondary }]}>PRODUCT NAME</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: errors.name ? '#FF3B30' : colors.border }]}
                placeholder="Air Force 1 Premium"
                placeholderTextColor={colors.textSecondary}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.name && <Text style={styles.errorText}>{String(errors.name.message)}</Text>}

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>DESCRIPTION</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.textArea, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}
                placeholder="Product description and luxury features..."
                placeholderTextColor={colors.textSecondary}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={4}
              />
            )}
          />

          {/* Category Dropdown (Simulated via list) */}
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>MAIN CATEGORY</Text>
          <View style={styles.dropdownGrid}>
            {(catsLoading || seeding) ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              categories?.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: isSelected ? colors.text : colors.backgroundSelected,
                        borderColor: isSelected ? colors.text : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setValue('category_id', cat.id, { shouldValidate: true, shouldDirty: true });
                      setValue('subcategory', '', { shouldValidate: true, shouldDirty: true }); // Clear subcategory on main change
                      setCustomSubcategory('');
                    }}
                  >
                    <Text style={[styles.choiceText, { color: isSelected ? colors.background : colors.text }]}>
                      {cat.name.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          {errors.category_id && <Text style={styles.errorText}>{String(errors.category_id.message)}</Text>}

          {/* Subcategory Picker */}
          {selectedCategoryId ? (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>SUBCATEGORY</Text>
              {hasPresetSubcategories ? (
                <View style={styles.dropdownGrid}>
                  {subcategoryOptions.map((sub) => {
                    const isSelected = watch('subcategory') === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        style={[
                          styles.choiceChip,
                          {
                            backgroundColor: isSelected ? colors.text : colors.backgroundSelected,
                            borderColor: isSelected ? colors.text : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setCustomSubcategory('');
                          setValue('subcategory', sub, { shouldValidate: true, shouldDirty: true });
                        }}
                      >
                        <Text style={[styles.choiceText, { color: isSelected ? colors.background : colors.text }]}>
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Custom option chip */}
                  <TouchableOpacity
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: customSubcategory ? colors.text : colors.backgroundSelected,
                        borderColor: customSubcategory ? colors.text : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setValue('subcategory', '');
                      setCustomSubcategory(' ');
                    }}
                  >
                    <Text style={[styles.choiceText, { color: customSubcategory ? colors.background : colors.text }]}>
                      + Other
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {/* Show text input when no presets OR when "Other" is selected */}
              {(!hasPresetSubcategories || customSubcategory) ? (
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: errors.subcategory ? '#FF3B30' : colors.border, marginTop: hasPresetSubcategories ? 8 : 0 }]}
                  placeholder="Enter subcategory name..."
                  placeholderTextColor={colors.textSecondary}
                  value={customSubcategory.trim()}
                  onChangeText={(text) => {
                    setCustomSubcategory(text);
                    setValue('subcategory', text.trim());
                  }}
                />
              ) : null}
              {errors.subcategory && <Text style={styles.errorText}>{String(errors.subcategory.message)}</Text>}
            </View>
          ) : null}

          {/* Stock and Pricing */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>PRICE ($)</Text>
              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: errors.price ? '#FF3B30' : colors.border }]}
                    placeholder="120.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.price && <Text style={styles.errorText}>{String(errors.price.message)}</Text>}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>DISCOUNT PRICE ($)</Text>
              <Controller
                control={control}
                name="discounted_price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: errors.discounted_price ? '#FF3B30' : colors.border }]}
                    placeholder="99.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.discounted_price && <Text style={styles.errorText}>{String(errors.discounted_price.message)}</Text>}
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>STOCK QUANTITY</Text>
              <Controller
                control={control}
                name="stock_quantity"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: errors.stock_quantity ? '#FF3B30' : colors.border }]}
                    placeholder="10"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.stock_quantity && <Text style={styles.errorText}>{String(errors.stock_quantity.message)}</Text>}
            </View>

            <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
              <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 8 }]}>FEATURE PRODUCT</Text>
              <Controller
                control={control}
                name="featured"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#767577', true: colors.accent }}
                    thumbColor={value ? '#FFF' : '#f4f3f4'}
                  />
                )}
              />
            </View>
          </View>

          <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginBottom: 0 }]}>STORAGE LOCATION</Text>

              <TouchableOpacity
                style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: colors.backgroundSelected }}
                onPress={() => {
                  setIsCustomLocation(!isCustomLocation);
                  setValue('storage_location', '');
                  setSelectedAreaCode(null);
                  setSelectedZoneCode(null);
                  setSelectedShelfCode(null);
                  setCustomLocation('');
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>
                  {isCustomLocation ? 'USE PREDEFINED PLAN' : 'USE CUSTOM TEXT'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ML Location Suggestions */}
            {!!nameVal && nameVal.trim().length >= 2 && suggestions.length > 0 ? (
              <View style={{ marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: colors.backgroundSelected, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 0.8, marginBottom: 8 }}>
                  🤖 SMART ML SUGGESTED SLOTS (CLICK TO ALLOT)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {suggestions.map((suggestion) => {
                    const isCurrent = watch('storage_location') === suggestion.code;
                    return (
                      <TouchableOpacity
                        key={suggestion.code}
                        activeOpacity={0.8}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: isCurrent ? colors.accent : colors.border,
                          backgroundColor: isCurrent ? colors.accent + '15' : colors.backgroundElement,
                          minWidth: 160,
                          maxWidth: 220,
                        }}
                        onPress={() => handleSelectSuggestion(suggestion)}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>
                            {suggestion.code}
                          </Text>
                          {isCurrent && (
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
                          )}
                        </View>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: colors.text, marginTop: 4 }} numberOfLines={1}>
                          {suggestion.areaName}
                        </Text>
                        <Text style={{ fontSize: 9, color: colors.textSecondary }} numberOfLines={1}>
                          {suggestion.zoneName} • {suggestion.shelfLabel}
                        </Text>
                        <Text style={{ fontSize: 8, color: colors.accent, fontWeight: '700', marginTop: 4 }} numberOfLines={2}>
                          {suggestion.reason}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {isCustomLocation ? (
              <View>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: errors.storage_location ? '#FF3B30' : colors.border }]}
                  placeholder="e.g. Back Room Box #12"
                  placeholderTextColor={colors.textSecondary}
                  value={customLocation}
                  onChangeText={(text) => {
                    setCustomLocation(text);
                    setValue('storage_location', text.trim(), { shouldValidate: true, shouldDirty: true });
                  }}
                />
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                  Enter any custom location name if it does not fit the master plan.
                </Text>
              </View>
            ) : (
              <View>
                {/* Area Selector */}
                <Text style={[styles.label, { color: colors.textSecondary, fontSize: 9, marginTop: 4 }]}>STEP 1: SELECT AREA</Text>
                <View style={styles.dropdownGrid}>
                  {LOCATION_PLAN.map((area) => {
                    const isSelected = selectedAreaCode === area.code;
                    return (
                      <TouchableOpacity
                        key={area.code}
                        style={[
                          styles.choiceChip,
                          {
                            backgroundColor: isSelected ? colors.text : colors.backgroundSelected,
                            borderColor: isSelected ? colors.text : colors.border,
                            marginBottom: 6,
                          },
                        ]}
                        onPress={() => handleSelectArea(area.code)}
                      >
                        <Text style={[styles.choiceText, { color: isSelected ? colors.background : colors.text, fontSize: 10 }]}>
                          {area.code} - {area.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Zone / Rack Selector */}
                {selectedAreaCode && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.label, { color: colors.textSecondary, fontSize: 9 }]}>STEP 2: SELECT RACK / ZONE</Text>
                    <View style={styles.dropdownGrid}>
                      {LOCATION_PLAN.find((a) => a.code === selectedAreaCode)?.zones.map((zone) => {
                        const isSelected = selectedZoneCode === zone.code;
                        return (
                          <TouchableOpacity
                            key={zone.code}
                            style={[
                              styles.choiceChip,
                              {
                                backgroundColor: isSelected ? colors.text : colors.backgroundSelected,
                                borderColor: isSelected ? colors.text : colors.border,
                                marginBottom: 6,
                              },
                            ]}
                            onPress={() => handleSelectZone(zone.code)}
                          >
                            <Text style={[styles.choiceText, { color: isSelected ? colors.background : colors.text, fontSize: 10 }]}>
                              {zone.name} ({zone.code})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Shelf / Compartment Selector */}
                {selectedAreaCode && selectedZoneCode && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.label, { color: colors.textSecondary, fontSize: 9 }]}>STEP 3: SELECT SHELF / LEVEL</Text>
                    <View style={styles.dropdownGrid}>
                      {LOCATION_PLAN.find((a) => a.code === selectedAreaCode)
                        ?.zones.find((z) => z.code === selectedZoneCode)
                        ?.shelves.map((shelf) => {
                          const isSelected = selectedShelfCode === shelf.code;
                          return (
                            <TouchableOpacity
                              key={shelf.code}
                              style={[
                                styles.choiceChip,
                                {
                                  backgroundColor: isSelected ? colors.text : colors.backgroundSelected,
                                  borderColor: isSelected ? colors.text : colors.border,
                                  marginBottom: 6,
                                },
                              ]}
                              onPress={() => handleSelectShelf(shelf.code)}
                            >
                              <Text style={[styles.choiceText, { color: isSelected ? colors.background : colors.text, fontSize: 10 }]}>
                                {shelf.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  </View>
                )}

                {/* Selected Location Indicator */}
                <Controller
                  control={control}
                  name="storage_location"
                  render={({ field: { value } }) => (
                    <View style={{
                      marginTop: 16,
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: value ? colors.accent + '15' : colors.backgroundSelected,
                      borderWidth: 1,
                      borderColor: value ? colors.accent : colors.border,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                        {value ? `Location Code:  ${value}` : 'Select options above to construct location code'}
                      </Text>
                      {value ? (
                        <View style={{ backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>VERIFIED</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                />
              </View>
            )}
            {errors.storage_location && <Text style={styles.errorText}>{String(errors.storage_location.message)}</Text>}
          </View>

          <Button
            title={isEditMode ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
            onPress={handleSubmit(onSubmit)}
            loading={saving}
            variant="accent"
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageThumbWrapper: {
    width: 80,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageCard: {
    width: 80,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 6,
  },
  pendingBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(255,165,0,0.85)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  pendingBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  form: {},
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  textArea: {
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  choiceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  saveBtn: {
    marginTop: 40,
    height: 52,
    borderRadius: 10,
  },
});
