import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ConfessionType = 'school' | 'college' | 'office' | 'home';

const CONFESSION_CARDS = [
  { type: 'school' as const, icon: 'school', title: 'School', subtitle: 'School crush', color: '#4A5FA8' },
  { type: 'college' as const, icon: 'library', title: 'College', subtitle: 'College crush', color: '#6B7FBF' },
  { type: 'office' as const, icon: 'business', title: 'Office', subtitle: 'Work crush', color: '#E8A4B8' },
  { type: 'home' as const, icon: 'home', title: 'Nearby', subtitle: 'Local crush', color: '#E05C5C' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [confessionType, setConfessionType] = useState<ConfessionType | null>(null);
  const [showCrushDetails, setShowCrushDetails] = useState(false);
  const [showMatchingPhotos, setShowMatchingPhotos] = useState(false);

  const [crushSchoolName, setCrushSchoolName] = useState('');
  const [crushSchoolLocation, setCrushSchoolLocation] = useState('');
  const [crushSchoolCity, setCrushSchoolCity] = useState('');
  const [crushSchoolState, setCrushSchoolState] = useState('');
  const [crushSchoolClass, setCrushSchoolClass] = useState('');
  const [crushSchoolSection, setCrushSchoolSection] = useState('');

  const [crushCollegeName, setCrushCollegeName] = useState('');
  const [crushCollegeDepartment, setCrushCollegeDepartment] = useState('');
  const [crushCollegeLocation, setCrushCollegeLocation] = useState('');

  const [crushOfficeName, setCrushOfficeName] = useState('');
  const [crushOfficeLocation, setCrushOfficeLocation] = useState('');
  const [crushOfficeDepartment, setCrushOfficeDepartment] = useState('');
  const [crushOfficeDesignation, setCrushOfficeDesignation] = useState('');

  const [crushHomeLocation, setCrushHomeLocation] = useState('');
  const [crushHomeCity, setCrushHomeCity] = useState('');
  const [crushHomeState, setCrushHomeState] = useState('');

  const [selectedCrushId, setSelectedCrushId] = useState<string | null>(null);
  const cardAnims = useRef(CONFESSION_CARDS.map(() => new Animated.Value(0))).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const statsCardOpacity = useRef(new Animated.Value(1)).current;
  const statsCardTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    CONFESSION_CARDS.forEach((_, index) => {
      Animated.spring(cardAnims[index], {
        toValue: 1,
        delay: index * 80,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // Hide stats card when scrolling up (above threshold)
        const threshold = 50;
        if (offsetY > threshold) {
          // Fade out and move up
          Animated.parallel([
            Animated.timing(statsCardOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(statsCardTranslateY, {
              toValue: -20,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // Fade in and move back
          Animated.parallel([
            Animated.timing(statsCardOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(statsCardTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }
  );

  const mockMatchingUsers = [
    { id: '1', name: 'Alex', photo: null, matchScore: 95 },
    { id: '2', name: 'Sam', photo: null, matchScore: 88 },
    { id: '3', name: 'Jordan', photo: null, matchScore: 82 },
  ];

  const handleConfessionTypeSelect = (type: ConfessionType) => {
    setConfessionType(type);
    setShowCrushDetails(true);
  };

  const validateCrushDetails = (): boolean => {
    if (!confessionType) return false;

    switch (confessionType) {
      case 'school':
        if (!crushSchoolName || !crushSchoolCity) {
          Alert.alert('Required', 'Please fill required fields');
          return false;
        }
        break;
      case 'college':
        if (!crushCollegeName || !crushCollegeDepartment) {
          Alert.alert('Required', 'Please fill required fields');
          return false;
        }
        break;
      case 'office':
        if (!crushOfficeName || !crushOfficeLocation) {
          Alert.alert('Required', 'Please fill required fields');
          return false;
        }
        break;
      case 'home':
        if (!crushHomeCity) {
          Alert.alert('Required', 'Please fill required fields');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSearchCrush = () => {
    if (!validateCrushDetails()) return;
    setShowMatchingPhotos(true);
  };

  const handleSelectCrush = (crushId: string) => {
    setSelectedCrushId(crushId);
    handleSubmitConfession(crushId);
  };

  const handleSkipSelection = () => handleSubmitConfession();

  const resetForm = () => {
    setConfessionType(null);
    setShowCrushDetails(false);
    setShowMatchingPhotos(false);
    setSelectedCrushId(null);
    setCrushSchoolName(''); setCrushSchoolLocation(''); setCrushSchoolCity(''); setCrushSchoolState(''); setCrushSchoolClass(''); setCrushSchoolSection('');
    setCrushCollegeName(''); setCrushCollegeDepartment(''); setCrushCollegeLocation('');
    setCrushOfficeName(''); setCrushOfficeLocation(''); setCrushOfficeDepartment(''); setCrushOfficeDesignation('');
    setCrushHomeLocation(''); setCrushHomeCity(''); setCrushHomeState('');
  };

  const handleSubmitConfession = async (crushId?: string) => {
    if (!confessionType) return;
    Alert.alert(
      'Confession Saved! 💕',
      crushId
        ? 'Your confession has been saved. If they confess about you too, you\'ll get a match!'
        : 'Your confession has been saved. We\'ll notify you if someone matches!',
      [{ text: 'OK', onPress: resetForm }]
    );
  };

  const renderCrushDetailsForm = () => {
    if (!confessionType) return null;

    switch (confessionType) {
      case 'school':
        return (
          <>
            <Input label="School Name *" placeholder="Their school" value={crushSchoolName} onChangeText={setCrushSchoolName} />
            <View style={styles.row}>
              <View style={styles.halfInput}><Input label="City *" placeholder="City" value={crushSchoolCity} onChangeText={setCrushSchoolCity} /></View>
              <View style={styles.halfInput}><Input label="Class" placeholder="e.g., 12th" value={crushSchoolClass} onChangeText={setCrushSchoolClass} /></View>
            </View>
          </>
        );
      case 'college':
        return (
          <>
            <Input label="College Name *" placeholder="Their college" value={crushCollegeName} onChangeText={setCrushCollegeName} />
            <Input label="Department *" placeholder="Their department" value={crushCollegeDepartment} onChangeText={setCrushCollegeDepartment} />
          </>
        );
      case 'office':
        return (
          <>
            <Input label="Company *" placeholder="Their company" value={crushOfficeName} onChangeText={setCrushOfficeName} />
            <Input label="Location *" placeholder="Office location" value={crushOfficeLocation} onChangeText={setCrushOfficeLocation} />
          </>
        );
      case 'home':
        return (
          <>
            <Input label="City *" placeholder="Their city" value={crushHomeCity} onChangeText={setCrushHomeCity} />
            <Input label="Area" placeholder="Neighborhood" value={crushHomeLocation} onChangeText={setCrushHomeLocation} />
          </>
        );
      default:
        return null;
    }
  };

  if (showMatchingPhotos) {
    return (
      <LinearGradient colors={theme.gradients.background.colors as [string, string, string]} style={styles.container}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowMatchingPhotos(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Your Crush</Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={styles.matchSubtitle}>{mockMatchingUsers.length} people found</Text>

          <View style={styles.photosGrid}>
            {mockMatchingUsers.map((person) => (
              <TouchableOpacity
                key={person.id}
                style={[styles.photoCard, selectedCrushId === person.id && styles.photoCardSelected]}
                onPress={() => handleSelectCrush(person.id)}
                activeOpacity={0.8}
              >
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={36} color={theme.colors.primary} />
                </View>
                <Text style={styles.photoName}>{person.name}</Text>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchScore}>{person.matchScore}%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Skip Selection" onPress={handleSkipSelection} variant="outline" style={styles.skipBtn} />
        </ScrollView>
      </LinearGradient>
    );
  }

  if (showCrushDetails) {
    return (
      <LinearGradient colors={theme.gradients.background.colors as [string, string, string]} style={styles.container}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowCrushDetails(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Crush Details</Text>
            <View style={{ width: 36 }} />
          </View>

          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={[styles.formIconBg, { backgroundColor: CONFESSION_CARDS.find(c => c.type === confessionType)?.color + '20' }]}>
                <Ionicons name={CONFESSION_CARDS.find(c => c.type === confessionType)?.icon as any} size={24} color={CONFESSION_CARDS.find(c => c.type === confessionType)?.color} />
              </View>
              <Text style={styles.formTitle}>{CONFESSION_CARDS.find(c => c.type === confessionType)?.title} Crush</Text>
            </View>
            {renderCrushDetailsForm()}
            <Button title="Find Matches" onPress={handleSearchCrush} style={styles.searchBtn} />
          </Card>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.gradients.background.colors as [string, string, string]} style={styles.container}>
      {/* Top Header - Welcome text and Icons */}
      <View style={[styles.topHeader, { top: insets.top + 10 }]}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
        </View>
        <View style={styles.topRightContainer}>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Settings' as never)}
            activeOpacity={0.8}
          >
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person-outline" size={20} color="#8E8E93" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.flex} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Subtitle */}
        <Text style={styles.welcomeSubtext}>Who's your crush today?</Text>

        {/* Stats Card */}
        <Animated.View
          style={[
            styles.statsCardContainer,
            {
              opacity: statsCardOpacity,
              transform: [{ translateY: statsCardTranslateY }],
            },
          ]}
        >
          <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="heart" size={20} color={theme.colors.heart} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="chatbubble" size={20} color={theme.colors.accent} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Confessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="eye" size={20} color={theme.colors.primary} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>
        </Card>
        </Animated.View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Confess about your crush</Text>

        {/* Confession Cards Grid */}
        <View style={styles.cardsGrid}>
          {CONFESSION_CARDS.map((card, index) => (
            <Animated.View
              key={card.type}
              style={[styles.confessionCardWrapper, {
                opacity: cardAnims[index],
                transform: [{ scale: cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
              }]}
            >
              <TouchableOpacity style={styles.confessionCard} onPress={() => handleConfessionTypeSelect(card.type)} activeOpacity={0.85}>
                <View style={[styles.cardIconBg, { backgroundColor: card.color + '15' }]}>
                  <Ionicons name={card.icon as any} size={26} color={card.color} />
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Live Match Card */}
        <TouchableOpacity 
          style={styles.liveMatchCard} 
          onPress={() => navigation.navigate('LiveMatching' as never)} 
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={theme.gradients.primary.colors as [string, string]} 
            style={styles.liveMatchCardGradient} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.liveMatchContent}>
              <View style={styles.liveMatchLeft}>
                <View style={styles.liveMatchIconContainer}>
                  <Ionicons name="location" size={32} color={theme.colors.white} />
                </View>
                <Text style={styles.liveMatchTitle}>Live Matching</Text>
                <Text style={styles.liveMatchSubtitle}>Find people nearby in real-time</Text>
                <View style={styles.liveMatchStats}>
                  <View style={styles.liveMatchStatItem}>
                    <Ionicons name="people" size={16} color={theme.colors.white} />
                    <Text style={styles.liveMatchStatText}>12 nearby</Text>
                  </View>
                  <View style={styles.liveMatchStatItem}>
                    <Ionicons name="radio" size={16} color={theme.colors.white} />
                    <Text style={styles.liveMatchStatText}>100m radius</Text>
                  </View>
                </View>
              </View>
              <View style={styles.liveMatchRight}>
                <View style={styles.liveMatchIllustration}>
                  {/* Map illustration with dots */}
                  <View style={styles.mapContainer}>
                    <View style={styles.mapCircle} />
                    <View style={[styles.mapDot, { top: 20, left: 30 }]} />
                    <View style={[styles.mapDot, { top: 50, left: 60 }]} />
                    <View style={[styles.mapDot, { top: 35, left: 80 }]} />
                    <View style={[styles.mapDot, { top: 60, left: 40 }]} />
                    <View style={styles.mapCenter}>
                      <Ionicons name="person" size={16} color={theme.colors.white} />
                    </View>
                  </View>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color={theme.colors.white} style={styles.liveMatchArrow} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const cardWidth = (width - 48 - 12) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 80 }, // Extra top padding for header
  topHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  topRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.shadows.md,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.white, justifyContent: 'center', alignItems: 'center', ...theme.shadows.sm },
  headerTitle: { ...theme.typography.subheading, color: theme.colors.textPrimary },

  welcomeText: { ...theme.typography.subheading, color: theme.colors.textPrimary },
  welcomeSubtext: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: 8, marginBottom: 16 },

  statsCardContainer: {
    marginBottom: 20,
  },
  statsCard: { padding: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { ...theme.typography.subheading, color: theme.colors.textPrimary },
  statLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  statDivider: { width: 1, height: 40, backgroundColor: theme.colors.border },

  sectionTitle: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 },

  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  confessionCardWrapper: { width: cardWidth },
  confessionCard: { backgroundColor: theme.colors.white, borderRadius: 16, padding: 16, alignItems: 'center', ...theme.shadows.sm, borderWidth: 1, borderColor: theme.colors.border },
  cardIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardTitle: { ...theme.typography.bodyBold, color: theme.colors.textPrimary },
  cardSubtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },

  liveMatchCard: { 
    marginTop: 34, 
    borderRadius: 20, 
    overflow: 'hidden', 
    ...theme.shadows.lg,
    marginBottom: 20,
    width: '100%',
  },
  liveMatchCardGradient: { 
    padding: 20,
    minHeight: 180,
    width: '100%',
  },
  liveMatchContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  liveMatchLeft: {
    flex: 1,
    gap: 8,
  },
  liveMatchIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveMatchTitle: {
    ...theme.typography.subheading,
    fontSize: 20,
    color: theme.colors.white,
    fontWeight: '600',
  },
  liveMatchSubtitle: {
    ...theme.typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  liveMatchStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  liveMatchStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveMatchStatText: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
  },
  liveMatchRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  liveMatchIllustration: {
    width: 120,
    height: 120,
    position: 'relative',
    marginBottom: 8,
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mapCircle: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    top: '10%',
    left: '10%',
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  mapDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  mapCenter: {
    position: 'absolute',
    top: 48,
    left: 48,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  liveMatchArrow: {
    opacity: 0.9,
  },

  formCard: { marginTop: 8 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  formIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  formTitle: { ...theme.typography.subheading, color: theme.colors.textPrimary },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  searchBtn: { marginTop: 12 },

  matchSubtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  photoCard: { width: cardWidth, backgroundColor: theme.colors.white, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: theme.colors.border, ...theme.shadows.sm },
  photoCardSelected: { borderColor: theme.colors.primary },
  photoPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primaryLight + '30', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  photoName: { ...theme.typography.bodyBold, color: theme.colors.textPrimary },
  matchBadge: { backgroundColor: theme.colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 6 },
  matchScore: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '600' },
  skipBtn: { marginTop: 8 },
});
