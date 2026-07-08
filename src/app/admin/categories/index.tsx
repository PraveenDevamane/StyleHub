import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Edit2, Trash2, Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useCategories } from '@/hooks/useProducts';
import { db } from '@/services/firebase';
import { uploadToGoogleDrive } from '@/services/googleDrive';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import CachedImage from '@/components/CachedImage';
import Button from '@/components/Button';
import { Category } from '@/types';
import { showAlert, showConfirm } from '@/utils/alert';

export default function AdminCategoriesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const { data: categories, isLoading, refetch } = useCategories();

  // Form Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCatName(category.name);
      setCatImageUrl(category.image_url || '');
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatImageUrl('');
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingCategory(null);
    setCatName('');
    setCatImageUrl('');
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Camera roll permissions are required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploading(true);
        const url = await uploadImage(result.assets[0].uri);
        if (url) {
          setCatImageUrl(url);
        } else {
          showAlert('Error', 'Image upload failed.');
        }
      }
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Could not select image.');
    } finally {
      setUploading(false);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const filename = uri.split('/').pop() || `cat_${Date.now()}.jpg`;
      return await uploadToGoogleDrive(uri, filename);
    } catch (e) {
      console.error('Category image upload error:', e);
      return null;
    }
  };

  const handleSave = async () => {
    if (!catName.trim()) {
      showAlert('Required', 'Please enter a category name.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: catName.trim(),
        image_url: catImageUrl.trim() || null,
      };

      if (editingCategory) {
        // Update Firestore
        const docRef = doc(db, 'categories', editingCategory.id);
        await updateDoc(docRef, payload);
      } else {
        // Insert Firestore
        await addDoc(collection(db, 'categories'), {
          ...payload,
          created_at: new Date().toISOString(),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
      showAlert('Success', 'Category saved successfully.');
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmed = await showConfirm(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This will delete all products under this category.`
    );
    if (!confirmed) return;

    try {
      const docRef = doc(db, 'categories', category.id);
      await deleteDoc(docRef);

      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showAlert('Success', 'Category deleted.');
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to delete category.');
    }
  };

  const renderItem = ({ item }: { item: Category }) => {
    return (
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <CachedImage
          source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300' }}
          style={styles.thumb}
        />
        <View style={styles.infoCol}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name.toUpperCase()}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Created: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.actionsCol}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.backgroundSelected }]}
            onPress={() => handleOpenModal(item)}
          >
            <Edit2 size={14} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={14} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>MANAGE CATEGORIES</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={() => handleOpenModal()}>
          <Plus size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Editor Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCategory ? 'EDIT CATEGORY' : 'NEW CATEGORY'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Category Image Picker */}
              <TouchableOpacity
                style={[styles.imagePicker, { backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}
                onPress={handlePickImage}
                disabled={uploading || saving}
              >
                {catImageUrl ? (
                  <CachedImage source={{ uri: catImageUrl }} style={StyleSheet.absoluteFill} />
                ) : uploading ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <Camera size={24} color={colors.text} />
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Upload Cover Photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={[styles.label, { color: colors.textSecondary }]}>CATEGORY NAME</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}
                placeholder="e.g. Clothing"
                placeholderTextColor={colors.textSecondary}
                value={catName}
                onChangeText={setCatName}
              />

              <Button
                title={editingCategory ? 'SAVE CHANGES' : 'CREATE CATEGORY'}
                onPress={handleSave}
                loading={saving}
                variant="accent"
                style={styles.saveBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  meta: {
    fontSize: 11,
  },
  actionsCol: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalBody: {},
  imagePicker: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 24,
  },
  saveBtn: {
    height: 52,
    borderRadius: 8,
  },
});
