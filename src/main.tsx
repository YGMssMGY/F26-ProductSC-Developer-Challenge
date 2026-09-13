import React, { useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Search,
  Home,
  Library as LibraryIcon,
  ArrowUpRight,
  Play,
  Pause,
  Plus,
  Check,
  Clock3,
  ArrowLeft,
  Music2,
  Disc3,
} from "lucide-react";
import { catalog } from "./data";
import type { Playlist, Track } from "./data";
import { LibraryProvider, useAsync, useLibrary } from "./hooks";
import { PlayerProvider, usePlayer, time } from "./player";
import "./styles.css";
function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Spotify home">
      <svg viewBox="0 0 24 24" width="33" height="33" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="currentColor" />
        <g fill="none" stroke="#090909" strokeLinecap="round">
          <path d="M5 9c5-2 10-1 14 1" strokeWidth="2" />
          <path d="M6 12.5c4-1.5 8-1 12 1" strokeWidth="1.7" />
          <path d="M7 16c3-1 6-1 10 .7" strokeWidth="1.5" />
        </g>
      </svg>
      <span>
        Spotify<span className="brand-dot">®</span>
      </span>
    </Link>
  );
}
function State({
  error,
  retry,
  children,
}: {
  error?: boolean;
  retry?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="state" role={error ? "alert" : "status"}>
      <Disc3 size={32} />
      <h2>
        {error
          ? "Something went quiet"
          : children
            ? "Nothing here yet"
            : "Finding your next favorite…"}
      </h2>
      {error ? (
        <>
          <p>We couldn’t load this view.</p>
          <button className="pill" onClick={retry}>
            Try again
          </button>
        </>
      ) : (
        children
      )}
    </div>
  );
}
function Save({ playlist }: { playlist: Playlist }) {
  const { saved, toggle } = useLibrary();
  const on = saved.includes(playlist.id);
  return (
    <button
      className={`save-button ${on ? "saved" : ""}`}
      aria-label={`${on ? "Remove" : "Save"} ${playlist.title}${on ? " from library" : " to library"}`}
      aria-pressed={on}
      onClick={() => toggle(playlist.id)}
    >
      {on ? <Check size={23} /> : <Plus size={23} />}
    </button>
  );
}
function Card({ playlist }: { playlist: Playlist }) {
  return (
    <article className="playlist-card">
      <Link
        to={`/playlist/${playlist.id}`}
        aria-label={`Open ${playlist.title}`}
      >
        <div className="cover-wrap">
          <img src={playlist.artwork} alt={`${playlist.title} cover`} />
          <span className="card-play">
            <Play size={21} fill="currentColor" />
          </span>
        </div>
        <h3>{playlist.title}</h3>
        <p>{playlist.description}</p>
      </Link>
    </article>
  );
}
function Cards({ playlists }: { playlists: Playlist[] }) {
  return (
    <div className="cards">
      {playlists.map((p) => (
        <Card key={p.id} playlist={p} />
      ))}
    </div>
  );
}
function TrackList({ tracks }: { tracks: Track[] }) {
  const { start, track, playing, toggle } = usePlayer();
  return (
    <div className="track-table">
      <div className="track-head">
        <span>#</span>
        <span>Title</span>
        <span className="album-label">Artist</span>
        <Clock3 size={16} aria-label="Duration" />
      </div>
      {tracks.map((t, i) => (
        <div
          className={`track-row ${track?.id === t.id ? "current" : ""}`}
          key={t.id}
        >
          <button
            className="track-select"
            aria-label={`${track?.id === t.id && playing ? "Pause" : "Play"} ${t.title}`}
            onClick={() => (track?.id === t.id ? toggle() : start(tracks, i))}
          >
            <span className="track-number">
              {track?.id === t.id && playing ? <Music2 size={17} /> : i + 1}
            </span>
            <span className="row-play">
              {track?.id === t.id && playing ? (
                <Pause size={16} />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
            </span>
          </button>
          <button
            className="track-title"
            onClick={() => (track?.id === t.id ? toggle() : start(tracks, i))}
            aria-label={`Listen to ${t.title}`}
          >
            <img src={t.artwork} alt="" />
            <span>
              <strong>{t.title}</strong>
              <small>
                Original instrumental{" "}
                <span className="mobile-artist">· {t.artist}</span>
              </small>
            </span>
          </button>
          <span className="artist-name">{t.artist}</span>
          <span className="duration">{time(t.duration)}</span>
        </div>
      ))}
    </div>
  );
}
function Sidebar() {
  const { data } = useAsync(useCallback(() => catalog.listPlaylists(), []));
  const { saved } = useLibrary();
  return (
    <aside className="sidebar">
      <div className="library-heading">
        <LibraryIcon size={21} />
        <span>Your Library</span>
        <Link to="/library" aria-label="Open your library">
          <ArrowUpRight size={19} />
        </Link>
      </div>
      <div className="library-chip">Playlists</div>
      {saved.length === 0 ? (
        <div className="library-empty">
          <div className="library-art">
            <Music2 size={25} />
          </div>
          <h3>A little space for your favorites</h3>
          <p>Save a playlist and keep your kind of music close.</p>
          <Link className="pill" to="/library">
            Explore your library
          </Link>
        </div>
      ) : (
        <div className="saved-list">
          {data
            ?.filter((p) => saved.includes(p.id))
            .map((p) => (
              <Link key={p.id} to={`/playlist/${p.id}`}>
                <img src={p.artwork} alt="" />
                <div>
                  <strong>{p.title}</strong>
                  <span>Playlist · Listening room</span>
                </div>
              </Link>
            ))}
        </div>
      )}
      <div className="sidebar-bottom">
        <span className="green-dot" /> YOUR LISTENING ROOM
        <p>
          A familiar feeling.
          <br />A fresh collection of sounds.
        </p>
        <span className="demo-label">Independent student project</span>
      </div>
    </aside>
  );
}
function Header() {
  const [params] = useSearchParams();
  return (
    <header className="topbar">
      <Brand />
      <nav aria-label="Main navigation">
        <NavLink to="/" end className="home-nav" aria-label="Home">
          <Home size={23} />
        </NavLink>
        <Link
          className="searchbar"
          to={`/search?q=${encodeURIComponent(params.get("q") ?? "")}`}
          aria-label="Search music"
        >
          <Search size={22} />
          <span className="search-link">What do you want to play?</span>
          <span className="search-shortcut">
            <Disc3 size={20} />
          </span>
        </Link>
      </nav>
      <div className="profile-area">
        <span className="guest-label">Made for your everyday</span>
        <div className="avatar" aria-label="Guest profile">
          G
        </div>
      </div>
    </header>
  );
}
function HomePage() {
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.listPlaylists(), []),
  );
  if (!data) return <State error={error} retry={retry} />;
  return (
    <div className="home-page">
      <div className="filter-chips">
        <span className="active">All</span>
        <Link to="/search">Music</Link>
        <Link to="/library">Your playlists</Link>
      </div>
      <div className="page-greeting">
        <div>
          <p className="eyebrow">A SOUNDTRACK FOR RIGHT NOW</p>
          <h1>Make yourself at home.</h1>
        </div>
        <span className="edition">
          THE DAILY EDIT <span>01 — 04</span>
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-badge">
            <span /> THE LISTENING ROOM
          </span>
          <h2>
            A softer
            <br />
            start.
          </h2>
          <p>
            Slow down. Tune in.
            <br />
            Let the morning find its rhythm.
          </p>
          <Link className="hero-cta" to="/playlist/morning">
            <Play size={18} fill="currentColor" />
            Find your morning
          </Link>
          <span className="hero-footnote">
            WARM KEYS &nbsp; / &nbsp; UNHURRIED BEATS
          </span>
        </div>
        <div className="hero-art">
          <img
            src="/art/morning-scene.svg"
            alt="Warm terracotta abstract sun and soft rolling shapes"
          />
        </div>
        <span className="hero-index">VOL. 001</span>
      </section>
      <section className="playlist-section">
        <div className="section-heading">
          <div>
            <h2>A mood for every moment</h2>
            <p>Four little worlds. Find the one that feels like you.</p>
          </div>
          <Link to="/search">
            Explore all <ArrowUpRight size={15} />
          </Link>
        </div>
        <Cards playlists={data} />
      </section>
      <div className="home-note">
        <span>
          <Disc3 size={18} /> Good music. No rush.
        </span>
        <p>Original sounds, curated for this little corner of your day.</p>
      </div>
    </div>
  );
}
function PlaylistPage() {
  const { id = "" } = useParams();
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.getPlaylist(id), [id]),
  );
  const { start, track, playing, toggle } = usePlayer();
  if (data === undefined) return <State error={error} retry={retry} />;
  if (data === null)
    return (
      <State>
        <p>This playlist doesn’t exist.</p>
        <Link className="pill" to="/">
          Back to home
        </Link>
      </State>
    );
  const { playlist: p, tracks } = data;
  const active = tracks.some((t) => t.id === track?.id) && playing;
  return (
    <div className="playlist-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={17} /> Back to your music
      </Link>
      <section
        className="playlist-hero"
        style={{ background: `linear-gradient(135deg,${p.color},#202020)` }}
      >
        <img src={p.artwork} alt={`${p.title} cover`} />
        <div>
          <p className="eyebrow">CURATED PLAYLIST</p>
          <h1>{p.title}</h1>
          <p>{p.description}</p>
          <div className="playlist-meta">
            <span className="mini-logo">●</span>
            <strong>Listening room</strong>
            <span>
              · {tracks.length} songs,{" "}
              {time(tracks.reduce((n, t) => n + t.duration, 0))}
            </span>
          </div>
        </div>
      </section>
      <div className="playlist-actions">
        <button
          className="big-play"
          aria-label={active ? "Pause playlist" : "Play playlist"}
          onClick={() => (active ? toggle() : start(tracks, 0))}
        >
          {active ? (
            <Pause fill="currentColor" />
          ) : (
            <Play fill="currentColor" />
          )}
        </button>
        <Save playlist={p} />
        <span>Made for a moment like this.</span>
      </div>
      <TrackList tracks={tracks} />
      <p className="credit-note">
        Original instrumental miniatures · CC0 audio · 2026
        <br />
        Created for the Listening Room collection.
      </p>
    </div>
  );
}
function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.search(q), [q]),
  );
  return (
    <div className="standard-page">
      <p className="eyebrow">FOLLOW YOUR CURIOSITY</p>
      <h1>Find your next favorite.</h1>
      <div className="page-search">
        <Search size={22} />
        <input
          aria-label="Search tracks, artists, and playlists"
          placeholder="Tracks, artists, or playlists"
          value={q}
          onChange={(e) =>
            setParams(e.target.value ? { q: e.target.value } : {}, {
              replace: true,
            })
          }
        />
        {q && <button onClick={() => setParams({})}>Clear</button>}
      </div>
      {!data ? (
        <State error={error} retry={retry} />
      ) : data.tracks.length + data.playlists.length === 0 ? (
        <State>
          <p>No results for “{q}”. Try “morning” or “Paloma”.</p>
          <button className="pill" onClick={() => setParams({})}>
            Clear search
          </button>
        </State>
      ) : (
        <>
          {data.playlists.length > 0 && (
            <section>
              <h2>{q ? "Playlists" : "Browse all playlists"}</h2>
              <Cards playlists={data.playlists} />
            </section>
          )}
          {data.tracks.length > 0 && (
            <section className="search-tracks">
              <h2>{q ? "Songs" : "All songs"}</h2>
              <TrackList tracks={data.tracks} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
function LibraryPage() {
  const { saved, error: libraryError } = useLibrary();
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.listPlaylists(), []),
  );
  if (!data) return <State error={error} retry={retry} />;
  const selected = data.filter((p) => saved.includes(p.id));
  return (
    <div className="standard-page">
      <p className="eyebrow">YOUR OWN LITTLE COLLECTION</p>
      <h1>Your library.</h1>
      <p className="subtitle">The sounds you come back to.</p>
      {libraryError && <p role="alert">{libraryError}</p>}
      {selected.length ? (
        <Cards playlists={selected} />
      ) : (
        <div className="empty-library-main">
          <LibraryIcon size={35} />
          <h2>Your favorites belong here.</h2>
          <p>Open a playlist and tap + to make it part of your collection.</p>
        </div>
      )}
      <section className="library-discover">
        <h2>Find something to keep</h2>
        <Cards playlists={data.filter((p) => !saved.includes(p.id))} />
      </section>
    </div>
  );
}
function App() {
  return (
    <BrowserRouter>
      <LibraryProvider>
        <PlayerProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Header />
          <div className="workspace">
            <Sidebar />
            <main id="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/playlist/:id" element={<PlaylistPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route
                  path="*"
                  element={
                    <State>
                      <p>This page doesn’t exist.</p>
                      <Link to="/">Back to home</Link>
                    </State>
                  }
                />
              </Routes>
            </main>
          </div>
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <NavLink to="/" end>
              <Home size={21} />
              Home
            </NavLink>
            <NavLink to="/search">
              <Search size={21} />
              Search
            </NavLink>
            <NavLink to="/library">
              <LibraryIcon size={21} />
              Library
            </NavLink>
          </nav>
        </PlayerProvider>
      </LibraryProvider>
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
