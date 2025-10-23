import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TouchButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const TouchButton: React.FC<TouchButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#cccccc' : '#007AFF',
          borderColor: disabled ? '#cccccc' : '#007AFF',
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
          borderColor: disabled ? '#cccccc' : '#007AFF',
          borderWidth: 2,
        };
      case 'success':
        return {
          backgroundColor: disabled ? '#cccccc' : '#28a745',
          borderColor: disabled ? '#cccccc' : '#28a745',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#cccccc' : '#dc3545',
          borderColor: disabled ? '#cccccc' : '#dc3545',
        };
      case 'warning':
        return {
          backgroundColor: disabled ? '#cccccc' : '#ffc107',
          borderColor: disabled ? '#cccccc' : '#ffc107',
        };
      default:
        return {
          backgroundColor: disabled ? '#cccccc' : '#007AFF',
          borderColor: disabled ? '#cccccc' : '#007AFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 48,
        };
      case 'medium':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          minHeight: 56,
        };
      case 'large':
        return {
          paddingVertical: 20,
          paddingHorizontal: 32,
          minHeight: 64,
        };
      case 'extra-large':
        return {
          paddingVertical: 24,
          paddingHorizontal: 40,
          minHeight: 72,
        };
      default:
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          minHeight: 56,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return '#666666';
    if (variant === 'secondary') return '#007AFF';
    if (variant === 'warning') return '#000000';
    return '#ffffff';
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 18;
      case 'large':
        return 20;
      case 'extra-large':
        return 22;
      default:
        return 18;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'medium':
        return 24;
      case 'large':
        return 28;
      case 'extra-large':
        return 32;
      default:
        return 24;
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();
  const textSize = getTextSize();
  const iconSize = getIconSize();

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={textColor}
            style={styles.loadingIndicator}
          />
          <Text style={[styles.text, { color: textColor, fontSize: textSize }, textStyle]}>
            {title}
          </Text>
        </View>
      );
    }

    if (icon) {
      return (
        <View style={[styles.contentContainer, iconPosition === 'right' && styles.contentReverse]}>
          <Ionicons
            name={icon}
            size={iconSize}
            color={textColor}
            style={[
              iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
            ]}
          />
          <Text style={[styles.text, { color: textColor, fontSize: textSize }, textStyle]}>
            {title}
          </Text>
        </View>
      );
    }

    return (
      <Text style={[styles.text, { color: textColor, fontSize: textSize }, textStyle]}>
        {title}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles,
        sizeStyles,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentReverse: {
    flexDirection: 'row-reverse',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
});

export default TouchButton;