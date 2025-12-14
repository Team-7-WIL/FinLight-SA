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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
});
