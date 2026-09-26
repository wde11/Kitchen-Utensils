import { useEffect, useState } from 'react';

import { getTrack, isSpotifyConfigured, parseTrackId, type SpotifyTrack } from '@/lib/spotify';

type TrackState =
  | { status: 'unconfigured' }
  | { status: 'no-track' }
  | { status: 'loading' }
  | { status: 'ready'; track: SpotifyTrack }
  | { status: 'error'; message: string };

/** Fetches a single Spotify track, reporting setup problems as distinct states. */
export function useSpotifyTrack(idOrLink: string, reloadKey = 0): TrackState {
  const configured = isSpotifyConfigured();
  const hasTrack = parseTrackId(idOrLink) !== null;
  const requestKey = `${idOrLink}#${reloadKey}`;
  // The result remembers which request produced it, so a new request reads as "loading".
  const [result, setResult] = useState<{ key: string; state: TrackState } | null>(null);

  useEffect(() => {
    if (!configured || !hasTrack) return;
    let cancelled = false;
    getTrack(idOrLink)
      .then((track) => !cancelled && setResult({ key: requestKey, state: { status: 'ready', track } }))
      .catch((e: Error) => !cancelled && setResult({ key: requestKey, state: { status: 'error', message: e.message } }));
    return () => {
      cancelled = true;
    };
  }, [idOrLink, requestKey, configured, hasTrack]);

  if (!configured) return { status: 'unconfigured' };
  if (!hasTrack) return { status: 'no-track' };
  if (result?.key !== requestKey) return { status: 'loading' };
  return result.state;
}
