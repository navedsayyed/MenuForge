// src/components/Button.tsx
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { ButtonVariant } from '../types';

// ============================================
// Reusable Button Component
// ============================================

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon = null,
  style,
  textStyle
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.button, styles.primaryButton, isDisabled && styles.disabledButton].filter(Boolean);
      case 'secondary':
        return [styles.button, styles.secondaryButton, isDisabled && styles.disabledButton].filter(Boolean);
      case 'outline':
        return [styles.button, styles.outlineButton, isDisabled && styles.disabledButton].filter(Boolean);
      case 'danger':
        return [styles.button, styles.dangerButton, isDisabled && styles.disabledButton].filter(Boolean);
      default:
        return [styles.button, styles.primaryButton, isDisabled && styles.disabledButton].filter(Boolean);
    }
  };

  const getTextStyle = (): TextStyle[] => {
    switch (variant) {
      case 'primary':
        return [styles.buttonText, styles.primaryText];
      case 'secondary':
        return [styles.buttonText, styles.secondaryText];
      case 'outline':
        return [styles.buttonText, styles.outlineText];
      case 'danger':
        return [styles.buttonText, styles.dangerText];
      default:
        return [styles.buttonText, styles.primaryText];
    }
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#FF6B6B' : '#FFFFFF'} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  primaryButton: {
    backgroundColor: '#FF6B6B'
  },
  secondaryButton: {
    backgroundColor: '#3498DB'
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B6B'
  },
  dangerButton: {
    backgroundColor: '#E74C3C'
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
    opacity: 0.6
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconContainer: {
    marginRight: 8
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  primaryText: {
    color: '#FFFFFF'
  },
  secondaryText: {
    color: '#FFFFFF'
  },
  outlineText: {
    color: '#FF6B6B'
  },
  dangerText: {
    color: '#FFFFFF'
  }
});

export default Button;
