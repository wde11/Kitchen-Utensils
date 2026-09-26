import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { SpotifySetupCard, TrackHero, TrackRow } from '@/components/spotify';
import { ThemedText } from '@/components/themed-text';
import { SPOTIFY } from '@/config';
import { BottomTabInset, Fonts, NoOutline, Radius, Spacing } from '@/constants/theme';
import { useSpotifyTrack } from '@/hooks/use-spotify-track';
import { useTheme } from '@/hooks/use-theme';
import { getTrack, isSpotifyConfigured, parseTrackId, searchTracks, type SpotifyTrack } from '@/lib/spotify';

const CONTENT_WIDTH = 760;

type Search =
  | { status: 'idle' | 'loading' }
  | { status: 'done'; query: string; results: SpotifyTrack[] }
  | { status: 'error'; message: string };

export default function TunesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [reloadKey, setReloadKey] = useState(0);
  const featured = useSpotifyTrack(SPOTIFY.featuredTrack, reloadKey);
  const configured = isSpotifyConfigured();

  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<Search>({ status: 'idle' });
  const [selected, setSelected] = useState<SpotifyTrack | null>(null);

  async function runSearch() {
    const q = query.trim();
    if (!q || !configured) return;
    setSearch({ status: 'loading' });
    try {
      if (parseTrackId(q)) {
        // A pasted link / ID fetches that specific song.
        const track = await getTrack(q);
        setSelected(track);
        setSearch({ status: 'done', query: q, results: [track] });
      } else {
        setSearch({ status: 'done', query: q, results: await searchTracks(q) });
      }
    } catch (e) {
      setSearch({ status: 'error', message: e instanceof Error ? e.message : 'Search failed.' });
    }
  }

  let hero;
  if (selected) {
    hero = <TrackHero track={selected} label="Now selected" />;
  } else if (featured.status === 'ready') {
    hero = <TrackHero track={featured.track} label="Featured soundtrack" />;
  } else if (featured.status === 'loading') {
    hero = (
      <View style={[styles.heroLoading, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ActivityIndicator color={theme.spotify} />
        <ThemedText type="small" themeColor="textSecondary">
          Fetching your soundtrack from Spotify…
        </ThemedText>
      </View>
    );
  } else if (featured.status === 'unconfigured') {
    hero = <SpotifySetupCard missing="credentials" />;
  } else if (featured.status === 'no-track') {
    hero = <SpotifySetupCard missing="track" />;
  } else {
    hero = <SpotifySetupCard missing="error" error={featured.message} onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four }]}>
      <View style={styles.column}>
        <View>
          <View style={styles.poweredBy}>
            <View style={[styles.dot, { backgroundColor: theme.spotify }]} />
            <ThemedText type="caption" themeColor="textSecondary">
              Powered by Spotify Web API
            </ThemedText>
          </View>
          <ThemedText type="display">Kitchen Tunes</ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            Find the perfect song to cook to.
          </ThemedText>
        </View>

        {hero}

        <View style={styles.searchRow}>
          <View
            style={[
              styles.search,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: configured ? 1 : 0.6 },
            ]}>
            <Icon name="search" size={18} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={runSearch}
              editable={configured}
              placeholder={configured ? 'Song, artist, or paste a Spotify link' : 'Connect Spotify to search'}
              placeholderTextColor={theme.textSecondary}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              style={[styles.searchInput, NoOutline, { color: theme.text }]}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search Spotify"
            disabled={!configured || !query.trim()}
            onPress={runSearch}
            style={({ pressed }) => [
              styles.searchButton,
              { backgroundColor: theme.spotify, opacity: !configured || !query.trim() ? 0.5 : pressed ? 0.85 : 1 },
            ]}>
            {search.status === 'loading' ? <ActivityIndicator color="#000" /> : <Icon name="search" size={20} color="#000000" weight="semibold" />}
          </Pressable>
        </View>

        {search.status === 'error' && (
          <View style={[styles.banner, { backgroundColor: theme.dangerSoft }]}>
            <Icon name="warning" size={16} color={theme.danger} />
            <ThemedText type="small" themeColor="danger" style={styles.flex}>
              {search.message}
            </ThemedText>
          </View>
        )}

        {search.status === 'done' && (
          <View style={styles.results}>
            <ThemedText type="subtitle">
              {search.results.length ? `Results for “${search.query}”` : `No songs found for “${search.query}”`}
            </ThemedText>
            <View style={[styles.resultList, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {search.results.map((track) => (
                <TrackRow key={track.id} track={track} active={selected?.id === track.id} onPress={() => setSelected(track)} />
              ))}
            </View>
          </View>
        )}

        {search.status === 'idle' && configured && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Tip: paste a link like open.spotify.com/track/… to fetch one specific song.
          </ThemedText>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  column: {
    width: '100%',
    maxWidth: CONTENT_WIDTH,
    alignSelf: 'center',
    gap: 20,
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroLoading: {
    height: 180,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.three,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.sans,
    fontSize: 16,
  },
  searchButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: 12,
    borderRadius: Radius.md,
  },
  results: {
    gap: 12,
  },
  resultList: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
  },
  hint: {
    textAlign: 'center',
  },
});
