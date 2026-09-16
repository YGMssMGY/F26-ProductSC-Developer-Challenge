import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  ListPlus,
  Disc3,
  UserRound,
  Info,
  Heart,
} from "lucide-react";
import type { Track } from "./data";
import { useLibrary } from "./hooks";
import { usePlayer } from "./player";
export function TrackMenu({ track }: { track: Track }) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const player = usePlayer();
  const { liked, toggleTrack } = useLibrary();
  const saved = liked.includes(track.id);
  const close = (focus = true) => {
    setPosition(null);
    if (focus) trigger.current?.focus();
  };
  useEffect(() => {
    if (!position) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (e: MouseEvent) => {
      if (
        !menu.current?.contains(e.target as Node) &&
        !trigger.current?.contains(e.target as Node)
      )
        close(false);
    };
    const dismiss = () => close(false);
    document.addEventListener("click", outside);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("click", outside);
      window.removeEventListener("resize", dismiss);
    };
  }, [position]);
  return (
    <>
      <button
        className="track-menu-trigger"
        ref={trigger}
        aria-label={`More options for ${track.title}`}
        title={`More options for ${track.title}`}
        aria-haspopup="menu"
        aria-expanded={!!position}
        onClick={() => {
          if (position) {
            close();
            return;
          }
          const r = trigger.current!.getBoundingClientRect();
          setPosition({
            left: Math.max(8, Math.min(r.right - 228, window.innerWidth - 236)),
            top: Math.max(8, Math.min(r.bottom + 6, window.innerHeight - 270)),
          });
        }}
      >
        <MoreHorizontal size={20} />
      </button>
      {position &&
        createPortal(
          <div
            ref={menu}
            className="track-menu"
            role="menu"
            aria-label={`Song actions for ${track.title}`}
            style={position}
            onKeyDown={(e) => {
              const items = Array.from(
                menu.current?.querySelectorAll<HTMLElement>(
                  '[role="menuitem"]',
                ) ?? [],
              );
              const index = items.indexOf(
                document.activeElement as HTMLElement,
              );
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                close();
              } else if (
                ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)
              ) {
                e.preventDefault();
                items[
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? items.length - 1
                      : (index +
                          (e.key === "ArrowDown" ? 1 : -1) +
                          items.length) %
                        items.length
                ]?.focus();
              } else if (e.key === "Tab") close(false);
            }}
          >
            <button
              role="menuitem"
              onClick={() => {
                player.addToQueue(track);
                close();
              }}
            >
              <ListPlus size={17} />
              Add to queue
            </button>
            <button
              role="menuitem"
              onClick={() => {
                toggleTrack(track.id);
                close();
              }}
            >
              <Heart size={17} fill={saved ? "currentColor" : "none"} />
              {saved ? "Remove from Liked Songs" : "Save to Liked Songs"}
            </button>
            <Link
              role="menuitem"
              to={`/release/${track.releaseId}?track=${track.id}`}
              onClick={() => close()}
            >
              <Disc3 size={17} />
              Go to release
            </Link>
            <Link
              role="menuitem"
              to={`/artist/${track.artistId}`}
              onClick={() => close()}
            >
              <UserRound size={17} />
              Go to artist
            </Link>
            <Link
              role="menuitem"
              to={`/track/${track.id}#credits`}
              onClick={() => close()}
            >
              <Info size={17} />
              View details and credits
            </Link>
          </div>,
          document.body,
        )}
    </>
  );
}
