import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/button';
import { Chip } from '@/components/chip';
import { Icon, type IconName } from '@/components/icon';
import { SoundtrackWidget } from '@/components/spotify';
import { StateView } from '@/components/state-view';
import { ThemedText } from '@/components/themed-text';
import { UtensilCard, UtensilCardSkeleton } from '@/components/utensil-card';
import { BottomTabInset, Fonts, MaxContentWidth, NoOutline, Radius, Spacing } from '@/constants/theme';
import { useUtensils } from '@/context/utensils-context';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORIES, type Category } from '@/lib/api';

const GAP = 14;
const FAB_SIZE = 60;
/** Height of the floating "New utensil" button plus breathing room, reserved at the end of the list. */
const FAB_SPACE = FAB_SIZE + Spacing.four;

export default function KitchenScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { utensils, status, error, refreshing, refresh } = useUtensils();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');

  const contentWidth = Math.min(width, MaxContentWidth);
  const padding = contentWidth >= 680 ? Spacing.five : 20;
  const columns = contentWidth >= 1000 ? 4 : contentWidth >= 640 ? 3 : 2;
  const cardWidth = Math.floor((contentWidth - padding * 2 - GAP * (columns - 1)) / columns);

  const needle = query.trim().toLowerCase();
  const filtered = utensils.filter(
    (u) =>
      (category === 'All' || u.category === category) &&
      (!needle || [u.name, u.material, u.description, u.category].some((v) => v?.toLowerCase().includes(needle))),
  );
  const countByCategory = (c: Category) => utensils.filter((u) => u.category === c).length;
  const totalPieces = utensils.reduce((sum, u) => sum + u.quantity, 0);
  const categoriesUsed = new Set(utensils.map((u) => u.category)).size;

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.titleRow}>
        <Image
          source={require('@/assets/images/kitchlet-logo.png')}
          style={styles.logo}
          contentFit="contain"
          contentPosition="left center"
          accessibilityRole="header"
          accessibilityLabel="Kitchlet"
        />
      </View>

      <View style={styles.stats}>
        <Stat icon="grid" value={utensils.length} label="Utensils" />
        <Stat icon="layers" value={totalPieces} label="Pieces" />
        <Stat icon="Storage" value={categoriesUsed} label="Categories" />
      </View>

      <SoundtrackWidget />

      <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Icon name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your utensils"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          autoCorrect={false}
          style={[styles.searchInput, NoOutline, { color: theme.text }]}
        />
        {query.length > 0 && (
          <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}>
            <Icon name="close" size={16} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -padding }}
        contentContainerStyle={[styles.chips, { paddingHorizontal: padding }]}>
        <Chip label="All" count={utensils.length} selected={category === 'All'} onPress={() => setCategory('All')} />
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} icon={c} count={countByCategory(c)} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>

      {status === 'ready' && error && (
        <View style={[styles.banner, { backgroundColor: theme.dangerSoft }]}>
          <Icon name="offline" size={16} color={theme.danger} />
          <ThemedText type="small" themeColor="danger" style={styles.flex}>
            {error}
          </ThemedText>
        </View>
      )}

      <View style={styles.sectionRow}>
        <ThemedText type="subtitle">{category === 'All' ? 'Your collection' : category}</ThemedText>
        {status === 'ready' && (
          <ThemedText type="small" themeColor="textSecondary">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </ThemedText>
        )}
      </View>
    </View>
  );

  let empty;
  if (status === 'loading') {
    empty = (
      <View style={[styles.skeletons, { gap: GAP }]}>
        {Array.from({ length: columns * 2 }, (_, i) => (
          <UtensilCardSkeleton key={i} width={cardWidth} />
        ))}
      </View>
    );
  } else if (status === 'error') {
    empty = (
      <StateView
        tone="danger"
        icon="offline"
        title="Can't reach your kitchen"
        message={error ?? 'Something went wrong.'}
        actionLabel="Try again"
        actionIcon="refresh"
        onAction={refresh}
      />
    );
  } else if (utensils.length === 0) {
    empty = (
      <StateView
        icon="Cookware"
        title="Your kitchen is empty"
        message="Start cataloguing your pots, pans and gadgets. Snap a photo to show them off."
        actionLabel="Add your first utensil"
        actionIcon="add"
        onAction={() => router.push('/utensil/form')}
      />
    );
  } else {
    empty = (
      <StateView
        icon="search"
        title="No matches"
        message="Try a different search or category."
        actionLabel="Clear filters"
        onAction={() => {
          setQuery('');
          setCategory('All');
        }}
      />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <FlatList
        key={columns}
        data={status === 'ready' ? filtered : []}
        keyExtractor={(item) => String(item.id)}
        numColumns={columns}
        renderItem={({ item }) => <UtensilCard utensil={item} width={cardWidth} />}
        columnWrapperStyle={{ gap: GAP }}
        ItemSeparatorComponent={RowGap}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          Platform.OS === 'web' ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.tint} colors={[theme.tint]} />
          )
        }
        style={styles.flex}
        contentContainerStyle={{
          width: contentWidth,
          alignSelf: 'center',
          paddingHorizontal: padding,
          paddingBottom: insets.bottom + BottomTabInset + FAB_SPACE + Spacing.four,
        }}
      />

      {/* Floating add button: stays pinned above the tab bar while the list scrolls. */}
      <View style={[styles.fabHost, { bottom: insets.bottom + BottomTabInset + Spacing.one }]}>
        <IconButton icon="add" variant="tint" size={FAB_SIZE} accessibilityLabel="New utensil" onPress={() => router.push('/utensil/form')} />
      </View>
    </View>
  );
}

function RowGap() {
  return <View style={{ height: GAP }} />;
}

function Stat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.statIcon, { backgroundColor: theme.accentSoft }]}>
        <Icon name={icon} size={16} color={theme.accent} />
      </View>
      <ThemedText type="title" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    gap: 18,
    paddingBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  fabHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  logo: {
    width: 200,
    maxWidth: '70%',
    aspectRatio: 1118 / 354, // cropped logo artwork
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.three,
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.sans,
    fontSize: 16,
  },
  chips: {
    gap: Spacing.two,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: 12,
    borderRadius: Radius.md,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  skeletons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
