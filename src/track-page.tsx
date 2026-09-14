import { useCallback, useLayoutEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Disc3,
  Music2,
  Pause,
  Play,
  Repeat2,
} from "lucide-react";
import { catalog } from "./data";
import { useAsync } from "./hooks";
import { time, usePlayer } from "./player";

export function TrackPage({ live = false }: { live?: boolean }) {
  const { id } = useParams();
  const player = usePlayer();
  const location = useLocation();
  const trackId = live ? player.track?.id : id;
  const { data, error, retry } = useAsync(
    useCallback(
      () => (trackId ? catalog.getTrack(trackId) : Promise.resolve(null)),
      [trackId],
    ),
  );

  useLayoutEffect(() => {
    if (data && location.hash === "#credits")
      document.getElementById("credits")?.scrollIntoView({ block: "start" });
  }, [data, location.key, location.hash]);

  if (live && !trackId)
    return (
      <div className="state">
        <Music2 size={32} />
        <h1>Choose a song to get started.</h1>
        <p>Your music, its story, and lyrics will appear here.</p>
        <Link className="pill" to="/">
          Find something to play
        </Link>
      </div>
    );
  if (error)
    return (
      <div className="state" role="alert">
        <Disc3 size={32} />
        <h2>We couldn’t load this song.</h2>
        <button className="pill" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (data === undefined)
    return (
      <div className="state" role="status">
        Loading song details…
      </div>
    );
  if (!data)
    return (
      <div className="state">
        <Music2 size={32} />
        <h1>This song doesn’t exist.</h1>
        <Link className="pill" to="/">
          Back to home
        </Link>
      </div>
    );

  const { track, playlist, tracks } = data;
  const isCurrent = player.track?.id === track.id;
  const isPlaying = isCurrent && player.playing;
  function playTrack() {
    if (isCurrent) player.toggle();
    else
      player.start(
        tracks,
        tracks.findIndex((item) => item.id === track.id),
        { kind: "playlist", id: playlist.id, label: playlist.title },
      );
  }

  return (
    <div className="song-page">
      <Link className="back-link" to={`/playlist/${playlist.id}`}>
        <ArrowLeft size={17} />
        Back to {playlist.title}
      </Link>
      <section
        className="song-hero"
        style={{
          background: `linear-gradient(135deg, ${playlist.color}, #202020)`,
        }}
      >
        <img
          className="song-artwork"
          src={track.artwork}
          alt={`${track.title} artwork`}
        />
        <div className="song-intro">
          <p className="eyebrow">{live ? "NOW PLAYING" : "BEHIND THE MUSIC"}</p>
          <h1>{track.title}</h1>
          <Link className="song-artist" to={`/artist/${track.artistId}`}>
            {track.artist}
          </Link>
          <p className="song-meta">
            Original instrumental <span>·</span> 2026 <span>·</span>{" "}
            {time(track.duration)}
          </p>
          <button
            className="song-play-button"
            aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title}`}
            onClick={playTrack}
          >
            {isPlaying ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" />
            )}
            {isPlaying ? "Pause song" : "Play song"}
          </button>
          {isCurrent && (
            <span className="song-status">
              <Repeat2 size={14} />
              {isPlaying ? "Playing" : "Paused"} · Repeat: {player.repeat}
            </span>
          )}
        </div>
      </section>
      <div className="song-details" id="credits">
        <section className="song-about">
          <p className="eyebrow">THE STORY IN THE SOUND</p>
          <h2>About this track</h2>
          <p>{track.description}</p>
          <dl>
            <div>
              <dt>Artist</dt>
              <dd>{track.artist}</dd>
            </div>
            <div>
              <dt>Source playlist</dt>
              <dd>
                <Link to={`/playlist/${playlist.id}`}>
                  {playlist.title} <ArrowUpRight size={14} />
                </Link>
              </dd>
            </div>
            <div>
              <dt>Release</dt>
              <dd>
                <Link to={`/release/${track.releaseId}`}>
                  Explore this release <ArrowUpRight size={14} />
                </Link>
              </dd>
            </div>
            <div>
              <dt>Audio</dt>
              <dd>Original composition · CC0</dd>
            </div>
          </dl>
        </section>
        <section className="song-lyrics">
          <div className="lyrics-heading">
            <h2>Lyrics</h2>
            <Music2 size={22} />
          </div>
          {track.lyrics ? (
            <p className="lyric-lines">{track.lyrics}</p>
          ) : (
            <>
              <span className="instrumental-label">JUST THE MUSIC</span>
              <h3>
                Let the melody
                <br />
                do the talking.
              </h3>
              <p>
                This is an instrumental track. There are no lyrics to display.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
