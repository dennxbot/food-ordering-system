import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem } from '../types';
import { formatCurrency } from '../utils/currency';
import TouchButton from './TouchButton';

interface MenuItemCardProps {
  item: FoodItem;
  onPress: (item: FoodItem) => void;
  onAddToCart?: (item: FoodItem) => void;
  showAddButton?: boolean;
  cardWidth?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const defaultCardWidth = (screenWidth - 60) / 2; // 2 columns with margins

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onPress,
  onAddToCart,
  showAddButton = true,
  cardWidth = defaultCardWidth,
}) => {
  const formatPrice = (price: number): string => {
    return formatCurrency(price);
  };

  const handleCardPress = () => {
    onPress(item);
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={handleCardPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatPrice(item.price)}`}
      accessibilityHint="Tap to view item details"
    >
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant" size={40} color="#cccccc" />
          </View>
        )}
        
        {!item.available && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Unavailable</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          
          {showAddButton && item.available && onAddToCart && (
            <TouchButton
              title="Add"
              onPress={handleAddToCart}
              size="small"
              variant="primary"
              icon="add"
              style={styles.addButton}
              accessibilityLabel={`Add ${item.name} to cart`}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
});

export default MenuItemCard;