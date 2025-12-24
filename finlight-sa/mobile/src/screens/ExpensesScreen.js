import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function ExpensesScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  const loadExpenses = async () => {
    try {
      const response = await apiClient.get('/expenses');
      if (response.data.success) {
        setExpenses(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadExpenses();
    }, [])
  );

  const renderExpense = ({ item }) => (
    <View
      style={[
        styles.expenseCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        theme.shadows.sm,
      ]}
    >
      <View style={styles.expenseHeader}>
        <Text style={[styles.category, { color: theme.colors.text }]}>
          {item.category || 'Uncategorized'}
        </Text>
        <Text style={[styles.amount, { color: theme.colors.error }]}>
          {`-R${(item.amount || 0).toFixed(2)}`}
        </Text>
      </View>
      {item.vendor && (
        <Text style={[styles.vendor, { color: theme.colors.textSecondary }]}>
          {item.vendor}
        </Text>
      )}
      {item.date && (
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      )}
      {item.notes && (
        <Text style={[styles.notes, { color: theme.colors.textSecondary }]}>
          {item.notes}
        </Text>
      )}
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
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('empty.noExpenses')}
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }, theme.shadows.lg]}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  list: {
    padding: 16,
  },
  expenseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  vendor: {
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
});