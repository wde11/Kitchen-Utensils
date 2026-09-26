import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Category, Utensil } from '@/lib/api';

export function UtensilCard({ utensil, width }: { utensil: Utensil; width: number }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${utensil.name}, ${utensil.category}`}
      onPress={() => router.push({ pathname: '/utensil/[id]', params: { id: utensil.id } })}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.media}>
        <UtensilImage uri={utensil.image_url} category={utensil.category} iconSize={40} />
        {utensil.quantity > 1 && (
          <View style={[styles.qty, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" style={styles.qtyText}>
              ×{utensil.quantity}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <ThemedText type="caption" themeColor="accent" numberOfLines={1}>
          {utensil.category}
        </ThemedText>
        <ThemedText type="label" numberOfLines={2}>
          {utensil.name}
        </ThemedText>
        {utensil.material && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {utensil.material}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

/** The utensil's photo, or a tinted placeholder with its category icon. */
export function UtensilImage({
  uri,
  category,
  iconSize = 56,
}: {
  uri: string | null;
  category: Category;
  iconSize?: number;
}) {
  const theme = useTheme();
  if (uri) {
    return <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />;
  }
  return (
    <View style={[StyleSheet.absoluteFill, styles.placeholder, { backgroundColor: theme.accentSoft }]}>
      <Icon name={category} size={iconSize} color={theme.accent} />
    </View>
  );
}

export function UtensilCardSkeleton({ width }: { width: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          width,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <View style={[styles.media, { backgroundColor: theme.backgroundSelected }]} />
      <View style={styles.body}>
        <View style={[styles.bar, { width: '40%', backgroundColor: theme.backgroundSelected }]} />
        <View
          style={[
            styles.bar,
            {
              width: '80%',
              height: 14,
              backgroundColor: theme.backgroundSelected,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(60, 40, 20, 0.06)',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  media: {
    aspectRatio: 1,
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  qtyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  body: {
    padding: Spacing.three,
    paddingTop: 12,
    gap: 2,
  },
  bar: {
    height: 10,
    borderRadius: 5,
    marginVertical: 4,
  },
});
