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
    reportedUserId: number;
    onSuccess: () => void;
}

const REPORT_CATEGORIES = [
    "Inappropriate Content",
    "Spam",
    "Abusive Behavior",
    "Catfishing",
    "Other"
];

export const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, reportedUserId, onSuccess }) => {
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

        setLoading(true);
        try {
            await reportApi.submitReport(reportedUserId, selectedCategory, reason);
            Alert.alert("Success", "User reported and blocked.", [
                { text: "OK", onPress: onSuccess }
            ]);
        } catch (error: any) {
            console.error('Report error:', error);
            Alert.alert("Error", "Failed to submit report. Please try again.");
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
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Report User</Text>
                                <TouchableOpacity onPress={handleClose} disabled={loading}>
                                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.subtitle}>
                                Please let us know why you are reporting this user. This will also block them permanently.
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

                            <Text style={styles.label}>Additional Comments (Required)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Describe the issue..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={reason}
                                onChangeText={setReason}
                                multiline
                                numberOfLines={4}
                                editable={!loading}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, loading && styles.disabledButton]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Report</Text>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 20,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 10,
    },
    categoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: 'transparent',
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
        borderRadius: 12,
        padding: 12,
        color: theme.colors.textPrimary,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    submitButton: {
        backgroundColor: theme.colors.error || '#FF4444', // Red for report action usually, or primary? User said "Block & Report", usually red.
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
