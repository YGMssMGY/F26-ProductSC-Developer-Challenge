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
  it("resolves song descriptions, instrumental lyrics, and the owning playlist queue", async () => {
    const all = await catalog.search("");
    for (const track of all.tracks) {
      const detail = await catalog.getTrack(track.id);
      expect(detail?.track).toEqual(track);
      expect(detail?.track.description.trim().length).toBeGreaterThan(0);
      expect(detail?.track.lyrics).toBeNull();
      expect(detail?.playlist.trackIds).toContain(track.id);
      expect(detail?.tracks.map((item) => item.id)).toEqual(
        detail?.playlist.trackIds,
      );
    }
    expect(await catalog.getTrack("missing")).toBeNull();
  });
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
  it("advances in both directions and wraps at either end", () => {
    expect(queueIndex(0, -1, 3)).toBe(2);
    expect(queueIndex(0, 1, 3)).toBe(1);
    expect(queueIndex(1, -1, 3)).toBe(0);
    expect(queueIndex(2, 1, 3)).toBe(0);
  });
  it("reuses a single track and leaves an empty queue unavailable", () => {
    expect(queueIndex(0, 1, 1)).toBe(0);
    expect(queueIndex(0, -1, 1)).toBe(0);
    expect(queueIndex(0, 1, 0)).toBeNull();
    expect(queueIndex(0, -1, 0)).toBeNull();
  });
});

it("resolves each song to a distinct release domain", async () => {
  for (const t of await catalog.listTracks()) {
    const release = await catalog.getRelease(t.releaseId);
    expect(release?.playlist.artistId).toBe(t.artistId);
    expect(release?.tracks.map((song) => song.id)).toContain(t.id);
    expect(await catalog.getPlaylist(t.releaseId)).toBeNull();
  }
  expect(await catalog.getRelease("missing")).toBeNull();
});
