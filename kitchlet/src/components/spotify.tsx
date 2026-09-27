import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { SpotifyPlayer } from '@/components/spotify-player';
import { ThemedText } from '@/components/themed-text';
import { SPOTIFY } from '@/config';
import { Radius, Spacing } from '@/constants/theme';
import { useSpotifyTrack } from '@/hooks/use-spotify-track';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, type SpotifyTrack } from '@/lib/spotify';

const WIDGET_BG = '#2B1B14';
const WIDGET_GRADIENT = 'linear-gradient(120deg, #C04000 0%, #965A3E 50%, #2B1B14 100%)';

/** Dashboard banner showing the featured "cooking soundtrack" from Spotify. */
export function SoundtrackWidget() {
  const state = useSpotifyTrack(SPOTIFY.featuredTrack);

  let title = 'Loading your soundtrack…';
  let subtitle = 'Spotify';
  if (state.status === 'unconfigured') {
    title = 'Add a cooking soundtrack';
    subtitle = 'Connect Spotify in src/config.ts';
  } else if (state.status === 'no-track') {
    title = 'Pick a cooking soundtrack';
    subtitle = 'Play your favorite songs from Spotify';
  } else if (state.status === 'error') {
    title = "Couldn't load your soundtrack";
    subtitle = state.message;
  } else if (state.status === 'ready') {
    title = state.track.name;
    subtitle = state.track.artists;
  }
  const artwork = state.status === 'ready' ? state.track.imageUrl : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Cooking soundtrack: ${title}. Open Tunes`}
      onPress={() => router.navigate('/tunes')}
      style={({ pressed }) => [styles.widget, pressed && { opacity: 0.9 }]}>
      <View style={styles.widgetArt}>
        {artwork ? (
          <Image source={{ uri: artwork }} style={StyleSheet.absoluteFill} transition={200} />
        ) : state.status === 'loading' ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Icon name="music" size={24} color="#FFFFFF" />
        )}
      </View>
      <View style={styles.widgetText}>
        <ThemedText type="caption" style={{ color: '#FBE3D4' }}>
          Cooking soundtrack
        </ThemedText>
        <ThemedText type="label" numberOfLines={1} style={{ color: '#FFFFFF' }}>
          {title}
        </ThemedText>
        <ThemedText type="small" numberOfLines={1} style={{ color: 'rgba(255,255,255,0.8)' }}>
          {subtitle}
        </ThemedText>
      </View>
      <Icon name="chevron" size={18} color="rgba(255,255,255,0.7)" />
    </Pressable>
  );
}

/** Large "now playing" style card for a single track. */
export function TrackHero({ track, label }: { track: SpotifyTrack; label: string }) {
  const theme = useTheme();
  const meta = [track.album, track.releaseYear, formatDuration(track.durationMs)].filter(Boolean).join(' · ');

  return (
    <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.heroArt}>
        {track.imageUrl ? (
          <Image source={{ uri: track.imageUrl }} style={StyleSheet.absoluteFill} transition={250} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: WIDGET_BG }]}>
            <Icon name="music" size={48} color="#1DB954" />
          </View>
        )}
      </View>
      <View style={styles.heroText}>
        <ThemedText type="caption" themeColor="spotify">
          {label}
        </ThemedText>
        <ThemedText type="title" numberOfLines={2}>
          {track.name}
        </ThemedText>
        <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
          {track.artists}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {meta}
        </ThemedText>
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => Linking.openURL(track.spotifyUrl)}
          style={({ pressed }) => [styles.openLink, pressed && { opacity: 0.6 }]}>
          <ThemedText type="smallBold" themeColor="tint">
            Open in Spotify
          </ThemedText>
          <Icon name="external" size={14} color={theme.tint} weight="semibold" />
        </Pressable>
      </View>
      <View style={styles.player}>
        <SpotifyPlayer key={track.id} trackId={track.id} />
      </View>
    </View>
  );
}

export function TrackRow({ track, active, onPress }: { track: SpotifyTrack; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${track.name} by ${track.artists}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: active ? theme.backgroundSelected : 'transparent' },
        pressed && { opacity: 0.7 },
      ]}>
      <View style={[styles.rowArt, { backgroundColor: theme.backgroundSelected }]}>
        {track.imageUrl && <Image source={{ uri: track.imageUrl }} style={StyleSheet.absoluteFill} />}
      </View>
      <View style={styles.rowText}>
        <ThemedText type="label" numberOfLines={1} themeColor={active ? 'spotify' : 'text'}>
          {track.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {track.artists}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {formatDuration(track.durationMs)}
      </ThemedText>
    </Pressable>
  );
}

export function SpotifySetupCard({ missing, onRetry, error }: { missing: 'credentials' | 'track' | 'error'; onRetry?: () => void; error?: string }) {
  const theme = useTheme();
  const content = {
    credentials: {
      title: 'Connect Spotify',
      // body: 'Create an app at developer.spotify.com/dashboard, then paste its Client ID and Client Secret into kitchlet/src/config.ts (or .env.local).',
    },
    track: {
      title: 'Choose your featured song',
       body: 'Paste a Spotify track ID or link into the search bar below.',
    }, 

    error: {
      title: "Couldn't load the featured song",
      body: error ?? 'Something went wrong while talking to Spotify.',
    },
  }[missing];

  return (
    <View style={[styles.setup, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.setupIcon, { backgroundColor: WIDGET_BG }]}>
        <Icon name={missing === 'error' ? 'warning' : missing === 'credentials' ? 'key' : 'music'} size={22} color="#1DB954" />
      </View>
      <View style={styles.setupText}>
        <ThemedText type="label">{content.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {content.body}
        </ThemedText>
        {onRetry && <Button label="Try again" icon="refresh" variant="secondary" onPress={onRetry} style={styles.retry} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  widget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: WIDGET_BG,
    experimental_backgroundImage: WIDGET_GRADIENT,
    // react-native-web ignores experimental_backgroundImage; it forwards the plain CSS property.
    ...(Platform.OS === 'web' ? ({ backgroundImage: WIDGET_GRADIENT } as object) : null),
  },
  widgetArt: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetText: {
    flex: 1,
    gap: 1,
  },
  hero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
    padding: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroArt: {
    flexGrow: 1,
    flexBasis: 220,
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
  },
  heroText: {
    flexGrow: 1,
    flexBasis: 240,
    gap: Spacing.one,
    justifyContent: 'flex-end',
  },
  openLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  player: {
    flexBasis: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
  rowArt: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  setup: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  setupIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupText: {
    flex: 1,
    gap: Spacing.one,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
});
