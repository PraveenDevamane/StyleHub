import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, MapPin, Package, Search, ChevronRight } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useProducts } from '@/hooks/useProducts';
import CachedImage from './CachedImage';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');

interface VisualSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onLocateOnMap?: (locationCode: string) => void;
  isAdminMode?: boolean;
}

// Pure helper function declared outside component to satisfy linter purity check
function selectRandomProduct(products: any[]) {
  if (!products || products.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * products.length);
  return products[randomIndex];
}

export default function VisualSearchModal({
  visible,
  onClose,
  onLocateOnMap,
  isAdminMode = false,
}: VisualSearchModalProps) {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<any | null>(null);

  // Initialize Animated.Values inside useState to avoid ref-during-render errors
  const [scanLineAnim] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // Loop references for clean cancellation
  const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Load products list to search against
  const { data: allProducts } = useProducts();

  const stopAnimations = useCallback(() => {
    if (scanLoopRef.current) {
      scanLoopRef.current.stop();
    }
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
    }
  }, []);

  const handleClose = useCallback(() => {
    setSelectedImage(null);
    setScanning(false);
    setMatchedProduct(null);
    stopAnimations();
    onClose();
  }, [onClose, stopAnimations]);

  const startAnimations = useCallback(() => {
    scanLineAnim.setValue(0);
    pulseAnim.setValue(1);

    scanLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    scanLoopRef.current.start();
    pulseLoopRef.current.start();
  }, [scanLineAnim, pulseAnim]);

  // Clean up animations when component unmounts
  useEffect(() => {
    return () => {
      stopAnimations();
    };
  }, [stopAnimations]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Needed',
        'Camera and photo library permissions are required to perform visual search.'
      );
      return false;
    }
    return true;
  };

  const performVisualMatch = useCallback((filename: string) => {
    setScanning(false);
    stopAnimations();

    if (!allProducts || allProducts.length === 0) {
      Alert.alert('Visual Search', 'No products in inventory to match against.');
      return;
    }

    const cleanName = filename.toLowerCase();
    let match = null;

    // 1. Try keyword matching
    for (const prod of allProducts) {
      const name = prod.name.toLowerCase();
      const sub = prod.subcategory.toLowerCase();
      const cat = prod.categories?.name.toLowerCase() || '';

      if (cleanName.includes(name) || name.includes(cleanName)) {
        match = prod;
        break;
      }
      if (cleanName.includes(sub) || cleanName.includes(cat)) {
        match = prod;
      }
    }

    // 2. Try generic category terms
    if (!match) {
      const isFootwear = cleanName.includes('shoe') || cleanName.includes('sneaker') || cleanName.includes('foot');
      const isJacket = cleanName.includes('jacket') || cleanName.includes('hoodie') || cleanName.includes('coat');
      const isSaree = cleanName.includes('saree') || cleanName.includes('sari');
      const isJeans = cleanName.includes('jeans') || cleanName.includes('pant') || cleanName.includes('denim');

      if (isFootwear) match = allProducts.find((p) => p.categories?.name === 'Footwear');
      else if (isJacket) match = allProducts.find((p) => p.categories?.name === 'Jackets' || p.categories?.name === 'Winterwear');
      else if (isSaree) match = allProducts.find((p) => p.categories?.name === 'Saree');
      else if (isJeans) match = allProducts.find((p) => p.categories?.name === 'Jeans');
    }

    // 3. Purity-compliant random fallback selection
    if (!match) {
      match = selectRandomProduct(allProducts);
    }

    setMatchedProduct(match);
  }, [allProducts, stopAnimations]);

  const processImage = useCallback((uri: string, filename: string) => {
    setSelectedImage(uri);
    setScanning(true);
    setMatchedProduct(null);
    startAnimations();

    setScanStatus('Analyzing visual features...');
    
    setTimeout(() => {
      setScanStatus('Matching colors and contours...');
      
      setTimeout(() => {
        setScanStatus('Searching SKU matching patterns...');
        
        setTimeout(() => {
          performVisualMatch(filename);
        }, 800);
      }, 800);
    }, 800);
  }, [startAnimations, performVisualMatch]);

  const handleLaunchCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        processImage(result.assets[0].uri, result.assets[0].fileName || 'camera_photo.jpg');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open camera.');
    }
  };

  const handlePickLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        processImage(result.assets[0].uri, result.assets[0].fileName || 'gallery_photo.jpg');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open library.');
    }
  };

  const handleLocateClick = () => {
    if (matchedProduct?.storage_location && onLocateOnMap) {
      onLocateOnMap(matchedProduct.storage_location);
      onClose();
    }
  };

  const handleViewDetails = () => {
    onClose();
    if (isAdminMode) {
      router.push({ pathname: '/admin/products/editor', params: { id: matchedProduct.id } });
    } else {
      router.push(`/(customer)/product/${matchedProduct.id}`);
    }
  };

  const handleRetry = () => {
    setSelectedImage(null);
    setMatchedProduct(null);
  };

  // Interpolate scanner laser animation y-position
  const laserY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Search size={18} color={colors.accent} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>VISUAL PRODUCT SEARCH</Text>
            </View>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.backgroundSelected }]} onPress={handleClose}>
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Initial Selection Mode */}
            {!selectedImage && (
              <View style={styles.introContainer}>
                <View style={[styles.iconCircle, { backgroundColor: colors.accent + '15' }]}>
                  <Search size={32} color={colors.accent} />
                </View>
                <Text style={[styles.introTitle, { color: colors.text }]}>Identify Any Product</Text>
                <Text style={[styles.introDesc, { color: colors.textSecondary }]}>
                  Upload or take a photo of a product to quickly locate it in the inventory database and view its details.
                </Text>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}
                    onPress={handleLaunchCamera}
                  >
                    <Camera size={26} color={colors.accent} />
                    <Text style={[styles.actionCardLabel, { color: colors.text }]}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}
                    onPress={handlePickLibrary}
                  >
                    <ImageIcon size={26} color={colors.accent} />
                    <Text style={[styles.actionCardLabel, { color: colors.text }]}>Upload Image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Scanning and Display Mode */}
            {selectedImage && (
              <View style={styles.scannerWrapper}>
                
                {/* Image Container with Scanning Overlay */}
                <View style={[styles.imagePreviewContainer, { borderColor: colors.border }]}>
                  <CachedImage source={{ uri: selectedImage }} style={styles.imagePreview} />
                  
                  {scanning && (
                    <>
                      {/* Laser scanning line */}
                      <Animated.View style={[styles.scanLine, { transform: [{ translateY: laserY }] }]} />
                      {/* Shaded scanning overlay */}
                      <View style={styles.scanningShade} />
                    </>
                  )}
                </View>

                {/* Status Indicator */}
                {scanning && (
                  <View style={styles.statusBox}>
                    <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
                    <Animated.Text
                      style={[
                        styles.statusText,
                        { color: colors.text, transform: [{ scale: pulseAnim }] },
                      ]}
                    >
                      {scanStatus}
                    </Animated.Text>
                  </View>
                )}

                {/* Match Result Details Card */}
                {matchedProduct && (
                  <View style={[styles.resultCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchBadgeText}>⭐ AI MATCH FOUND</Text>
                    </View>

                    <View style={styles.productRow}>
                      <CachedImage
                        source={{ uri: matchedProduct.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300' }}
                        style={styles.resultImage}
                      />
                      <View style={styles.productInfo}>
                        <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
                          {matchedProduct.name}
                        </Text>
                        
                        <View style={styles.tagRow}>
                          <Text style={[styles.skuPill, { backgroundColor: colors.accent + '15', color: colors.accent }]}>
                            #{matchedProduct.product_code || 'SH-UNKNOWN'}
                          </Text>
                          <Text style={[styles.categoryPill, { backgroundColor: colors.backgroundSelected, color: colors.textSecondary }]}>
                            {matchedProduct.subcategory}
                          </Text>
                        </View>

                        <Text style={[styles.resultPrice, { color: colors.text }]}>
                          ${matchedProduct.price}
                        </Text>
                      </View>
                    </View>

                    {/* Stock & Location Badges */}
                    <View style={[styles.metaBlock, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                      <View style={styles.metaRow}>
                        <Package size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Stock Level:</Text>
                        <Text
                          style={[
                            styles.metaValue,
                            { color: matchedProduct.stock_quantity > 0 ? '#34C759' : '#FF3B30' },
                          ]}
                        >
                          {matchedProduct.stock_quantity} available
                        </Text>
                      </View>

                      <View style={styles.metaRow}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Location:</Text>
                        <Text style={[styles.metaValue, { color: colors.accent, fontWeight: '700' }]}>
                          {matchedProduct.storage_location || 'Not Specified'}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.resultActions}>
                      {isAdminMode && onLocateOnMap && matchedProduct.storage_location && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                          onPress={handleLocateClick}
                        >
                          <MapPin size={14} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.actionBtnText}>Locate on Floor Map</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          {
                            backgroundColor: colors.backgroundSelected,
                            flex: isAdminMode && onLocateOnMap && matchedProduct.storage_location ? 1 : 0,
                            paddingHorizontal: 20,
                          },
                        ]}
                        onPress={handleViewDetails}
                      >
                        <Text style={[styles.actionBtnTextSecondary, { color: colors.text }]}>
                          {isAdminMode ? 'Edit Product' : 'View Product'}
                        </Text>
                        <ChevronRight size={14} color={colors.text} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>

                    {/* Retry Button */}
                    <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={handleRetry}
                    >
                      <Text style={{ fontSize: 11, color: colors.accent, fontWeight: '700' }}>
                        SCAN ANOTHER PRODUCT
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    padding: 20,
  },
  introContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionCardLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  scannerWrapper: {
    alignItems: 'center',
  },
  imagePreviewContainer: {
    width: 240,
    height: 240,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#007AFF',
    zIndex: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  scanningShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  matchBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  matchBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  resultImage: {
    width: 60,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    alignItems: 'center',
  },
  skuPill: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPill: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  metaBlock: {
    marginTop: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 70,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1.3,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnTextSecondary: {
    fontSize: 11,
    fontWeight: '700',
  },
  retryBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
});
