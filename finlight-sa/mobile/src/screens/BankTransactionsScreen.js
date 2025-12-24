import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function BankTransactionsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [feedbackTransaction, setFeedbackTransaction] = useState(null);
  const [feedbackCategory, setFeedbackCategory] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedAmount, setEditedAmount] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedDirection, setEditedDirection] = useState('');
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      const response = await apiClient.get('/banktransactions');
      if (response.data.success) {
        setTransactions(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert(t('common.error'), t('messages.failedToLoad') + ' ' + t('titles.bankTransactions').toLowerCase());
    } finally {
      setIsLoading(false);
    }
  };

  const categorizeTransaction = async (transactionId) => {
    try {
      const response = await apiClient.post(`/banktransactions/${transactionId}/categorize`);
      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.transactionCategorized'));
        loadTransactions(); // Refresh the list
      } else {
        Alert.alert(t('common.error'), response.data.message || t('messages.failedToCategorize'));
      }
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      Alert.alert(t('common.error'), t('messages.failedToCategorize'));
    }
  };

  const categorizeSelectedTransactions = async () => {
    if (selectedTransactions.length === 0) {
      Alert.alert(t('common.error'), t('messages.selectTransactions'));
      return;
    }

    setIsCategorizing(true);
    try {
      const response = await apiClient.post('/banktransactions/categorize-batch', selectedTransactions);
      if (response.data.success) {
        Alert.alert(t('common.success'), `${selectedTransactions.length} ${t('messages.transactionsCategorized')}`);
        setSelectedTransactions([]);
        loadTransactions(); // Refresh the list
      } else {
        Alert.alert(t('common.error'), response.data.message || t('messages.failedToCategorize'));
      }
    } catch (error) {
      console.error('Error categorizing transactions:', error);
      Alert.alert(t('common.error'), t('messages.failedToCategorize'));
    } finally {
      setIsCategorizing(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackTransaction || !feedbackCategory.trim()) {
      Alert.alert(t('common.error'), t('messages.enterCategory'));
      return;
    }

    try {
      const response = await apiClient.post(`/banktransactions/${feedbackTransaction.id}/feedback`, {
        correctCategory: feedbackCategory.trim(),
      });

      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.feedbackSubmitted'));
        setFeedbackTransaction(null);
        setFeedbackCategory('');
        loadTransactions(); // Refresh the list
      } else {
        Alert.alert(t('common.error'), response.data.message || t('messages.failedToSubmitFeedback'));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(t('common.error'), t('messages.failedToSubmitFeedback'));
    }
  };

  const toggleTransactionSelection = (transactionId) => {
    setSelectedTransactions(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const deleteTransaction = async (transactionId) => {
    Alert.alert(
      t('common.delete') + ' ' + t('titles.bankTransactions'),
      t('messages.deleteTransactionConfirm') || 'Are you sure you want to delete this transaction?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete(`/banktransactions/${transactionId}`);
              if (response.data.success) {
                Alert.alert(t('common.success'), t('messages.transactionDeleted') || 'Transaction deleted successfully');
                loadTransactions(); // Refresh the list
              } else {
                Alert.alert(t('common.error'), response.data.message || t('messages.failedToDeleteTransaction') || 'Failed to delete transaction');
              }
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert(t('common.error'), t('messages.failedToDeleteTransaction') || 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const startEditingTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setEditedDescription(transaction.description);
    setEditedAmount(transaction.amount.toString());
    setEditedDate(new Date(transaction.txnDate).toISOString().split('T')[0]);
    setEditedDirection(transaction.direction);
  };

  const saveTransactionEdit = async () => {
    if (!editingTransaction) return;

    // Validation
    if (!editedDescription.trim()) {
      Alert.alert(t('common.error'), 'Description is required');
      return;
    }

    const amount = parseFloat(editedAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('common.error'), 'Amount must be greater than 0');
      return;
    }

    try {
      const response = await apiClient.put(`/banktransactions/${editingTransaction.id}`, {
        description: editedDescription.trim(),
        amount: amount,
        txnDate: new Date(editedDate).toISOString(),
        direction: editedDirection,
      });

      if (response.data.success) {
        Alert.alert(t('common.success'), 'Transaction updated successfully');
        setEditingTransaction(null);
        loadTransactions();
      } else {
        Alert.alert(t('common.error'), response.data.message || 'Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert(t('common.error'), 'Failed to update transaction');
    }
  };

  const renderTransaction = ({ item }) => (
    <View
      style={[
        styles.transactionCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        theme.shadows.sm,
      ]}
    >
      <View style={styles.transactionHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleTransactionSelection(item.id)}
        >
          <View style={[
            styles.checkboxInner,
            selectedTransactions.includes(item.id) && { backgroundColor: theme.colors.primary }
          ]} />
        </TouchableOpacity>

        <View style={styles.transactionInfo}>
          <Text style={[styles.description, { color: theme.colors.text }]}>
            {item.description}
          </Text>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
            {new Date(item.txnDate).toLocaleDateString()}
          </Text>
        </View>

        <Text style={[
          styles.amount,
          {
            color: item.direction === 'Credit' ? theme.colors.success : theme.colors.error
          }
        ]}>
          {item.direction === 'Credit' ? '+' : '-'}R {Math.abs(item.amount).toFixed(2)}
        </Text>
      </View>

      {item.aiCategory && (
        <View style={styles.categoryContainer}>
          <View style={styles.categoryRow}>
            <Text style={[styles.categoryLabel, { color: theme.colors.textSecondary }]}>
              {t('expenses.category')}:
            </Text>
            <Text style={[styles.category, { color: theme.colors.primary }]}>
              {item.aiCategory}
            </Text>
            {item.confidenceScore && (
              <Text style={[styles.confidence, { color: theme.colors.textSecondary }]}>
                ({(item.confidenceScore * 100).toFixed(1)}% {t('common.confirm').toLowerCase()})
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {!item.aiCategory && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => categorizeTransaction(item.id)}
          >
            <Text style={styles.actionButtonText}>{t('buttons.categorize')}</Text>
          </TouchableOpacity>
        )}

        {item.aiCategory && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            onPress={() => setFeedbackTransaction(item)}
          >
            <Text style={styles.actionButtonText}>{t('buttons.correct')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.warning || '#FF9800' }]}
          onPress={() => startEditingTransaction(item)}
        >
          <Text style={styles.actionButtonText}>{t('buttons.edit') || 'Edit'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => deleteTransaction(item.id)}
        >
          <Text style={styles.actionButtonText}>{t('buttons.delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {selectedTransactions.length > 0 && (
        <View style={[styles.batchActions, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.batchText, { color: theme.colors.text }]}>
            {selectedTransactions.length} {t('banking.selectTransactions')}
          </Text>
          <TouchableOpacity
            style={[styles.batchButton, { backgroundColor: theme.colors.primary }]}
            onPress={categorizeSelectedTransactions}
            disabled={isCategorizing}
          >
            {isCategorizing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.batchButtonText}>{t('buttons.categorizeAll')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('empty.noTransactions')}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              {t('empty.uploadAndProcess')}
            </Text>
          </View>
        }
      />

      {editingTransaction && (
        <View style={styles.editOverlay}>
          <View style={[styles.editContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.editTitle, { color: theme.colors.text }]}>
              {t('common.edit') || 'Edit Transaction'}
            </Text>

            <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>
              {t('common.description') || 'Description'}
            </Text>
            <TextInput
              style={[styles.editInput, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder={t('common.description')}
              placeholderTextColor={theme.colors.textSecondary}
              value={editedDescription}
              onChangeText={setEditedDescription}
              maxLength={200}
            />

            <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>
              {t('common.amount') || 'Amount'}
            </Text>
            <TextInput
              style={[styles.editInput, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              value={editedAmount}
              onChangeText={setEditedAmount}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>
              {t('common.date') || 'Date'}
            </Text>
            <TextInput
              style={[styles.editInput, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
              value={editedDate}
              onChangeText={setEditedDate}
            />

            <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>
              {t('common.type') || 'Type'} (Debit/Credit)
            </Text>
            <View style={styles.directionButtons}>
              <TouchableOpacity
                style={[
                  styles.directionButton,
                  {
                    backgroundColor: editedDirection === 'Debit' ? theme.colors.error : theme.colors.background,
                    borderColor: theme.colors.border
                  }
                ]}
                onPress={() => setEditedDirection('Debit')}
              >
                <Text style={[
                  styles.directionButtonText,
                  { color: editedDirection === 'Debit' ? '#fff' : theme.colors.text }
                ]}>
                  Debit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.directionButton,
                  {
                    backgroundColor: editedDirection === 'Credit' ? theme.colors.success : theme.colors.background,
                    borderColor: theme.colors.border
                  }
                ]}
                onPress={() => setEditedDirection('Credit')}
              >
                <Text style={[
                  styles.directionButtonText,
                  { color: editedDirection === 'Credit' ? '#fff' : theme.colors.text }
                ]}>
                  Credit
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => setEditingTransaction(null)}
              >
                <Text style={styles.editButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
                onPress={saveTransactionEdit}
              >
                <Text style={styles.editButtonText}>{t('common.save') || 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {feedbackTransaction && (
        <View style={styles.feedbackOverlay}>
          <View style={[styles.feedbackContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>
              {t('banking.correctCategory')}
            </Text>
            <Text style={[styles.feedbackDescription, { color: theme.colors.textSecondary }]}>
              "{feedbackTransaction.description}"
            </Text>
            <Text style={[styles.feedbackCurrent, { color: theme.colors.textSecondary }]}>
              {t('banking.current')}: {feedbackTransaction.aiCategory}
            </Text>

            <TextInput
              style={[styles.feedbackInput, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder={t('banking.enterCorrectCategory')}
              placeholderTextColor={theme.colors.textSecondary}
              value={feedbackCategory}
              onChangeText={setFeedbackCategory}
            />

            <View style={styles.feedbackActions}>
              <TouchableOpacity
                style={[styles.feedbackButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => {
                  setFeedbackTransaction(null);
                  setFeedbackCategory('');
                }}
              >
                <Text style={styles.feedbackButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.feedbackButton, { backgroundColor: theme.colors.primary }]}
                onPress={submitFeedback}
              >
                <Text style={styles.feedbackButtonText}>{t('buttons.submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  batchText: {
    fontSize: 16,
    fontWeight: '500',
  },
  batchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  batchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  confidence: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  feedbackDescription: {
    fontSize: 16,
    marginBottom: 8,
  },
  feedbackCurrent: {
    fontSize: 14,
    marginBottom: 16,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  feedbackActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  feedbackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 12,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  directionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  directionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
