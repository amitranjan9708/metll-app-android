import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    Platform
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';

export interface MenuOption {
    label: string;
    icon?: string; // key of Ionicons
    action: () => void;
    type?: 'default' | 'destructive';
}

interface ChatMenuProps {
    visible: boolean;
    onClose: () => void;
    options: MenuOption[];
    anchorPosition?: { top: number; right: number }; // Optional custom positioning
}

export const ChatMenu: React.FC<ChatMenuProps> = ({ visible, onClose, options, anchorPosition }) => {
    const theme = useTheme();
    const styles = getStyles(theme, anchorPosition);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.menuContainer}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    index === options.length - 1 && styles.lastMenuItem
                                ]}
                                onPress={() => {
                                    onClose();
                                    option.action();
                                }}
                            >
                                <Text style={[
                                    styles.menuText,
                                    option.type === 'destructive' && styles.destructiveText
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const getStyles = (theme: any, anchorPosition?: { top: number; right: number }) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent', // Don't dim background, acting like a dropdown
    },
    menuContainer: {
        position: 'absolute',
        top: anchorPosition?.top || (Platform.OS === 'ios' ? 100 : 70), // Default header height approx
        right: anchorPosition?.right || 20,
        backgroundColor: theme.colors.card, // Make sure 'card' color is suitable, usually darker in dark mode
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 150,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuText: {
        fontSize: 16,
        color: theme.colors.textPrimary,
    },
    destructiveText: {
        color: theme.colors.error || '#ff4444',
    }
});
