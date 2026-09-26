import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.background}
      indicatorColor={theme.tintSoft}
      tintColor={theme.tint}
      labelStyle={{ selected: { color: theme.tint } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Kitchen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tunes">
        <NativeTabs.Trigger.Label>Tunes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="music.note" md="music_note" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
