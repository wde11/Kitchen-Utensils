import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  icon?: IconName;
  destructive?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Cross-platform confirmation dialog (React Native's Alert is a no-op on web). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  icon = 'trash',
  destructive,
  busy,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={busy ? undefined : onCancel} statusBarTranslucent>
      <Pressable
        accessibilityLabel="Dismiss dialog"
        style={[styles.backdrop, { backgroundColor: theme.overlay }]}
        onPress={busy ? undefined : onCancel}>
        <Pressable style={[styles.card, { backgroundColor: theme.backgroundElement }]} accessibilityRole="alert">
          <View style={[styles.iconCircle, { backgroundColor: destructive ? theme.dangerSoft : theme.tintSoft }]}>
            <Icon name={icon} size={26} color={destructive ? theme.danger : theme.tint} weight="semibold" />
          </View>
          <ThemedText type="subtitle" style={styles.center}>
            {title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {message}
          </ThemedText>
          {error && (
            <ThemedText type="small" themeColor="danger" style={styles.center}>
              {error}
            </ThemedText>
          )}
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} disabled={busy} style={styles.action} />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={busy}
              style={styles.action}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
    boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
  action: {
    flex: 1,
  },
});
