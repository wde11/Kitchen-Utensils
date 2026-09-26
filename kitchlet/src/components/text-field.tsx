import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, NoOutline, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  required?: boolean;
  /** Shows "used / max" under the field when maxLength is set. */
  showCounter?: boolean;
  accessory?: ReactNode;
};

export function TextField({ label, error, required, showCounter, accessory, style, onFocus, onBlur, ...input }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.danger : focused ? theme.tint : theme.border;

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold">
        {label}
        {required && <ThemedText type="smallBold" themeColor="tint"> *</ThemedText>}
      </ThemedText>
      <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement, borderColor }]}>
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, NoOutline, { color: theme.text }, input.multiline && styles.multiline, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...input}
        />
        {accessory}
      </View>
      <View style={styles.footer}>
        <ThemedText type="small" themeColor="danger" style={styles.error}>
          {error ?? ''}
        </ThemedText>
        {showCounter && input.maxLength != null && (
          <ThemedText type="small" themeColor="textSecondary">
            {(input.value ?? '').length}/{input.maxLength}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: 13,
    minHeight: 50,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 16,
    marginTop: -Spacing.one,
  },
  error: {
    flex: 1,
    fontSize: 13,
  },
});
