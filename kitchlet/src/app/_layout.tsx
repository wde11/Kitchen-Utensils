import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { ToastProvider } from '@/context/toast-context';
import { UtensilsProvider } from '@/context/utensils-context';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.tint,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <UtensilsProvider>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="utensil/[id]" />
            <Stack.Screen name="utensil/form" options={{ presentation: 'modal' }} />
          </Stack>
        </ToastProvider>
      </UtensilsProvider>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
