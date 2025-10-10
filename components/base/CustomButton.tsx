import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type CustomButtonProps = Omit<PressableProps, 'style'> & {
  label?: string;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: PressableProps['style'];
  textStyle?: StyleProp<TextStyle>;
  spinnerColor?: string;
};

const buttonStyles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48
  },
  label: {
    fontSize: TYPOGRAPHY.native.button.fontSize,
    fontWeight: TYPOGRAPHY.native.button.fontWeight,
    fontFamily: TYPOGRAPHY.fontFamily.body
  },
  primary: {
    backgroundColor: COLORS.buttonPrimaryBackground
  },
  secondary: {
    backgroundColor: COLORS.buttonSecondaryBackground
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.buttonGhostBorder
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  },
  disabled: {
    opacity: 0.6
  }
});

const variantTextColor: Record<ButtonVariant, string> = {
  primary: COLORS.white,
  secondary: COLORS.buttonSecondaryText,
  ghost: COLORS.buttonGhostText
};

const variantSpinnerColor: Record<ButtonVariant, string> = {
  primary: COLORS.white,
  secondary: COLORS.buttonPrimaryBackground,
  ghost: COLORS.buttonPrimaryBackground
};

export const CustomButton: React.FC<CustomButtonProps> = ({
  label,
  children,
  loading = false,
  disabled,
  variant = 'primary',
  style,
  textStyle,
  spinnerColor,
  ...pressableProps
}) => {
  const isDisabled = disabled || loading;
  const resolvedSpinnerColor = spinnerColor ?? variantSpinnerColor[variant];

  const renderLabel = () => {
    if (loading) {
      return <ActivityIndicator color={resolvedSpinnerColor} />;
    }

    if (children) {
      return children;
    }

    return (
      <Text
        style={[
          buttonStyles.label,
          { color: variantTextColor[variant] },
          textStyle
        ]}
      >
        {label}
      </Text>
    );
  };

  const computeBaseStyles = (
    state: PressableStateCallbackType
  ): StyleProp<ViewStyle>[] => {
    const composed: StyleProp<ViewStyle>[] = [
      buttonStyles.base,
      buttonStyles[variant]
    ];

    if (state.pressed && !isDisabled) {
      composed.push(buttonStyles.pressed);
    }

    if (isDisabled) {
      composed.push(buttonStyles.disabled);
    }

    return composed;
  };

  const computedStyle =
    typeof style === 'function'
      ? (state: PressableStateCallbackType) => {
          const base = computeBaseStyles(state);
          const result = style(state);
          return result ? [...base, result] : base;
        }
      : (state: PressableStateCallbackType) => {
          const base = computeBaseStyles(state);
          if (style) {
            base.push(style as StyleProp<ViewStyle>);
          }
          return base;
        };

  return (
    <Pressable
      accessibilityRole="button"
      {...pressableProps}
      disabled={isDisabled}
      style={computedStyle}
    >
      {renderLabel()}
    </Pressable>
  );
};

CustomButton.displayName = 'CustomButton';
