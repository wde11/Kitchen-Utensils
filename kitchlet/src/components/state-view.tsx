import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StateViewProps = {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
  tone?: 'neutral' | 'danger';
};

/** Empty / error placeholder used across screens. */
export function StateView({ icon, title, message, actionLabel, actionIcon, onAction, tone = 'neutral' }: StateViewProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: tone === 'danger' ? theme.dangerSoft : theme.accentSoft }]}>
        <Icon name={icon} size={34} color={tone === 'danger' ? theme.danger : theme.accent} />
      </View>
      <ThemedText type="subtitle" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.message]}>
        {message}
      </ThemedText>
      {actionLabel && onAction && (
        <Button label={actionLabel} icon={actionIcon} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  message: {
    maxWidth: 340,
  },
  action: {
    marginTop: Spacing.three,
  },
});
