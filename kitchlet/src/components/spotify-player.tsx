import { Linking, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Radius } from '@/constants/theme';
import { embedUrl, SPOTIFY_EMBED_HEIGHT } from '@/lib/spotify';

/**
 * Spotify's embed player inside a WebView. Plays the full track for listeners logged in to Spotify
 * in that browser context, otherwise a 30-second preview. No extra API credentials needed.
 */
export function SpotifyPlayer({ trackId }: { trackId: string }) {
  return (
    <View style={styles.frame}>
      <WebView
        source={{ uri: embedUrl(trackId) }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        onShouldStartLoadWithRequest={(request) => {
          // Keep the player (and its sub-frames) in the WebView; open "Open in Spotify" links outside.
          if (!request.isTopFrame || request.url.startsWith('https://open.spotify.com/embed') || request.url.startsWith('about:')) {
            return true;
          }
          Linking.openURL(request.url);
          return false;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: SPOTIFY_EMBED_HEIGHT,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
