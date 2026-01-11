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
import { authApi } from '../services/api';

const PROFILE_CACHE_KEY = '@user_profile_cache';

export const EditOfficeScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { updateUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [hasOffice, setHasOffice] = useState(false);
    const [officeName, setOfficeName] = useState('');
    const [officeLocation, setOfficeLocation] = useState('');
    const [officeDepartment, setOfficeDepartment] = useState('');
    const [officeDesignation, setOfficeDesignation] = useState('');

    useEffect(() => {
        loadExistingData();
    }, []);

    const loadExistingData = async () => {
        try {
            const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
            if (cachedData) {
                const profile = JSON.parse(cachedData);
                if (profile.office) {
                    setHasOffice(true);
                    setOfficeName(profile.office.name || '');
                    setOfficeLocation(profile.office.location || '');
                    setOfficeDepartment(profile.office.department || '');
                    setOfficeDesignation(profile.office.designation || '');
                }
            }
        } catch (error) {
            console.error('Failed to load existing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (hasOffice && (!officeName || !officeDesignation)) {
            Alert.alert('Required', 'Please fill in Company Name and Designation');
            return;
        }

        try {
            setSaving(true);

            const officeData = hasOffice ? {
                name: officeName,
                location: officeLocation || undefined,
                department: officeDepartment || undefined,
                designation: officeDesignation,
            } : null;

            const response = await authApi.updateProfile({ office: officeData });

            if (response.success) {
                const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
                if (cachedData) {
                    const profile = JSON.parse(cachedData);
                    profile.office = officeData;
                    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
                }

                await updateUser({ office: officeData || undefined });

                Alert.alert('Success', 'Office details updated', [
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
                <Text style={styles.headerTitle}>Edit Office</Text>
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
                        onPress={() => setHasOffice(!hasOffice)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, hasOffice && styles.checkboxActive]}>
                            {hasOffice && <Ionicons name="checkmark" size={16} color="#FFF" />}
                        </View>
                        <Text style={styles.toggleText}>I want to add office details</Text>
                    </TouchableOpacity>

                    {hasOffice && (
                        <View style={styles.form}>
                            <Input
                                label="Company Name *"
                                placeholder="Enter company name"
                                value={officeName}
                                onChangeText={setOfficeName}
                            />
                            <Input
                                label="Designation *"
                                placeholder="Your job title"
                                value={officeDesignation}
                                onChangeText={setOfficeDesignation}
                            />
                            <Input
                                label="Department"
                                placeholder="Your department"
                                value={officeDepartment}
                                onChangeText={setOfficeDepartment}
                            />
                            <Input
                                label="Location"
                                placeholder="Office location/city"
                                value={officeLocation}
                                onChangeText={setOfficeLocation}
                            />
                        </View>
                    )}

                    {!hasOffice && (
                        <View style={styles.emptyState}>
                            <Ionicons name="briefcase-outline" size={48} color="#9B9B9B" />
                            <Text style={styles.emptyText}>
                                Toggle above to add your office information
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
