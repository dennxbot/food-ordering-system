import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { FoodItem } from '../types';
import { apiService } from '../services/api';
import { useCart } from '../context/CartContext';
import MenuItemCard from '../components/MenuItemCard';
import TouchButton from '../components/TouchButton';

interface MenuScreenProps {
  navigation: any;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ navigation }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem, state: cartState } = useCart();

  // Filter items based on category and search query
  const filteredItems = foodItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const loadMenuData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Check API health first
      const isHealthy = await apiService.healthCheck();
      if (!isHealthy) {
        throw new Error('Unable to connect to the ordering system');
      }

      // Load food items and categories
      const [items, cats] = await Promise.all([
        apiService.getFoodItems(),
        apiService.getCategories(),
      ]);

      setFoodItems(items);
      setCategories(['All', ...cats]);
    } catch (err) {
      console.error('Error loading menu data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menu');
      
      Alert.alert(
        'Connection Error',
        'Unable to load menu items. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => loadMenuData() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMenuData(false);
  };

  const handleItemPress = (item: FoodItem) => {
    navigation.navigate('ItemDetails', { item });
  };

  const handleAddToCart = (item: FoodItem) => {
    try {
      addItem(item);
      
      // Show brief success feedback
      Alert.alert(
        'Added to Cart',
        `${item.name} has been added to your cart.`,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const handleViewCart = () => {
    navigation.navigate('Cart');
  };

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMenuData();
      
      // Set up auto-refresh interval (every 30 seconds)
      const interval = setInterval(() => {
        loadMenuData(false);
      }, 30000);

      return () => clearInterval(interval);
    }, [])
  );

  const renderCategoryButton = ({ item: category }: { item: string }) => (
    <TouchButton
      title={category}
      onPress={() => setSelectedCategory(category)}
      variant={selectedCategory === category ? 'primary' : 'secondary'}
      size="medium"
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.selectedCategoryButton,
      ]}
    />
  );

  const renderMenuItem = ({ item }: { item: FoodItem }) => (
    <MenuItemCard
      item={item}
      onPress={handleItemPress}
      onAddToCart={handleAddToCart}
      showAddButton={true}
    />
  );

  if (loading && foodItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        
        {cartState.itemCount > 0 && (
          <TouchButton
            title={`Cart (${cartState.itemCount})`}
            onPress={handleViewCart}
            variant="primary"
            size="medium"
            icon="bag"
            style={styles.cartButton}
          />
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search menu items"
        />
        {searchQuery.length > 0 && (
          <TouchButton
            title="Clear"
            onPress={() => setSearchQuery('')}
            variant="secondary"
            size="small"
            icon="close"
            style={styles.clearButton}
          />
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchButton
              key={category}
              title={category}
              onPress={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'primary' : 'secondary'}
              size="medium"
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton,
              ]}
            />
          ))}
        </ScrollView>
      </View>

      {/* Menu Items */}
      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.menuContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant" size={64} color="#cccccc" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory !== 'All'
                ? 'No items found matching your criteria'
                : 'No menu items available'}
            </Text>
            <TouchButton
              title="Refresh Menu"
              onPress={() => loadMenuData()}
              variant="primary"
              size="medium"
              icon="refresh"
              style={styles.refreshButton}
            />
          </View>
        }
      />

      {/* Floating Cart Button */}
      {cartState.itemCount > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchButton
            title={`View Cart (${cartState.itemCount}) - $${cartState.total.toFixed(2)}`}
            onPress={handleViewCart}
            variant="success"
            size="large"
            icon="bag"
            fullWidth
            style={styles.floatingCartButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  cartButton: {
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    marginRight: 8,
    paddingHorizontal: 20,
  },
  selectedCategoryButton: {
    elevation: 4,
  },
  menuContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for floating cart button
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: 40,
  },
  refreshButton: {
    paddingHorizontal: 24,
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  floatingCartButton: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default MenuScreen;