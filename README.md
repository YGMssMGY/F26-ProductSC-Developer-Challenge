# The Listening Room

A Spotify-inspired music app built for the **F26 ProductSC Developer Challenge**. Browse four playlists, search twelve original instrumental tracks, and keep listening as you explore.

**[Live demo](https://ygmssmgy.github.io/F26-ProductSC-Developer-Challenge/)**

![Desktop preview](docs/home-1440.png)

## Features

- Home filters, search suggestions, and grouped search results.
- Playlist, release, artist, and song-detail pages.
- Persistent player with seeking, volume, shuffle, repeat, and queue controls.
- Expandable Now Playing and library views.
- Saved playlists, listening history, and preferences stored locally.
- Responsive layouts and keyboard-accessible controls.

**Try it:** Open _A softer morning_ → play _First Light_ → browse while listening → save the playlist → find it in Your Library.

## Run locally

Requires **Node.js 22+ and npm**. No account, API key, or backend is needed.

Clone or download this repository, then open its folder in Terminal on Mac or PowerShell on Windows:

```sh
npm install
npm run dev
```

Open the local address printed in the terminal. Press **Ctrl+C** to stop the server; run `npm run dev` to restart it. On Mac, use Control, not Command. If PowerShell blocks `npm.ps1`, use `npm.cmd` instead of `npm`.

The repository also supports pnpm 11: `pnpm install --frozen-lockfile` uses the committed lockfile, followed by `pnpm dev`.

## Tech and structure

Built with **React, TypeScript, Vite, React Router, custom CSS, and Lucide icons**.

| File                                          | Responsibility                            |
| --------------------------------------------- | ----------------------------------------- |
| `src/main.tsx`                                | App layout, routes, and main screens      |
| `src/data.ts` / `src/hooks.tsx`               | Catalog, data loading, and saved library  |
| `src/player.tsx` / `src/queue.ts`             | Shared audio player and playback rules    |
| `src/sidebar.tsx` / `src/listening-views.tsx` | Library and listening views               |
| `src/styles.css`                              | Styling and responsive layouts            |
| `public/`                                     | Audio, artwork, and favicons              |
| `tests/`                                      | Browser interaction and deployment checks |

One audio element stays mounted across navigation. Catalog and library access use asynchronous interfaces, allowing a future backend to replace the bundled data and local-storage adapters.

## Tests and builds

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Vitest checks catalog and queue logic. Playwright checks playback, navigation, search, persistence, keyboard controls, and responsive layouts. Automated audio checks verify decoding and playback progress; speaker output should also be checked manually.

Use `npm run preview` to preview the standard production build.

## GitHub Pages

In the repository, select **Settings → Pages → Source → GitHub Actions**. Push changes to `main` to run the deployment workflow, which tests, builds, and publishes the app.

To verify the Pages build locally:

```sh
npm run build:pages
npm run test:e2e:pages
npm run preview:pages
```

Open `http://127.0.0.1:4173/F26-ProductSC-Developer-Challenge/` when using the default preview port. The Pages build uses hash routes so direct links and refreshes work. If the repository is renamed, update the base path in `vite.config.ts` and the Pages tests.

## Credits and scope

The catalog contains fictional artists and twelve original 32-second instrumental tracks. Audio, artwork, and favicons are included under CC0; see [asset credits](ASSETS.md) for details and third-party licenses.

This is an independent student project, not an official Spotify product. It uses no Spotify API, authentication, or backend. Tracks are instrumental, so no lyrics are supplied.

[UI/UX comparison notes](docs/spotify-uiux-comparison.md) · [Mobile preview](docs/home-390.png) · [Now Playing preview](docs/expanded-1440.png)
