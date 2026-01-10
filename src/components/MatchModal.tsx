import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User, MatchedUser } from '../types';

interface MatchModalProps {
    visible: boolean;
    currentUser: User | null;
    matchedUser: MatchedUser | null;
    onSendMessage: () => void;
    onKeepSwiping: () => void;
}

const { width } = Dimensions.get('window');

export const MatchModal: React.FC<MatchModalProps> = ({
    visible,
    currentUser,
    matchedUser,
    onSendMessage,
    onKeepSwiping,
}) => {
    const theme = useTheme();
    const styles = getStyles(theme);

    // Animation values
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const rotateLeft = useRef(new Animated.Value(0)).current;
    const rotateRight = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(rotateLeft, {
                        toValue: -15,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateRight, {
                        toValue: 15,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            ]).start();
        } else {
            scale.setValue(0);
            opacity.setValue(0);
            rotateLeft.setValue(0);
            rotateRight.setValue(0);
        }
    }, [visible]);

    if (!visible || !matchedUser || !currentUser) return null;

    const leftRotation = rotateLeft.interpolate({
        inputRange: [-15, 0],
        outputRange: ['-15deg', '0deg'],
    });

    const rightRotation = rotateRight.interpolate({
        inputRange: [0, 15],
        outputRange: ['0deg', '15deg'],
    });

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onKeepSwiping}
        >
            <View style={styles.overlay}>
                <LinearGradient
                    colors={[theme.colors.primary + 'E6', theme.colors.secondary + 'E6']} // slightly transparent
                    style={styles.container}
                >
                    <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
                        <View style={styles.matchTitleContainer}>
                            <Text style={styles.matchTitle}>It's a Match!</Text>
                            <Text style={styles.matchSubtitle}>You and {matchedUser.name} liked each other</Text>
                        </View>

                        <View style={styles.avatarsContainer}>
                            {/* Current User */}
                            <Animated.View style={[styles.avatarWrapper, { transform: [{ rotate: leftRotation }] }]}>
                                <Image
                                    source={{ uri: currentUser.photo || 'https://via.placeholder.com/150' }}
                                    style={styles.avatar}
                                />
                            </Animated.View>

                            {/* Heart Icon in middle */}
                            <View style={styles.heartContainer}>
                                <Ionicons name="heart" size={40} color="#fff" />
                            </View>

                            {/* Matched User */}
                            <Animated.View style={[styles.avatarWrapper, { transform: [{ rotate: rightRotation }] }]}>
                                <Image
                                    source={{ uri: matchedUser.profilePhoto || matchedUser.images[0] || 'https://via.placeholder.com/150' }}
                                    style={styles.avatar}
                                />
                            </Animated.View>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.messageButton} onPress={onSendMessage}>
                                <Ionicons name="chatbubble" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.messageButtonText}>Send a Message</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.keepSwipingButton} onPress={onKeepSwiping}>
                                <Text style={styles.keepSwipingText}>Keep Swiping</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </LinearGradient>
            </View>
        </Modal>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    overlay: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    matchTitleContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    matchTitle: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        fontStyle: 'italic',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 8,
    },
    matchSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    avatarsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60,
        width: '100%',
        height: 160,
    },
    avatarWrapper: {
        padding: 4,
        backgroundColor: '#fff',
        borderRadius: 80, // Half of size + padding
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    avatar: {
        width: 120, // Reduced from 150 to fit better
        height: 120,
        borderRadius: 60,
        resizeMode: 'cover',
    },
    heartContainer: {
        position: 'absolute',
        backgroundColor: theme.colors.primary,
        padding: 10,
        borderRadius: 30,
        zIndex: 10,
        borderWidth: 3,
        borderColor: '#fff',
    },
    actions: {
        width: '100%',
        maxWidth: 300,
        gap: 16,
    },
    messageButton: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    messageButtonText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    keepSwipingButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    keepSwipingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
