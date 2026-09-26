# Kitchlet

A mobile app for cataloguing your kitchen utensils — with photos — plus a Spotify-powered "cooking soundtrack".

| Part | Tech | Folder |
| --- | --- | --- |
| Mobile app (iOS / Android / web) | Expo SDK 57, Expo Router, TypeScript | [`kitchlet/`](kitchlet/) |
| API 1 — self-hosted REST API (full CRUD) | PHP 8 + MySQL/MariaDB on XAMPP | [`api/`](api/) |
| API 2 — external public API | Spotify Web API | [`kitchlet/src/lib/spotify.ts`](kitchlet/src/lib/spotify.ts) |

## Features

- **Read** – responsive grid (2–4 columns) with search, category filters and dashboard stats. Tap a card for the detail screen.
- **Create** – form with client + server validation and photo upload (gallery, or camera on a phone).
- **Update** – pre-filled edit form; change fields, replace or remove the photo.
- **Delete** – confirmation dialog before the record (and its photo) is removed.
- **Spotify** – a "Cooking soundtrack" widget on the dashboard and a **Tunes** tab to search songs or fetch one specific song by link/ID.
- Light theme in mahogany and coconut brown (colours live in `kitchlet/src/constants/theme.ts`), toasts, loading skeletons, empty/error states.

## 1. Run the API (XAMPP)

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. This repo must live at `C:\xampp\htdocs\Kitchen-Utensils` (it does already).
3. Open <http://localhost/Kitchen-Utensils/api/utensils> — you should see JSON.

The `kitchlet` database and `utensils` table are created automatically on the first request (with 5 sample utensils). To create them by hand instead, import [`api/schema.sql`](api/schema.sql) in phpMyAdmin. DB credentials are in [`api/config.php`](api/config.php) (XAMPP defaults: `root`, no password).

### Endpoints

Base URL: `http://<your-pc>/Kitchen-Utensils/api`

| Method | Path | Body | Purpose |
| --- | --- | --- | --- |
| GET | `/utensils?search=&category=` | – | List |
| GET | `/utensils/{id}` | – | One utensil |
| POST | `/utensils` | JSON, or multipart with `image` file | Create |
| PUT | `/utensils/{id}` | JSON (`remove_image: true` to drop the photo) | Update |
| POST | `/utensils/{id}` | multipart with `image` file | Update with a new photo |
| DELETE | `/utensils/{id}` | – | Delete |
| GET | `/categories` | – | Allowed categories |

Validation errors return `422` with `{ "error": "...", "errors": { "field": "message" } }`. Photos (JPG/PNG/WebP/GIF, ≤ 5 MB, checked by content type) are saved in `api/uploads/`.

## 2. Run the app

```bash
cd kitchlet
npm install
npx expo start
```

Then press `w` for web, or scan the QR code with **Expo Go** on your phone.

The app finds the API automatically: it uses the IP of the computer running `npx expo start` (which is also running XAMPP). If that doesn't work, create `kitchlet/.env.local` with:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x/Kitchen-Utensils/api
```

**Testing on a real phone:** the phone and PC must be on the same Wi‑Fi, and Windows Firewall must allow Apache (`httpd.exe`) on private networks.

## 3. Connect Spotify (placeholder)

1. Create an app at <https://developer.spotify.com/dashboard> (any redirect URI works; it isn't used).
2. Put the credentials and **the song you want to feature** in [`kitchlet/src/config.ts`](kitchlet/src/config.ts) — look for `SPOTIFY` — or in `kitchlet/.env.local` (see [`kitchlet/.env.example`](kitchlet/.env.example)):

   ```ts
   export const SPOTIFY = {
     clientId: 'YOUR_SPOTIFY_CLIENT_ID',
     clientSecret: 'YOUR_SPOTIFY_CLIENT_SECRET',
     featuredTrack: 'PASTE_YOUR_SPOTIFY_TRACK_ID_HERE', // ID, spotify:track:… URI, or open.spotify.com link
   };
   ```

3. Restart `npx expo start`. The dashboard widget and the Tunes tab will show the song; the Tunes tab also lets you search or paste any track link.

Until credentials are set, the app shows a friendly "Connect Spotify" card instead.

**Playback:** the Tunes card includes Spotify's official embed player (a WebView on phones, an iframe on web). It plays the full song for listeners logged in to Spotify in that browser and a 30-second preview otherwise; "Open in Spotify" hands off to the Spotify app for full playback.

> **Note:** the app uses Spotify's Client Credentials flow directly from the app, so the client secret ends up inside the app bundle. That's fine for a class project or demo, but for a public release move the token request into the PHP API so the secret stays on the server.

## 4. Deploy the web app to Vercel

[`vercel.json`](vercel.json) at the repo root configures the build (Framework Preset **Other**, i.e. `"framework": null`):

| Setting | Value |
| --- | --- |
| Install Command | `cd kitchlet && npm ci` |
| Build Command | `cd kitchlet && npx expo export --platform web --clear` |
| Output Directory | `kitchlet/dist` |
| Rewrites | every path → `/` (so links like `/utensil/5` work on refresh) |

On vercel.com: **Add New → Project**, import this repository, and leave **Root Directory** as the repo root (`./`). `vercel.json` overrides the rest.

Add these under **Settings → Environment Variables** (they are baked in at build time, so redeploy after changing them):

| Variable | Required | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Yes | Public **https://** URL of the PHP API, e.g. `https://your-api-host/Kitchen-Utensils/api` |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | For music | |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` | For music | |
| `EXPO_PUBLIC_SPOTIFY_TRACK_ID` | For music | Featured song ID or link |

**Vercel only hosts the app, not the PHP API or MySQL** (`api/` is excluded via [`.vercelignore`](.vercelignore)). The API must be reachable over HTTPS from the internet, because browsers block `http://` requests from an `https://` page. Options: a PHP + MySQL host with SSL, or keep XAMPP running and expose it with a tunnel such as Cloudflare Tunnel or ngrok, then use that `https://` address as `EXPO_PUBLIC_API_URL`. If it's missing or wrong, the app shows a message explaining which.

