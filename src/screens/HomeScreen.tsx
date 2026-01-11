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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ConfessionType = 'school' | 'college' | 'office' | 'home';

const CONFESSION_CARDS = [
  {
    type: 'college' as const,
    icon: 'school-outline',
    title: 'College',
    subtitle: 'Campus connections',
  },
  {
    type: 'school' as const,
    icon: 'book-outline',
    title: 'School',
    subtitle: 'Classmate crushes',
  },
  {
    type: 'office' as const,
    icon: 'briefcase-outline',
    title: 'Office',
    subtitle: 'Workplace sparks',
  },
  {
    type: 'home' as const,
    icon: 'location-outline',
    title: 'Nearby',
    subtitle: 'Local connections',
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [confessionType, setConfessionType] = useState<ConfessionType | null>(null);
  const [showCrushDetails, setShowCrushDetails] = useState(false);
  const [showMatchingPhotos, setShowMatchingPhotos] = useState(false);

  const [crushSchoolName, setCrushSchoolName] = useState('');
  const [crushSchoolCity, setCrushSchoolCity] = useState('');
  const [crushSchoolClass, setCrushSchoolClass] = useState('');

  const [crushCollegeName, setCrushCollegeName] = useState('');
  const [crushCollegeDepartment, setCrushCollegeDepartment] = useState('');

  const [crushOfficeName, setCrushOfficeName] = useState('');
  const [crushOfficeLocation, setCrushOfficeLocation] = useState('');

  const [crushHomeCity, setCrushHomeCity] = useState('');
  const [crushHomeLocation, setCrushHomeLocation] = useState('');

  const [selectedCrushId, setSelectedCrushId] = useState<string | null>(null);
  const cardAnims = useRef(CONFESSION_CARDS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    CONFESSION_CARDS.forEach((_, index) => {
      Animated.spring(cardAnims[index], {
        toValue: 1,
        delay: index * 60,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const mockMatchingUsers = [
    { id: '1', name: 'Alex', matchScore: 95 },
    { id: '2', name: 'Sam', matchScore: 88 },
    { id: '3', name: 'Jordan', matchScore: 82 },
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
    setCrushSchoolName(''); setCrushSchoolCity(''); setCrushSchoolClass('');
    setCrushCollegeName(''); setCrushCollegeDepartment('');
    setCrushOfficeName(''); setCrushOfficeLocation('');
    setCrushHomeLocation(''); setCrushHomeCity('');
  };

  const handleSubmitConfession = async (crushId?: string) => {
    if (!confessionType) return;
    Alert.alert(
      'Sent! 💫',
      crushId
        ? 'If they feel the same, you\'ll match!'
        : 'We\'ll notify you when someone matches.',
      [{ text: 'Done', onPress: resetForm }]
    );
  };

  const renderCrushDetailsForm = () => {
    if (!confessionType) return null;
    switch (confessionType) {
      case 'school':
        return (
          <>
            <Input label="School Name" placeholder="Where do they study?" value={crushSchoolName} onChangeText={setCrushSchoolName} />
            <View style={styles.row}>
              <View style={styles.halfInput}><Input label="City" placeholder="City" value={crushSchoolCity} onChangeText={setCrushSchoolCity} /></View>
              <View style={styles.halfInput}><Input label="Class" placeholder="e.g. 12th" value={crushSchoolClass} onChangeText={setCrushSchoolClass} /></View>
            </View>
          </>
        );
      case 'college':
        return (
          <>
            <Input label="College Name" placeholder="Where do they study?" value={crushCollegeName} onChangeText={setCrushCollegeName} />
            <Input label="Department" placeholder="Their department" value={crushCollegeDepartment} onChangeText={setCrushCollegeDepartment} />
          </>
        );
      case 'office':
        return (
          <>
            <Input label="Company" placeholder="Where do they work?" value={crushOfficeName} onChangeText={setCrushOfficeName} />
            <Input label="Location" placeholder="Office location" value={crushOfficeLocation} onChangeText={setCrushOfficeLocation} />
          </>
        );
      case 'home':
        return (
          <>
            <Input label="City" placeholder="Their city" value={crushHomeCity} onChangeText={setCrushHomeCity} />
            <Input label="Area" placeholder="Neighborhood (optional)" value={crushHomeLocation} onChangeText={setCrushHomeLocation} />
          </>
        );
      default:
        return null;
    }
  };

  // Matching photos screen - minimal style
  if (showMatchingPhotos) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => setShowMatchingPhotos(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Your Crush</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.matchSubtitle}>{mockMatchingUsers.length} people found</Text>

          <View style={styles.peopleList}>
            {mockMatchingUsers.map((person) => (
              <TouchableOpacity
                key={person.id}
                style={[styles.personCard, selectedCrushId === person.id && styles.personCardSelected]}
                onPress={() => handleSelectCrush(person.id)}
                activeOpacity={0.7}
              >
                <View style={styles.personAvatar}>
                  <Ionicons name="person" size={28} color="#6B6B6B" />
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personMatch}>{person.matchScore}% match</Text>
                </View>
                <Ionicons
                  name={selectedCrushId === person.id ? "checkmark-circle" : "chevron-forward"}
                  size={24}
                  color={selectedCrushId === person.id ? "#E07A5F" : "#9B9B9B"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleSkipSelection} style={styles.skipLink}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Crush details form - clean, minimal
  if (showCrushDetails) {
    const currentCard = CONFESSION_CARDS.find(c => c.type === confessionType);
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => setShowCrushDetails(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.formScrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formTypeIndicator}>
            <View style={styles.formTypeIcon}>
              <Ionicons name={currentCard?.icon as any} size={24} color="#1A1A1A" />
            </View>
            <Text style={styles.formTypeText}>{currentCard?.title} Crush</Text>
          </View>

          <Text style={styles.formDescription}>
            Tell us a bit about where you know them from
          </Text>

          <View style={styles.formFields}>
            {renderCrushDetailsForm()}
          </View>

          <Button title="Find Matches" onPress={handleSearchCrush} style={styles.findBtn} />
        </ScrollView>
      </View>
    );
  }

  // Main home screen - Hinge-inspired minimal design
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.mainHeader, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Who's on your mind?</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          {user?.photo ? (
            <Image 
              source={{ uri: user.photo }} 
              style={styles.profileImage}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={32} color="#1A1A1A" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Confession Cards */}
        <Text style={styles.sectionTitle}>Make a confession</Text>

        {CONFESSION_CARDS.map((card, index) => (
          <Animated.View
            key={card.type}
            style={{
              opacity: cardAnims[index],
              transform: [{
                translateY: cardAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }],
            }}
          >
            <TouchableOpacity
              style={styles.confessionCard}
              onPress={() => handleConfessionTypeSelect(card.type)}
              activeOpacity={0.7}
            >
              <View style={styles.cardIcon}>
                <Ionicons name={card.icon as any} size={24} color="#1A1A1A" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#9B9B9B" />
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Live Feature Card - Modern Gradient Design */}
        <TouchableOpacity
          style={styles.liveCard}
          onPress={() => navigation.navigate('LiveMatching' as never)}
          activeOpacity={0.85}
        >
          {/* Gradient Background Layers */}
          <View style={styles.liveGradientBase} />
          <View style={styles.liveGradientOverlay} />

          {/* Decorative Circles */}
          <View style={styles.liveDecorCircle1} />
          <View style={styles.liveDecorCircle2} />
          <View style={styles.liveDecorCircle3} />

          <View style={styles.liveCardInner}>
            {/* Left Content */}
            <View style={styles.liveCardContent}>
              {/* Live Badge with Pulse */}
              <View style={styles.liveBadge}>
                <View style={styles.livePulseOuter}>
                  <View style={styles.livePulseInner} />
                  <View style={styles.liveDot} />
                </View>
                <Text style={styles.liveText}>LIVE NOW</Text>
              </View>

              {/* Main Text */}
              <Text style={styles.liveTitle}>Discover Nearby</Text>
              <Text style={styles.liveSubtitle}>Find people close to you right now</Text>

              {/* Stats Row */}
              <View style={styles.liveStatsRow}>
                <View style={styles.liveStat}>
                  <MaterialCommunityIcons name="account-group" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.liveStatText}>12 nearby</Text>
                </View>
                <View style={styles.liveStatDivider} />
                <View style={styles.liveStat}>
                  <Ionicons name="location" size={12} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.liveStatText}>5km radius</Text>
                </View>
              </View>
            </View>

            {/* Right Side - Radar Icon */}
            <View style={styles.liveRadarContainer}>
              <View style={styles.liveRadarRing1} />
              <View style={styles.liveRadarRing2} />
              <View style={styles.liveRadarCenter}>
                <Ionicons name="navigate" size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Arrow Indicator */}
          <View style={styles.liveArrowContainer}>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.8)" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const cardWidth = (width - 48 - 12) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  flex: { flex: 1 },

  // Header
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 15,
    color: '#6B6B6B',
    marginTop: 4,
  },
  profileBtn: {
    padding: 4,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // Main content
  mainScrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9B9B9B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },

  // Confession cards - minimal list style
  confessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 2,
  },

  // Live card - Modern Gradient Design
  liveCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    marginTop: 28,
    minHeight: 160,
  },
  liveGradientBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#667EEA',
  },
  liveGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#764BA2',
    opacity: 0.6,
  },
  liveDecorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  liveDecorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  liveDecorCircle3: {
    position: 'absolute',
    top: 20,
    left: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  liveCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    zIndex: 1,
  },
  liveCardContent: {
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  livePulseOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  livePulseInner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ADE80',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  liveTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  liveSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  liveStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveStatText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  liveStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  liveRadarContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveRadarRing1: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  liveRadarRing2: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  liveRadarCenter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveArrowContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Form content
  scrollContent: {
    padding: 24,
  },
  formScrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  formTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formTypeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  formDescription: {
    fontSize: 15,
    color: '#6B6B6B',
    marginBottom: 32,
    lineHeight: 22,
  },
  formFields: {
    marginBottom: 24,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  findBtn: { marginTop: 8 },

  // Match selection
  matchSubtitle: {
    fontSize: 15,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  peopleList: {
    gap: 12,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  personCardSelected: {
    borderColor: '#E07A5F',
    backgroundColor: 'rgba(224, 122, 95, 0.04)',
  },
  personAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  personMatch: {
    fontSize: 14,
    color: '#E07A5F',
    marginTop: 2,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  skipText: {
    fontSize: 15,
    color: '#6B6B6B',
    textDecorationLine: 'underline',
  },
});
