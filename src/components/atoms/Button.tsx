import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacityProps,
  ViewStyle,
  TextStyle 
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  fullWidth = false,
  style,
  textStyle,
  disabled,
  ...rest
}) => {
  const getButtonStyles = (): ViewStyle => {
    const buttonStyles: ViewStyle = {
      ...styles.button,
      opacity: disabled ? 0.6 : 1,
    };
    
    // Size
    if (size === 'small') {
      buttonStyles.paddingVertical = spacing.xs;
      buttonStyles.paddingHorizontal = spacing.md;
    } else if (size === 'large') {
      buttonStyles.paddingVertical = spacing.md;
      buttonStyles.paddingHorizontal = spacing.lg;
    }
    
    // Variant
    if (variant === 'primary') {
      buttonStyles.backgroundColor = colors.primary;
    } else if (variant === 'secondary') {
      buttonStyles.backgroundColor = colors.secondary;
    } else if (variant === 'outline') {
      buttonStyles.backgroundColor = 'transparent';
      buttonStyles.borderWidth = 1;
      buttonStyles.borderColor = colors.primary;
    }
    
    // Width
    if (fullWidth) {
      buttonStyles.width = '100%';
    }
    
    return buttonStyles;
  };
  
  const getTextStyles = (): TextStyle => {
    const textStyles: TextStyle = { ...styles.text };
    
    // Size
    if (size === 'small') {
      textStyles.fontSize = typography.fontSize.caption;
    } else if (size === 'large') {
      textStyles.fontSize = typography.fontSize.h3;
    }
    
    // Variant
    if (variant === 'outline') {
      textStyles.color = colors.primary;
    }
    
    return textStyles;
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? colors.primary : '#FFFFFF'} 
        />
      ) : (
        <Text style={[getTextStyles(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.body,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
});

export default Button; 