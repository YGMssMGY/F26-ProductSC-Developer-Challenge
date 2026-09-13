import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Music2,
} from "lucide-react";
import type { Track } from "./data";
import { queueIndex } from "./data";
type PlayerState = {
  track?: Track;
  playing: boolean;
  start: (tracks: Track[], index: number) => void;
  toggle: () => void;
};
const Context = createContext<PlayerState>({
  playing: false,
  start: () => {},
  toggle: () => {},
});
export const usePlayer = () => useContext(Context);
export const time = (n: number) =>
  `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
function initialVolume() {
  try {
    const raw = localStorage.getItem("listening-room.volume");
    const n = raw === null ? 0.7 : Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.7;
  } catch {
    return 0.7;
  }
}
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);
  const track = queue[index];
  const play = () => {
    setError("");
    audio.current?.play().catch((reason: unknown) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError"))
        setError("Audio could not play. Try again.");
    });
  };
  const start = (tracks: Track[], i: number) => {
    if (!tracks[i]) return;
    setQueue(tracks);
    setIndex(i);
    setRequest((n) => n + 1);
  };
  useEffect(() => {
    if (!track || !audio.current) return;
    setPosition(0);
    setDuration(0);
    audio.current.src = track.audioUrl;
    audio.current.load();
    play();
  }, [track, request]);
  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
    try {
      localStorage.setItem("listening-room.volume", String(volume));
    } catch {}
  }, [volume]);
  const toggle = () => {
    if (!track) return;
    if (audio.current?.paused) play();
    else audio.current?.pause();
  };
  const move = (direction: number) => {
    const next = queueIndex(index, direction, queue.length);
    if (next !== null) setIndex(next);
  };
  return (
    <Context.Provider value={{ track, playing, start, toggle }}>
      {children}
      <audio
        ref={audio}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setPosition(audio.current?.currentTime ?? 0)}
        onDurationChange={() => {
          const n = audio.current?.duration ?? 0;
          setDuration(Number.isFinite(n) ? n : 0);
        }}
        onEnded={() => {
          setPlaying(false);
          move(1);
        }}
        onError={() => setError("This audio could not be loaded. Try again.")}
      />
      <footer className="player" aria-label="Music player">
        <div className="now-playing">
          {track ? (
            <img src={track.artwork} alt="" />
          ) : (
            <div className="empty-cover">
              <Music2 size={24} />
            </div>
          )}
          <div>
            <strong>{track?.title ?? "Find your next favorite"}</strong>
            <span>
              {track?.artist ?? "Pick a track. Make yourself at home."}
            </span>
          </div>
          {playing && (
            <span className="equalizer" aria-label="Playing">
              <i />
              <i />
              <i />
            </span>
          )}
        </div>
        <div className="transport">
          <div className="transport-buttons">
            <button
              aria-label="Previous track"
              disabled={!track || index === 0}
              onClick={() => move(-1)}
            >
              <SkipBack size={19} fill="currentColor" />
            </button>
            <button
              className="play-circle"
              aria-label={playing ? "Pause" : "Play"}
              disabled={!track}
              onClick={toggle}
            >
              {playing ? (
                <Pause size={19} fill="currentColor" />
              ) : (
                <Play size={19} fill="currentColor" />
              )}
            </button>
            <button
              aria-label="Next track"
              disabled={!track || index === queue.length - 1}
              onClick={() => move(1)}
            >
              <SkipForward size={19} fill="currentColor" />
            </button>
          </div>
          <div className="timeline">
            <span>{time(position)}</span>
            <input
              aria-label="Seek"
              type="range"
              min="0"
              max={duration || 32}
              step="0.1"
              value={position}
              disabled={!track || !duration}
              onChange={(e) => {
                if (audio.current)
                  audio.current.currentTime = Number(e.target.value);
                setPosition(Number(e.target.value));
              }}
            />
            <span>{time(duration)}</span>
          </div>
        </div>
        <div className="volume">
          <Volume2 size={19} />
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <span className="audio-quality">ORIGINAL AUDIO</span>
        </div>
        {error && (
          <div className="audio-error" role="alert">
            {error}
            <button
              onClick={() => {
                audio.current?.load();
                play();
              }}
            >
              Retry playback
            </button>
          </div>
        )}
      </footer>
    </Context.Provider>
  );
}
