export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  artwork: string;
  audioUrl: string;
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
  getPlaylist(
    id: string,
  ): Promise<{ playlist: Playlist; tracks: Track[] } | null>;
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
const tracks: Track[] = names.flatMap((group, i) =>
  group.map((title, j) => ({
    id: `${ids[i]}-${j + 1}`,
    title,
    artist: artists[i],
    duration: 32,
    artwork: `/art/${ids[i]}.svg`,
    audioUrl: `/audio/${ids[i]}-${j + 1}.wav`,
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
export const catalog: Catalog = {
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
  const next = index + direction;
  return next >= 0 && next < length ? next : null;
}
