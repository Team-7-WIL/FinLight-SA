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
} from 'react-native';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function AuditLogsScreen({ navigation }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useFocusEffect(
    React.useCallback(() => {
      loadAuditLogs(true);
    }, [])
  );

  const loadAuditLogs = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setPage(1);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const response = await apiClient.get(`/auditlogs?page=${currentPage}&pageSize=20`);

      if (response.data.success) {
        const newLogs = response.data.data.items;
        if (reset) {
          setAuditLogs(newLogs);
        } else {
          setAuditLogs(prev => [...prev, ...newLogs]);
        }

        setHasMore(newLogs.length === 20);
        if (!reset) {
          setPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      Alert.alert(t('common.error'), t('messages.failedToLoad') + ' audit logs');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case 'created':
        return theme.colors.success;
      case 'updated':
        return theme.colors.primary;
      case 'deleted':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderAuditLog = ({ item }) => (
    <View
      style={[
        styles.auditLogCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        theme.shadows.sm,
      ]}
    >
      <View style={styles.auditLogHeader}>
        <Text style={[styles.action, { color: getActionColor(item.action) }]}>
          {item.action}
        </Text>
        <Text style={[styles.module, { color: theme.colors.primary }]}>
          {item.module}
        </Text>
      </View>

      {item.userName && (
        <Text style={[styles.user, { color: theme.colors.text }]}>
          👤 {item.userName}
        </Text>
      )}

      <Text style={[styles.details, { color: theme.colors.textSecondary }]}>
        {item.details}
      </Text>

      <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
        🕒 {formatTimestamp(item.timestamp)}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Loading more...
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          📋 Audit Logs
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Track all user activities in the system
        </Text>
      </View>

      {auditLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            📝 No audit logs found
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            Activity logs will appear here as users interact with the system
          </Text>
        </View>
      ) : (
        <FlatList
          data={auditLogs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAuditLog}
          onEndReached={() => {
            if (hasMore && !isLoadingMore) {
              loadAuditLogs();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  listContainer: {
    padding: 16,
  },
  auditLogCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  auditLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  action: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  module: {
    fontSize: 14,
    fontWeight: '600',
  },
  user: {
    fontSize: 14,
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
  },
});
