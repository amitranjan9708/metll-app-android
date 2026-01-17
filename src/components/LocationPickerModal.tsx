import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationResult {
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
    };
}

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onLocationSelect: (location: {
        latitude: number;
        longitude: number;
        city: string | null;
    }) => void;
    initialLocation?: {
        latitude: number | null;
        longitude: number | null;
        city: string | null;
    };
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    visible,
    onClose,
    onLocationSelect,
    initialLocation,
}) => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{
        latitude: number;
        longitude: number;
        city: string | null;
    } | null>(null);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    // Initialize with current location if available
    useEffect(() => {
        if (initialLocation?.latitude && initialLocation?.longitude) {
            setSelectedLocation({
                latitude: initialLocation.latitude,
                longitude: initialLocation.longitude,
                city: initialLocation.city,
            });
        }
    }, [initialLocation]);

    // Debounced search using Nominatim API
    const searchLocations = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
                {
                    headers: {
                        'User-Agent': 'MetllApp/1.0',
                    },
                }
            );
            const data: LocationResult[] = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Location search error:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle search input change with debounce
    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        const timer = setTimeout(() => {
            searchLocations(text);
        }, 500);
        
        setDebounceTimer(timer);
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (item: LocationResult) => {
        const city = item.address?.city || item.address?.town || item.address?.village || 
                     item.display_name.split(',')[0];
        
        setSelectedLocation({
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            city,
        });
        setSearchQuery(city || item.display_name.split(',')[0]);
        setSuggestions([]);
    };

    // Get current GPS location
    const handleGetCurrentLocation = async () => {
        try {
            setGpsLoading(true);
            
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Location permission is required');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = location.coords;
            let city: string | null = null;

            // Reverse geocode to get city name
            try {
                const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
                city = address?.city || address?.subregion || null;
                if (city) {
                    setSearchQuery(city);
                }
            } catch (error) {
                console.warn('Reverse geocode failed:', error);
            }

            setSelectedLocation({ latitude, longitude, city });
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Failed to get your location. Please try again.');
        } finally {
            setGpsLoading(false);
        }
    };

    // Confirm selection
    const handleConfirm = () => {
        if (selectedLocation) {
            onLocationSelect(selectedLocation);
            onClose();
        }
    };

    // Generate map HTML for WebView
    const getMapHTML = () => {
        const lat = selectedLocation?.latitude || 20.5937;
        const lon = selectedLocation?.longitude || 78.9629;
        const zoom = selectedLocation ? 12 : 4;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <style>
                    body { margin: 0; padding: 0; }
                    #map { width: 100%; height: 100vh; }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    var map = L.map('map').setView([${lat}, ${lon}], ${zoom});
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    }).addTo(map);
                    ${selectedLocation ? `
                        L.marker([${lat}, ${lon}]).addTo(map)
                            .bindPopup('${selectedLocation.city || 'Selected Location'}')
                            .openPopup();
                    ` : ''}
                </script>
            </body>
            </html>
        `;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Set Your Location</Text>
                    <View style={styles.closeBtn} />
                </View>

                {/* Map View - Upper Half */}
                <View style={styles.mapContainer}>
                    <WebView
                        source={{ html: getMapHTML() }}
                        style={styles.map}
                        scrollEnabled={false}
                        javaScriptEnabled={true}
                    />
                    {!selectedLocation && (
                        <View style={styles.mapOverlay}>
                            <Ionicons name="location-outline" size={48} color="#6B6B6B" />
                            <Text style={styles.mapOverlayText}>
                                Search for a city or use GPS
                            </Text>
                        </View>
                    )}
                </View>

                {/* Location Input - Lower Half */}
                <View style={styles.inputContainer}>
                    {/* GPS Button */}
                    <TouchableOpacity
                        style={styles.gpsButton}
                        onPress={handleGetCurrentLocation}
                        disabled={gpsLoading}
                    >
                        {gpsLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="navigate" size={20} color="#fff" />
                                <Text style={styles.gpsButtonText}>Use My Current Location</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or search</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#6B6B6B" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for a city..."
                            placeholderTextColor="#9B9B9B"
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            autoCapitalize="words"
                        />
                        {loading && (
                            <ActivityIndicator size="small" color="#1A1A1A" style={styles.searchLoader} />
                        )}
                    </View>

                    {/* Suggestions List */}
                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            <FlatList
                                data={suggestions}
                                keyExtractor={(item) => item.place_id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.suggestionItem}
                                        onPress={() => handleSelectSuggestion(item)}
                                    >
                                        <Ionicons name="location-outline" size={20} color="#6B6B6B" />
                                        <View style={styles.suggestionTextContainer}>
                                            <Text style={styles.suggestionTitle} numberOfLines={1}>
                                                {item.address?.city || item.address?.town || 
                                                 item.address?.village || item.display_name.split(',')[0]}
                                            </Text>
                                            <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                                                {item.display_name}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                keyboardShouldPersistTaps="handled"
                                style={styles.suggestionsList}
                            />
                        </View>
                    )}

                    {/* Selected Location Info */}
                    {selectedLocation && (
                        <View style={styles.selectedContainer}>
                            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            <View style={styles.selectedInfo}>
                                <Text style={styles.selectedCity}>
                                    {selectedLocation.city || 'Location Selected'}
                                </Text>
                                <Text style={styles.selectedCoords}>
                                    {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Confirm Button */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            !selectedLocation && styles.confirmButtonDisabled
                        ]}
                        onPress={handleConfirm}
                        disabled={!selectedLocation}
                    >
                        <Text style={styles.confirmButtonText}>
                            Confirm Location
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    mapContainer: {
        height: SCREEN_HEIGHT * 0.35,
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapOverlayText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B6B6B',
    },
    inputContainer: {
        flex: 1,
        padding: 20,
    },
    gpsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#1A1A1A',
        paddingVertical: 16,
        borderRadius: 12,
    },
    gpsButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 13,
        color: '#9B9B9B',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1A1A1A',
    },
    searchLoader: {
        marginLeft: 10,
    },
    suggestionsContainer: {
        marginTop: 8,
        maxHeight: 200,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    suggestionsList: {
        maxHeight: 200,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    suggestionSubtitle: {
        fontSize: 12,
        color: '#6B6B6B',
        marginTop: 2,
    },
    selectedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    selectedInfo: {
        flex: 1,
    },
    selectedCity: {
        fontSize: 16,
        fontWeight: '600',
        color: '#059669',
    },
    selectedCoords: {
        fontSize: 12,
        color: '#6B6B6B',
        marginTop: 2,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    confirmButton: {
        backgroundColor: '#1A1A1A',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    confirmButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
});
