import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Web version of the tab bar: a floating pill at the bottom of the page. */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <FloatingTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="Cutlery">Kitchen</TabButton>
          </TabTrigger>
          <TabTrigger name="tunes" href="/tunes" asChild>
            <TabButton icon="music">Tunes</TabButton>
          </TabTrigger>
        </FloatingTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: IconName }) {
  const theme = useTheme();
  const color = isFocused ? theme.onTint : theme.textSecondary;
  return (
    <Pressable {...props} style={({ pressed }) => pressed && { opacity: 0.8 }}>
      <View style={[styles.tabButton, isFocused && { backgroundColor: theme.tint }]}>
        <Icon name={icon} size={18} color={color} />
        <ThemedText type="smallBold" style={{ color }}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function FloatingTabList(props: TabListProps) {
  const theme = useTheme();
  return (
    <View {...props} style={styles.container}>
      <View style={[styles.pill, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing.four,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pill: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 10px 30px rgba(40, 25, 10, 0.15)',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
  },
});
