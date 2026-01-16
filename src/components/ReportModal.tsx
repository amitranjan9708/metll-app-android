import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { reportApi } from '../services/api';

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    reportedUserId?: number; // Optional if matchId is provided
    matchId?: number;        // Optional, improves backend resolution
    onSuccess: () => void;
}

const REPORT_CATEGORIES = [
    "Inappropriate Content",
    "Spam",
    "Abusive Behavior",
    "Catfishing",
    "Other"
];

export const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, reportedUserId, matchId, onSuccess }) => {
    const theme = useTheme();
    const styles = getStyles(theme);

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedCategory) {
            Alert.alert("Error", "Please select a category.");
            return;
        }

        if (!reason.trim()) {
            Alert.alert("Error", "Please provide a reason/comment.");
            return;
        }

        if (!reportedUserId && !matchId) {
            Alert.alert("Error", "Internal Error: No user or match ID to report.");
            return;
        }

        setLoading(true);
        try {
            await reportApi.submitReport(
                reportedUserId || 0, // Fallback, backend will use matchId if provided
                selectedCategory,
                reason,
                matchId
            );
            Alert.alert("Report Submitted", "User reported and blocked. You won't see them again.", [
                { text: "OK", onPress: onSuccess }
            ]);
        } catch (error: any) {
            console.error('Report error:', error);
            Alert.alert("Error", error.message || "Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            // Reset state
            setSelectedCategory(null);
            setReason('');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.keyboardView}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Block & Report</Text>
                                <TouchableOpacity onPress={handleClose} disabled={loading} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.subtitle}>
                                Why are you reporting this user? We won't let them know.
                            </Text>

                            <View style={styles.categoriesContainer}>
                                {REPORT_CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryButton,
                                            selectedCategory === cat && styles.categoryButtonSelected
                                        ]}
                                        onPress={() => setSelectedCategory(cat)}
                                        disabled={loading}
                                    >
                                        <Text style={[
                                            styles.categoryText,
                                            selectedCategory === cat && styles.categoryTextSelected
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Details (Required)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Please explain what happened..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={reason}
                                onChangeText={setReason}
                                multiline
                                numberOfLines={4}
                                editable={!loading}
                            />

                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    loading && styles.disabledButton,
                                    (!selectedCategory || !reason.trim()) && styles.disabledButton // Visual disable if incomplete
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Block & Report</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: theme.colors.card, // Should use a proper dark card color
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 24,
        lineHeight: 20,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 24,
        gap: 10,
    },
    categoryButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: theme.colors.background, // Should contrast slightly with card
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 8,
        marginRight: 8,
    },
    categoryButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    categoryText: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    categoryTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginBottom: 10,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        padding: 16,
        color: theme.colors.textPrimary,
        height: 120,
        textAlignVertical: 'top',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
        fontSize: 15,
    },
    submitButton: {
        backgroundColor: theme.colors.error || '#FF4444',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
