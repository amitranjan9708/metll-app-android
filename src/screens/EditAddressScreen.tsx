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

export const EditAddressScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { updateUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [currentAddress, setCurrentAddress] = useState('');
    const [currentCity, setCurrentCity] = useState('');
    const [currentState, setCurrentState] = useState('');
    const [pastAddress, setPastAddress] = useState('');
    const [pastCity, setPastCity] = useState('');
    const [pastState, setPastState] = useState('');

    useEffect(() => {
        loadExistingData();
    }, []);

    const loadExistingData = async () => {
        try {
            const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
            if (cachedData) {
                const profile = JSON.parse(cachedData);
                if (profile.homeLocation) {
                    if (profile.homeLocation.current) {
                        setCurrentAddress(profile.homeLocation.current.address || '');
                        setCurrentCity(profile.homeLocation.current.city || '');
                        setCurrentState(profile.homeLocation.current.state || '');
                    }
                    if (profile.homeLocation.past) {
                        setPastAddress(profile.homeLocation.past.address || '');
                        setPastCity(profile.homeLocation.past.city || '');
                        setPastState(profile.homeLocation.past.state || '');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load existing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const hasCurrent = currentAddress || currentCity;
            const hasPast = pastAddress || pastCity;

            const homeLocation = (hasCurrent || hasPast) ? {
                current: hasCurrent ? {
                    address: currentAddress || undefined,
                    city: currentCity || undefined,
                    state: currentState || undefined,
                } : undefined,
                past: hasPast ? {
                    address: pastAddress || undefined,
                    city: pastCity || undefined,
                    state: pastState || undefined,
                } : undefined,
            } : null;

            const response = await userApi.updateProfile({ homeLocation });

            if (response.success) {
                const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
                if (cachedData) {
                    const profile = JSON.parse(cachedData);
                    profile.homeLocation = homeLocation;
                    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
                }

                await updateUser({ homeLocation: homeLocation || undefined });

                Alert.alert('Success', 'Address updated', [
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
                <Text style={styles.headerTitle}>Edit Address</Text>
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
                    <Text style={styles.sectionTitle}>Current Location</Text>
                    <View style={styles.form}>
                        <Input
                            label="Address"
                            placeholder="Current address"
                            value={currentAddress}
                            onChangeText={setCurrentAddress}
                        />
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Input
                                    label="City"
                                    placeholder="City"
                                    value={currentCity}
                                    onChangeText={setCurrentCity}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Input
                                    label="State"
                                    placeholder="State"
                                    value={currentState}
                                    onChangeText={setCurrentState}
                                />
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Previous Location (Optional)</Text>
                    <View style={styles.form}>
                        <Input
                            label="Address"
                            placeholder="Previous address"
                            value={pastAddress}
                            onChangeText={setPastAddress}
                        />
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Input
                                    label="City"
                                    placeholder="City"
                                    value={pastCity}
                                    onChangeText={setPastCity}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Input
                                    label="State"
                                    placeholder="State"
                                    value={pastState}
                                    onChangeText={setPastState}
                                />
                            </View>
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
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#E07A5F', marginBottom: 12 },
    form: { marginTop: 8 },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    footer: { padding: 20, paddingTop: 12, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
});
