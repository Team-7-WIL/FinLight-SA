import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadProducts(), loadCategories()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      if (response.data.success) {
        setProducts(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/productcategories');
      if (response.data.success) {
        setCategories(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getFilteredProducts = () => {
    if (!selectedCategory) return products;
    return products.filter(product => product.productCategoryId === selectedCategory);
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return t('products.uncategorized');
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : t('products.uncategorized');
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilters}>
      <TouchableOpacity
        style={[
          styles.categoryFilter,
          {
            backgroundColor: !selectedCategory ? theme.colors.primary : theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text
          style={[
            styles.categoryFilterText,
            {
              color: !selectedCategory ? '#fff' : theme.colors.text,
            },
          ]}
        >
          {t('products.all')}
        </Text>
      </TouchableOpacity>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryFilter,
            {
              backgroundColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Text
            style={[
              styles.categoryFilterText,
              {
                color: selectedCategory === category.id ? '#fff' : theme.colors.text,
              },
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.productCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        theme.shadows.sm,
      ]}
      onPress={() => navigation.navigate('EditProduct', { product: item })}
    >
      <View style={styles.productHeader}>
        <Text style={[styles.productName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
          R {item.unitPrice.toFixed(2)}
        </Text>
      </View>
      {item.description && (
        <Text style={[styles.productDescription, { color: theme.colors.textSecondary }]}>
          {item.description}
        </Text>
      )}
      <View style={styles.productFooter}>
        <Text style={[styles.productCategory, { color: theme.colors.textSecondary }]}>
          {getCategoryName(item.productCategoryId)}
        </Text>
        <Text style={[styles.productType, { color: theme.colors.textSecondary }]}>
          {item.isService ? t('products.service') : t('products.product')}
        </Text>
      </View>
      {item.sku && (
        <Text style={[styles.productSku, { color: theme.colors.textSecondary }]}>
          SKU: {item.sku}
        </Text>
      )}
    </TouchableOpacity>
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
      {renderCategoryFilter()}

      <FlatList
        data={getFilteredProducts()}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {selectedCategory
                ? t('empty.noProductsInCategory')
                : t('empty.noProducts')}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }, theme.shadows.lg]}
        onPress={() => navigation.navigate('AddProduct')}
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
  categoryFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  productCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCategory: {
    fontSize: 12,
  },
  productType: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  productSku: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
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