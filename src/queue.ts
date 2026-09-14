import type { Track } from "./data";
export type RepeatMode = "queue" | "song" | "off";
export type PlaybackSource = {
  kind: "playlist" | "release" | "search" | "catalog" | "artist";
  id: string;
  label: string;
};
export type QueueTrack = Track & { entryId: string; addedByUser?: boolean };
export type PlaybackQueue = {
  original: QueueTrack[];
  order: QueueTrack[];
  index: number;
  source?: PlaybackSource;
};
export const emptyQueue: PlaybackQueue = { original: [], order: [], index: 0 };
export function shuffled<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function setQueueShuffle(
  queue: PlaybackQueue,
  enabled: boolean,
  random = Math.random,
): PlaybackQueue {
  const current = queue.order[queue.index];
  if (!current) return queue;
  const order = enabled
    ? [
        current,
        ...shuffled(
          queue.original.filter((t) => t.entryId !== current.entryId),
          random,
        ),
      ]
    : [...queue.original];
  return {
    ...queue,
    order,
    index: order.findIndex((t) => t.entryId === current.entryId),
  };
}
export function createQueue(
  tracks: Track[],
  index: number,
  source: PlaybackSource,
  shuffle: boolean,
  random = Math.random,
): PlaybackQueue {
  const entries = tracks.map((t, i) => ({
    ...t,
    entryId: `${source.kind}:${source.id}:${i}`,
  }));
  const queue = { original: [...entries], order: [...entries], index, source };
  return shuffle ? setQueueShuffle(queue, true, random) : queue;
}
export function advanceIndex(
  index: number,
  length: number,
  repeat: RepeatMode,
  automatic = false,
  direction = 1,
): number | null {
  if (!length) return null;
  if (automatic && repeat === "song") return index;
  if (automatic && repeat === "off" && index === length - 1) return null;
  return (((index + direction) % length) + length) % length;
}
export const nextRepeat = (mode: RepeatMode): RepeatMode =>
  mode === "queue" ? "song" : mode === "song" ? "off" : "queue";
export function upcomingIndices(
  queue: PlaybackQueue,
  repeat: RepeatMode,
): number[] {
  const { index, order } = queue;
  if (!order.length) return [];
  const remaining = Array.from(
    { length: order.length - index - 1 },
    (_, i) => index + i + 1,
  );
  return repeat === "off"
    ? remaining
    : [...remaining, ...Array.from({ length: index + 1 }, (_, i) => i)];
}

export const PREVIOUS_RESTART_SECONDS = 3;
export function manualTransition(
  queue: PlaybackQueue,
  repeat: RepeatMode,
  direction: number,
  position: number,
) {
  if (!queue.order.length) return { index: null, repeat, restart: false };
  if (direction === -1 && position > PREVIOUS_RESTART_SECONDS)
    return { index: queue.index, repeat, restart: true };
  return {
    index: advanceIndex(
      queue.index,
      queue.order.length,
      repeat,
      false,
      direction,
    ),
    repeat: repeat === "song" ? ("queue" as const) : repeat,
    restart: false,
  };
}
export function enqueueTrack(
  queue: PlaybackQueue,
  track: Track,
  entryId: string,
): PlaybackQueue {
  const entry = { ...track, entryId, addedByUser: true };
  if (!queue.order.length)
    return {
      original: [entry],
      order: [entry],
      index: 0,
      source: { kind: "catalog", id: "queue", label: "Your queue" },
    };
  const current = queue.order[queue.index];
  const insert = (items: QueueTrack[], currentIndex: number) => {
    let index = currentIndex + 1;
    while (items[index]?.addedByUser) index++;
    return [...items.slice(0, index), entry, ...items.slice(index)];
  };
  return {
    ...queue,
    order: insert(queue.order, queue.index),
    original: insert(
      queue.original,
      queue.original.findIndex((t) => t.entryId === current.entryId),
    ),
  };
}
