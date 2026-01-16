import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';

const PROFILE_CACHE_KEY = '@user_profile_cache';

export const EditCollegeScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { updateUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [hasCollege, setHasCollege] = useState(false);
    const [collegeName, setCollegeName] = useState('');
    const [collegeDepartment, setCollegeDepartment] = useState('');
    const [collegeLocation, setCollegeLocation] = useState('');

    useEffect(() => {
        loadExistingData();
    }, []);

    const loadExistingData = async () => {
        try {
            const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
            if (cachedData) {
                const profile = JSON.parse(cachedData);
                if (profile.college) {
                    setHasCollege(true);
                    setCollegeName(profile.college.name || '');
                    setCollegeDepartment(profile.college.department || '');
                    setCollegeLocation(profile.college.location || '');
                }
            }
        } catch (error) {
            console.error('Failed to load existing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (hasCollege && (!collegeName || !collegeDepartment)) {
            Alert.alert('Required', 'Please fill in College Name and Department');
            return;
        }

        try {
            setSaving(true);

            const collegeData = hasCollege ? {
                name: collegeName,
                department: collegeDepartment,
                location: collegeLocation || undefined,
            } : null;

            const response = await userApi.updateProfile({ college: collegeData });

            if (response.success) {
                const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
                if (cachedData) {
                    const profile = JSON.parse(cachedData);
                    profile.college = collegeData;
                    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
                }

                await updateUser({ college: collegeData || undefined });

                Alert.alert('Success', 'College details updated', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Error', response.message || 'Failed to update');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            Alert.alert('Error', 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#E07A5F" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="close" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit College</Text>
                <View style={styles.headerBtn} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={() => setHasCollege(!hasCollege)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, hasCollege && styles.checkboxActive]}>
                            {hasCollege && <Ionicons name="checkmark" size={16} color="#FFF" />}
                        </View>
                        <Text style={styles.toggleText}>I want to add college details</Text>
                    </TouchableOpacity>

                    {hasCollege && (
                        <View style={styles.form}>
                            <Input
                                label="College Name *"
                                placeholder="Enter college name"
                                value={collegeName}
                                onChangeText={setCollegeName}
                            />
                            <Input
                                label="Department *"
                                placeholder="Your department/branch"
                                value={collegeDepartment}
                                onChangeText={setCollegeDepartment}
                            />
                            <Input
                                label="Location"
                                placeholder="College location/city"
                                value={collegeLocation}
                                onChangeText={setCollegeLocation}
                            />
                        </View>
                    )}

                    {!hasCollege && (
                        <View style={styles.emptyState}>
                            <Ionicons name="school-outline" size={48} color="#9B9B9B" />
                            <Text style={styles.emptyText}>
                                Toggle above to add your college information
                            </Text>
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <Button
                        title={saving ? 'Saving...' : 'Save Changes'}
                        onPress={handleSave}
                        disabled={saving}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    flex: { flex: 1 },
    loadingContainer: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
    headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
    scrollArea: { flex: 1 },
    scrollContent: { padding: 20 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    checkboxActive: { backgroundColor: '#E07A5F', borderColor: '#E07A5F' },
    toggleText: { fontSize: 16, color: '#1A1A1A' },
    form: { marginTop: 8 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { marginTop: 16, fontSize: 15, color: '#9B9B9B', textAlign: 'center' },
    footer: { padding: 20, paddingTop: 12, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
});
