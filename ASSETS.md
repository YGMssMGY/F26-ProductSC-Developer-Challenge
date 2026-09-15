# Asset provenance

## Original music and playlist artwork

The twelve WAV recordings in `public/audio/` and the SVG artwork in `public/art/` were generated specifically for this project by `scripts/generate_assets.py`. They use original procedural arrangements and geometric illustrations; no third-party recordings, melodies, artwork, or sampled sounds were copied.

To the extent copyright applies, these original audio and artwork assets are dedicated to the public domain under **CC0 1.0 Universal**: https://creativecommons.org/publicdomain/zero/1.0/ . This dedication does not cover Spotify branding, third-party fonts, icons, or dependencies.

| Playlist         | Track files                           | Titles                                  | Fictional artist    |
| ---------------- | ------------------------------------- | --------------------------------------- | ------------------- |
| A softer morning | `morning-1.wav` – `morning-3.wav`     | First Light; Slow Bloom; Sunday Windows | The Daylight Studio |
| Midnight drive   | `midnight-1.wav` – `midnight-3.wav`   | After Hours; Neon Rain; Last Train Home | Night School        |
| Deep focus       | `focus-1.wav` – `focus-3.wav`         | Weightless; Still Water; Soft Focus     | Soft Signals        |
| Good days ahead  | `good-days-1.wav` – `good-days-3.wav` | Golden Hour; Coastline; Long Way Home   | Paloma              |

Every track is a unique 32-second, 22,050 Hz, mono, 16-bit PCM WAV. Each combines synthesized keys, bass, and an arpeggio; selected collections include synthesized percussion. The generator uses seeded randomness for reproducibility. Artwork uses hand-authored SVG shapes and procedural texture. `morning-scene.svg` is the text-free hero variation of the morning cover.

Regeneration is optional; all assets are committed. To regenerate, install NumPy in your Python environment and run `python3 scripts/generate_assets.py`.

## Third-party identity and UI resources

- **Spotify name / recognizable mark:** used solely to identify the product being recreated for the assessment. The header mark is a small independently drawn SVG approximation. Spotify owns its trademarks; they are not included in the CC0 dedication. Brief reference: https://newsroom.spotify.com/media-kit/logo-and-brand-assets/
- **Lucide React icons:** ISC license, installed through the package manager. Source: https://lucide.dev/ . License included in the package.
- **DM Sans and Manrope:** optional fonts delivered through Google Fonts, licensed under the SIL Open Font License. Sources: https://fonts.google.com/specimen/DM+Sans and https://fonts.google.com/specimen/Manrope . System sans-serif fonts are used if the network is unavailable.

No proprietary application source code or scraped artwork is included.

## Favicon

`public/favicon.svg` is an original geometric headphones icon drawn for The Listening Room, using a green tile and dark headphones. It is dedicated to CC0 1.0 Universal alongside the original project artwork. It does not use Spotify’s logo.
