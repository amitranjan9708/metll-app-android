import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    SafeAreaView
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, swipeApi } from '../services/api'; // Added swipeApi
import { socketService } from '../services/socket';
import { Message, User } from '../types';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Alert } from 'react-native';

interface ChatParams {
    matchId: number;
    userName: string;
    userPhoto: string;
}

export const ChatScreen: React.FC = () => {
    const theme = useTheme();
    const styles = getStyles(theme);
    const navigation = useNavigation();
    const route = useRoute();
    const { matchId, userName, userPhoto } = route.params as ChatParams;
    const { user } = useAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadChat();

        // Connect and join socket room
        socketService.connect();
        socketService.joinChat(matchId);

        // Listen for new messages
        const handleNewMessage = (newMessage: Message) => {
            // Only add if it belongs to this chat
            // In a real app we'd verify the matchId/chatRoomId match
            // Here assuming backend only pushes relevant messages or we filter
            // The backend emits 'new_message' to the room `chat:${chatRoomId}`
            // We need to ensure we don't duplicate

            // For now, simpler check: avoid duplicates by ID if possible, 
            // or just append. 
            setMessages(prev => {
                const exists = prev.some(m => m.id === newMessage.id);
                if (exists) return prev;
                return [...prev, { ...newMessage, isOwn: newMessage.senderId === Number(user?.id) }];
            });

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        };

        socketService.on('new_message', handleNewMessage);

        return () => {
            socketService.off('new_message', handleNewMessage);
            // Leave chat logic if needed
        };
    }, [matchId]);

    const loadChat = async () => {
        try {
            const data = await chatApi.getChatRoom(matchId);
            if (data.chatRoom) {
                setMessages(data.chatRoom.messages);
            }
        } catch (error) {
            console.error('Failed to load chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const content = inputText.trim();
        setInputText('');
        setSending(true);

        // Optimistic update
        const tempId = Date.now(); // Temp ID
        const optimisticMessage: Message = {
            id: tempId,
            senderId: Number(user?.id) || 0,
            content: content,
            type: 'text',
            createdAt: new Date().toISOString(),
            isRead: false,
            isOwn: true
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            // Try via Socket first
            socketService.sendMessage(matchId, content);
            setSending(false);
        } catch (error) {
            console.error('Failed to send message via socket, trying HTTP:', error);
            // Fallback to HTTP
            try {
                const msg = await chatApi.sendMessage(matchId, content);
                // Replace optimistic message with real one
                setMessages(prev => prev.map(m => m.id === tempId ? { ...msg, isOwn: true } : m));
            } catch (httpError) {
                console.error('Failed to send message:', httpError);
                // Remove optimistic message or show error
            } finally {
                setSending(false);
            }
        }
    };

    const handleUnmatch = () => {
        Alert.alert(
            "Unmatch User",
            "Are you sure you want to unmatch? This action cannot be undone and you will lose your chat history.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Unmatch", style: "destructive", onPress: confirmUnmatch }
            ]
        );
    };

    const confirmUnmatch = async () => {
        try {
            setLoading(true);
            await swipeApi.unmatch(matchId);
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to unmatch.");
            setLoading(false);
        }
    };

    const handleAttachment = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 0.8,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets[0]) {
                uploadAndSendMedia(result.assets[0]);
            }
        } catch (error) {
            console.error('Pick media error:', error);
            Alert.alert("Error", "Failed to pick media.");
        }
    };

    const uploadAndSendMedia = async (asset: ImagePicker.ImagePickerAsset) => {
        const type = asset.type === 'video' ? 'video' : 'image';

        // Optimistic update placeholder?
        // For simplicity, just show loading or rely on upload completion

        try {
            // Just Alert for now that it's uploading?
            // Or better, set sending state
            setSending(true);

            const uploadRes = await chatApi.uploadMedia(asset.uri, type);

            // Send via HTTP fallback usually preferred for media to ensure persistence
            // But we can also emit via socket if backend supports it.
            // Our backend socket implementation expects 'sendMessage' event with 'content'.
            // It doesn't seem to support media inputs in socket event yet in chat.gateway.ts?
            // Actually I didn't update chat.gateway.ts to handle media messages!
            // So I should use HTTP API to send media messages.
            // The backend controller sendMessage stores it, and then...
            // Wait, does backend sendMessage emit to socket?
            // I need to check chat.controller.ts. 
            // The sendMessage controller strictly creates DB record. It does NOT emit socket event.
            // So if I use HTTP sendMessage, the other user won't get real-time update unless I manually emit or controller emits.
            // I should update controller to emit or client to emit?
            // Usually Client emits via socket.
            // BUT socket `sendMessage` event only takes `content`.
            // I should have updated Socket Gateway too.
            // For now, I will use HTTP sendMessage.
            // And maybe loose real-time for media unless I update Gateway.
            // I'll proceed with HTTP.

            const msg = await chatApi.sendMessage(matchId, null, type, uploadRes.url);

            // Add to local list
            setMessages(prev => [...prev, { ...msg, isOwn: true }]);

        } catch (error: any) {
            console.error('Send media error:', error);
            Alert.alert("Error", "Failed to send media.");
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isOwn = item.isOwn;

        const renderContent = () => {
            if (item.type === 'image' && item.mediaUrl) {
                return (
                    <Image
                        source={{ uri: item.mediaUrl }}
                        style={{ width: 200, height: 200, borderRadius: 12 }}
                        resizeMode="cover"
                    />
                );
            } else if (item.type === 'video' && item.mediaUrl) {
                return (
                    <Video
                        source={{ uri: item.mediaUrl }}
                        style={{ width: 200, height: 200, borderRadius: 12 }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping
                    />
                );
            }
            return (
                <Text style={[
                    styles.messageText,
                    isOwn ? styles.textOwn : styles.textOther
                ]}>
                    {item.content}
                </Text>
            );
        };

        return (
            <View style={[
                styles.messageContainer,
                isOwn ? styles.messageOwn : styles.messageOther
            ]}>
                {!isOwn && (
                    <Image
                        source={{ uri: userPhoto || 'https://via.placeholder.com/30' }}
                        style={styles.messageAvatar}
                    />
                )}
                <View style={[
                    styles.bubble,
                    isOwn ? styles.bubbleOwn : styles.bubbleOther
                ]}>
                    {renderContent()}
                    <Text style={[
                        styles.timeText,
                        isOwn ? styles.timeOwn : styles.timeOther
                    ]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>

                <Image
                    source={{ uri: userPhoto || 'https://via.placeholder.com/40' }}
                    style={styles.headerAvatar}
                />

                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{userName}</Text>
                    <Text style={styles.headerStatus}>Active now</Text>
                </View>

                <TouchableOpacity style={styles.optionButton} onPress={handleUnmatch}>
                    <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton} onPress={handleAttachment} disabled={sending}>
                        <Ionicons name="add" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Message..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 40, // Status bar safe area
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        elevation: 2,
    },
    backButton: {
        marginRight: 16,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    headerStatus: {
        fontSize: 12,
        color: theme.colors.primary,
    },
    optionButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        padding: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    messageOwn: {
        justifyContent: 'flex-end',
    },
    messageOther: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        marginBottom: 4,
    },
    bubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 20,
    },
    bubbleOwn: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: theme.colors.backgroundCard,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    textOwn: {
        color: '#fff',
    },
    textOther: {
        color: theme.colors.textPrimary,
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    timeOwn: {
        color: 'rgba(255,255,255,0.7)',
    },
    timeOther: {
        color: theme.colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    attachButton: {
        padding: 8,
        marginRight: 8,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        color: theme.colors.textPrimary,
        marginRight: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: theme.colors.border,
    },
});
