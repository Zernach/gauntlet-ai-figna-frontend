import React from 'react';
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    StyleProp
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

export type CustomTextInputProps = TextInputProps & {
    style?: StyleProp<TextStyle>;
};

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: COLORS.buttonGhostBorder,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: TYPOGRAPHY.native.body.fontSize,
        lineHeight: TYPOGRAPHY.native.body.lineHeight,
        fontFamily: TYPOGRAPHY.fontFamily.body,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.white,
        minHeight: 48
    }
});

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
    style,
    placeholderTextColor = COLORS.textSecondary,
    ...rest
}) => {
    return (
        <TextInput
            style={[styles.input, style]}
            placeholderTextColor={placeholderTextColor}
            {...rest}
        />
    );
};

CustomTextInput.displayName = 'CustomTextInput';

