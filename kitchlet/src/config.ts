import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Base URL of the self-hosted Kitchlet REST API (the PHP app in /api, served by XAMPP).
 *
 * By default it points at the computer running `npx expo start`, which is also the
 * machine running XAMPP. Override with EXPO_PUBLIC_API_URL in `.env.local` if needed,
 * e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20/Kitchen-Utensils/api
 */
export const API_URL = resolveApiUrl();

function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }

  let host: string | undefined;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    host = window.location.hostname;
  } else {
    host = Constants.expoConfig?.hostUri?.split(':')[0];
  }
  host ||= Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  return `http://${host}/Kitchen-Utensils/api`;
}

/**
 * ─── Spotify Web API ───────────────────────────────────────────────────────────
 * 1. Create an app at https://developer.spotify.com/dashboard
 * 2. Paste its Client ID and Client Secret below (or set them in `.env.local`).
 * 3. Paste the ID of the song you want to feature. For a link like
 *    https://open.spotify.com/track/<TRACK_ID>?si=… the ID is the part after /track/.
 *    A full Spotify link or `spotify:track:` URI works too.
 */
export const SPOTIFY = {
  clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || 'YOUR_SPOTIFY_CLIENT_ID',
  clientSecret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || '33e2804035ae4350a0711f9e39e682ef',
  // 🎵 PLACEHOLDER: the specific song shown as your kitchen soundtrack.
  featuredTrack: process.env.EXPO_PUBLIC_SPOTIFY_TRACK_ID || 'https://open.spotify.com/track/2e6soczRbcYbU4gzPN3xwk?si=34ad5e86e0e54366',
};
