import { describe, it, expect } from "vitest";
import { catalog, createLibrary, queueIndex } from "./data";
describe("catalog", () => {
  it("has twelve distinct playable tracks and four consistent playlists", async () => {
    const all = await catalog.search("");
    expect(all.tracks).toHaveLength(12);
    expect(all.playlists).toHaveLength(4);
    expect(new Set(all.tracks.map((t) => t.audioUrl)).size).toBe(12);
    for (const p of all.playlists) {
      const detail = await catalog.getPlaylist(p.id);
      expect(detail?.tracks.map((t) => t.id)).toEqual(p.trackIds);
    }
  });
  it("searches trimmed case-insensitive titles, artists, and playlist names", async () => {
    expect((await catalog.search("  PALOMA  ")).tracks).toHaveLength(3);
    expect((await catalog.search("first LIGHT")).tracks[0].title).toBe(
      "First Light",
    );
    expect((await catalog.search("morning")).playlists).toHaveLength(1);
    expect((await catalog.search("xxxxxx")).tracks).toHaveLength(0);
    expect((await catalog.search("   ")).tracks).toHaveLength(12);
  });
  it("returns null for a missing playlist", async () =>
    expect(await catalog.getPlaylist("missing")).toBeNull());
});
describe("library", () => {
  it("saves without duplicates, persists, and removes", async () => {
    let data: string | null = null;
    const store = {
      getItem: () => data,
      setItem: (_key: string, value: string) => {
        data = value;
      },
    };
    const first = createLibrary(store);
    await first.setSaved("morning", true);
    await first.setSaved("morning", true);
    expect(await createLibrary(store).getSavedPlaylistIds()).toEqual([
      "morning",
    ]);
    await first.setSaved("morning", false);
    expect(await createLibrary(store).getSavedPlaylistIds()).toEqual([]);
  });
  it("recovers from corrupt and unavailable storage", async () => {
    const corrupt = createLibrary({
      getItem: () => "{bad",
      setItem: () => {
        throw Error();
      },
    });
    expect(await corrupt.getSavedPlaylistIds()).toEqual([]);
    expect(await corrupt.setSaved("focus", true)).toEqual(["focus"]);
    expect(await corrupt.setSaved("invalid", true)).toEqual(["focus"]);
    const denied = createLibrary({
      getItem: () => {
        throw Error();
      },
      setItem: () => {
        throw Error();
      },
    });
    expect(await denied.setSaved("morning", true)).toEqual(["morning"]);
  });
});
describe("queue boundaries", () => {
  it("advances and stops at either end", () => {
    expect(queueIndex(0, -1, 3)).toBeNull();
    expect(queueIndex(0, 1, 3)).toBe(1);
    expect(queueIndex(1, -1, 3)).toBe(0);
    expect(queueIndex(2, 1, 3)).toBeNull();
  });
});
