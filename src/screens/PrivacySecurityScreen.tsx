import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../services/api';
import { theme } from '../theme';

export const PrivacySecurityScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();
    const [deletingAccount, setDeletingAccount] = useState(false);

    // Privacy settings state
    const [showOnlineStatus, setShowOnlineStatus] = useState(true);
    const [showLastSeen, setShowLastSeen] = useState(true);
    const [showReadReceipts, setShowReadReceipts] = useState(true);
    const [hideFromSearch, setHideFromSearch] = useState(false);

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => {
                        // Second confirmation
                        Alert.alert(
                            'Final Confirmation',
                            'This will permanently delete your account, matches, messages, and all data. Are you absolutely sure?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Yes, Delete My Account',
                                    style: 'destructive',
                                    onPress: async () => {
                                        setDeletingAccount(true);
                                        try {
                                            const result = await authApi.deleteAccount();
                                            if (result.success) {
                                                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                                                await logout();
                                            } else {
                                                Alert.alert('Error', result.message || 'Failed to delete account');
                                            }
                                        } catch (error: any) {
                                            Alert.alert('Error', error.message || 'Failed to delete account');
                                        } finally {
                                            setDeletingAccount(false);
                                        }
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy & Security</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Privacy Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Show Online Status</Text>
                            <Text style={styles.settingDesc}>Let others see when you're online</Text>
                        </View>
                        <Switch
                            value={showOnlineStatus}
                            onValueChange={setShowOnlineStatus}
                            trackColor={{ false: '#E5E5E5', true: theme.colors.primary + '40' }}
                            thumbColor={showOnlineStatus ? theme.colors.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Show Last Seen</Text>
                            <Text style={styles.settingDesc}>Let others see when you were last active</Text>
                        </View>
                        <Switch
                            value={showLastSeen}
                            onValueChange={setShowLastSeen}
                            trackColor={{ false: '#E5E5E5', true: theme.colors.primary + '40' }}
                            thumbColor={showLastSeen ? theme.colors.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Read Receipts</Text>
                            <Text style={styles.settingDesc}>Show when you've read messages</Text>
                        </View>
                        <Switch
                            value={showReadReceipts}
                            onValueChange={setShowReadReceipts}
                            trackColor={{ false: '#E5E5E5', true: theme.colors.primary + '40' }}
                            thumbColor={showReadReceipts ? theme.colors.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Hide from Search</Text>
                            <Text style={styles.settingDesc}>Don't show your profile in discovery</Text>
                        </View>
                        <Switch
                            value={hideFromSearch}
                            onValueChange={setHideFromSearch}
                            trackColor={{ false: '#E5E5E5', true: theme.colors.primary + '40' }}
                            thumbColor={hideFromSearch ? theme.colors.primary : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Change password coming soon')}>
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="key-outline" size={22} color="#1A1A1A" />
                            <Text style={styles.menuItemText}>Change Password</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9B9B9B" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Two-factor authentication coming soon')}>
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="shield-checkmark-outline" size={22} color="#1A1A1A" />
                            <Text style={styles.menuItemText}>Two-Factor Authentication</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9B9B9B" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('Coming Soon', 'Blocked users coming soon')}>
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="ban-outline" size={22} color="#1A1A1A" />
                            <Text style={styles.menuItemText}>Blocked Users</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9B9B9B" />
                    </TouchableOpacity>
                </View>

                {/* Data Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data & Account</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Download data coming soon')}>
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="download-outline" size={22} color="#1A1A1A" />
                            <Text style={styles.menuItemText}>Download My Data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9B9B9B" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Clear cache coming soon')}>
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="trash-bin-outline" size={22} color="#1A1A1A" />
                            <Text style={styles.menuItemText}>Clear Cache</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9B9B9B" />
                    </TouchableOpacity>

                    {/* Delete Account - Danger Zone */}
                    <TouchableOpacity
                        style={[styles.menuItem, styles.dangerItem, { borderBottomWidth: 0 }]}
                        onPress={handleDeleteAccount}
                        disabled={deletingAccount}
                    >
                        {deletingAccount ? (
                            <ActivityIndicator size="small" color="#EF4444" style={{ marginRight: 14 }} />
                        ) : (
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="skull-outline" size={22} color="#EF4444" />
                                <Text style={styles.dangerItemText}>Delete Account</Text>
                            </View>
                        )}
                        {!deletingAccount && <Ionicons name="chevron-forward" size={20} color="#EF4444" />}
                    </TouchableOpacity>
                </View>

                {/* Info text */}
                <Text style={styles.infoText}>
                    Deleting your account will permanently remove all your data, matches, messages, and profile information. This action cannot be undone.
                </Text>

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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B6B6B',
        textTransform: 'uppercase',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        color: '#1A1A1A',
        marginBottom: 2,
    },
    settingDesc: {
        fontSize: 13,
        color: '#6B6B6B',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    menuItemText: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    dangerItem: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    dangerItemText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '500',
    },
    infoText: {
        fontSize: 13,
        color: '#9B9B9B',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});
