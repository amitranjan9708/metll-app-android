import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface NearbyPerson {
  id: string;
  name: string;
  photo?: string;
  distance: number;
  x: number;
  y: number;
}

export const LiveMatchingScreen: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyPeople, setNearbyPeople] = useState<NearbyPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const radarAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const personAnims = useRef<Animated.Value[]>([]).current;

  const mockPeople: NearbyPerson[] = [
    { id: '1', name: 'Alex', distance: 45, x: 0.25, y: 0.25 },
    { id: '2', name: 'Sam', distance: 78, x: 0.7, y: 0.2 },
    { id: '3', name: 'Jordan', distance: 32, x: 0.35, y: 0.65 },
    { id: '4', name: 'Taylor', distance: 89, x: 0.75, y: 0.55 },
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationEnabled) {
      // Radar sweep animation
      Animated.loop(
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      // Center pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Person markers animation
      nearbyPeople.forEach((_, index) => {
        if (!personAnims[index]) {
          personAnims[index] = new Animated.Value(0);
        }
        Animated.spring(personAnims[index], {
          toValue: 1,
          delay: 500 + index * 200,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [locationEnabled, nearbyPeople]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationEnabled(true);
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        setNearbyPeople(mockPeople);
      } else {
        Alert.alert('Location Permission', 'Please enable location to use live matching feature.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handlePersonSelect = (personId: string) => {
    setSelectedPerson(personId);
  };

  const handleConfess = () => {
    if (!selectedPerson) {
      Alert.alert('Select Someone', 'Please select a person to confess about');
      return;
    }

    const person = nearbyPeople.find((p) => p.id === selectedPerson);
    Alert.alert(
      'Confession Sent! 💕',
      `Your confession about ${person?.name} has been sent. If they confess about you too, you'll get a match!`,
      [{ text: 'OK', onPress: () => setSelectedPerson(null) }]
    );
  };

  const spin = radarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!locationEnabled) {
    return (
      <LinearGradient colors={theme.gradients.background.colors as [string, string, string]} style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.locationIconWrapper}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryGradientEnd]}
              style={styles.locationIcon}
            >
              <Ionicons name="location-outline" size={48} color={theme.colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.subtitle}>We need your location to show people nearby for live matching</Text>
          <Button title="Enable Location" onPress={requestLocationPermission} style={styles.enableBtn} />
        </View>
      </LinearGradient>
    );
  }

  const mapSize = width - theme.spacing.lg * 2;

  return (
    <LinearGradient colors={theme.gradients.background.colors as [string, string, string]} style={styles.container}>
      <View style={styles.mapContainer}>
        <View style={[styles.map, { width: mapSize, height: mapSize }]}>
          {/* Radar circles */}
          {[0.25, 0.5, 0.75, 1].map((scale, i) => (
            <View
              key={i}
              style={[
                styles.radarCircle,
                {
                  width: mapSize * scale,
                  height: mapSize * scale,
                  borderRadius: (mapSize * scale) / 2,
                  left: (mapSize - mapSize * scale) / 2,
                  top: (mapSize - mapSize * scale) / 2,
                },
              ]}
            />
          ))}

          {/* Radar sweep */}
          <Animated.View style={[styles.radarSweep, { transform: [{ rotate: spin }] }]}>
            <LinearGradient
              colors={['transparent', theme.colors.primary + '40']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.radarSweepGradient, { width: mapSize / 2, height: mapSize }]}
            />
          </Animated.View>

          {/* Center indicator (You) */}
          <Animated.View style={[styles.centerPulse, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.centerIndicator}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryGradientEnd]}
              style={styles.centerIndicatorGradient}
            >
              <Ionicons name="person" size={24} color={theme.colors.white} />
            </LinearGradient>
          </View>

          {/* Nearby people */}
          {nearbyPeople.map((person, index) => {
            const personAnim = personAnims[index] || new Animated.Value(0);
            const isSelected = selectedPerson === person.id;

            return (
              <Animated.View
                key={person.id}
                style={[
                  styles.personMarker,
                  {
                    left: person.x * mapSize - 35,
                    top: person.y * mapSize - 35,
                    opacity: personAnim,
                    transform: [{ scale: personAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.personTouchable, isSelected && styles.personSelected]}
                  onPress={() => handlePersonSelect(person.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.personPhoto, isSelected && styles.personPhotoSelected]}>
                    <Ionicons name="person" size={20} color={isSelected ? theme.colors.white : theme.colors.primary} />
                  </View>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personDistance}>{person.distance}m</Text>
                  {isSelected && (
                    <View style={styles.selectedCheck}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent} />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Radius label */}
          <View style={styles.radiusLabel}>
            <Ionicons name="radio-outline" size={14} color={theme.colors.accent} />
            <Text style={styles.radiusLabelText}>100m radius</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        {selectedPerson ? (
          <Card variant="glow" style={styles.selectedCard}>
            <View style={styles.selectedContent}>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedLabel}>Selected</Text>
                <Text style={styles.selectedName}>
                  {nearbyPeople.find((p) => p.id === selectedPerson)?.name}
                </Text>
              </View>
              <Button title="Confess" onPress={handleConfess} style={styles.confessBtn} />
            </View>
          </Card>
        ) : (
          <Card style={styles.infoCard}>
            <Ionicons name="finger-print" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>Tap on anyone on the map to confess about them</Text>
          </Card>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.statText}>{nearbyPeople.length} nearby</Text>
          </View>
          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.accent + '20' }]}>
              <Ionicons name="pulse" size={18} color={theme.colors.accent} />
            </View>
            <Text style={styles.statText}>Live mode</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  locationIconWrapper: { marginBottom: theme.spacing.xl },
  locationIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', ...theme.shadows.glow },
  title: { ...theme.typography.heading, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.xl, lineHeight: 24 },
  enableBtn: { marginTop: theme.spacing.md },
  mapContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  map: { position: 'relative', borderRadius: 1000, backgroundColor: theme.colors.backgroundLight, overflow: 'hidden' },
  radarCircle: { position: 'absolute', borderWidth: 1, borderColor: theme.colors.glassBorder, borderStyle: 'dashed' },
  radarSweep: { position: 'absolute', top: 0, left: '50%', height: '100%', transformOrigin: 'left center' },
  radarSweepGradient: { height: '100%' },
  centerPulse: { position: 'absolute', top: '50%', left: '50%', marginLeft: -30, marginTop: -30, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary + '30' },
  centerIndicator: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -24 },
  centerIndicatorGradient: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.colors.background },
  personMarker: { position: 'absolute', width: 70, alignItems: 'center', zIndex: 5 },
  personTouchable: { alignItems: 'center', padding: theme.spacing.xs },
  personSelected: { transform: [{ scale: 1.1 }] },
  personPhoto: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.primary, marginBottom: 4 },
  personPhotoSelected: { backgroundColor: theme.colors.primary },
  personName: { ...theme.typography.caption, color: theme.colors.textPrimary, fontWeight: '600', fontSize: 11 },
  personDistance: { ...theme.typography.caption, color: theme.colors.accent, fontSize: 10 },
  selectedCheck: { position: 'absolute', top: -2, right: 8 },
  radiusLabel: { position: 'absolute', top: theme.spacing.md, right: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.glass, paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  radiusLabelText: { ...theme.typography.caption, color: theme.colors.accent, fontSize: 11 },
  bottomSection: { padding: theme.spacing.lg },
  selectedCard: { marginBottom: theme.spacing.md },
  selectedContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedInfo: { flex: 1 },
  selectedLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  selectedName: { ...theme.typography.subheading, color: theme.colors.textPrimary },
  confessBtn: { marginLeft: theme.spacing.md, flex: 0, width: 120 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  infoText: { ...theme.typography.body, color: theme.colors.textSecondary, flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.xl, marginTop: theme.spacing.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  statIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  statText: { ...theme.typography.body, color: theme.colors.textPrimary },
});
