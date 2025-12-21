import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import useThemeStore from '../store/useThemeStore';
import useAuthStore from '../store/useAuthStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useThemeStore();
  const { t } = useLanguage();
  const business = useAuthStore((state) => state.business);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async () => {
    try {
      const response = await apiClient.get('/dashboard/summary');
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const chartData = {
    labels: summary?.monthlyTrends?.map((t) => t.month.substring(0, 3)) || [],
    datasets: [
      {
        data: summary?.monthlyTrends?.map((t) => t.income) || [0],
        color: () => theme.colors.success,
        strokeWidth: 2,
      },
      {
        data: summary?.monthlyTrends?.map((t) => t.expenses) || [0],
        color: () => theme.colors.error,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {business?.name}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {t('dashboard.title')}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
            theme.shadows.md,
          ]}
        >
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('dashboard.totalIncome')}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            R {summary?.totalIncome?.toFixed(2) || '0.00'}
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
            theme.shadows.md,
          ]}
        >
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('dashboard.totalExpenses')}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>
            R {summary?.totalExpenses?.toFixed(2) || '0.00'}
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            styles.statCardFull,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
            theme.shadows.md,
          ]}
        >
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('dashboard.netCashFlow')}
          </Text>
          <Text
            style={[
              styles.statValue,
              styles.statValueLarge,
              {
                color:
                  (summary?.netCashFlow || 0) >= 0
                    ? theme.colors.success
                    : theme.colors.error,
              },
            ]}
          >
            R {summary?.netCashFlow?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('dashboard.quickActions')}
        </Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: theme.colors.primary },
              theme.shadows.sm,
            ]}
            onPress={() => navigation.navigate('CreateInvoice')}
          >
            <Text style={styles.actionIcon}>INV</Text>
            <Text style={styles.actionText}>{t('dashboard.createInvoice')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: theme.colors.secondary },
              theme.shadows.sm,
            ]}
            onPress={() => navigation.navigate('OCRScan', { documentType: 'receipt' })}
          >
            <Text style={styles.actionIcon}>OCR</Text>
            <Text style={styles.actionText}>{t('dashboard.scanReceipt')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: theme.colors.success },
              theme.shadows.sm,
            ]}
            onPress={() => navigation.navigate('AddCustomer')}
          >
            <Text style={styles.actionIcon}>CUS</Text>
            <Text style={styles.actionText}>{t('dashboard.addCustomer')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: theme.colors.info },
              theme.shadows.sm,
            ]}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Text style={styles.actionIcon}>EXP</Text>
            <Text style={styles.actionText}>{t('dashboard.addExpense')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          theme.shadows.md,
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          {t('dashboard.monthlyTrends')}
        </Text>
        {summary?.monthlyTrends?.length > 0 && (
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.card,
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: () => theme.colors.text,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },
            }}
            bezier
            style={styles.chart}
          />
        )}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          theme.shadows.md,
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          {t('dashboard.topExpenses')}
        </Text>
        {summary?.topExpenseCategories?.map((category, index) => (
          <View key={index} style={styles.categoryRow}>
            <Text style={[styles.categoryName, { color: theme.colors.text }]}>
              {category.category}
            </Text>
            <Text style={[styles.categoryAmount, { color: theme.colors.textSecondary }]}>
              R {category.amount.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.primary },
            theme.shadows.md,
          ]}
          onPress={() => navigation.navigate('CreateInvoice')}
        >
          <Text style={styles.actionButtonText}>{t('buttons.createInvoice')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.secondary },
            theme.shadows.md,
          ]}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.actionButtonText}>{t('buttons.addExpense')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  statCardFull: {
    width: '100%',
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statValueLarge: {
    fontSize: 32,
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryName: {
    fontSize: 16,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});