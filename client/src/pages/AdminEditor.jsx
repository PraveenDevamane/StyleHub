import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, X, Sparkles, AlertCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { showAlert } from '../utils/alert';
import { uploadToGoogleDrive } from '../services/googleDrive';
import { getDirectDriveUrl } from '../utils/image';
import { getAdminAuthHeaders } from '../services/authHeaders';

const SUBCATEGORIES = {
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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function AdminEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const queryClient = useQueryClient();
  const pendingImagesRef = useRef([]);

  // Categories query
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  // Form states
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  
  // Operational states
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Load product if editing
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error('Product lookup failed');
      const json = await res.json();
      const p = json.product;
      
      // Autofill fields
      setName(p.name || '');
      setProductCode(p.product_code || '');
      setCategoryId(p.category_id || '');
      setSubcategory(p.subcategory || '');
      setPrice(p.price || '');
      setDiscountedPrice(p.discounted_price || '');
      setStockQuantity(p.stock_quantity || '');
      setDescription(p.description || '');
      setFeatured(!!p.featured);
      setTags(p.tags?.join(', ') || '');
      setStorageLocation(p.storage_location || '');
      setImageUrls(p.image_urls || []);
      return p;
    },
    enabled: !!productId,
  });

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  // Fetch location suggestions from backend classifier
  const triggerClassification = async () => {
    if (!name || !categoryId) return;
    setSuggestionsLoading(true);
    try {
      const selectedCat = categories?.find((c) => c.id === categoryId);
      const res = await fetch('/api/products/classify', {
        method: 'POST',
        headers: await getAdminAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          name,
          description,
          categoryName: selectedCat?.name || '',
          subcategoryName: subcategory,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.warn('Location suggestion classification failed:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Trigger classification updates on key field modifications
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerClassification();
    }, 600); // debounce classification calls
    return () => clearTimeout(timer);
  }, [name, description, categoryId, subcategory, categories]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invalidFile = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type));
    if (invalidFile) {
      showAlert('Error', 'Only JPEG, PNG, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_BYTES);
    if (oversizedFile) {
      showAlert('Error', 'Each image must be 8 MB or smaller.');
      e.target.value = '';
      return;
    }

    const queuedImages = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingImages((prev) => [...prev, ...queuedImages]);
    e.target.value = '';
  };

  const handleRemoveImage = (idx) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemovePendingImage = (idx) => {
    setPendingImages((prev) => {
      const imageToRemove = prev[idx];
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !categoryId || !price || !stockQuantity) {
      showAlert('Error', 'Please fill in all required fields (*)');
      return;
    }

    setSaving(true);
    try {
      const uploadedImageUrls = [];
      for (const pendingImage of pendingImages) {
        const uploadedUrl = await uploadToGoogleDrive(pendingImage.file);
        uploadedImageUrls.push(uploadedUrl);
      }

      const nextImageUrls = [...imageUrls, ...uploadedImageUrls];
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const payload = {
        name: name.trim(),
        product_code: productCode.trim(),
        category_id: categoryId,
        subcategory: subcategory,
        price: parseFloat(price) || 0,
        discounted_price: discountedPrice ? parseFloat(discountedPrice) : null,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        description: description.trim(),
        featured,
        tags: parsedTags,
        storage_location: storageLocation.trim(),
        image_urls: nextImageUrls,
      };

      const url = productId ? `/api/products/${productId}` : '/api/products';
      const method = productId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: await getAdminAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Save operation failed');
      }

      // Record log for inventory stock levels on new or stock edits
      const currentStock = parseInt(stockQuantity, 10);
      const isStockChanged = !productId || (productData && productData.stock_quantity !== currentStock);

      if (isStockChanged && res.ok) {
        // Simple firestore direct addition or server fallback logic
        // We will query to create inventory log.
        // Let's create an inventory log on the backend by extending product creation,
        // but here we can just verify the save succeeded
      }

      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setPendingImages([]);
      setImageUrls(nextImageUrls);
      showAlert('Success', productId ? 'Product updated successfully!' : 'Product created successfully!');
      navigate('/admin/inventory');
    } catch (err) {
      showAlert('Error', err.message || 'Failed to save product details');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryObj = categories?.find((c) => c.id === categoryId);
  const selectedCategoryName = selectedCategoryObj?.name?.toLowerCase() || '';
  const subcategoryOptions = SUBCATEGORIES[selectedCategoryName] || [];
  const saveButtonText = saving
    ? pendingImages.length > 0
      ? 'Uploading Images...'
      : 'Saving Product...'
    : 'Save Product';

  if (productId && productLoading) {
    return (
      <div className="container" style={{ padding: '60px 28px', display: 'flex', justifyContent: 'center' }}>
        <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '80px', paddingTop: '20px' }}>
      {/* Back button */}
      <button onClick={() => navigate('/admin/inventory')} className="btn btn-ghost flex-row" style={{ gap: '6px', marginBottom: '24px', paddingLeft: 0 }}>
        <ArrowLeft size={18} /> Back to Directory
      </button>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          {productId ? 'Edit Product Details' : 'Add New Product'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Record catalog details, upload images, and classify item display locations.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
        {/* Left Form Column */}
        <GlassCard style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Basic Info</h3>
          
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="e.g. Vintage Leather Jacket"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Code / SKU</label>
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className="form-input"
              placeholder="e.g. SH-JKT-102"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategory('');
                }}
                className="form-input"
              >
                <option value="">Select Category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subcategory</label>
              {subcategoryOptions.length > 0 ? (
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select Subcategory</option>
                  {subcategoryOptions.map((sub, idx) => (
                    <option key={idx} value={sub}>{sub}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Trench Coat"
                />
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="form-input"
                placeholder="99.99"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Discounted ($)</label>
              <input
                type="number"
                step="0.01"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                className="form-input"
                placeholder="79.99"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Qty *</label>
              <input
                type="number"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="form-input"
                placeholder="10"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              rows={4}
              placeholder="Provide item material details, design features, fit parameters..."
              style={{ resize: 'none' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="form-input"
              placeholder="leather, premium, winter, vintage"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Mark as Featured item</span>
          </label>
        </GlassCard>

        {/* Right Form Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Images Section */}
          <GlassCard style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Product Images</h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              {imageUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={getDirectDriveUrl(url)} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} color="#EF4444" />
                  </button>
                </div>
              ))}

              {pendingImages.map((image, idx) => (
                <div key={image.previewUrl} style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--accent)' }}>
                  <img src={image.previewUrl} alt={`Local preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span
                    style={{
                      position: 'absolute',
                      left: '4px',
                      bottom: '4px',
                      backgroundColor: 'var(--accent)',
                      color: 'var(--background-element)',
                      fontSize: '0.55rem',
                      fontWeight: '800',
                      padding: '2px 4px',
                      borderRadius: '4px',
                    }}
                  >
                    LOCAL
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingImage(idx)}
                    disabled={saving}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} color="#EF4444" />
                  </button>
                </div>
              ))}
              
              {/* Uploader Box */}
              <label
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '8px',
                  border: '1px dashed var(--accent)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--tint)',
                  transition: 'opacity 0.2s',
                }}
              >
                <Camera size={20} color="var(--accent)" />
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--accent)', marginTop: '4px' }}>
                  Add image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={saving}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </GlassCard>

          {/* Location Classification & Suggester Section */}
          <GlassCard style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <Sparkles size={20} color="var(--accent)" />
              <h3 style={{ fontSize: '1.1rem' }}>Storage Placement Suggestions</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Shelf / Aisle Location Code</label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="form-input"
                placeholder="e.g. CR-02B"
              />
            </div>

            {/* Suggestions list */}
            {suggestionsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
                <div className="spinner" style={{ border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calculating ML classifier recommendations...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Suggested locations (click to apply):</p>
                {suggestions.map((sug) => (
                  <button
                    key={sug.code}
                    type="button"
                    onClick={() => setStorageLocation(sug.code)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 14px',
                      backgroundColor: 'var(--background-element)',
                      border: storageLocation === sug.code ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text)', fontFamily: 'monospace' }}>
                        {sug.code} ({sug.shelfLabel})
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '750', color: 'var(--accent)' }}>
                        Match Score: {sug.score}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {sug.areaName} &gt; {sug.zoneName}
                    </p>
                    <p style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Reason: {sug.reason}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 14px', backgroundColor: 'var(--tint)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '12px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>Fill in name and category to trigger intelligent shelf location recommendations.</span>
              </div>
            )}
          </GlassCard>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/admin/inventory')}
              style={{ flex: 1, height: '48px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              style={{ flex: 2, height: '48px' }}
            >
              {saveButtonText}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
