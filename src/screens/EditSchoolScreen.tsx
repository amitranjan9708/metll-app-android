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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const PROFILE_CACHE_KEY = '@user_profile_cache';

export const EditSchoolScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { user, updateUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [hasSchool, setHasSchool] = useState(false);
    const [schoolName, setSchoolName] = useState('');
    const [schoolLocation, setSchoolLocation] = useState('');
    const [schoolCity, setSchoolCity] = useState('');
    const [schoolState, setSchoolState] = useState('');
    const [schoolClass, setSchoolClass] = useState('');
    const [schoolSection, setSchoolSection] = useState('');

    useEffect(() => {
        loadExistingData();
    }, []);

    const loadExistingData = async () => {
        try {
            const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
            if (cachedData) {
                const profile = JSON.parse(cachedData);
                if (profile.school) {
                    setHasSchool(true);
                    setSchoolName(profile.school.name || '');
                    setSchoolLocation(profile.school.location || '');
                    setSchoolCity(profile.school.city || '');
                    setSchoolState(profile.school.state || '');
                    setSchoolClass(profile.school.class || '');
                    setSchoolSection(profile.school.section || '');
                }
            }
        } catch (error) {
            console.error('Failed to load existing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (hasSchool && (!schoolName || !schoolCity)) {
            Alert.alert('Required', 'Please fill in School Name and City');
            return;
        }

        try {
            setSaving(true);

            const schoolData = hasSchool ? {
                name: schoolName,
                location: schoolLocation || undefined,
                city: schoolCity,
                state: schoolState || undefined,
                class: schoolClass || undefined,
                section: schoolSection || undefined,
            } : null;

            // Update via API
            const response = await authApi.updateProfile({ school: schoolData });

            if (response.success) {
                // Update local cache
                const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
                if (cachedData) {
                    const profile = JSON.parse(cachedData);
                    profile.school = schoolData;
                    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
                }

                // Update user context
                await updateUser({ school: schoolData || undefined });

                Alert.alert('Success', 'School details updated', [
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
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="close" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit School</Text>
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
                    {/* Toggle */}
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={() => setHasSchool(!hasSchool)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, hasSchool && styles.checkboxActive]}>
                            {hasSchool && <Ionicons name="checkmark" size={16} color="#FFF" />}
                        </View>
                        <Text style={styles.toggleText}>I want to add school details</Text>
                    </TouchableOpacity>

                    {hasSchool && (
                        <View style={styles.form}>
                            <Input
                                label="School Name *"
                                placeholder="Enter school name"
                                value={schoolName}
                                onChangeText={setSchoolName}
                            />
                            <Input
                                label="Location"
                                placeholder="School address/area"
                                value={schoolLocation}
                                onChangeText={setSchoolLocation}
                            />
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="City *"
                                        placeholder="City"
                                        value={schoolCity}
                                        onChangeText={setSchoolCity}
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="State"
                                        placeholder="State"
                                        value={schoolState}
                                        onChangeText={setSchoolState}
                                    />
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Class"
                                        placeholder="e.g., 12th"
                                        value={schoolClass}
                                        onChangeText={setSchoolClass}
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Section"
                                        placeholder="e.g., A"
                                        value={schoolSection}
                                        onChangeText={setSchoolSection}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {!hasSchool && (
                        <View style={styles.emptyState}>
                            <Ionicons name="book-outline" size={48} color="#9B9B9B" />
                            <Text style={styles.emptyText}>
                                Toggle above to add your school information
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Save Button */}
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
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    flex: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
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
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: '#E07A5F',
        borderColor: '#E07A5F',
    },
    toggleText: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    form: {
        marginTop: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 15,
        color: '#9B9B9B',
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        paddingTop: 12,
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
});
