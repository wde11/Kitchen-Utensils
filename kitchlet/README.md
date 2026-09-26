# Kitchlet — Expo app

See the [project README](../README.md) for full setup (XAMPP API, Spotify credentials).

```bash
npm install
npx expo start     # w = web, or scan the QR code with Expo Go
npx tsc --noEmit   # typecheck
npx expo lint      # lint
```

## Where things live

| Path | What |
| --- | --- |
| `src/config.ts` | API URL detection and the **Spotify placeholders** |
| `src/lib/api.ts` | Client for the Kitchlet REST API (CRUD + photo upload) |
| `src/lib/spotify.ts` | Spotify Web API client (token, track lookup, search) |
| `src/context/` | Shared utensil list state and toasts |
| `src/app/(tabs)/index.tsx` | Kitchen dashboard + utensil grid |
| `src/app/(tabs)/tunes.tsx` | Spotify search / featured song |
| `src/app/utensil/[id].tsx` | Detail screen with delete confirmation |
| `src/app/utensil/form.tsx` | Create / edit form |
