# Spotify — The Listening Room

A Spotify-inspired home and library experience built for the F26 ProductSC Developer Challenge. Browse four curated playlists, explore song details, search twelve original instrumental tracks, listen with a persistent audio player, and save playlists to your library.

![Desktop home](docs/home-1440.png)

## Run locally

Requires Node.js 22+ and pnpm 11+ (or npm). No API keys, accounts, database, or environment variables are needed for the app.

```sh
pnpm install
pnpm dev
```

Open the local address printed by Vite. Alternatively, `npm install` and `npm run dev` work; the committed dependency lockfile is for pnpm.

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

The production app is in `dist/`. A future static host must rewrite application routes to `index.html`; audio and artwork are ordinary static files.

## Demo walkthrough

1. On Home, **All**, **Music**, and **Your playlists** filter the feed in place. All three chips stay visible and show the selected filter. Saved-only results include an empty state; the URL remembers the filter for refresh and Back/Forward. Open **A softer morning** by clicking its artwork or title. The separate green play buttons start music without navigating.
2. Click **First Light** in the playlist to read its description and instrumental lyrics state. Press its play button to listen; opening another song’s details leaves playback running.
3. At widths of 700px and above, the right-hand **Now Playing** panel opens on first playback. Bottom **artwork** toggles it. **Expand** opens a large artwork view without changing the browsing URL; **Minimize** or Escape restores the panel and keyboard focus. Playback continues throughout.
4. Click the bottom **song title** to open its release and highlight the song. The panel’s collection heading opens the playback source separately. Artist names open artist pages.
5. Pause, resume, seek, and skip tracks. **Repeat** cycles queue → song → off. Off stops automatic playback after the final song; manual Next/Previous wrap. Next while repeating one song switches to queue repeat. Previous after more than three seconds restarts the current song; before that it goes back. The three-second boundary is a demo choice, not a verified Spotify threshold.
6. Enable **Shuffle** without restarting the current song. **Queue** shows upcoming songs even with Repeat One enabled. Select an entry to play it; disable Shuffle to restore original order. The playlist’s green play button pauses/resumes its own active queue.
7. Open a song’s **…** menu to add it to the queue, visit its release or artist, or view details and credits. Added songs play next in insertion order; duplicates are allowed. Adding to an empty queue selects the song but waits for Play. A brief message confirms each addition.
8. Open **Lyrics** to see the active song’s lyrics state. All twelve original tracks are instrumental, so the demo explains that no lyrics are available.
9. Type `Paloma`, `First Light`, or `morning` in the header. Suggestions appear over the current page. Use arrow keys and Enter to open a suggestion, or submit/View all for full results. Try **All / Songs / Playlists**, an unmatched query, Clear, and Back/Forward. Playing a search result queues the displayed song results.
10. Save a playlist with **+**. Open the **G avatar** for **Profile**, **Recents**, **Settings**, and **About this demo**. Settings is a full page with shared volume, shuffle, and repeat controls. Escape dismisses menus and the About dialog and restores focus.
11. Refresh: saved playlists, recently played songs, and preferences remain, but audio does not automatically start. At 700–1199px, the library becomes a compact rail and the full bottom transport remains available. Below 700px, artwork opens a Now Playing page with full controls and bottom Home/Search/Library navigation. Click **Your Library** to collapse/open the artwork rail without leaving your browsing page. The sidebar’s **Playlists** chip filters locally; Search only searches saved items. **Recents / Recently added / Alphabetical** and **List / Grid** change the sidebar’s ordering and layout. The separate expand icon opens a full library grid; Minimize or Escape returns to the same page with playback intact. At narrower desktop widths, opening the library makes room by closing the right-hand panel; reopening that panel compacts the library.

## Architecture

- **React + TypeScript + Vite**, React Router, custom CSS, and Lucide icons.
- `src/data.ts`: shared `Track`, `Playlist`, and `Release` types, asynchronous `Catalog`/`Library` contracts, bundled catalog, and resilient local-storage library adapter.
- `src/hooks.tsx`: asynchronous loading/retry and shared saved-library state.
- `src/main.tsx`: app shell, reusable cards/track rows, home, playlist, release, artist, search, library, recents, guest profile, and not-found screens.
- `src/track-page.tsx`: individual song descriptions, lyrics state, and playlist playback entry point.
- `src/player.tsx`: one audio element mounted above routed content, shared controls, playback-source identity, and persistent preferences and listening history. Browser media events drive progress and play state.
- `src/queue.ts`: pure queue creation, shuffle, repeat, manual/automatic transitions, duplicate-safe queue additions, and upcoming-order helpers.
- `src/view-state.tsx` and `src/listening-views.tsx`: independent panel state, desktop Now Playing/Queue panels, expanded and full-page listening views, and live lyrics.
- `src/profile-menu.tsx`: guest dropdown, full Settings page, and focus-trapped About dialog using the shared player.
- `src/sidebar.tsx`: independent library filters, search, ordering, layouts, selection and playback feedback, plus a route-preserving expanded library.
- `src/header-search.tsx`: keyboard-accessible suggestions that preserve the current route until submission.
- `src/track-menu.tsx`: accessible song actions and contextual navigation.
- `src/styles.css`: responsive dark panels, focus states, and reduced-motion support.

