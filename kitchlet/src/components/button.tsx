import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerSoft' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, size = 'md', style }: ButtonProps) {
  const theme = useTheme();
  const palette = {
    primary: { bg: theme.tint, fg: theme.onTint },
    secondary: { bg: theme.backgroundSelected, fg: theme.text },
    danger: { bg: theme.danger, fg: '#FFFFFF' },
    dangerSoft: { bg: theme.dangerSoft, fg: theme.danger },
    ghost: { bg: 'transparent', fg: theme.textSecondary },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.large,
        { backgroundColor: palette.bg, opacity: disabled ? 0.5 : 1 },
        pressed && styles.pressed,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={palette.fg} />
        ) : (
          icon && <Icon name={icon} size={size === 'lg' ? 20 : 18} color={palette.fg} weight="semibold" />
        )}
        <ThemedText type="label" style={{ color: palette.fg }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'surface' | 'tint' | 'glass';
  size?: number;
};

export function IconButton({ icon, onPress, accessibilityLabel, variant = 'surface', size = 44 }: IconButtonProps) {
  const theme = useTheme();
  const colors = {
    surface: { bg: theme.backgroundElement, fg: theme.text, border: theme.border },
    tint: { bg: theme.tint, fg: theme.onTint, border: theme.tint },
    glass: { bg: 'rgba(255,255,255,0.88)', fg: '#2B1B14', border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, backgroundColor: colors.bg, borderColor: colors.border },
        variant === 'tint' && styles.tintShadow,
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size={size * 0.42} color={colors.fg} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  large: {
    minHeight: 54,
    borderRadius: Radius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  iconButton: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tintShadow: {
    boxShadow: '0 6px 16px rgba(192, 64, 0, 0.32)',
  },
});
