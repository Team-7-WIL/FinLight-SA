import React, { useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import useAuthStore from './src/store/useAuthStore';
import useThemeStore from './src/store/useThemeStore';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { useLanguage } from './src/contexts/LanguageContext';

// Auth Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Main Screens
import DashboardScreen from './src/screens/DashboardScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Additional Screens
import CreateInvoiceScreen from './src/screens/CreateInvoiceScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import AddCustomerScreen from './src/screens/AddCustomerScreen';
import EditCustomerScreen from './src/screens/EditCustomerScreen';
import BankStatementsScreen from './src/screens/BankStatementsScreen';
import BankTransactionsScreen from './src/screens/BankTransactionsScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import EditProductScreen from './src/screens/EditProductScreen';
import OCRScanScreen from './src/screens/OCRScanScreen';
import ProcessReceiptResultScreen from './src/screens/ProcessReceiptResultScreen';
import AuditLogsScreen from './src/screens/AuditLogsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        tabBarLabelStyle: {
          fontWeight: theme.fontWeights.medium,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('tabs.dashboard'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{
          tabBarLabel: t('tabs.invoices'),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarLabel: t('tabs.expenses'),
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          tabBarLabel: t('tabs.customers'),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarLabel: t('tabs.products'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('tabs.settings'),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  const { theme } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateInvoice"
        component={CreateInvoiceScreen}
        options={{ title: t('titles.createInvoice') }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ title: t('titles.addExpense') }}
      />
      <Stack.Screen
        name="AddCustomer"
        component={AddCustomerScreen}
        options={{ title: t('titles.addCustomer') }}
      />
      <Stack.Screen
        name="EditCustomer"
        component={EditCustomerScreen}
        options={{ title: t('titles.editCustomer') }}
      />
      <Stack.Screen
        name="BankStatements"
        component={BankStatementsScreen}
        options={{ title: t('titles.bankStatements') }}
      />
      <Stack.Screen
        name="BankTransactions"
        component={BankTransactionsScreen}
        options={{ title: t('titles.bankTransactions') }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ title: t('titles.addProduct') }}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{ title: t('titles.editProduct') }}
      />
      <Stack.Screen
        name="OCRScan"
        component={OCRScanScreen}
        options={{ title: t('titles.ocrScan') }}
      />
      <Stack.Screen
        name="ProcessReceiptResult"
        component={ProcessReceiptResultScreen}
        options={{ title: t('titles.processReceipt') }}
      />
      <Stack.Screen
        name="AuditLogs"
        component={AuditLogsScreen}
        options={{ title: 'Audit Logs' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, loadAuth } = useAuthStore();
  const { theme, isDark, initTheme } = useThemeStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadAuth();
        await initTheme();
      } catch (error) {
        console.error('Error initializing app:', error);
        // Force loading to complete even if there's an error
        useAuthStore.setState({ isLoading: false });
      }
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('App initialization timeout, forcing completion');
      useAuthStore.setState({ isLoading: false });
    }, 5000); // 5 second timeout

    initializeApp();

    return () => clearTimeout(timeout);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Loading FinLight SA...
        </Text>
      </View>
    );
  }

  return (
    <LanguageProvider>
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.primary,
          },
            fonts: {
              regular: {
                fontFamily: theme.fonts.regular.fontFamily,
                fontWeight: theme.fonts.regular.fontWeight,
              },
              medium: {
                fontFamily: theme.fonts.medium.fontFamily,
                fontWeight: theme.fonts.medium.fontWeight,
              },
              bold: {
                fontFamily: theme.fonts.bold.fontFamily,
                fontWeight: theme.fonts.bold.fontWeight,
              },
              heavy: {
                fontFamily: theme.fonts.bold.fontFamily,
                fontWeight: theme.fonts.bold.fontWeight,
              },
            },
        }}
      >
        {isAuthenticated ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </>
    </LanguageProvider>
  );
}