Routes: `/?facet=music|playlists` (or `/` for All), `/playlist/:id?track=:trackId`, `/release/:id?track=:trackId`, `/artist/:id`, `/track/:id`, `/now-playing`, `/queue`, `/lyrics`, `/search?q=…&type=…`, `/library`, `/profile`, `/recents`, and `/settings`. Song details stay on the selected song; Now Playing and Lyrics follow the active player. Search submission stores the query in the URL; subsequent submissions replace the current search history entry. Back/Forward restores the query. Panels and expanded Now Playing preserve the browsing route and scroll position.

The catalog contains twelve distinct 32-second instrumental miniatures, with three tracks per playlist and four original release collections using the same audio. Artists, releases, and playlist copy are fictional. Audio is real synthesized music. Saved playlist IDs, listening history, volume, shuffle, and repeat persist locally; playback does not automatically resume after refresh. If storage is blocked or corrupt, the current session remains usable. Queue additions are session-only; backend recommendations and Spotify’s queue-reordering rules are not implemented.

### Adding a backend later

Replace the exported catalog/library adapters while retaining their TypeScript interfaces. Views consume hooks and async methods rather than fixture arrays. An HTTP adapter can map the current methods to endpoints such as playlist listing/detail, all tracks (`listTracks()`), song detail, catalog search, and the current user's saved playlists. `getTrack(id)` returns the song, its owning playlist, and that playlist's ordered tracks, or `null` for an unknown ID. `getRelease(id)` resolves release metadata and its ordered tracks; stable `releaseId` and `artistId` fields distinguish release, artist, and source-playlist navigation. Artist pages currently group `listTracks()` results by artist ID. Each track includes a `description` and `lyrics: string | null`; use `null` for instrumental tracks. Keep stable IDs and return the same domain types. Audio URLs can point to your media storage.

The existing loading, retry, empty, and missing-resource views are already present. When authentication is introduced, create a user-scoped library adapter and clear/reload library state when the session changes. Guest-to-account library migration and the eventual database/API technology are intentionally future decisions. The browser audio controller stays client-side.

## Validation

`pnpm test` runs Vitest checks for catalog integrity, song metadata and owning playlist resolution, search, missing songs/playlists, persistence, unavailable/corrupt storage, shuffle preservation/restoration, every repeat mode, upcoming order, circular boundaries, and empty/single-track queues.

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

To use an existing Chrome installation instead, set `CHROME_PATH` to its executable. On macOS:

```sh
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" pnpm test:e2e
```

Browser tests cover actual media progress, pause/resume, seeking, manual/automatic repeat, one-song replay, stable shuffle, queue selection, playlist-source identity, panel route/scroll continuity, release-row reveal, expanded-view route/scroll/focus restoration, live lyrics, saved profiles, duplicate queue additions, recents, menu keyboard behavior, synchronized settings, failed-media retry, direct URLs, search suggestions/history/filters, Home facet history and uninterrupted playback, sidebar search/sort/layouts and expand/minimize focus, and keyboard-only playback. Layout checks capture Home, the profile menu, and Now Playing at 1440px, 1024px, 760px, and 390px, with no horizontal page overflow.

Automated browser runs use Chromium's `--disable-audio-output` test option: the real WAV files are decoded and their media timelines advance, while the OS audio stream is replaced by a test stream. This avoids host audio-device interruptions in headless runs; it does not change the app. [Chromium's description of the test option](https://chromium.googlesource.com/chromium/src/+/f29eb01290cd36a30177ecf8197f906c01088a0d). Set `E2E_REAL_AUDIO=1` to use physical audio output when verifying on a suitable device.

The interface and playback update is checked with fifteen unit tests, seventeen browser tests, a type check, and a production build. Desktop, tablet, and mobile screenshots are included for visual review.

Before submission, run the type check, production build, unit tests, and browser tests, then inspect desktop and mobile layouts. Browser tests verify decoded audio playback and time advancement; a final human listening check on the submitting device is recommended for speaker volume and subjective sound quality.

## Assets and credits

See [ASSETS.md](ASSETS.md). All audio and playlist artwork are generated locally from original source, bundled in the repository, and offered under CC0. No Spotify account or Spotify API is used. Google Fonts are an optional network enhancement with system-font fallbacks.

See the [hands-on Spotify comparison and implementation notes](docs/spotify-uiux-comparison.md).

Screenshots: [library sidebar](docs/library-sidebar.png), [expanded library](docs/library-expanded.png), [Home filters on tablet](docs/home-filters-760.png), [expanded player](docs/expanded-1440.png), [compact expanded player](docs/expanded-760.png), [search suggestions](docs/search-suggestions.png), [search results](docs/search-results.png), [desktop home](docs/home-1440.png), [tablet home](docs/home-1024.png), [mobile home](docs/home-390.png), [desktop Now Playing](docs/now-playing-desktop.png), [tablet Now Playing](docs/now-playing-1024.png), [mobile Now Playing](docs/now-playing-390.png), [desktop profile menu](docs/profile-menu-1440.png), [mobile profile menu](docs/profile-menu-390.png).

## Challenge submission checklist

- [x] Recognizable, structured homepage recreation
- [x] Complete browse → playlist → track → playback flow
- [x] Searchable data view
- [x] Responsive layouts, tests, setup guide, asset credits, and demo steps
- [ ] Review and publish the code to a public GitHub repository
- [ ] Email its link to `saniagup@usc.edu`, `avshah@usc.edu`, and `kakolla@usc.edu`
- [ ] Use subject `[NAME] - ProductSC Dev Challenge`; deadline in the brief: Wednesday, September 16 at 12 PM (timezone unspecified)

This is an independent student assessment project, not an official Spotify product. Deployment, authentication, backend implementation, publication, and email submission are outside this implementation.
