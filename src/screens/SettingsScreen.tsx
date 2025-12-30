import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const navigation = useNavigation();

  const settingsItems = [
    { icon: 'person-outline', title: 'Edit Profile', onPress: () => Alert.alert('Coming Soon', 'Edit profile coming soon') },
    { icon: 'diamond-outline', title: 'Subscription', onPress: () => navigation.navigate('Subscription' as never) },
    { icon: 'notifications-outline', title: 'Notifications', onPress: () => Alert.alert('Coming Soon', 'Notification settings coming soon') },
    { icon: 'lock-closed-outline', title: 'Privacy & Security', onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon') },
    { icon: 'location-outline', title: 'Location Settings', onPress: () => Alert.alert('Coming Soon', 'Location settings coming soon') },
    { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => Alert.alert('Coming Soon', 'Help & Support coming soon') },
    { icon: 'document-text-outline', title: 'Terms & Privacy', onPress: () => Alert.alert('Coming Soon', 'Terms & Privacy coming soon') },
  ];

  return (
    <LinearGradient
      colors={theme.gradients.background.colors as [string, string, string]}
      style={styles.container}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageWrapper}>
            <LinearGradient
              colors={theme.gradients.romantic.colors as [string, string]}
              style={styles.profileRing}
            />
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Ionicons name="person" size={40} color={theme.colors.primary} />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={20} color={theme.colors.heart} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={20} color={theme.colors.accent} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Confessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>
        </View>

        {/* Settings List */}
        <Card style={styles.settingsCard}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingsItem,
                index < settingsItems.length - 1 && styles.settingsItemBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.settingsItemLeft}>
                <View style={styles.settingsIconWrapper}>
                  <Ionicons name={item.icon as any} size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.settingsItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          icon={<Ionicons name="log-out-outline" size={20} color={theme.colors.primary} />}
          style={styles.logoutButton}
        />

        {/* Version */}
        <Text style={styles.versionText}>MetLL v1.0.0 💕</Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: theme.spacing.lg },
  profileSection: { alignItems: 'center', marginBottom: theme.spacing.xl, paddingTop: theme.spacing.lg },
  profileImageWrapper: { position: 'relative', marginBottom: theme.spacing.md },
  profileRing: { position: 'absolute', width: 108, height: 108, borderRadius: 54, top: -4, left: -4 },
  profilePhoto: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: theme.colors.white },
  profilePhotoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.colors.white, ...theme.shadows.md },
  profileName: { ...theme.typography.heading, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  profileEmail: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.sm },
  statItem: { alignItems: 'center', flex: 1, gap: 4 },
  statNumber: { ...theme.typography.subheading, color: theme.colors.textPrimary },
  statLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  statDivider: { width: 1, height: 50, backgroundColor: theme.colors.border },
  settingsCard: { marginBottom: theme.spacing.lg },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.md },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  settingsItemLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  settingsIconWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primaryLight + '30', justifyContent: 'center', alignItems: 'center' },
  settingsItemText: { ...theme.typography.body, color: theme.colors.textPrimary },
  logoutButton: { marginTop: theme.spacing.md },
  versionText: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg },
});
