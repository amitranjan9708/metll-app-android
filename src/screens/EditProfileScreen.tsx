import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { authApi, userApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_CACHE_KEY = '@user_profile_cache';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [schoolClass, setSchoolClass] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [collegeDept, setCollegeDept] = useState('');
  const [collegeLocation, setCollegeLocation] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [officeDesignation, setOfficeDesignation] = useState('');
  const [officeDept, setOfficeDept] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [pastCity, setPastCity] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      if (!refreshing) setLoading(true);

      // Try cache first
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        setProfileData(data);
        populateForm(data);
      }

      // Fetch fresh data
      const response = await userApi.getUserProfile();
      if (response.success && response.data?.user) {
        const data = response.data.user;
        setProfileData(data);
        populateForm(data);
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const populateForm = (data: any) => {
    setName(data.name || '');
    setBio(data.bio || '');
    setAge(data.age?.toString() || '');
    setGender(data.gender || '');
    setSchoolName(data.school?.name || '');
    setSchoolCity(data.school?.city || '');
    setSchoolClass(data.school?.class || '');
    setCollegeName(data.college?.name || '');
    setCollegeDept(data.college?.department || '');
    setCollegeLocation(data.college?.location || '');
    setOfficeName(data.office?.name || '');
    setOfficeDesignation(data.office?.designation || '');
    setOfficeDept(data.office?.department || '');
    setCurrentCity(data.homeLocation?.current?.city || '');
    setPastCity(data.homeLocation?.past?.city || '');
  };

  const saveSection = async (section: string) => {
    setSaving(true);
    try {
      let updateData: any = {};

      if (section === 'basic') {
        updateData = { name, bio, age: age ? parseInt(age) : undefined, gender };
      } else if (section === 'school') {
        updateData = { school: { name: schoolName, city: schoolCity, class: schoolClass } };
      } else if (section === 'college') {
        updateData = { college: { name: collegeName, department: collegeDept, location: collegeLocation } };
      } else if (section === 'office') {
        updateData = { office: { name: officeName, designation: officeDesignation, department: officeDept } };
      } else if (section === 'address') {
        updateData = { homeLocation: { current: { city: currentCity }, past: { city: pastCity } } };
      }

      const response = await userApi.updateProfile(updateData);
      if (response.success) {
        await loadProfile();
        setEditingSection(null);
        Alert.alert('Success', 'Profile updated!');
      } else {
        Alert.alert('Error', response.message || 'Update failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleEdit = (section: string) => {
    if (editingSection === section) {
      populateForm(profileData);
      setEditingSection(null);
    } else {
      setEditingSection(section);
    }
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    if (!profileData) return 0;
    const fields = [
      profileData.name,
      profileData.bio,
      profileData.age,
      profileData.gender,
      profileData.photo,
      profileData.school?.name,
      profileData.college?.name,
      profileData.office?.name,
      profileData.homeLocation?.current?.city,
    ];
    const filledFields = fields.filter(f => f && f !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  if (loading && !profileData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const photos: string[] = [];
  if (profileData?.photo) photos.push(profileData.photo);
  if (Array.isArray(profileData?.additionalPhotos)) photos.push(...profileData.additionalPhotos);

  // Check if user has completed discover onboarding to show additional photos edit
  const isDiscoverOnboarded = profileData?.isDiscoverOnboarded || user?.isDiscoverOnboarded || false;

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadProfile(); }}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Avatar Section with Completion */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfilePicture')}>
              {profileData?.photo ? (
                <Image source={{ uri: profileData.photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color={theme.colors.textMuted} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Completion Circle */}
            <View style={styles.completionCircle}>
              <View style={[styles.completionInner, { borderColor: completionPercentage >= 80 ? '#10B981' : completionPercentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                <Text style={styles.completionText}>{completionPercentage}%</Text>
              </View>
            </View>
          </View>
          <Text style={styles.avatarName}>{profileData?.name || 'Your Name'}</Text>
          <Text style={styles.completionLabel}>
            {completionPercentage >= 80 ? '✨ Profile looking great!' : completionPercentage >= 50 ? '🔧 Almost there!' : '📝 Complete your profile'}
          </Text>
        </View>

        {/* Photos Card - Only show if user has completed discover onboarding */}
        {isDiscoverOnboarded && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="images" size={20} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Additional Photos ({Math.max(0, photos.length - 1)})</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditPhotos')}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {photos.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.filter((_, i) => i > 0).map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.photoThumb} />
                ))}
              </ScrollView>
            ) : (
              <TouchableOpacity 
                style={styles.addPhotoBtn} 
                onPress={() => navigation.navigate('EditPhotos')}
              >
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.addPhotoBtnText}>Add Photos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Basic Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="person-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Basic Info</Text>
            </View>
            {editingSection === 'basic' ? (
              <TouchableOpacity style={styles.saveBtn} onPress={() => saveSection('basic')} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={() => toggleEdit('basic')}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            {editingSection === 'basic' ? (
              <TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholder="Your name" />
            ) : (
              <Text style={styles.fieldValue}>{name || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Bio</Text>
            {editingSection === 'basic' ? (
              <TextInput style={styles.fieldInput} value={bio} onChangeText={setBio} placeholder="About you" multiline />
            ) : (
              <Text style={styles.fieldValue}>{bio || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Age</Text>
            {editingSection === 'basic' ? (
              <TextInput style={styles.fieldInput} value={age} onChangeText={setAge} placeholder="Age" keyboardType="numeric" />
            ) : (
              <Text style={styles.fieldValue}>{age || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Gender</Text>
            {editingSection === 'basic' ? (
              <TextInput style={styles.fieldInput} value={gender} onChangeText={setGender} placeholder="Gender" />
            ) : (
              <Text style={styles.fieldValue}>{gender || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{profileData?.email || 'Not set'}</Text>
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <Text style={styles.fieldValue}>{profileData?.phoneNumber || profileData?.phone || 'Not set'}</Text>
          </View>
        </View>

        {/* School Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="book" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>School</Text>
            </View>
            {editingSection === 'school' ? (
              <TouchableOpacity style={styles.saveBtn} onPress={() => saveSection('school')} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={() => toggleEdit('school')}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>School Name</Text>
            {editingSection === 'school' ? (
              <TextInput style={styles.fieldInput} value={schoolName} onChangeText={setSchoolName} placeholder="School name" />
            ) : (
              <Text style={styles.fieldValue}>{schoolName || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>City</Text>
            {editingSection === 'school' ? (
              <TextInput style={styles.fieldInput} value={schoolCity} onChangeText={setSchoolCity} placeholder="City" />
            ) : (
              <Text style={styles.fieldValue}>{schoolCity || 'Not set'}</Text>
            )}
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Class</Text>
            {editingSection === 'school' ? (
              <TextInput style={styles.fieldInput} value={schoolClass} onChangeText={setSchoolClass} placeholder="Class" />
            ) : (
              <Text style={styles.fieldValue}>{schoolClass || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* College Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="school" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>College</Text>
            </View>
            {editingSection === 'college' ? (
              <TouchableOpacity style={styles.saveBtn} onPress={() => saveSection('college')} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={() => toggleEdit('college')}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>College Name</Text>
            {editingSection === 'college' ? (
              <TextInput style={styles.fieldInput} value={collegeName} onChangeText={setCollegeName} placeholder="College name" />
            ) : (
              <Text style={styles.fieldValue}>{collegeName || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Department</Text>
            {editingSection === 'college' ? (
              <TextInput style={styles.fieldInput} value={collegeDept} onChangeText={setCollegeDept} placeholder="Department" />
            ) : (
              <Text style={styles.fieldValue}>{collegeDept || 'Not set'}</Text>
            )}
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Location</Text>
            {editingSection === 'college' ? (
              <TextInput style={styles.fieldInput} value={collegeLocation} onChangeText={setCollegeLocation} placeholder="Location" />
            ) : (
              <Text style={styles.fieldValue}>{collegeLocation || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Office Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="briefcase" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Office</Text>
            </View>
            {editingSection === 'office' ? (
              <TouchableOpacity style={styles.saveBtn} onPress={() => saveSection('office')} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={() => toggleEdit('office')}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Company</Text>
            {editingSection === 'office' ? (
              <TextInput style={styles.fieldInput} value={officeName} onChangeText={setOfficeName} placeholder="Company name" />
            ) : (
              <Text style={styles.fieldValue}>{officeName || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Designation</Text>
            {editingSection === 'office' ? (
              <TextInput style={styles.fieldInput} value={officeDesignation} onChangeText={setOfficeDesignation} placeholder="Job title" />
            ) : (
              <Text style={styles.fieldValue}>{officeDesignation || 'Not set'}</Text>
            )}
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Department</Text>
            {editingSection === 'office' ? (
              <TextInput style={styles.fieldInput} value={officeDept} onChangeText={setOfficeDept} placeholder="Department" />
            ) : (
              <Text style={styles.fieldValue}>{officeDept || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="home" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Address</Text>
            </View>
            {editingSection === 'address' ? (
              <TouchableOpacity style={styles.saveBtn} onPress={() => saveSection('address')} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={() => toggleEdit('address')}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Current City</Text>
            {editingSection === 'address' ? (
              <TextInput style={styles.fieldInput} value={currentCity} onChangeText={setCurrentCity} placeholder="Current city" />
            ) : (
              <Text style={styles.fieldValue}>{currentCity || 'Not set'}</Text>
            )}
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Previous City</Text>
            {editingSection === 'address' ? (
              <TextInput style={styles.fieldInput} value={pastCity} onChangeText={setPastCity} placeholder="Previous city" />
            ) : (
              <Text style={styles.fieldValue}>{pastCity || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Account Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Account</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Ionicons name={profileData?.isVerified ? 'checkmark-circle' : 'alert-circle'} size={16} color={profileData?.isVerified ? '#10B981' : '#F59E0B'} />
              <Text style={[styles.statusText, { color: profileData?.isVerified ? '#10B981' : '#F59E0B' }]}>
                {profileData?.isVerified ? 'Verified' : 'Not Verified'}
              </Text>
            </View>
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Member Since</Text>
            <Text style={styles.fieldValue}>
              {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Bottom spacing */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.border,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  completionCircle: {
    position: 'absolute',
    bottom: -5,
    right: -10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 3,
    ...theme.shadows.sm,
  },
  completionInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  avatarName: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  completionLabel: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  fieldRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '50',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  fieldInput: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.backgroundCard,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  photoThumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: theme.colors.border,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  addPhotoBtnText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
