import { CheckCircle2, PlusCircle, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { Track } from "./data";
import { useLibrary } from "./hooks";

export function SaveTrack({ track }: { track: Track }) {
  const { liked, toggleTrack } = useLibrary();
  const saved = liked.includes(track.id);
  const label = `${saved ? "Remove" : "Save"} ${track.title} ${saved ? "from" : "to"} Liked Songs`;
  return (
    <button
      className={`save-track ${saved ? "is-saved" : ""}`}
      aria-label={label}
      title={label}
      aria-pressed={saved}
      onClick={() => toggleTrack(track.id)}
    >
      {saved ? <CheckCircle2 size={20} /> : <PlusCircle size={20} />}
    </button>
  );
}
export function LikedSongsLink() {
  const { liked } = useLibrary();
  const location = useLocation();
  return (
    <div
      className={`library-entry liked-songs-entry ${location.pathname === "/collection/tracks" ? "selected" : ""}`}
    >
      <Link
        to="/collection/tracks"
        title="Liked Songs"
        aria-label={`Liked Songs, ${liked.length} ${liked.length === 1 ? "song" : "songs"}`}
        aria-current={
          location.pathname === "/collection/tracks" ? "page" : undefined
        }
      >
        <span className="liked-art" aria-hidden="true">
          <Heart size={24} fill="currentColor" />
        </span>
        <div>
          <strong>Liked Songs</strong>
          <span>
            {liked.length} {liked.length === 1 ? "song" : "songs"}
          </span>
        </div>
      </Link>
    </div>
  );
}
