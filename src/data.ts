export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  artwork: string;
  audioUrl: string;
  description: string;
  lyrics: string | null;
  releaseId: string;
  artistId: string;
}
export interface Release extends Playlist {
  artist: string;
  artistId: string;
  year: number;
}
export interface Playlist {
  id: string;
  title: string;
  description: string;
  artwork: string;
  color: string;
  tag: string;
  trackIds: string[];
}
export interface Catalog {
  listPlaylists(): Promise<Playlist[]>;
  listTracks(): Promise<Track[]>;
  getRelease(
    id: string,
  ): Promise<{ playlist: Release; tracks: Track[] } | null>;
  getPlaylist(
    id: string,
  ): Promise<{ playlist: Playlist; tracks: Track[] } | null>;
  getTrack(id: string): Promise<{
    track: Track;
    playlist: Playlist;
    tracks: Track[];
  } | null>;
  search(query: string): Promise<{ playlists: Playlist[]; tracks: Track[] }>;
}
export interface Library {
  getSavedPlaylistIds(): Promise<string[]>;
  setSaved(id: string, saved: boolean): Promise<string[]>;
}
const names = [
  ["First Light", "Slow Bloom", "Sunday Windows"],
  ["After Hours", "Neon Rain", "Last Train Home"],
  ["Weightless", "Still Water", "Soft Focus"],
  ["Golden Hour", "Coastline", "Long Way Home"],
];
const artists = [
  "The Daylight Studio",
  "Night School",
  "Soft Signals",
  "Paloma",
];
const descriptions = [
  "Ease into the day. Warm keys, soft rhythms, and a little room to breathe.",
  "For city lights and the thoughts that keep you company.",
  "Less noise. More headspace. Find your flow in these quiet instrumentals.",
  "A little sunshine for wherever the road takes you.",
];
const titles = [
  "A softer morning",
  "Midnight drive",
  "Deep focus",
  "Good days ahead",
];
const ids = ["morning", "midnight", "focus", "good-days"];
const trackDescriptions = [
  [
    "Warm, gently layered keys welcome the day, with a soft bass pulse and bright notes drifting overhead. A small moment of calm before everything begins.",
    "An unhurried keyboard motif opens a little further with every phrase. Rounded bass and delicate percussion give this miniature its quietly hopeful rhythm.",
    "Light arpeggios fall across mellow chords like sunlight through an open window. Made for slow coffee, a good book, and nowhere you need to be.",
  ],
  [
    "Low keys and a steady pulse trace a path through the late-night city. Small melodic reflections float above the rhythm, leaving room for your thoughts.",
    "A shimmering keyboard pattern and hushed percussion catch the feeling of streetlights reflected on wet pavement. Let the repeating phrases carry you along.",
    "Soft bass anchors a wandering melody as the city settles down. A gentle, rhythmic companion for the final stretch of the journey home.",
  ],
  [
    "Spacious chords and a floating arpeggio create a light, open sound. With no percussion to interrupt it, the melody gives you space to settle into your work.",
    "Quiet keyboard layers ripple over a low, sustained foundation. An understated instrumental for clearing your head and finding a comfortable pace.",
    "A delicate sequence of notes moves through warm, slow-changing harmonies. Designed to sit gently in the background while you get lost in what matters.",
  ],
  [
    "Bright keys, an easy bass line, and a relaxed beat bring a little late-afternoon warmth. A sunny instrumental for making an ordinary moment feel good.",
    "A rolling arpeggio meets soft percussion and open, easygoing chords. Imagine the road beside the water, the windows down, and time to take the scenic route.",
    "An uplifting keyboard melody wanders over a familiar, steady groove. A little reminder that the journey can be just as enjoyable as arriving.",
  ],
];
const tracks: Track[] = names.flatMap((group, i) =>
  group.map((title, j) => ({
    id: `${ids[i]}-${j + 1}`,
    title,
    artist: artists[i],
    duration: 32,
    artwork: `/art/${ids[i]}.svg`,
    audioUrl: `/audio/${ids[i]}-${j + 1}.wav`,
    description: trackDescriptions[i][j],
    lyrics: null,
    releaseId: `${ids[i]}-sessions`,
    artistId: ids[i],
  })),
);
const playlists: Playlist[] = ids.map((id, i) => ({
  id,
  title: titles[i],
  description: descriptions[i],
  artwork: `/art/${id}.svg`,
  color: ["#806755", "#3c3766", "#426961", "#98633f"][i],
  tag: ["SLOW STARTS", "AFTER DARK", "IN THE ZONE", "FEEL-GOOD FINDS"][i],
  trackIds: tracks.slice(i * 3, i * 3 + 3).map((t) => t.id),
}));
const releases: Release[] = playlists.map((p, i) => ({
  ...p,
  id: `${p.id}-sessions`,
  title: [
    "Morning sketches",
    "After-hours sketches",
    "Quiet studies",
    "Sunlit sketches",
  ][i],
  artist: artists[i],
  artistId: ids[i],
  year: 2026,
}));
export const catalog: Catalog = {
  async getRelease(id) {
    const playlist = releases.find((r) => r.id === id);
    return playlist
      ? { playlist, tracks: tracks.filter((t) => t.releaseId === id) }
      : null;
  },
  async listTracks() {
    return tracks;
  },
  async listPlaylists() {
    return playlists;
  },
  async getPlaylist(id) {
    const playlist = playlists.find((p) => p.id === id);
    return playlist
      ? {
          playlist,
          tracks: playlist.trackIds.map((id) =>
            tracks.find((t) => t.id === id)!,
          ),
        }
      : null;
  },
  async getTrack(id) {
    const track = tracks.find((item) => item.id === id);
    const playlist = playlists.find((item) => item.trackIds.includes(id));
    if (!track || !playlist) return null;
    return {
      track,
      playlist,
      tracks: playlist.trackIds.map((trackId) =>
        tracks.find((item) => item.id === trackId)!,
      ),
    };
  },
  async search(query) {
    const q = query.trim().toLocaleLowerCase();
    return {
      playlists: playlists.filter(
        (p) => !q || p.title.toLocaleLowerCase().includes(q),
      ),
      tracks: tracks.filter(
        (t) => !q || `${t.title} ${t.artist}`.toLocaleLowerCase().includes(q),
      ),
    };
  },
};
export function createLibrary(
  storage?: Pick<Storage, "getItem" | "setItem">,
): Library {
  let saved: string[] = [];
  try {
    const value = JSON.parse(
      storage?.getItem("listening-room.library") ?? "[]",
    );
    if (Array.isArray(value))
      saved = value.filter(
        (id): id is string => typeof id === "string" && ids.includes(id),
      );
  } catch {
    /* Use session state if storage is unavailable. */
  }
  return {
    async getSavedPlaylistIds() {
      return [...saved];
    },
    async setSaved(id, on) {
      if (!ids.includes(id)) return [...saved];
      saved = on ? [...new Set([...saved, id])] : saved.filter((x) => x !== id);
      try {
        storage?.setItem("listening-room.library", JSON.stringify(saved));
      } catch {
        /* Keep session usable. */
      }
      return [...saved];
    },
  };
}
let storage: Storage | undefined;
try {
  storage = window.localStorage;
} catch {
  /* Private storage may be unavailable. */
}
export const library = createLibrary(storage);
export function queueIndex(index: number, direction: number, length: number) {
  if (length <= 0) return null;
  return (((index + direction) % length) + length) % length;
}
