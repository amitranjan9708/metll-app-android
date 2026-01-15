import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Modal,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { GifItem } from '../types';
import { mediaApi } from '../services/api';

interface GifPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectGif: (gif: GifItem) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GIF_COLUMNS = 2;
const GIF_SIZE = (SCREEN_WIDTH - 48) / GIF_COLUMNS;

export const GifPicker: React.FC<GifPickerProps> = ({
    visible,
    onClose,
    onSelectGif,
}) => {
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState<GifItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    const styles = getStyles(theme);

    // Load trending GIFs on mount
    useEffect(() => {
        if (visible && gifs.length === 0) {
            loadTrendingGifs();
        }
    }, [visible]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                searchGifs(searchQuery);
            } else if (isSearching) {
                setIsSearching(false);
                setOffset(0);
                setHasMore(true);
                loadTrendingGifs();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadTrendingGifs = async (loadMore = false) => {
        if (loading) return;

        try {
            setLoading(true);
            const currentOffset = loadMore ? offset : 0;
            const result = await mediaApi.getTrendingGifs(20, currentOffset);

            if (result.gifs.length === 0) {
                setHasMore(false);
            } else {
                if (loadMore) {
                    setGifs(prev => [...prev, ...result.gifs]);
                } else {
                    setGifs(result.gifs);
                }
                setOffset(currentOffset + result.gifs.length);
            }
        } catch (error) {
            console.error('Failed to load trending GIFs:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchGifs = async (query: string, loadMore = false) => {
        if (loading || !query.trim()) return;

        try {
            setLoading(true);
            setIsSearching(true);
            const currentOffset = loadMore ? offset : 0;
            const result = await mediaApi.searchGifs(query, 20, currentOffset);

            if (result.gifs.length === 0) {
                setHasMore(false);
            } else {
                if (loadMore) {
                    setGifs(prev => [...prev, ...result.gifs]);
                } else {
                    setGifs(result.gifs);
                }
                setOffset(currentOffset + result.gifs.length);
            }
        } catch (error) {
            console.error('Failed to search GIFs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!hasMore || loading) return;

        if (isSearching && searchQuery.trim()) {
            searchGifs(searchQuery, true);
        } else {
            loadTrendingGifs(true);
        }
    };

    const handleSelectGif = (gif: GifItem) => {
        onSelectGif(gif);
        onClose();
    };

    const renderGifItem = ({ item }: { item: GifItem }) => (
        <TouchableOpacity
            style={styles.gifItem}
            onPress={() => handleSelectGif(item)}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: item.previewUrl || item.url }}
                style={styles.gifImage}
                resizeMode="cover"
            />
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
        );
    };

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyText}>
                    {searchQuery.trim() ? 'No GIFs found' : 'No trending GIFs'}
                </Text>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.title}>GIFs</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search GIFs..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Category Label */}
                    <Text style={styles.categoryLabel}>
                        {isSearching ? `Results for "${searchQuery}"` : '🔥 Trending'}
                    </Text>

                    {/* GIF Grid */}
                    <FlatList
                        data={gifs}
                        renderItem={renderGifItem}
                        keyExtractor={(item) => item.id}
                        numColumns={GIF_COLUMNS}
                        contentContainerStyle={styles.gifGrid}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={renderEmpty}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Powered by Giphy */}
                    <View style={styles.poweredBy}>
                        <Text style={styles.poweredByText}>Powered by GIPHY</Text>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        flex: 1,
        marginTop: SCREEN_HEIGHT * 0.15,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    closeButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    placeholder: {
        width: 36,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginVertical: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        fontSize: 16,
        color: theme.colors.textPrimary,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    gifGrid: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    gifItem: {
        width: GIF_SIZE,
        height: GIF_SIZE,
        margin: 4,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.colors.backgroundCard,
    },
    gifImage: {
        width: '100%',
        height: '100%',
    },
    loadingFooter: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginTop: 12,
    },
    poweredBy: {
        paddingVertical: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    poweredByText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
});

export default GifPicker;
