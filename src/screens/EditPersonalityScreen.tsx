import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import { theme } from '../theme';
import { SITUATIONS } from './SituationSelectionScreen';
import { SituationQuestion, SituationResponse, SituationCategory } from '../types';

const CATEGORY_COLORS: Record<SituationCategory, string> = {
  Dating: '#E8A4B8',
  Social: '#7EB8DA',
  Adventure: '#9ED9A0',
  Life: '#F5D76E',
  Entertainment: '#C8A8E9',
  Ethics: '#FFB085',
};

export const EditPersonalityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responses, setResponses] = useState<SituationResponse[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      setLoading(true);
      // Get responses from user context or fetch from API
      const existingResponses = user?.situationResponses || [];
      setResponses(existingResponses);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionById = (questionId: number): SituationQuestion | undefined => {
    return SITUATIONS.find(s => s.id === questionId);
  };

  const handleEditAnswer = (index: number) => {
    setEditingIndex(index);
    setEditText(responses[index].answer);
  };

  const handleSaveAnswer = () => {
    if (editingIndex === null) return;
    
    const updatedResponses = [...responses];
    updatedResponses[editingIndex] = {
      ...updatedResponses[editingIndex],
      answer: editText,
      answeredAt: new Date().toISOString(),
    };
    setResponses(updatedResponses);
    setEditingIndex(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const handleReplaceQuestion = (index: number) => {
    setReplacingIndex(index);
    setShowQuestionPicker(true);
  };

  const handleSelectNewQuestion = (question: SituationQuestion) => {
    if (replacingIndex === null) return;

    const updatedResponses = [...responses];
    updatedResponses[replacingIndex] = {
      questionId: question.id,
      answer: '',
      answeredAt: new Date().toISOString(),
    };
    setResponses(updatedResponses);
    setShowQuestionPicker(false);
    setReplacingIndex(null);
    
    // Automatically open edit for the new question
    setEditingIndex(replacingIndex);
    setEditText('');
  };

  const handleAddQuestion = () => {
    if (responses.length >= 5) {
      Alert.alert('Maximum Reached', 'You can only have up to 5 personality questions.');
      return;
    }
    setReplacingIndex(responses.length);
    setShowQuestionPicker(true);
  };

  const handleRemoveQuestion = (index: number) => {
    Alert.alert(
      'Remove Question',
      'Are you sure you want to remove this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedResponses = responses.filter((_, i) => i !== index);
            setResponses(updatedResponses);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    // Validate all questions have answers
    const unanswered = responses.filter(r => !r.answer.trim());
    if (unanswered.length > 0) {
      Alert.alert('Missing Answers', 'Please answer all questions before saving.');
      return;
    }

    try {
      setSaving(true);
      
      // Update locally
      await updateUser({ situationResponses: responses });
      
      // Update on server
      await userApi.updateProfile({ situationResponses: responses });
      
      Alert.alert('Success', 'Your personality questions have been updated!');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert('Error', 'Failed to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const usedQuestionIds = responses.map(r => r.questionId);
  const availableQuestions = SITUATIONS.filter(q => !usedQuestionIds.includes(q.id));

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Question Picker Modal
  if (showQuestionPicker) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={() => setShowQuestionPicker(false)}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>Choose a Question</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.pickerList}>
          {availableQuestions.map((question) => {
            const categoryColor = CATEGORY_COLORS[question.category];
            return (
              <TouchableOpacity
                key={question.id}
                style={styles.pickerItem}
                onPress={() => handleSelectNewQuestion(question)}
              >
                <View style={styles.pickerItemHeader}>
                  <Text style={styles.pickerEmoji}>{question.emoji}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                    <Text style={[styles.categoryText, { color: categoryColor }]}>
                      {question.category}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pickerQuestion}>{question.question}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Personality</Text>
        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Personality Questions</Text>
        <Text style={styles.sectionSubtitle}>
          These answers appear on your profile and help others get to know you.
        </Text>

        {responses.map((response, index) => {
          const question = getQuestionById(response.questionId);
          const categoryColor = question ? CATEGORY_COLORS[question.category] : theme.colors.primary;
          const isEditing = editingIndex === index;

          return (
            <View key={index} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.questionHeaderLeft}>
                  <Text style={styles.questionEmoji}>{question?.emoji || '💬'}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                    <Text style={[styles.categoryText, { color: categoryColor }]}>
                      {question?.category || 'Question'}
                    </Text>
                  </View>
                </View>
                <View style={styles.questionActions}>
                  <TouchableOpacity onPress={() => handleReplaceQuestion(index)} style={styles.actionBtn}>
                    <Ionicons name="swap-horizontal" size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveQuestion(index)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.questionText}>{question?.question || 'Question not found'}</Text>

              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editText}
                    onChangeText={setEditText}
                    placeholder="Type your answer..."
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    maxLength={300}
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.confirmBtn, !editText.trim() && styles.confirmBtnDisabled]} 
                      onPress={handleSaveAnswer}
                      disabled={!editText.trim()}
                    >
                      <Text style={styles.confirmBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.answerContainer} onPress={() => handleEditAnswer(index)}>
                  <Text style={styles.answerText}>
                    {response.answer || 'Tap to add your answer...'}
                  </Text>
                  <Ionicons name="pencil" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {responses.length < 5 && (
          <TouchableOpacity style={styles.addQuestionBtn} onPress={handleAddQuestion}>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.addQuestionText}>Add Question ({responses.length}/5)</Text>
          </TouchableOpacity>
        )}

        {responses.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Personality Questions</Text>
            <Text style={styles.emptySubtitle}>
              Add questions to help others understand your personality better.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 24,
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionEmoji: {
    fontSize: 24,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  questionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    lineHeight: 22,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  editContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
  },
  editInput: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  addQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  // Question Picker Styles
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  pickerList: {
    flex: 1,
    padding: 16,
  },
  pickerItem: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  pickerItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pickerEmoji: {
    fontSize: 24,
  },
  pickerQuestion: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
});

export default EditPersonalityScreen;
