import { describe, it, expect } from "vitest";
import { catalog } from "./data";
import {
  createQueue,
  setQueueShuffle,
  advanceIndex,
  upcomingIndices,
  nextRepeat,
  manualTransition,
  enqueueTrack,
  emptyQueue,
} from "./queue";
const source = {
  kind: "playlist" as const,
  id: "morning",
  label: "A softer morning",
};
describe("playback queue", () => {
  it("keeps the active song while shuffling, and restores original order", async () => {
    const tracks = (await catalog.getPlaylist("morning"))!.tracks;
    const base = createQueue(tracks, 1, source, false);
    const mixed = setQueueShuffle(base, true, () => 0);
    expect(mixed.order[0]).toMatchObject(tracks[1]);
    expect(new Set(mixed.order.map((t) => t.id)).size).toBe(3);
    expect(base.order.map((t) => t.id)).toEqual(tracks.map((t) => t.id));
    const restored = setQueueShuffle(mixed, false);
    expect(restored.order.map((t) => t.id)).toEqual(tracks.map((t) => t.id));
    expect(restored.index).toBe(1);
    expect(restored.source).toEqual(source);
  });
  it("starts a shuffled collection at the selected song", async () => {
    const tracks = (await catalog.listTracks()).slice(0, 3);
    const q = createQueue(tracks, 2, source, true, () => 0);
    expect(q.order[0]).toMatchObject(tracks[2]);
    expect(q.index).toBe(0);
  });
  it("distinguishes automatic repeat modes from manual navigation", () => {
    expect(advanceIndex(2, 3, "queue", true)).toBe(0);
    expect(advanceIndex(2, 3, "off", true)).toBeNull();
    expect(advanceIndex(1, 3, "off", true)).toBe(2);
    expect(advanceIndex(1, 3, "song", true)).toBe(1);
    for (const mode of ["queue", "song", "off"] as const) {
      expect(advanceIndex(2, 3, mode)).toBe(0);
      expect(advanceIndex(0, 3, mode, false, -1)).toBe(2);
      expect(advanceIndex(0, 1, mode)).toBe(0);
      expect(advanceIndex(0, 0, mode)).toBeNull();
    }
  });
  it("shows the upcoming order including repeat boundaries", async () => {
    const q = createQueue(
      (await catalog.getPlaylist("morning"))!.tracks,
      1,
      source,
      false,
    );
    expect(upcomingIndices(q, "queue")).toEqual([2, 0, 1]);
    expect(upcomingIndices(q, "song")).toEqual([2, 0, 1]);
    expect(upcomingIndices(q, "off")).toEqual([2]);
    expect(nextRepeat("queue")).toBe("song");
    expect(nextRepeat("song")).toBe("off");
    expect(nextRepeat("off")).toBe("queue");
  });
});

it("manual skipping exits repeat one and Previous restarts after three seconds", async () => {
  const q = createQueue(
    (await catalog.listTracks()).slice(0, 3),
    1,
    source,
    false,
  );
  expect(manualTransition(q, "song", 1, 10)).toEqual({
    index: 2,
    repeat: "queue",
    restart: false,
  });
  expect(manualTransition(q, "song", -1, 3.01)).toEqual({
    index: 1,
    repeat: "song",
    restart: true,
  });
  expect(manualTransition(q, "song", -1, 3)).toEqual({
    index: 0,
    repeat: "queue",
    restart: false,
  });
  expect(manualTransition(emptyQueue, "song", 1, 0).index).toBeNull();
});
it("queues additions in order and preserves duplicate entries through shuffle", async () => {
  const tracks = (await catalog.listTracks()).slice(0, 3);
  let q = createQueue(tracks, 0, source, false);
  q = enqueueTrack(q, tracks[2], "added-1");
  q = enqueueTrack(q, tracks[2], "added-2");
  expect(q.order.map((t) => t.id)).toEqual([
    tracks[0].id,
    tracks[2].id,
    tracks[2].id,
    tracks[1].id,
    tracks[2].id,
  ]);
  q = { ...q, index: 2 };
  q = setQueueShuffle(q, true, () => 0);
  expect(q.order[0].entryId).toBe("added-2");
  expect(q.order).toHaveLength(5);
  q = setQueueShuffle(q, false);
  expect(q.index).toBe(2);
  expect(enqueueTrack(emptyQueue, tracks[0], "first").order).toHaveLength(1);
});
