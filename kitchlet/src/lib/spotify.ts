import { SPOTIFY } from '@/config';

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string;
  album: string;
  imageUrl: string | null;
  durationMs: number;
  releaseYear: string | null;
  spotifyUrl: string;
};

type RawTrack = {
  id: string;
  name: string;
  duration_ms: number;
  artists?: { name: string }[];
  album?: { name?: string; release_date?: string; images?: { url: string; width?: number }[] };
  external_urls?: { spotify?: string };
};

export class SpotifyError extends Error {}

export function isSpotifyConfigured() {
  return !SPOTIFY.clientId.startsWith('YOUR_') && !SPOTIFY.clientSecret.startsWith('YOUR_');
}

/**
 * Extracts a track ID from anything a user might paste:
 * a bare ID, `spotify:track:ID`, or an open.spotify.com track link.
 */
export function parseTrackId(input: string): string | null {
  const value = input.trim();
  const match =
    value.match(/^([A-Za-z0-9]{22})$/) ??
    value.match(/^spotify:track:([A-Za-z0-9]{22})$/) ??
    value.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]{22})/);
  return match?.[1] ?? null;
}

// Client Credentials flow: https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow
let token: { value: string; expiresAt: number } | null = null;

async function getAccessToken() {
  if (token && token.expiresAt > Date.now()) {
    return token.value;
  }
  if (!isSpotifyConfigured()) {
    throw new SpotifyError('Add your Spotify Client ID and Secret in src/config.ts to enable music.');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${SPOTIFY.clientId}:${SPOTIFY.clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  }).catch(() => {
    throw new SpotifyError("Couldn't reach Spotify. Check your internet connection.");
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.access_token) {
    throw new SpotifyError(
      response.status === 400 || response.status === 401
        ? 'Spotify rejected the Client ID / Secret. Double-check them in src/config.ts.'
        : `Spotify sign-in failed (${response.status}).`,
    );
  }

  token = { value: body.access_token, expiresAt: Date.now() + (body.expires_in - 60) * 1000 };
  return token.value;
}

async function spotifyGet<T>(path: string): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {
    throw new SpotifyError("Couldn't reach Spotify. Check your internet connection.");
  });

  if (response.status === 401) {
    token = null;
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 404 || response.status === 400) {
      throw new SpotifyError("That song couldn't be found on Spotify.");
    }
    throw new SpotifyError(body?.error?.message ?? `Spotify request failed (${response.status}).`);
  }
  return body as T;
}

function toTrack(raw: RawTrack): SpotifyTrack {
  const images = [...(raw.album?.images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return {
    id: raw.id,
    name: raw.name,
    artists: raw.artists?.map((a) => a.name).join(', ') || 'Unknown artist',
    album: raw.album?.name ?? '',
    imageUrl: images[0]?.url ?? null,
    durationMs: raw.duration_ms,
    releaseYear: raw.album?.release_date?.slice(0, 4) ?? null,
    spotifyUrl: raw.external_urls?.spotify ?? `https://open.spotify.com/track/${raw.id}`,
  };
}

const trackCache = new Map<string, Promise<SpotifyTrack>>();

/** GET /v1/tracks/{id} — accepts an ID, URI or share link. */
export function getTrack(idOrLink: string): Promise<SpotifyTrack> {
  const id = parseTrackId(idOrLink);
  if (!id) {
    return Promise.reject(new SpotifyError('That doesn\'t look like a Spotify track ID or link.'));
  }
  let pending = trackCache.get(id);
  if (!pending) {
    pending = spotifyGet<RawTrack>(`/tracks/${id}`).then(toTrack);
    pending.catch(() => trackCache.delete(id));
    trackCache.set(id, pending);
  }
  return pending;
}

/** GET /v1/search?type=track */
export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  const params = `q=${encodeURIComponent(query)}&type=track&limit=10`;
  const body = await spotifyGet<{ tracks?: { items?: (RawTrack | null)[] } }>(`/search?${params}`);
  return (body.tracks?.items ?? []).filter((t): t is RawTrack => !!t).map(toTrack);
}

/** Spotify's embeddable player: https://developer.spotify.com/documentation/embeds */
export const SPOTIFY_EMBED_HEIGHT = 152;

export function embedUrl(trackId: string) {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}
