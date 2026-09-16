import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  PanelRight,
  Mic2,
} from "lucide-react";
import { SaveTrack } from "./save-track";
import { catalog } from "./data";
import type { Track, Playlist } from "./data";
import {
  advanceIndex,
  createQueue,
  emptyQueue,
  nextRepeat,
  setQueueShuffle,
  manualTransition,
  enqueueTrack,
} from "./queue";
import type { PlaybackSource, PlaybackQueue, RepeatMode } from "./queue";
import { useView } from "./view-state";
export const time = (n: number) =>
  `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
function readPreference<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => value is T,
): T {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(`listening-room.${key}`) ?? "null",
    );
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(`listening-room.${key}`, JSON.stringify(value));
  } catch {
    /* The current session stays usable. */
  }
}
type PlayerState = {
  track?: Track;
  playing: boolean;
  queue: PlaybackQueue;
  repeat: RepeatMode;
  shuffle: boolean;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  error: string;
  collectionUrl: string;
  releaseUrl: string;
  recentIds: string[];
  addToQueue: (track: Track) => void;
  notice: string;
  start: (tracks: Track[], index: number, source?: PlaybackSource) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  select: (index: number) => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setShuffle: (enabled: boolean) => void;
  setRepeat: (mode: RepeatMode) => void;
  retry: () => void;
  playPlaylist: (
    playlist: Playlist,
    kind?: "playlist" | "release",
  ) => Promise<void>;
};
const Context = createContext<PlayerState | null>(null);
export function usePlayer() {
  const value = useContext(Context);
  if (!value) throw new Error("PlayerProvider is missing");
  return value;
}
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = useState(emptyQueue);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, updateVolume] = useState(() =>
    readPreference(
      "volume",
      0.7,
      (v): v is number => typeof v === "number" && v >= 0 && v <= 1,
    ),
  );
  const [muted, setMuted] = useState(false);
  const [shuffle, updateShuffle] = useState(() =>
    readPreference(
      "shuffle",
      false,
      (v): v is boolean => typeof v === "boolean",
    ),
  );
  const [repeat, setRepeat] = useState<RepeatMode>(() =>
    readPreference(
      "repeat",
      "queue" as RepeatMode,
      (v): v is RepeatMode => v === "queue" || v === "song" || v === "off",
    ),
  );
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);
  const [ownerId, setOwnerId] = useState("");
  const [notice, setNotice] = useState("");
  const [recentIds, setRecentIds] = useState(() =>
    readPreference(
      "recents",
      [] as string[],
      (v): v is string[] =>
        Array.isArray(v) && v.every((id) => typeof id === "string"),
    ),
  );
  const autoplayRequest = useRef(true);
  const playlistRequest = useRef(0);
  const track = queue.order[queue.index];
  const play = () => {
    setError("");
    audio.current?.play().catch((reason: unknown) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError"))
        setError("Audio could not play. Try again.");
    });
  };
  const start = (
    tracks: Track[],
    index: number,
    source: PlaybackSource = {
      kind: "catalog",
      id: "all",
      label: "Songs to try",
    },
  ) => {
    if (!tracks[index]) return;
    autoplayRequest.current = true;
    playlistRequest.current++;
    setQueue(createQueue(tracks, index, source, shuffle));
    setRequest((n) => n + 1);
  };
  const toggle = () => {
    if (!track) return;
    if (audio.current?.paused) play();
    else audio.current?.pause();
  };
  const select = (index: number) => {
    if (!queue.order[index]) return;
    autoplayRequest.current = true;
    playlistRequest.current++;
    setQueue((q) => ({ ...q, index }));
    setRequest((n) => n + 1);
  };
  const move = (direction = 1, automatic = false) => {
    if (!automatic) {
      const result = manualTransition(
        queue,
        repeat,
        direction,
        audio.current?.currentTime ?? position,
      );
      if (result.index === null) return;
      setRepeat(result.repeat);
      if (result.restart && audio.current) {
        audio.current.currentTime = 0;
        setPosition(0);
      } else select(result.index);
      return;
    }
    const index = advanceIndex(
      queue.index,
      queue.order.length,
      repeat,
      automatic,
      direction,
    );
    if (index !== null) select(index);
  };
  useEffect(() => {
    if (!track || !audio.current) return;
    setPosition(0);
    setDuration(0);
    audio.current.src = track.audioUrl;
    audio.current.load();
    if (autoplayRequest.current) play();
  }, [track?.audioUrl, request]);
  useEffect(() => {
    let active = true;
    setOwnerId("");
    if (track)
      catalog
        .getTrack(track.id)
        .then((detail) => {
          if (active) setOwnerId(detail?.playlist.id ?? "");
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [track?.id]);
  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
      audio.current.muted = muted;
    }
    persist("volume", volume);
  }, [volume, muted]);
  useEffect(() => persist("shuffle", shuffle), [shuffle]);
  useEffect(() => persist("repeat", repeat), [repeat]);
  useEffect(() => persist("recents", recentIds), [recentIds]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const setShuffle = (enabled: boolean) => {
    updateShuffle(enabled);
    setQueue((q) => setQueueShuffle(q, enabled));
  };
  const setVolume = (value: number) => {
    updateVolume(Math.min(1, Math.max(0, value)));
    if (value > 0) setMuted(false);
  };
  const seek = (value: number) => {
    if (audio.current && duration) {
      audio.current.currentTime = Math.max(0, Math.min(duration, value));
      setPosition(audio.current.currentTime);
    }
  };
  const playPlaylist = async (
    playlist: Playlist,
    kind: "playlist" | "release" = "playlist",
  ) => {
    if (queue.source?.kind === kind && queue.source.id === playlist.id) {
      toggle();
      return;
    }
    const version = ++playlistRequest.current;
    try {
      const data = await (kind === "release"
        ? catalog.getRelease(playlist.id)
        : catalog.getPlaylist(playlist.id));
      if (version !== playlistRequest.current) return;
      if (!data?.tracks.length) {
        setError("This playlist has no playable songs.");
        return;
      }
      start(data.tracks, 0, {
        kind,
        id: playlist.id,
        label: playlist.title,
      });
    } catch {
      setError("Could not load this playlist. Please try again.");
    }
  };
  const playlistId =
    queue.source?.kind === "playlist" ? queue.source.id : ownerId;
  const collectionUrl =
    track && queue.source?.kind === "liked"
      ? "/collection/tracks"
      : track && queue.source?.kind === "search"
        ? `/search?q=${encodeURIComponent(queue.source.id)}`
        : track && queue.source?.kind === "catalog"
          ? "/search"
          : track && queue.source?.kind === "release"
            ? `/release/${queue.source.id}?track=${track.id}`
            : track && queue.source?.kind === "artist"
              ? `/artist/${queue.source.id}`
              : track && playlistId
                ? `/playlist/${playlistId}?track=${track.id}`
                : track
                  ? `/track/${track.id}`
                  : "/";
  const value: PlayerState = {
    track,
    playing,
    queue,
    repeat,
    shuffle,
    position,
    duration,
    volume,
    muted,
    error,
    collectionUrl,
    releaseUrl: track ? `/release/${track.releaseId}?track=${track.id}` : "/",
    recentIds,
    notice,
    addToQueue: (item) => {
      if (!track) autoplayRequest.current = false;
      setQueue((q) => enqueueTrack(q, item, crypto.randomUUID()));
      setNotice(`Added ${item.title} to queue`);
    },
    start,
    toggle,
    next: () => move(1),
    previous: () => move(-1),
    select,
    seek,
    setVolume,
    toggleMute: () => setMuted((v) => !v),
    setShuffle,
    setRepeat,
    retry: () => {
      audio.current?.load();
      play();
    },
    playPlaylist,
  };
  return (
    <Context.Provider value={value}>
      {children}
      <audio
        ref={audio}
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          if (track)
            setRecentIds((ids) =>
              [track.id, ...ids.filter((id) => id !== track.id)].slice(0, 30),
            );
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setPosition(audio.current?.currentTime ?? 0)}
        onDurationChange={() => {
          const n = audio.current?.duration ?? 0;
          setDuration(Number.isFinite(n) ? n : 0);
        }}
        onEnded={() => {
          setPlaying(false);
          move(1, true);
        }}
        onError={() => setError("This audio could not be loaded. Try again.")}
      />
    </Context.Provider>
  );
}
export function Transport({ expanded = false }: { expanded?: boolean }) {
  const p = usePlayer();
  const repeatAction =
    p.repeat === "off"
      ? "Enable repeat queue"
      : p.repeat === "queue"
        ? "Enable repeat one"
        : "Disable repeat";
  return (
    <div className={`transport ${expanded ? "expanded-transport" : ""}`}>
      <div className="transport-buttons">
        <button
          className={`secondary-transport ${p.shuffle ? "is-active" : ""}`}
          title={p.shuffle ? "Disable shuffle" : "Enable shuffle"}
          aria-label={p.shuffle ? "Disable shuffle" : "Enable shuffle"}
          aria-pressed={p.shuffle}
          onClick={() => p.setShuffle(!p.shuffle)}
        >
          <Shuffle size={18} />
        </button>
        <button
          title="Previous track"
          aria-label="Previous track"
          disabled={!p.track}
          onClick={p.previous}
        >
          <SkipBack size={18} fill="currentColor" />
        </button>
        <button
          className="play-circle"
          title={p.playing ? "Pause" : "Play"}
          aria-label={p.playing ? "Pause" : "Play"}
          disabled={!p.track}
          onClick={p.toggle}
        >
          {p.playing ? (
            <Pause size={19} fill="currentColor" />
          ) : (
            <Play size={19} fill="currentColor" />
          )}
        </button>
        <button
          title="Next track"
          aria-label="Next track"
          disabled={!p.track}
          onClick={p.next}
        >
          <SkipForward size={18} fill="currentColor" />
        </button>
        <button
          className={`secondary-transport ${p.repeat !== "off" ? "is-active" : ""}`}
          title={repeatAction}
          aria-label={`Repeat: ${p.repeat}`}
          aria-description={repeatAction}
          aria-pressed={p.repeat !== "off"}
          data-tooltip={repeatAction}
          onClick={() => p.setRepeat(nextRepeat(p.repeat))}
        >
          {p.repeat === "song" ? <Repeat1 size={18} /> : <Repeat size={18} />}
        </button>
      </div>
      <div className="timeline">
        <span>{time(p.position)}</span>
        <input
          aria-label="Seek"
          type="range"
          min="0"
          max={p.duration || 32}
          step=".1"
          value={p.position}
          disabled={!p.track || !p.duration}
          onChange={(e) => p.seek(Number(e.target.value))}
        />
        <span>{time(p.duration)}</span>
      </div>
    </div>
  );
}
export function Volume({ label = "Volume" }: { label?: string }) {
  const p = usePlayer();
  return (
    <div className="volume">
      <button
        title={p.muted ? "Unmute" : "Mute"}
        aria-label={p.muted ? "Unmute" : "Mute"}
        onClick={p.toggleMute}
      >
        {p.muted || p.volume === 0 ? (
          <VolumeX size={19} />
        ) : (
          <Volume2 size={19} />
        )}
      </button>
      <input
        aria-label={label}
        type="range"
        min="0"
        max="1"
        step=".01"
        value={p.muted ? 0 : p.volume}
        onChange={(e) => p.setVolume(Number(e.target.value))}
      />
    </div>
  );
}
export function PlayerBar() {
  const p = usePlayer();
  const view = useView();
  return (
    <footer className="player" aria-label="Music player">
      <div className="now-playing">
        {p.track ? (
          <>
            <button
              className="player-artwork"
              onClick={() => view.openView("now-playing")}
              aria-label="Open now playing"
              title="Now Playing"
            >
              <img src={p.track.artwork} alt="" />
            </button>
            <div className="player-track-text">
              <Link
                to={p.releaseUrl}
                aria-label={`Open release for ${p.track.title}`}
              >
                <strong>{p.track.title}</strong>
              </Link>
              <Link
                className="player-artist"
                to={`/artist/${p.track.artistId}`}
              >
                <span>{p.track.artist}</span>
              </Link>
            </div>
            <SaveTrack track={p.track} />
          </>
        ) : (
          <>
            <div className="empty-cover">
              <Music2 size={24} />
            </div>
            <div>
              <strong>Choose something to play</strong>
              <span>Your next favorite is waiting.</span>
            </div>
          </>
        )}
      </div>
      <Transport />
      <div className="player-tools">
        <button
          title="Now Playing view"
          aria-label="Now Playing view"
          aria-pressed={view.panel === "now-playing" && view.desktop}
          className={
            view.panel === "now-playing" && view.desktop ? "is-active" : ""
          }
          onClick={() => view.openView("now-playing")}
        >
          <PanelRight size={18} />
        </button>
        <Link title="Lyrics" aria-label="Lyrics" to="/lyrics">
          <Mic2 size={18} />
        </Link>
        <button
          title="Queue"
          aria-label="Queue"
          aria-pressed={view.panel === "queue" && view.desktop}
          className={view.panel === "queue" && view.desktop ? "is-active" : ""}
          onClick={() => view.openView("queue")}
        >
          <ListMusic size={19} />
        </button>
        <Volume />
      </div>
      {p.error && (
        <div className="audio-error" role="alert">
          {p.error}
          <button onClick={p.retry}>Retry playback</button>
        </div>
      )}
      {p.notice && (
        <div role="status" className="player-notice">
          {p.notice}
        </div>
      )}
    </footer>
  );
}
