import { createContext, use, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Sits above the Kitchen screen's floating "New utensil" button (60pt tall). */
const TOAST_LIFT = 60 + Spacing.four;

type Toast ={ id: number; message: string; icon: IconName };
type ShowToast = (message: string, icon?: IconName) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const show: ShowToast = (message, icon = 'check') => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, icon });
    timer.current = setTimeout(() => setToast(null), 2400);
  };

  return (
    <ToastContext value={show}>
      {children}
      <View style={[styles.host,{ bottom: insets.bottom + BottomTabInset + TOAST_LIFT }]}>
        {toast && (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.springify().damping(18)}
            exiting={FadeOutDown.duration(180)}
            style={[styles.toast, { backgroundColor: theme.text }]}>
            <Icon name={toast.icon} size={18} color={theme.background} />
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {toast.message}
            </ThemedText>
          </Animated.View>
        )}
      </View>
    </ToastContext>
  );
}

export function useToast() {
  const context = use(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return context;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  },
});
