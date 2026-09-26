import { Radius } from '@/constants/theme';
import { embedUrl, SPOTIFY_EMBED_HEIGHT } from '@/lib/spotify';

/** Web version: Spotify's embed player as a plain iframe (react-native-webview doesn't support web). */
export function SpotifyPlayer({ trackId }: { trackId: string }) {
  return (
    <iframe
      title="Spotify player"
      src={embedUrl(trackId)}
      width="100%"
      height={SPOTIFY_EMBED_HEIGHT}
      style={{ border: 0, borderRadius: Radius.md, display: 'block' }}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
