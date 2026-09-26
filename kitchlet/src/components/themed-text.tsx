import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'display' | 'title' | 'subtitle' | 'label' | 'small' | 'smallBold' | 'caption';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
  },
  display: {
    fontFamily: Fonts.rounded,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 800,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 600,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 600,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
