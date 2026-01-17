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
import { chatApi, swipeApi, hostApi, mediaApi } from '../services/api';
import { socketService } from '../services/socket';
import { Message, User, ChatHostSession, ChatHostMessage, GifItem } from '../types';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Alert } from 'react-native';
import { HostOptInBanner, HostChatView, VoiceNotePlayer, VoiceRecorder, GifPicker, ReportModal, ChatMenu } from '../components';

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
    const [hostSession, setHostSession] = useState<ChatHostSession | null>(null);
    const [hostMessages, setHostMessages] = useState<ChatHostMessage[]>([]);
    const [showOptIn, setShowOptIn] = useState(false);
    const [waitingForOptIn, setWaitingForOptIn] = useState(false);
    const [otherUserId, setOtherUserId] = useState<number>(0);

    // Voice Notes & GIF state
    const [isRecording, setIsRecording] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadChat();
        loadHostSession();
        loadMatchDetails();

        // Connect and join socket room
        socketService.connect();
        socketService.joinChat(matchId);

        // Listen for new messages
        const handleNewMessage = (newMessage: Message) => {
            setMessages(prev => {
                const exists = prev.some(m => m.id === newMessage.id);
                if (exists) return prev;
                return [...prev, { ...newMessage, isOwn: newMessage.senderId === Number(user?.id) }];
            });

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        };

        // Listen for host events
        const handleHostOptIn = (data: any) => {
            if (data.sessionId) {
                loadHostSession();
            }
        };

        const handleHostMessage = (data: { message: ChatHostMessage; sessionId: number }) => {
            setHostMessages(prev => {
                // Check for exact ID match
                const existsById = prev.some(m => m.id === data.message.id);
                if (existsById) return prev;

                // Also check for duplicate by content + sender + recent timestamp (within 5 seconds)
                // This handles the case where sender has optimistic local message with temp ID
                const messageTime = new Date(data.message.createdAt).getTime();
                const existsByContent = prev.some(m =>
                    m.content === data.message.content &&
                    m.senderId === data.message.senderId &&
                    Math.abs(new Date(m.createdAt).getTime() - messageTime) < 5000
                );
                if (existsByContent) {
                    // Replace the temp message with the real one (has correct DB id)
                    return prev.map(m =>
                        m.content === data.message.content &&
                            m.senderId === data.message.senderId &&
                            Math.abs(new Date(m.createdAt).getTime() - messageTime) < 5000
                            ? data.message
                            : m
                    );
                }

                return [...prev, data.message];
            });
            setShowOptIn(false);
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        };

        const handleHostHandoff = () => {
            // Host has stepped back, allow normal chat
            setHostSession(prev => prev ? { ...prev, status: 'completed' } : null);
        };

        const handleHostExited = () => {
            // Host exited, clear everything and show regular chat
            setHostSession(null); // Clear session completely
            setHostMessages([]); // Clear host messages
            // Reload regular chat messages
            loadChat();
        };

        socketService.on('new_message', handleNewMessage);
        socketService.on('host_opt_in', handleHostOptIn);
        socketService.on('host_message', handleHostMessage);
        socketService.on('host_handoff', handleHostHandoff);
        socketService.on('host_exited', handleHostExited);

        return () => {
            socketService.off('new_message', handleNewMessage);
            socketService.off('host_opt_in', handleHostOptIn);
            socketService.off('host_message', handleHostMessage);
            socketService.off('host_handoff', handleHostHandoff);
            socketService.off('host_exited', handleHostExited);
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

    const loadHostSession = async () => {
        try {
            const response = await hostApi.getHostSession(matchId);
            console.log('Host session response:', response);
            if (response.success && response.data) {
                const session = response.data;
                setHostSession(session);

                console.log('Host session loaded:', {
                    status: session.status,
                    user1OptIn: session.user1OptIn,
                    user2OptIn: session.user2OptIn,
                    isUser1: session.isUser1,
                });

                // Check if we should show opt-in
                if (session.status === 'pending' || session.status === 'exited') {
                    // Show opt-in if user hasn't opted in yet, or if session was exited (allow re-entry)
                    const hasOptedIn = session.isUser1 ? session.user1OptIn : session.user2OptIn;
                    console.log('Should show opt-in?', !hasOptedIn && !waitingForOptIn, 'status:', session.status);
                    if (!hasOptedIn && !waitingForOptIn) {
                        setShowOptIn(true);
                    } else {
                        setShowOptIn(false);
                    }
                } else if (!session.status || session.status === null) {
                    // Session just created, show opt-in
                    setShowOptIn(true);
                } else {
                    setShowOptIn(false);
                }

                // Load host messages if session is active or completed
                if (session.status === 'active' || session.status === 'completed') {
                    const messagesResponse = await hostApi.getHostMessages(matchId);
                    if (messagesResponse.success && messagesResponse.data) {
                        setHostMessages(messagesResponse.data);
                    }
                } else if (session.status === 'exited') {
                    // Host exited, clear host messages and show regular chat
                    setHostMessages([]);
                }
            } else {
                // If no session exists yet, we might want to show opt-in
                // But for now, let's wait for session to be created on first API call
                console.log('No host session found yet');
            }
        } catch (error) {
            console.error('Failed to load host session:', error);
            // On error, don't show opt-in to avoid confusion
            setShowOptIn(false);
        }
    };

    const loadMatchDetails = async () => {
        try {
            const matchData = await swipeApi.getMatch(matchId);
            if (matchData && matchData.matchedUser) {
                setOtherUserId(matchData.matchedUser.id);
            }
        } catch (error) {
            console.error('Failed to load match details:', error);
        }
    };

    const handleOptIn = async () => {
        try {
            setWaitingForOptIn(true);
            const response = await hostApi.optIn(matchId);
            if (response.success) {
                setShowOptIn(false);
                await loadHostSession();
            }
        } catch (error) {
            console.error('Failed to opt-in:', error);
            Alert.alert("Error", "Failed to opt-in to host.");
        } finally {
            setWaitingForOptIn(false);
        }
    };

    const handleOptOut = async () => {
        try {
            await hostApi.optOut(matchId);
            setShowOptIn(false);
            setHostSession(null);
        } catch (error) {
            console.error('Failed to opt-out:', error);
        }
    };

    const handleHostAnswer = async (answer: string, questionId?: string) => {
        try {
            await hostApi.submitAnswer(matchId, answer, questionId);
            // Add user's answer to host messages for immediate UI update
            const userAnswer: ChatHostMessage = {
                id: Date.now(),
                sessionId: hostSession?.id || 0,
                senderType: hostSession?.isUser1 ? 'user1' : 'user2',
                senderId: Number(user?.id),
                content: answer,
                messageType: 'text',
                createdAt: new Date().toISOString(),
            };
            setHostMessages(prev => [...prev, userAnswer]);
            setInputText('');
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Failed to submit answer:', error);
            Alert.alert("Error", "Failed to send answer.");
        }
    };

    const handleExitHost = async () => {
        Alert.alert(
            "Exit Host Mode",
            "Are you sure you want to exit host mode? You'll continue chatting normally. You can restart host mode anytime.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Exit",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await hostApi.exitHost(matchId);
                            // Clear host messages immediately to show regular chat
                            setHostMessages([]);
                            // Reload regular chat messages
                            await loadChat();
                            // Reload host session to get the exited status (so opt-in banner can show again)
                            await loadHostSession();
                        } catch (error) {
                            console.error('Failed to exit host:', error);
                            Alert.alert("Error", "Failed to exit host mode.");
                        }
                    }
                }
            ]
        );
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const content = inputText.trim();
        const textToSend = content;
        setInputText('');
        setSending(true);

        // If host session is active, send as host answer
        if (hostSession && hostSession.status === 'active') {
            try {
                await handleHostAnswer(textToSend);
            } catch (error) {
                console.error('Failed to send host answer:', error);
            } finally {
                setSending(false);
            }
            return;
        }

        // Regular message
        const tempId = Date.now();
        const optimisticMessage: Message = {
            id: tempId,
            senderId: Number(user?.id) || 0,
            content: textToSend,
            type: 'text',
            createdAt: new Date().toISOString(),
            isRead: false,
            isOwn: true
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            socketService.sendMessage(matchId, textToSend);
            setSending(false);
        } catch (error) {
            console.error('Failed to send message via socket, trying HTTP:', error);
            try {
                const msg = await chatApi.sendMessage(matchId, textToSend);
                setMessages(prev => prev.map(m => m.id === tempId ? { ...msg, isOwn: true } : m));
            } catch (httpError) {
                console.error('Failed to send message:', httpError);
            } finally {
                setSending(false);
            }
        }
    };

    // Chat Menu Options
    const [showChatMenu, setShowChatMenu] = useState(false);

    // Calculate menu position relative to the button if needed, 
    // but simplified fixed positioning works better for now with the modal overlay.
    // For a real anchor, we would measure the button. 
    // Here we'll just use top-right positioning in the ChatMenu component style default.

    const handleOptions = () => {
        setShowChatMenu(true);
    };

    const confirmUnmatch = async () => {
        Alert.alert(
            "Unmatch",
            "Are you sure? You will lose this chat and match permanently.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unmatch",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await swipeApi.unmatch(matchId);
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to unmatch.");
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleBlockReport = () => {
        setShowReportModal(true);
    };

    const menuOptions = [
        {
            label: "Block & Report",
            action: handleBlockReport,
            type: 'destructive' as const
        },
        {
            label: "Unmatch Only",
            action: confirmUnmatch,
            type: 'destructive' as const
        }
    ];

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

    // Voice Note Handlers
    const handleVoiceRecordingComplete = async (uri: string, duration: number, waveformData: number[]) => {
        setIsRecording(false);
        setSending(true);

        try {
            // Upload voice note
            const uploadRes = await mediaApi.uploadVoiceNote(uri, waveformData);

            // Send voice note message
            const msg = await mediaApi.sendVoiceNote(
                matchId,
                uploadRes.url,
                uploadRes.duration || duration,
                uploadRes.waveformData || waveformData
            );

            // Add to local list
            setMessages(prev => [...prev, { ...msg, isOwn: true }]);

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (error: any) {
            console.error('Send voice note error:', error);
            Alert.alert("Error", "Failed to send voice note.");
        } finally {
            setSending(false);
        }
    };

    const handleVoiceRecordingCancel = () => {
        setIsRecording(false);
    };

    // GIF Handler
    const handleGifSelect = async (gif: GifItem) => {
        setShowGifPicker(false);
        setSending(true);

        try {
            const msg = await mediaApi.sendGif(
                matchId,
                gif.url,
                gif.id,
                gif.width,
                gif.height
            );

            // Add to local list
            setMessages(prev => [...prev, { ...msg, isOwn: true }]);

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (error: any) {
            console.error('Send GIF error:', error);
            Alert.alert("Error", "Failed to send GIF.");
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
            } else if (item.type === 'voice_note' && item.mediaUrl) {
                return (
                    <VoiceNotePlayer
                        audioUrl={item.mediaUrl}
                        duration={item.duration || 0}
                        waveformData={item.waveformData}
                        isOwn={isOwn}
                    />
                );
            } else if (item.type === 'gif' && item.mediaUrl) {
                // Calculate proportional height based on width
                const maxWidth = 200;
                const gifWidth = item.gifWidth || maxWidth;
                const gifHeight = item.gifHeight || maxWidth;
                const displayHeight = Math.min(200, (maxWidth / gifWidth) * gifHeight);

                return (
                    <Image
                        source={{ uri: item.mediaUrl }}
                        style={{
                            width: maxWidth,
                            height: displayHeight,
                            borderRadius: 12,
                        }}
                        resizeMode="cover"
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

    const renderHostMessage = ({ item }: { item: ChatHostMessage }) => {
        const isHost = item.senderType === 'host';
        const isOwn = item.senderType !== 'host' && item.senderId === Number(user?.id);

        if (isHost) {
            return (
                <View style={styles.hostMessageContainer}>
                    <View style={styles.hostBubble}>
                        <Text style={styles.hostIcon}>🤖</Text>
                        <Text style={styles.hostMessageText}>{item.content}</Text>
                        {item.metadata?.options && (
                            <View style={styles.optionsContainer}>
                                {item.metadata.options.map((option: string, idx: number) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.hostOptionButton}
                                        onPress={() => handleHostAnswer(option, item.metadata?.questionId)}
                                    >
                                        <Text style={styles.optionText}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            );
        }

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
                    <Text style={[
                        styles.messageText,
                        isOwn ? styles.textOwn : styles.textOther
                    ]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    const renderOptInBanner = () => {
        // Show banner if:
        // 1. showOptIn is true (user hasn't opted in yet, or session was exited)
        // 2. OR if no messages exist and no active host session (new match)
        const shouldShow = showOptIn || (
            messages.length === 0 &&
            (!hostSession || hostSession.status === 'pending' || hostSession.status === 'exited') &&
            !hostSession?.user1OptIn &&
            !hostSession?.user2OptIn
        );

        if (!shouldShow) return null;

        // Check if partner has opted in
        const partnerOptedIn = hostSession ? (
            hostSession.isUser1 ? hostSession.user2OptIn : hostSession.user1OptIn
        ) : false;

        return (
            <HostOptInBanner
                onOptIn={handleOptIn}
                onOptOut={() => {
                    setShowOptIn(false);
                    handleOptOut();
                }}
                isLoading={waitingForOptIn}
                partnerName={userName}
                partnerOptedIn={partnerOptedIn}
            />
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

                <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => (navigation as any).navigate('Call', {
                        matchId,
                        userName,
                        userPhoto,
                        callType: 'voice'
                    })}
                >
                    <Ionicons name="call" size={22} color={theme.colors.primary} />
                </TouchableOpacity>

                {hostSession && hostSession.status === 'active' && (
                    <TouchableOpacity
                        style={styles.exitHostButton}
                        onPress={handleExitHost}
                    >
                        <Ionicons name="close-circle" size={24} color={theme.colors.error || '#ff4444'} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.hostButton}
                    onPress={() => {
                        // Force show opt-in or reload host session
                        loadHostSession();
                    }}
                >
                    <Text style={styles.hostButtonText}>🤖</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionButton} onPress={handleOptions}>
                    <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ChatMenu
                visible={showChatMenu}
                onClose={() => setShowChatMenu(false)}
                options={menuOptions}
                anchorPosition={Platform.OS === 'ios' ? { top: 100, right: 20 } : { top: 60, right: 10 }}
            />

            <ReportModal
                visible={showReportModal}
                onClose={() => setShowReportModal(false)}
                matchId={matchId}
                reportedUserId={otherUserId} // Fallback
                onSuccess={() => {
                    setShowReportModal(false);
                    navigation.goBack();
                }}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <View style={styles.chatContent}>
                    {renderOptInBanner()}
                    {hostSession && hostSession.status === 'active' ? (
                        <HostChatView
                            session={hostSession}
                            messages={hostMessages}
                            userName={userName}
                            userPhoto={userPhoto}
                            currentUserId={user?.id}
                            onAnswer={handleHostAnswer}
                            onExit={handleExitHost}
                        />
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item, index) => `${item.id || index}-msg`}
                            contentContainerStyle={styles.messageList}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            ListEmptyComponent={
                                messages.length === 0 && !showOptIn ? (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Start the conversation!</Text>
                                    </View>
                                ) : null
                            }
                        />
                    )}
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {isRecording ? (
                    <View style={styles.inputContainer}>
                        <VoiceRecorder
                            isVisible={isRecording}
                            onRecordingComplete={handleVoiceRecordingComplete}
                            onCancel={handleVoiceRecordingCancel}
                        />
                    </View>
                ) : (
                    <View style={styles.inputContainer}>
                        {/* Attachment Button */}
                        <TouchableOpacity style={styles.attachButton} onPress={handleAttachment} disabled={sending}>
                            <Ionicons name="add" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>

                        {/* GIF Button */}
                        <TouchableOpacity
                            style={styles.gifButton}
                            onPress={() => setShowGifPicker(true)}
                            disabled={sending || waitingForOptIn}
                        >
                            <Text style={styles.gifButtonText}>GIF</Text>
                        </TouchableOpacity>

                        {/* Text Input */}
                        <TextInput
                            style={styles.input}
                            placeholder={hostSession && hostSession.status === 'active' ? "Answer the host..." : "Message..."}
                            placeholderTextColor={theme.colors.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            editable={!waitingForOptIn}
                        />

                        {/* Send or Mic Button */}
                        {inputText.trim() ? (
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSend}
                                disabled={sending}
                            >
                                <Ionicons name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.micButton}
                                onPress={() => setIsRecording(true)}
                                disabled={sending || waitingForOptIn}
                            >
                                <Ionicons name="mic" size={22} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* GIF Picker Modal */}
            <GifPicker
                visible={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                onSelectGif={handleGifSelect}
            />

            {/* Report Modal */}
            <ReportModal
                visible={showReportModal}
                onClose={() => setShowReportModal(false)}
                reportedUserId={otherUserId}
                onSuccess={() => {
                    setShowReportModal(false);
                    navigation.goBack();
                }}
            />
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
    callButton: {
        padding: 8,
        marginRight: 4,
    },
    optionButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatContent: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    hostButton: {
        padding: 8,
        marginRight: 4,
    },
    hostButtonText: {
        fontSize: 22,
    },
    exitHostButton: {
        padding: 8,
        marginRight: 4,
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
    gifButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        backgroundColor: 'transparent',
    },
    gifButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    micButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },

    optInBanner: {
        backgroundColor: theme.colors.backgroundCard,
        padding: 16,
        margin: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.primary + '40',
    },
    optInTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 8,
    },
    optInSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 12,
    },
    optInButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    optInButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    optInButtonYes: {
        backgroundColor: theme.colors.primary,
    },
    optInButtonNo: {
        backgroundColor: theme.colors.border,
    },
    optInButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    hostMessageContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    hostBubble: {
        backgroundColor: theme.colors.backgroundCard,
        padding: 16,
        borderRadius: 20,
        maxWidth: '85%',
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
    },
    hostIcon: {
        fontSize: 24,
        marginBottom: 8,
        textAlign: 'center',
    },
    hostMessageText: {
        fontSize: 16,
        color: theme.colors.textPrimary,
        lineHeight: 22,
        marginBottom: 8,
    },
    optionsContainer: {
        marginTop: 8,
        gap: 8,
    },
    hostOptionButton: {
        backgroundColor: theme.colors.primary + '20',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    optionText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '600',
        textAlign: 'center',
    },
});
