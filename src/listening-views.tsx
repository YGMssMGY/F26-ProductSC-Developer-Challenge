import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Music2,
  ListMusic,
  ArrowUpRight,
  Play,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { usePlayer, Transport, Volume, time } from "./player";
import { useView } from "./view-state";
import { upcomingIndices } from "./queue";
import { TrackMenu } from "./track-menu";
export function AutoOpenPlayer() {
  const p = usePlayer();
  const view = useView();
  const opened = useRef(false);
  useEffect(() => {
    if (p.track && !opened.current) {
      opened.current = true;
      if (view.desktop) view.setPanel("now-playing");
    }
  }, [p.track, view.desktop, view.setPanel]);
  return null;
}
function EmptyPlayer() {
  return (
    <div className="state">
      <Music2 size={32} />
      <h2>Choose a song to get started.</h2>
      <p>Your music and its story will appear here.</p>
      <Link className="pill" to="/">
        Find something to play
      </Link>
    </div>
  );
}
export function QueueView({ panel = false }: { panel?: boolean }) {
  const p = usePlayer();
  if (!p.track) return <EmptyPlayer />;
  const upcoming = upcomingIndices(p.queue, p.repeat);
  return (
    <div className={panel ? "queue-content" : "standard-page queue-page"}>
      {!panel && <h1>Queue</h1>}
      <h3 className="queue-section-label">Now playing</h3>
      <div className="queue-item current">
        <img src={p.track.artwork} alt="" />
        <div>
          <strong>{p.track.title}</strong>
          <span>{p.track.artist}</span>
        </div>
        <TrackMenu track={p.track} />
      </div>
      <h3 className="queue-section-label">
        Next from <span>{p.queue.source?.label}</span>
      </h3>
      {upcoming.length ? (
        upcoming.map((index, i) => {
          const t = p.queue.order[index];
          return (
            <div className="queue-entry" key={`${index}-${i}`}>
              <button
                className="queue-item"
                aria-label={`Play queued ${t.title}`}
                onClick={() => p.select(index)}
              >
                <img src={t.artwork} alt="" />
                <div>
                  <strong>{t.title}</strong>
                  <span>{t.artist}</span>
                </div>
                <Play size={15} />
              </button>
              <TrackMenu track={t} />
            </div>
          );
        })
      ) : (
        <p className="muted">You’ve reached the end of this queue.</p>
      )}
      <p className="queue-note">
        {p.repeat === "queue"
          ? "The queue repeats when it reaches the end."
          : p.repeat === "song"
            ? "The current song is on repeat."
            : "Playback stops after the last song."}
      </p>
    </div>
  );
}
export function NowPlayingView({ panel = false }: { panel?: boolean }) {
  const p = usePlayer();
  const view = useView();
  if (!p.track) return <EmptyPlayer />;
  const next = upcomingIndices(p.queue, p.repeat)[0];
  const t = p.track;
  return (
    <div
      className={
        panel ? "now-playing-content" : "standard-page full-now-playing"
      }
    >
      <Link className="collection-link" to={p.collectionUrl}>
        {p.queue.source?.label ?? "Your music"}
        <ArrowUpRight size={15} />
      </Link>
      <img className="now-art" src={t.artwork} alt={`${t.title} artwork`} />
      <div className="now-track-header">
        <div>
          <Link to={p.releaseUrl}>
            <h1>{t.title}</h1>
          </Link>
          <Link className="now-artist" to={`/artist/${t.artistId}`}>
            {t.artist}
          </Link>
        </div>
        <TrackMenu track={t} />
      </div>
      {!panel && (
        <div className="full-player-controls">
          <Transport expanded />
          <Volume label="Now Playing volume" />
          <div className="view-links">
            <Link to="/lyrics">Lyrics</Link>
            <Link to="/queue">
              <ListMusic size={16} />
              Queue
            </Link>
          </div>
        </div>
      )}
      <section className="info-card">
        <h2>About this track</h2>
        <p>{t.description}</p>
        <span>{time(t.duration)} · Original instrumental</span>
      </section>
      <section className="info-card">
        <div className="info-card-heading">
          <h2>Lyrics</h2>
          <Link to="/lyrics">Show view</Link>
        </div>
        <p>
          {t.lyrics
            ? "Open the lyrics view to read along."
            : "This is an instrumental track. There are no lyrics to display."}
        </p>
      </section>
      {next !== undefined && (
        <section className="info-card">
          <div className="info-card-heading">
            <h2>Next in queue</h2>
            <button onClick={() => view.openView("queue")}>Open queue</button>
          </div>
          <button
            className="queue-item"
            aria-label={`Play next ${p.queue.order[next].title}`}
            onClick={() => p.select(next)}
          >
            <img src={p.queue.order[next].artwork} alt="" />
            <div>
              <strong>{p.queue.order[next].title}</strong>
              <span>{p.queue.order[next].artist}</span>
            </div>
          </button>
        </section>
      )}
    </div>
  );
}
export function ListeningPanel() {
  const v = useView();
  if (!v.desktop || !v.panel) return null;
  return (
    <aside
      className="listening-panel"
      aria-label={v.panel === "queue" ? "Play queue" : "Now Playing panel"}
      inert={v.expanded || v.libraryExpanded}
    >
      <div className="panel-heading">
        <h2>{v.panel === "queue" ? "Queue" : "Now Playing"}</h2>
        {v.panel === "now-playing" && (
          <button
            title="Expand Now Playing"
            aria-label="Expand Now Playing"
            onClick={v.expand}
          >
            <Maximize2 size={18} />
          </button>
        )}
        <button
          title="Close panel"
          aria-label="Close panel"
          onClick={() => v.setPanel(null)}
        >
          <X size={21} />
        </button>
      </div>
      {v.panel === "queue" ? <QueueView panel /> : <NowPlayingView panel />}
    </aside>
  );
}
export function LyricsPage() {
  const p = usePlayer();
  if (!p.track) return <EmptyPlayer />;
  return (
    <div className="lyrics-page">
      <p className="eyebrow">LYRICS</p>
      <h1>{p.track.title}</h1>
      <p className="now-artist">{p.track.artist}</p>
      {p.track.lyrics ? (
        <p className="lyric-lines">{p.track.lyrics}</p>
      ) : (
        <div className="lyrics-empty">
          <Music2 size={40} />
          <h2>Just the music.</h2>
          <p>This is an instrumental track. There are no lyrics to display.</p>
        </div>
      )}
    </div>
  );
}

export function ExpandedPlayer() {
  const view = useView();
  const p = usePlayer();
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!view.expanded) return;
    close.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        view.minimize();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [view.expanded]);
  if (!view.expanded) return null;
  return (
    <section className="expanded-player" aria-label="Expanded Now Playing">
      <div className="expanded-heading">
        <Link to={p.collectionUrl}>
          {p.queue.source?.label ?? "Now Playing"}
        </Link>
        <button
          ref={close}
          onClick={view.minimize}
          aria-label="Minimize Now Playing"
          title="Minimize Now Playing (Escape)"
        >
          <Minimize2 size={22} />
        </button>
      </div>
      <NowPlayingView panel />
    </section>
  );
}
