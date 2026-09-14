import React, { useCallback, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import {
  Search,
  Home,
  Library as LibraryIcon,
  Play,
  Pause,
  Plus,
  Check,
  Clock3,
  ArrowLeft,
  Music2,
  Disc3,
  UserRound,
} from "lucide-react";
import { catalog } from "./data";
import type { Playlist, Track } from "./data";
import type { PlaybackSource } from "./queue";
import { LibraryProvider, useAsync, useLibrary } from "./hooks";
import { PlayerProvider, PlayerBar, usePlayer, time } from "./player";
import { TrackPage } from "./track-page";
import { ViewProvider, useView } from "./view-state";
import {
  AutoOpenPlayer,
  ExpandedPlayer,
  ListeningPanel,
  NowPlayingView,
  QueueView,
  LyricsPage,
} from "./listening-views";
import { ProfileMenu, SettingsPage } from "./profile-menu";
import { Sidebar } from "./sidebar";
import { HeaderSearch } from "./header-search";
import { TrackMenu } from "./track-menu";
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
          ? "Something went wrong"
          : children
            ? "Nothing here yet"
            : "Loading your music…"}
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
      title={on ? "Remove from library" : "Save to library"}
      aria-label={`${on ? "Remove" : "Save"} ${playlist.title}${on ? " from library" : " to library"}`}
      aria-pressed={on}
      onClick={() => toggle(playlist.id)}
    >
      {on ? <Check size={23} /> : <Plus size={23} />}
    </button>
  );
}
function PlaylistPlay({
  playlist,
  className = "card-play",
  kind = "playlist",
}: {
  playlist: Playlist;
  className?: string;
  kind?: "playlist" | "release";
}) {
  const p = usePlayer();
  const active =
    p.queue.source?.kind === kind &&
    p.queue.source.id === playlist.id &&
    p.playing;
  return (
    <button
      className={className}
      title={`${active ? "Pause" : "Play"} ${playlist.title}`}
      aria-label={`${active ? "Pause" : "Play"} ${playlist.title}`}
      onClick={() => void p.playPlaylist(playlist, kind)}
    >
      {active ? (
        <Pause size={21} fill="currentColor" />
      ) : (
        <Play size={21} fill="currentColor" />
      )}
    </button>
  );
}
function Card({ playlist }: { playlist: Playlist }) {
  return (
    <article className="playlist-card">
      <div className="cover-wrap">
        <Link
          to={`/playlist/${playlist.id}`}
          aria-label={`Open ${playlist.title}`}
        >
          <img src={playlist.artwork} alt={`${playlist.title} cover`} />
        </Link>
        <PlaylistPlay playlist={playlist} />
      </div>
      <Link to={`/playlist/${playlist.id}`}>
        <h3>{playlist.title}</h3>
      </Link>
      <p>{playlist.description}</p>
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
function SongCard({
  track,
  tracks,
  index,
}: {
  track: Track;
  tracks: Track[];
  index: number;
}) {
  const p = usePlayer();
  const active = p.track?.id === track.id && p.playing;
  return (
    <article className="playlist-card song-card">
      <div className="cover-wrap">
        <Link
          aria-label={`View ${track.title} details`}
          to={`/track/${track.id}`}
        >
          <img src={track.artwork} alt="" />
        </Link>
        <button
          className="card-play"
          aria-label={`${active ? "Pause" : "Play"} ${track.title}`}
          onClick={() =>
            p.track?.id === track.id
              ? p.toggle()
              : p.start(tracks, index, {
                  kind: "catalog",
                  id: "all",
                  label: "Songs to try",
                })
          }
        >
          {active ? (
            <Pause fill="currentColor" size={21} />
          ) : (
            <Play fill="currentColor" size={21} />
          )}
        </button>
      </div>
      <Link to={`/track/${track.id}`}>
        <h3>{track.title}</h3>
      </Link>
      <p>{track.artist}</p>
    </article>
  );
}
function TrackList({
  tracks,
  source,
  highlight,
}: {
  tracks: Track[];
  source: PlaybackSource;
  highlight?: string;
}) {
  const p = usePlayer();
  useLayoutEffect(() => {
    if (highlight)
      document
        .getElementById(`track-${highlight}`)
        ?.scrollIntoView({ block: "center" });
  }, [highlight, tracks]);
  return (
    <div className="track-table">
      <div className="track-head">
        <span>#</span>
        <span>Title</span>
        <span className="album-label">Artist</span>
        <Clock3 size={16} aria-label="Duration" />
        <span className="sr-only">Song actions</span>
      </div>
      {tracks.map((t, i) => (
        <div
          id={`track-${t.id}`}
          data-track-id={t.id}
          className={`track-row ${p.track?.id === t.id ? "current" : ""} ${highlight === t.id ? "highlighted" : ""}`}
          key={t.id}
        >
          <button
            className="track-select"
            aria-label={`${p.track?.id === t.id && p.playing ? "Pause" : "Play"} ${t.title}`}
            onClick={() =>
              p.track?.id === t.id ? p.toggle() : p.start(tracks, i, source)
            }
          >
            <span className="track-number">
              {p.track?.id === t.id && p.playing ? <Music2 size={16} /> : i + 1}
            </span>
            <span className="row-play">
              {p.track?.id === t.id && p.playing ? (
                <Pause size={16} />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
            </span>
          </button>
          <Link
            className="track-title"
            to={`/track/${t.id}`}
            aria-label={`View ${t.title} details`}
          >
            <img src={t.artwork} alt="" />
            <span>
              <strong>{t.title}</strong>
              <small>{t.artist}</small>
            </span>
          </Link>
          <Link className="artist-name" to={`/artist/${t.artistId}`}>
            {t.artist}
          </Link>
          <span className="duration">{time(t.duration)}</span>
          <TrackMenu track={t} />
        </div>
      ))}
    </div>
  );
}
function Header() {
  return (
    <header className="topbar">
      <Brand />
      <nav aria-label="Main navigation">
        <NavLink to="/" end className="home-nav" aria-label="Home">
          <Home size={24} />
        </NavLink>
        <HeaderSearch />
      </nav>
      <span className="guest-label">Your listening room</span>
      <ProfileMenu />
    </header>
  );
}
function HomePage() {
  const [params, setParams] = useSearchParams();
  const facet = params.get("facet");
  const filter = facet === "music" || facet === "playlists" ? facet : "all";
  const setFilter = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("facet");
    else next.set("facet", value);
    setParams(next, { preventScrollReset: true });
  };
  const { data, error, retry } = useAsync(
    useCallback(async () => {
      const [playlists, tracks] = await Promise.all([
        catalog.listPlaylists(),
        catalog.listTracks(),
      ]);
      return { playlists, tracks };
    }, []),
  );
  const { saved } = useLibrary();
  if (!data) return <State error={error} retry={retry} />;
  return (
    <div className="home-page">
      <div
        className="filter-chips home-filters"
        role="group"
        aria-label="Home filters"
      >
        {[
          ["all", "All"],
          ["music", "Music"],
          ["playlists", "Your playlists"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <h1 className="home-heading">
        {filter === "playlists"
          ? "Your playlists"
          : filter === "music"
            ? "Music for your day"
            : "Your daily soundtrack"}
      </h1>
      {filter !== "playlists" && (
        <>
          <div className="quick-picks">
            {data.playlists.map((p) => (
              <div className="quick-pick" key={p.id}>
                <Link to={`/playlist/${p.id}`}>
                  <img src={p.artwork} alt="" />
                  <strong>{p.title}</strong>
                </Link>
                <PlaylistPlay playlist={p} className="quick-play" />
              </div>
            ))}
          </div>
          <section className="playlist-section">
            <div className="section-heading">
              <h2>Songs to try</h2>
              <Link to="/search">Show all</Link>
            </div>
            <div className="song-scroll">
              {data.tracks.map((t, i) => (
                <SongCard key={t.id} track={t} tracks={data.tracks} index={i} />
              ))}
            </div>
          </section>
          <section className="playlist-section">
            <div className="section-heading">
              <h2>Made for your mood</h2>
              <Link to="/library">Show all</Link>
            </div>
            <Cards playlists={data.playlists} />
          </section>
        </>
      )}
      {filter !== "music" && saved.length > 0 && (
        <section className="playlist-section">
          <div className="section-heading">
            <h2>Your playlists</h2>
            <Link to="/library">Show all</Link>
          </div>
          <Cards
            playlists={data.playlists.filter((p) => saved.includes(p.id))}
          />
        </section>
      )}
      {filter === "playlists" && !saved.length && (
        <div className="home-library-empty">
          <LibraryIcon size={40} />
          <h2>Your favorites start here</h2>
          <p>Save a playlist and it will appear here and in Your Library.</p>
          <button className="pill" onClick={() => setFilter("all")}>
            Browse music
          </button>
        </div>
      )}
      <div className="home-note">
        The Listening Room · Original sounds for your everyday.
      </div>
    </div>
  );
}
function PlaylistPage({ release = false }: { release?: boolean }) {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { data, error, retry } = useAsync(
    useCallback(
      () => (release ? catalog.getRelease(id) : catalog.getPlaylist(id)),
      [id, release],
    ),
  );
  if (data === undefined) return <State error={error} retry={retry} />;
  if (!data)
    return (
      <State>
        <p>This {release ? "release" : "playlist"} doesn’t exist.</p>
        <Link className="pill" to="/">
          Back to home
        </Link>
      </State>
    );
  const { playlist: p, tracks } = data;
  return (
    <div className="playlist-page">
      <section
        className="playlist-hero"
        style={{ background: `linear-gradient(135deg,${p.color},#252525)` }}
      >
        <Link className="back-link" to="/" aria-label="Back to your music">
          <ArrowLeft size={22} />
        </Link>
        <img src={p.artwork} alt={`${p.title} cover`} />
        <div>
          <p className="eyebrow">{release ? "EP · 2026" : "Playlist"}</p>
          <h1>{p.title}</h1>
          <p>{p.description}</p>
          <div className="playlist-meta">
            <strong>
              {release && tracks[0] ? (
                <Link to={`/artist/${tracks[0].artistId}`}>
                  {tracks[0].artist}
                </Link>
              ) : (
                "Listening room"
              )}
            </strong>
            <span>
              · {tracks.length} songs,{" "}
              {time(tracks.reduce((n, t) => n + t.duration, 0))}
            </span>
          </div>
        </div>
      </section>
      <div className="playlist-body">
        <div className="playlist-actions">
          <PlaylistPlay
            playlist={p}
            className="big-play"
            kind={release ? "release" : "playlist"}
          />
          {!release && <Save playlist={p} />}
        </div>
        <TrackList
          tracks={tracks}
          source={{
            kind: release ? "release" : "playlist",
            id: p.id,
            label: p.title,
          }}
          highlight={params.get("track") ?? undefined}
        />
        <p className="credit-note">
          2026 · Original instrumental miniatures
          <br />
          Created for the Listening Room collection.
        </p>
      </div>
    </div>
  );
}
function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const filter = ["songs", "playlists"].includes(params.get("type") ?? "")
    ? params.get("type")!
    : "all";
  const player = usePlayer();
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.search(q), [q]),
  );
  return (
    <div className="standard-page">
      <div className="filter-chips search-filters" aria-label="Result type">
        {["all", "songs", "playlists"].map((type) => (
          <button
            key={type}
            className={filter === type ? "active" : ""}
            aria-pressed={filter === type}
            onClick={() => {
              const next = new URLSearchParams(params);
              if (type === "all") next.delete("type");
              else next.set("type", type);
              setParams(next, { replace: true });
            }}
          >
            {type[0].toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      <h1>{q ? "Search results" : "Browse all"}</h1>
      {!data ? (
        <State error={error} retry={retry} />
      ) : data.tracks.length + data.playlists.length === 0 ? (
        <State>
          <p>No results for “{q}”. Try “morning” or “Paloma”.</p>
          <button
            className="pill"
            onClick={() => setParams({}, { replace: true })}
          >
            Clear results
          </button>
        </State>
      ) : (
        <>
          {q && filter === "all" && data.tracks[0] && (
            <section className="top-result-section">
              <h2>Top result</h2>
              <div className="top-result">
                <Link
                  to={`/track/${data.tracks[0].id}`}
                  aria-label="Open top result"
                >
                  <img src={data.tracks[0].artwork} alt="" />
                  <span>
                    <strong>{data.tracks[0].title}</strong>
                    <small>Song · {data.tracks[0].artist}</small>
                  </span>
                </Link>
                <button
                  className="big-play"
                  aria-label="Play top result"
                  onClick={() =>
                    player.start(data.tracks, 0, {
                      kind: "search",
                      id: q.trim().toLowerCase(),
                      label: `Search: ${q}`,
                    })
                  }
                >
                  <Play size={23} fill="currentColor" />
                </button>
              </div>
            </section>
          )}
          {filter === "songs" && !data.tracks.length && (
            <p className="subtitle">
              No songs match this search. Try All or Playlists.
            </p>
          )}
          {filter === "playlists" && !data.playlists.length && (
            <p className="subtitle">
              No playlists match this search. Try All or Songs.
            </p>
          )}
          {filter !== "playlists" && data.tracks.length > 0 && (
            <section className="search-tracks">
              <h2>{q ? "Songs" : "All songs"}</h2>
              <TrackList
                tracks={data.tracks}
                source={{
                  kind: "search",
                  id: q.trim().toLowerCase(),
                  label: q ? `Search: ${q}` : "All songs",
                }}
              />
            </section>
          )}
          {filter !== "songs" && data.playlists.length > 0 && (
            <section>
              <h2>Playlists</h2>
              <Cards playlists={data.playlists} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
function LibraryPage({ profile = false }: { profile?: boolean }) {
  const { saved, error: libraryError } = useLibrary();
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.listPlaylists(), []),
  );
  if (!data) return <State error={error} retry={retry} />;
  const selected = data.filter((p) => saved.includes(p.id));
  return (
    <div className="standard-page">
      {profile ? (
        <div className="profile-hero">
          <div className="guest-portrait">
            <UserRound size={70} />
          </div>
          <div>
            <p>Profile</p>
            <h1>Guest</h1>
            <p>
              {selected.length} saved{" "}
              {selected.length === 1 ? "playlist" : "playlists"} · On this
              device
            </p>
          </div>
        </div>
      ) : (
        <>
          <h1>Your Library</h1>
          <p className="subtitle">Your playlists, all in one place.</p>
        </>
      )}
      {libraryError && <p role="alert">{libraryError}</p>}
      {profile && <h2 className="profile-section-title">Saved playlists</h2>}
      {selected.length ? (
        <Cards playlists={selected} />
      ) : (
        <div className="empty-library-main">
          <LibraryIcon size={35} />
          <h2>Your favorites belong here.</h2>
          <p>Open a playlist and tap + to save it to your collection.</p>
        </div>
      )}
      <section className="library-discover">
        <h2>Find something to keep</h2>
        <Cards playlists={data.filter((p) => !saved.includes(p.id))} />
      </section>
    </div>
  );
}
function RecentsPage() {
  const { recentIds } = usePlayer();
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.listTracks(), []),
  );
  if (!data) return <State error={error} retry={retry} />;
  const tracks = recentIds
    .map((id) => data.find((t) => t.id === id))
    .filter((t): t is Track => !!t);
  return (
    <div className="standard-page">
      <h1>Recently played</h1>
      <p className="subtitle">Pick up where you left off.</p>
      {tracks.length ? (
        <TrackList
          tracks={tracks}
          source={{ kind: "catalog", id: "recents", label: "Recently played" }}
        />
      ) : (
        <State>
          <p>Your listening history will appear here after you play a song.</p>
          <Link className="pill" to="/">
            Find something to play
          </Link>
        </State>
      )}
    </div>
  );
}
function ArtistPage() {
  const { id } = useParams();
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.listTracks(), []),
  );
  if (!data) return <State error={error} retry={retry} />;
  const tracks = data.filter((t) => t.artistId === id);
  if (!tracks.length)
    return (
      <State>
        <p>This artist doesn’t exist.</p>
        <Link to="/">Back to home</Link>
      </State>
    );
  return (
    <div className="standard-page artist-page">
      <div className="artist-hero">
        <img src={tracks[0].artwork} alt="" />
        <div>
          <p className="eyebrow">Artist</p>
          <h1>{tracks[0].artist}</h1>
          <p className="subtitle">
            Original instrumental miniatures · The Listening Room
          </p>
        </div>
      </div>
      <section>
        <h2>Songs</h2>
        <TrackList
          tracks={tracks}
          source={{ kind: "artist", id: id!, label: tracks[0].artist }}
        />
      </section>
      <section>
        <h2>Releases</h2>
        <Link className="pill" to={`/release/${tracks[0].releaseId}`}>
          Explore the release
        </Link>
      </section>
    </div>
  );
}
function RouteScrollReset() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const main = document.getElementById("main-content");
    if (main) main.scrollTop = 0;
  }, [pathname]);
  return null;
}
function Shell() {
  const v = useView();
  const location = useLocation();
  const fullPlayback = location.pathname === "/now-playing" && !v.expanded;
  useLayoutEffect(() => {
    if (v.expanded) v.minimize();
    if (v.libraryExpanded) v.setLibraryExpanded(false);
  }, [location.key]);
  return (
    <>
      <RouteScrollReset />
      <AutoOpenPlayer />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <div
        className={`workspace ${v.panel && v.desktop ? "with-panel" : ""} ${v.compactLibrary ? "compact-library" : ""}`}
      >
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          inert={v.expanded || v.libraryExpanded}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/release/:id" element={<PlaylistPage release />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/recents" element={<RecentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/track/:id" element={<TrackPage />} />
            <Route path="/now-playing" element={<NowPlayingView />} />
            <Route path="/queue" element={<QueueView />} />
            <Route path="/lyrics" element={<LyricsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/profile" element={<LibraryPage profile />} />
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
        <ListeningPanel />
        <ExpandedPlayer />
      </div>
      <div
        className={
          fullPlayback ? "bottom-player on-full-player" : "bottom-player"
        }
      >
        <PlayerBar />
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/" end>
          <Home size={22} />
          Home
        </NavLink>
        <NavLink to="/search">
          <Search size={22} />
          Search
        </NavLink>
        <NavLink to="/library">
          <LibraryIcon size={22} />
          Library
        </NavLink>
      </nav>
    </>
  );
}
function App() {
  return (
    <BrowserRouter>
      <LibraryProvider>
        <ViewProvider>
          <PlayerProvider>
            <Shell />
          </PlayerProvider>
        </ViewProvider>
      </LibraryProvider>
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
