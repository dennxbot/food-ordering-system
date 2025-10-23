import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../types';
import TouchButton from './TouchButton';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onUpdateNotes,
  onRemove,
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState(item.notes || '');

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      handleRemove();
    } else {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove ${item.food_item.name} from your cart?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(item.id),
        },
      ]
    );
  };

  const handleNotesSubmit = () => {
    onUpdateNotes(item.id, notesText);
    setShowNotes(false);
  };

  const unitPrice = item.total_price / item.quantity;

  return (
    <View style={styles.card}>
      <View style={styles.mainContent}>
        <View style={styles.imageContainer}>
          {item.food_item.image_url ? (
            <Image
              source={{ uri: item.food_item.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="restaurant" size={24} color="#cccccc" />
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.name}>{item.food_item.name}</Text>
          
          {item.size && (
            <Text style={styles.size}>Size: {item.size.size_name}</Text>
          )}
          
          <Text style={styles.unitPrice}>
            {formatPrice(unitPrice)} each
          </Text>
          
          {item.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              Notes: {item.notes}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.food_item.name} from cart`}
          >
            <Ionicons name="close" size={20} color="#dc3545" />
          </TouchableOpacity>
          
          <Text style={styles.totalPrice}>
            {formatPrice(item.total_price)}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.quantityControls}>
          <TouchButton
            title="-"
            onPress={() => handleQuantityChange(-1)}
            size="small"
            variant="secondary"
            style={styles.quantityButton}
            accessibilityLabel="Decrease quantity"
          />
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <TouchButton
            title="+"
            onPress={() => handleQuantityChange(1)}
            size="small"
            variant="secondary"
            style={styles.quantityButton}
            accessibilityLabel="Increase quantity"
          />
        </View>

        <TouchButton
          title={showNotes ? "Save Notes" : "Add Notes"}
          onPress={() => {
            if (showNotes) {
              handleNotesSubmit();
            } else {
              setShowNotes(true);
            }
          }}
          size="small"
          variant="secondary"
          icon={showNotes ? "checkmark" : "create"}
          style={styles.notesButton}
        />
      </View>

      {showNotes && (
        <View style={styles.notesSection}>
          <TextInput
            style={styles.notesInput}
            value={notesText}
            onChangeText={setNotesText}
            placeholder="Add special instructions..."
            multiline
            numberOfLines={3}
            maxLength={200}
            accessibilityLabel="Special instructions for this item"
          />
          
          <View style={styles.notesActions}>
            <TouchButton
              title="Cancel"
              onPress={() => {
                setNotesText(item.notes || '');
                setShowNotes(false);
              }}
              size="small"
              variant="secondary"
              style={styles.notesActionButton}
            />
            
            <TouchButton
              title="Save"
              onPress={handleNotesSubmit}
              size="small"
              variant="primary"
              style={styles.notesActionButton}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
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
  details: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  size: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  unitPrice: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  removeButton: {
    padding: 4,
    marginBottom: 8,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  notesButton: {
    paddingHorizontal: 16,
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  notesActionButton: {
    paddingHorizontal: 20,
  },
});

export default CartItemCard;