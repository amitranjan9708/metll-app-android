import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { referralApi } from '../services/api';
import { Button } from '../components/Button';

export const ReferralScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [rewards, setRewards] = useState<any[]>([]);
    const [redeeming, setRedeeming] = useState(false);

    useEffect(() => {
        loadReferralData();
    }, []);

    const loadReferralData = async () => {
        try {
            setLoading(true);
            const response = await referralApi.getStats();
            if (response.success && response.data) {
                setStats(response.data.stats);
                setRewards(response.data.rewards);
            }
        } catch (error) {
            console.error('Error loading referral data:', error);
            Alert.alert('Error', 'Failed to load referral data');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!stats?.referralCode) return;

        try {
            await Share.share({
                message: `Join me on Metll - the dating app for meaningful connections! Use my code ${stats.referralCode} to sign up and we both get closer to free coffee dates! ☕`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleRedeem = async () => {
        try {
            setRedeeming(true);
            const response = await referralApi.redeemReward();
            if (response.success) {
                Alert.alert('Success', 'Reward redeemed successfully! Enjoy your coffee date! ☕');
                loadReferralData(); // Refresh data
            } else {
                Alert.alert('Error', response.message || 'Failed to redeem reward');
            }
        } catch (error: any) {
            console.error('Redeem error', error);
            Alert.alert('Error', 'Failed to redeem reward');
        } finally {
            setRedeeming(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const availableRewards = rewards.filter(r => r.status === 'available').length;
    const progressToNextReward = (stats?.totalReferrals || 0) % 3;

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Invite Friends</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Main Banner */}
                <View style={styles.banner}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="gift-outline" size={48} color="#FFF" />
                    </View>
                    <Text style={styles.bannerTitle}>Refer & Earn Coffee Dates</Text>
                    <Text style={styles.bannerText}>
                        Invite 3 friends to join Metll and earn a FREE coffee date! ☕
                    </Text>
                </View>

                {/* Referral Code */}
                <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>Your Referral Code</Text>
                    <TouchableOpacity style={styles.codeBox} onPress={handleShare}>
                        <Text style={styles.codeText}>{stats?.referralCode || 'LOADING...'}</Text>
                        <Ionicons name="copy-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <Button
                        title="Share Code"
                        onPress={handleShare}
                        style={styles.shareButton}
                    />
                </View>

                {/* Progress */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Progress</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats?.totalReferrals || 0}</Text>
                            <Text style={styles.statLabel}>Friends Invited</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{availableRewards}</Text>
                            <Text style={styles.statLabel}>Rewards Available</Text>
                        </View>
                    </View>

                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${(progressToNextReward / 3) * 100}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {3 - progressToNextReward} more referrals for next reward
                        </Text>
                    </View>
                </View>

                {/* Rewards Action */}
                {availableRewards > 0 && (
                    <View style={styles.redeemContainer}>
                        <Text style={styles.redeemTitle}>You have rewards to claim!</Text>
                        <Button
                            title="Redeem Coffee Date"
                            onPress={handleRedeem}
                            loading={redeeming}
                            style={styles.redeemButton}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
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
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    content: {
        padding: 24,
    },
    banner: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    bannerText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 22,
    },
    codeContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    codeLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    codeText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginRight: 10,
        letterSpacing: 1,
    },
    shareButton: {
        backgroundColor: '#007AFF',
    },
    section: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
    },
    progressBarContainer: {
        marginTop: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#34C759',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
    },
    redeemContainer: {
        backgroundColor: '#FFF8E1', // Light gold/yellow
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    redeemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#B08800',
        marginBottom: 16,
        textAlign: 'center',
    },
    redeemButton: {
        backgroundColor: '#FFC107',
    },
});
