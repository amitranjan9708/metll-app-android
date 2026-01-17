import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { theme } from '../theme';
import { authApi, userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PhotoSlot {
  uri: string | null;
  isNew: boolean; // true if newly selected (not yet uploaded)
  isUploading: boolean;
}

export const EditPhotosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [additionalPhotos, setAdditionalPhotos] = useState<PhotoSlot[]>(
    Array(5).fill(null).map(() => ({ uri: null, isNew: false, isUploading: false }))
  );

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUserProfile();
      if (response.success && response.data?.user) {
        const userData = response.data.user;
        console.log(userData,'yyyy')
        setProfilePhoto(userData.profilePhoto || userData.photo || null);
        
        // Load additional photos
        const existingPhotos = userData.additionalPhotos || [];
        const slots: PhotoSlot[] = Array(5).fill(null).map((_, index) => ({
          uri: existingPhotos[index] || null,
          isNew: false,
          isUploading: false,
        }));
        setAdditionalPhotos(slots);
      }
    } catch (error) {
      console.error('Load photos error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfilePicture = () => {
    // Navigate to profile picture edit with verification
    navigation.navigate('EditProfilePicture');
  };

  const handlePickAdditionalPhoto = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = [...additionalPhotos];
        newPhotos[index] = {
          uri: result.assets[0].uri,
          isNew: true,
          isUploading: false,
        };
        setAdditionalPhotos(newPhotos);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const photo = additionalPhotos[index];
    if (!photo.uri) return;

    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // If it's an existing photo (not new), delete from backend
            if (!photo.isNew && photo.uri) {
              try {
                await authApi.deletePhoto(index + 1); // +1 because index 0 is profile photo
              } catch (error) {
                console.error('Failed to delete from backend:', error);
              }
            }

            // Remove locally
            const newPhotos = [...additionalPhotos];
            newPhotos[index] = { uri: null, isNew: false, isUploading: false };
            setAdditionalPhotos(newPhotos);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    // Get new photos that need uploading
    const newPhotos = additionalPhotos.filter(p => p.isNew && p.uri);
    
    if (newPhotos.length === 0) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      // Upload new photos
      const urisToUpload = newPhotos.map(p => p.uri!);
      const result = await authApi.uploadPhotos(urisToUpload);

      if (!result.success) {
        throw new Error(result.message || 'Failed to upload photos');
      }

      // Update local user state
      const allPhotos = additionalPhotos
        .filter(p => p.uri !== null)
        .map(p => {
          if (p.isNew) {
            // Find the uploaded URL for this photo
            const uploadedIndex = newPhotos.findIndex(np => np.uri === p.uri);
            return result.data?.uploadedUrls?.[uploadedIndex] || p.uri;
          }
          return p.uri;
        })
        .filter((uri): uri is string => uri !== null);

      await updateUser({ additionalPhotos: allPhotos }, true);

      Alert.alert('Success', 'Photos updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save photos');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = additionalPhotos.some(p => p.isNew);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Photos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Photos</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={!hasChanges || saving}
          style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Picture</Text>
            <TouchableOpacity onPress={handleEditProfilePicture} style={styles.editButton}>
              <Ionicons name="pencil" size={16} color={theme.colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Changing your profile picture requires video verification
          </Text>
          
          <TouchableOpacity 
            style={styles.profilePhotoContainer} 
            onPress={handleEditProfilePicture}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Ionicons name="person" size={48} color="#999" />
              </View>
            )}
            <View style={styles.profilePhotoBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Additional Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Photos</Text>
          <Text style={styles.sectionSubtitle}>
            Add up to 5 more photos to show your personality
          </Text>

          <View style={styles.photoGrid}>
            {additionalPhotos.map((photo, index) => (
              <View key={index} style={styles.photoSlotContainer}>
                <TouchableOpacity
                  style={[
                    styles.photoSlot,
                    photo.uri && styles.photoSlotFilled,
                    photo.isNew && styles.photoSlotNew,
                  ]}
                  onPress={() => photo.uri ? handleRemovePhoto(index) : handlePickAdditionalPhoto(index)}
                  disabled={photo.isUploading}
                >
                  {photo.uri ? (
                    <>
                      <Image source={{ uri: photo.uri }} style={styles.photo} />
                      {photo.isNew && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.addPhotoContent}>
                      <Ionicons name="add" size={28} color="#999" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>📸 Photo Tips</Text>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
            <Text style={styles.tipText}>Show your face clearly in at least one photo</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
            <Text style={styles.tipText}>Include photos of your hobbies and interests</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
            <Text style={styles.tipText}>Use recent photos that represent you</Text>
          </View>
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  profilePhotoContainer: {
    width: 120,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  profilePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoSlotContainer: {
    width: '30%',
  },
  photoSlot: {
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D0D0D0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSlotFilled: {
    borderStyle: 'solid',
    borderColor: '#E0E0E0',
  },
  photoSlotNew: {
    borderColor: theme.colors.primary,
    borderStyle: 'solid',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  addPhotoContent: {
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#6B6B6B',
    flex: 1,
  },
});
