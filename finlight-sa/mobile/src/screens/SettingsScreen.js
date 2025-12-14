import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import useThemeStore from '../store/useThemeStore';
import useAuthStore from '../store/useAuthStore';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useThemeStore();
  const { user, business, logout } = useAuthStore();
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'zu', name: 'isiZulu' },
    { code: 'nso', name: 'Sepedi' },
    { code: 'sw', name: 'Swahili' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
  ];

  const selectedLanguage = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageSelect = async (languageCode) => {
    try {
      await changeLanguage(languageCode);
      setShowLanguageModal(false);
      Alert.alert(t('common.success'), t('common.languageChanged'));
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert(t('common.error'), 'Failed to save language preference');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('settings.confirmLogout') || 'Are you sure you want to logout?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          onPress: () => logout(),
          style: 'destructive',
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
          theme.shadows.sm,
        ]}
      >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.account')}
            </Text>
        <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('settings.name')}
              </Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {user?.fullName}
              </Text>
        </View>
        <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('settings.email')}
              </Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {user?.email}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('settings.business')}
              </Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {business?.name}
              </Text>
        </View>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
          theme.shadows.sm,
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('settings.appearance')}
        </Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
            {t('settings.darkMode')}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[styles.settingRow, styles.menuItem]}
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
            {t('common.language')}
          </Text>
          <View style={styles.languageSelector}>
            <Text style={[styles.languageText, { color: theme.colors.text }]}>
              {selectedLanguage.name}
            </Text>
            <Text style={[styles.menuItemChevron, { color: theme.colors.textSecondary }]}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
          theme.shadows.sm,
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('settings.banking')}
        </Text>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
          onPress={() => navigation.navigate('BankStatements')}
        >
          <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
            {t('settings.bankStatements')}
          </Text>
          <Text style={[styles.menuItemChevron, { color: theme.colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('BankTransactions')}
        >
          <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
            {t('settings.bankTransactions')}
          </Text>
          <Text style={[styles.menuItemChevron, { color: theme.colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('AuditLogs')}
        >
          <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
            📋 Audit Logs
          </Text>
          <Text style={[styles.menuItemChevron, { color: theme.colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.colors.error }, theme.shadows.md]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          {t('settings.version')}
        </Text>
      </View>

      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('common.selectLanguage')}
            </Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    {
                      backgroundColor: item.code === selectedLanguage.code
                        ? theme.colors.primary + '20'
                        : 'transparent',
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      {
                        color: theme.colors.text,
                        fontWeight: item.code === selectedLanguage.code ? '600' : '400',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.code === selectedLanguage.code && (
                    <Text style={[styles.checkmark, { color: theme.colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.secondary }]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 16,
    marginRight: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuItemChevron: {
    fontSize: 20,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageOptionText: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});