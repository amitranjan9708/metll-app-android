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

export const EditBasicInfoScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { user, updateUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');

    const genderOptions = ['Male', 'Female', 'Other'];

    useEffect(() => {
        loadExistingData();
    }, []);

    const loadExistingData = async () => {
        try {
            const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
            if (cachedData) {
                const profile = JSON.parse(cachedData);
                setName(profile.name || '');
                setBio(profile.bio || '');
                setAge(profile.age ? String(profile.age) : '');
                setGender(profile.gender || '');
            } else if (user) {
                const u = user as any;
                setName(u.name || '');
                setBio(u.bio || '');
                setAge(u.age ? String(u.age) : '');
                setGender(u.gender || '');
            }
        } catch (error) {
            console.error('Failed to load existing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Name is required');
            return;
        }

        try {
            setSaving(true);

            const basicInfo = {
                name: name.trim(),
                bio: bio.trim() || undefined,
                age: age ? parseInt(age, 10) : undefined,
                gender: gender || undefined,
            };

            const response = await authApi.updateProfile(basicInfo);

            if (response.success) {
                const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
                if (cachedData) {
                    const profile = JSON.parse(cachedData);
                    profile.name = basicInfo.name;
                    profile.bio = basicInfo.bio;
                    profile.age = basicInfo.age;
                    profile.gender = basicInfo.gender;
                    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
                }

                await updateUser(basicInfo);

                Alert.alert('Success', 'Basic info updated', [
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
                <Text style={styles.headerTitle}>Edit Basic Info</Text>
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
                    <View style={styles.form}>
                        <Input
                            label="Name *"
                            placeholder="Your full name"
                            value={name}
                            onChangeText={setName}
                        />
                        <Input
                            label="Bio"
                            placeholder="Tell others about yourself..."
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={3}
                        />
                        <Input
                            label="Age"
                            placeholder="Your age"
                            value={age}
                            onChangeText={setAge}
                            keyboardType="number-pad"
                        />

                        <Text style={styles.fieldLabel}>Gender</Text>
                        <View style={styles.genderRow}>
                            {genderOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.genderOption,
                                        gender === option && styles.genderOptionActive,
                                    ]}
                                    onPress={() => setGender(option)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.genderOptionText,
                                            gender === option && styles.genderOptionTextActive,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
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
    form: { marginTop: 8 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8, marginTop: 8 },
    genderRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    genderOption: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.08)',
        alignItems: 'center',
    },
    genderOptionActive: {
        borderColor: '#E07A5F',
        backgroundColor: 'rgba(224, 122, 95, 0.08)',
    },
    genderOptionText: {
        fontSize: 15,
        color: '#6B6B6B',
        fontWeight: '500',
    },
    genderOptionTextActive: {
        color: '#E07A5F',
        fontWeight: '600',
    },
    footer: { padding: 20, paddingTop: 12, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
});
