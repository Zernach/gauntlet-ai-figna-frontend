import React from 'react';
import {
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  StyleProp
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

type CustomTextVariant = 'body' | 'heading' | 'subtitle' | 'caption';

export type CustomTextProps = TextProps & {
  variant?: CustomTextVariant;
  style?: StyleProp<TextStyle>;
};

const variantStyles = StyleSheet.create<Record<CustomTextVariant, TextStyle>>({
  body: {},
  heading: {
    fontSize: TYPOGRAPHY.native.heading.fontSize,
    lineHeight: TYPOGRAPHY.native.heading.lineHeight,
    fontWeight: TYPOGRAPHY.native.heading.fontWeight
  },
  subtitle: {
    fontSize: TYPOGRAPHY.native.subtitle.fontSize,
    lineHeight: TYPOGRAPHY.native.subtitle.lineHeight,
    fontWeight: TYPOGRAPHY.native.subtitle.fontWeight
  },
  caption: {
    fontSize: TYPOGRAPHY.native.caption.fontSize,
    lineHeight: TYPOGRAPHY.native.caption.lineHeight,
    color: COLORS.textSecondary
  }
});

const baseStyles = StyleSheet.create({
  text: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.native.body.fontSize,
    lineHeight: TYPOGRAPHY.native.body.lineHeight,
    fontFamily: TYPOGRAPHY.fontFamily.body
  }
});

export const CustomText: React.FC<CustomTextProps> = ({
  children,
  variant = 'body',
  style,
  ...rest
}) => {
  return (
    <Text style={[baseStyles.text, variantStyles[variant], style]} {...rest}>
      {children}
    </Text>
  );
};

CustomText.displayName = 'CustomText';
