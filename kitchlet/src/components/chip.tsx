import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  count?: number;
};

export function Chip({ label, selected, onPress, icon, count }: ChipProps) {
  const theme = useTheme();
  const fg = selected ? theme.onTint : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.tint : theme.backgroundElement,
          borderColor: selected ? theme.tint : theme.border,
        },
        pressed && { opacity: 0.8 },
      ]}>
      {icon && <Icon name={icon} size={16} color={selected ? theme.onTint : theme.accent} />}
      <ThemedText type="smallBold" style={{ color: fg }}>
        {label}
      </ThemedText>
      {count != null && (
        <ThemedText type="small" style={{ color: selected ? theme.onTint : theme.textSecondary, opacity: 0.9 }}>
          {count}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
