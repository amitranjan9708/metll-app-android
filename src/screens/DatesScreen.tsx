import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { swipeApi } from '../services/api';
import { MatchData } from '../types';
import { theme } from '../theme';

export const DatesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [])
  );

  const loadMatches = async () => {
    try {
      setLoading(true);
      const matchesData = await swipeApi.getMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error('Load matches error:', error);
    } finally {
      setLoading(false);
    }
  };

  const coffeeTicketMatches = matches.filter(m => m.coffeeTicket);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Dates</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your dates...</Text>
          </View>
        ) : (
          <>
            {coffeeTicketMatches.length > 0 ? (
              coffeeTicketMatches.map((match) => {
                const expiryDate = match.coffeeTicketExpiry ? new Date(match.coffeeTicketExpiry) : null;
                const isExpired = expiryDate ? expiryDate < new Date() : false;
                
                return (
                  <View key={match.id} style={styles.coffeeTicketCard}>
                    {/* Status Badge */}
                    <View style={styles.cardTop}>
                      <View style={[styles.statusBadge, isExpired && styles.statusBadgeExpired]}>
                        <View style={[styles.statusDot, isExpired && styles.statusDotExpired]} />
                        <Text style={styles.statusText}>{isExpired ? 'Expired' : 'Active'}</Text>
                      </View>
                    </View>

                    {/* Main Content */}
                    <View style={styles.cardContent}>
                      <Text style={styles.ticketTitle}>Coffee Date</Text>
                      
                      <View style={styles.divider} />

                      <View style={styles.detailsSection}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>With</Text>
                          <Text style={styles.detailValue}>{match.matchedUser.name}</Text>
                        </View>
                        
                        {match.coffeeTicketCafe && (
                          <>
                            <View style={styles.dividerThin} />
                            <View style={styles.detailItem}>
                              <Text style={styles.detailLabel}>Cafe</Text>
                              <Text style={styles.detailValue}>{match.coffeeTicketCafe}</Text>
                            </View>
                          </>
                        )}
                        
                        {expiryDate && (
                          <>
                            <View style={styles.dividerThin} />
                            <View style={styles.detailItem}>
                              <Text style={styles.detailLabel}>Valid Until</Text>
                              <Text style={styles.detailValue}>
                                {expiryDate.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.noTicketsCard}>
                <Ionicons name="cafe-outline" size={60} color="#D1D1D1" />
                <Text style={styles.noTicketsTitle}>No Active Tickets</Text>
                <Text style={styles.noTicketsSubtitle}>
                  Keep matching! You might win a sponsored coffee date
                </Text>
              </View>
            )}
          </>
        )}

        {/* Bottom spacing */}
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
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B6B6B',
  },
  coffeeTicketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  cardTop: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeExpired: {
    opacity: 0.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  statusDotExpired: {
    backgroundColor: '#666666',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 20,
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#000000',
    marginBottom: 20,
  },
  detailsSection: {
    gap: 0,
  },
  detailItem: {
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    letterSpacing: -0.3,
  },
  dividerThin: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 4,
  },
  noTicketsCard: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  noTicketsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  noTicketsSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
