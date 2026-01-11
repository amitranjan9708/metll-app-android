import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const PROFILE_CACHE_KEY = '@user_profile_cache';
const { width } = Dimensions.get('window');

export const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cachedData) {
        setProfileData(JSON.parse(cachedData));
        setLoading(false);
      }
      const response = await authApi.getUserProfile();
      if (response.success && response.data?.user) {
        const freshData = response.data.user;
        setProfileData(freshData);
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(freshData));
      } else if (!cachedData) {
        setProfileData(user);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cachedData) {
        setProfileData(JSON.parse(cachedData));
      } else {
        setProfileData(user);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  if (loading && !profileData) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#E07A5F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#6B6B6B" />
        <Text style={styles.errorText}>No profile data available</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProfileData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const school = profileData.school;
  const college = profileData.college;
  const office = profileData.office;
  const homeLocation = profileData.homeLocation;

  const photos: string[] = [];
  if (profileData.photo) photos.push(profileData.photo);
  if (Array.isArray(profileData.additionalPhotos)) {
    photos.push(...profileData.additionalPhotos);
  }

  // Build sections data for FlatList
  const sections = [
    { key: 'header', type: 'header' },
    { key: 'basicInfo', type: 'basicInfo' },
    ...(photos.length > 0 ? [{ key: 'photos', type: 'photos' }] : []),
    { key: 'school', type: 'school' },
    { key: 'college', type: 'college' },
    { key: 'office', type: 'office' },
    { key: 'address', type: 'address' },
    { key: 'account', type: 'account' },
    { key: 'footer', type: 'footer' },
  ];

  const renderItem = ({ item }: { item: { key: string; type: string } }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('PhotoUpload')}
            >
              {profileData.photo ? (
                <Image source={{ uri: profileData.photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#9B9B9B" />
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{profileData.name || 'Your Name'}</Text>
            {profileData.bio && <Text style={styles.userBio}>{profileData.bio}</Text>}
          </View>
        );

      case 'basicInfo':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="person-outline" size={18} color="#1A1A1A" />
                <Text style={styles.cardTitle}>Basic Info</Text>
              </View>
              <TouchableOpacity
                style={styles.editChip}
                onPress={() => navigation.navigate('EditBasicInfo')}
              >
                <Ionicons name="pencil" size={12} color="#E07A5F" />
                <Text style={styles.editChipText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {profileData.email && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profileData.email}</Text>
              </View>
            )}
            {(profileData.phoneNumber || profileData.phone) && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profileData.phoneNumber || profileData.phone}</Text>
              </View>
            )}
            {profileData.age && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{profileData.age}</Text>
              </View>
            )}
            {profileData.gender && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{profileData.gender}</Text>
              </View>
            )}
          </View>
        );

      case 'photos':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="images-outline" size={18} color="#1A1A1A" />
                <Text style={styles.cardTitle}>Photos ({photos.length})</Text>
              </View>
              <TouchableOpacity
                style={styles.editChip}
                onPress={() => navigation.navigate('PhotoUpload')}
              >
                <Ionicons name="pencil" size={12} color="#E07A5F" />
                <Text style={styles.editChipText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={photos}
              keyExtractor={(uri, idx) => `photo-${idx}`}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: uri, index }) => (
                <View style={styles.photoThumbWrapper}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  {index === 0 && (
                    <View style={styles.mainLabel}>
                      <Text style={styles.mainLabelText}>Main</Text>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        );

      case 'school':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="book-outline" size={18} color="#1A1A1A" />
                <Text style={styles.cardTitle}>School</Text>
              </View>
              <TouchableOpacity
                style={styles.editChip}
                onPress={() => navigation.navigate('Onboarding', { step: 'school', fromEdit: true })}
              >
                <Ionicons name="pencil" size={12} color="#E07A5F" />
                <Text style={styles.editChipText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {school?.name || school?.city ? (
              <>
                {school?.name && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{school.name}</Text>
                  </View>
                )}
                {school?.city && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>City</Text>
                    <Text style={styles.infoValue}>{school.city}</Text>
                  </View>
                )}
                {school?.class && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Class</Text>
                    <Text style={styles.infoValue}>{school.class}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>No school information added</Text>
            )}
          </View>
        );

      case 'college':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="school-outline" size={18} color="#1A1A1A" />
                <Text style={styles.cardTitle}>College</Text>
              </View>
              <TouchableOpacity
                style={styles.editChip}
                onPress={() => navigation.navigate('EditCollege')}
              >
                <Ionicons name="pencil" size={12} color="#E07A5F" />
                <Text style={styles.editChipText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {college?.name || college?.department ? (
              <>
                {college?.name && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{college.name}</Text>
                  </View>
                )}
                {college?.department && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Department</Text>
                    <Text style={styles.infoValue}>{college.department}</Text>
                  </View>
                )}
                {college?.location && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{college.location}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>No college information added</Text>
            )}
          </View>
        );

      case 'office':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="briefcase-outline" size={18} color="#1A1A1A" />
                <Text style={styles.cardTitle}>Office</Text>
              </View>
              <TouchableOpacity
                style={styles.editChip}
                onPress={() => navigation.navigate('EditOffice')}
              >
                <Ionicons name="pencil" size={12} color="#E07A5F" />
                <Text style={styles.editChipText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {office?.name || office?.designation ? (
              <>
                {office?.name && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Company</Text>
                    <Text style={styles.infoValue}>{office.name}</Text>
                  </View>
                )}
                {office?.designation && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Designation</Text>
                    <Text style={styles.infoValue}>{office.designation}</Text>
                  </View>
                )}
                {office?.department && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Department</Text>
                    <Text style={styles.infoValue}>{office.department}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>No office information added</Text>
            )}
          </View>
        );

      case 'address':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="home-outline" size={18} color="#1A1A1A" />
                <Text style={styles.cardTitle}>Address</Text>
              </View>
              <TouchableOpacity
                style={styles.editChip}
                onPress={() => navigation.navigate('EditAddress')}
              >
                <Ionicons name="pencil" size={12} color="#E07A5F" />
                <Text style={styles.editChipText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {homeLocation?.current?.city || homeLocation?.past?.city ? (
              <>
                {homeLocation?.current?.city && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Current City</Text>
                    <Text style={styles.infoValue}>{homeLocation.current.city}</Text>
                  </View>
                )}
                {homeLocation?.past?.city && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Previous City</Text>
                    <Text style={styles.infoValue}>{homeLocation.past.city}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>No address information added</Text>
            )}
          </View>
        );

      case 'account':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#1A1A1A" />
                <Text style={styles.cardTitle}>Account</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Verified</Text>
              <Text style={styles.infoValue}>{profileData.isVerified ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Onboarded</Text>
              <Text style={styles.infoValue}>{profileData.isOnboarded ? 'Yes' : 'No'}</Text>
            </View>
            {profileData.createdAt && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{new Date(profileData.createdAt).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        );

      case 'footer':
        return <View style={{ height: insets.bottom + 40 }} />;

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={loadProfileData} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#6B6B6B" />
        </TouchableOpacity>
      </View>

      {/* FlatList for reliable scrolling */}
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E07A5F']}
            tintColor="#E07A5F"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B6B6B',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B6B6B',
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E07A5F',
    borderRadius: 24,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E5E5',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E07A5F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FAFAFA',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  userBio: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(224, 122, 95, 0.1)',
    borderRadius: 12,
  },
  editChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E07A5F',
  },
  infoItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  infoLabel: {
    fontSize: 12,
    color: '#9B9B9B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  emptyText: {
    fontSize: 14,
    color: '#9B9B9B',
    fontStyle: 'italic',
  },
  photoThumbWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E5E5E5',
  },
  mainLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainLabelText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFF',
  },
});
