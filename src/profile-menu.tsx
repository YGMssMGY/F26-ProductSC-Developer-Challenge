import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { UserRound, Settings, Info, X, History } from "lucide-react";
import { usePlayer } from "./player";
import type { RepeatMode } from "./queue";
export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"about" | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const closeMenu = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, [open]);
  useEffect(() => {
    if (dialog) modal.current?.showModal();
  }, [dialog]);
  function menuKey(e: KeyboardEvent) {
    const items = Array.from(
      menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? items.length - 1
            : (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
              items.length;
      items[next]?.focus();
    } else if (e.key === "Tab") setOpen(false);
  }
  return (
    <div className="profile-area" ref={root}>
      <button
        ref={trigger}
        className="avatar"
        title="Guest profile"
        aria-label="Profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? closeMenu() : setOpen(true))}
      >
        G
      </button>
      {open && (
        <div
          className="profile-dropdown"
          role="menu"
          aria-label="Profile"
          ref={menu}
          onKeyDown={menuKey}
        >
          <div className="menu-identity">Listening as Guest</div>
          <Link role="menuitem" to="/profile" onClick={closeMenu}>
            <UserRound size={17} />
            Profile
          </Link>
          <Link role="menuitem" to="/recents" onClick={closeMenu}>
            <History size={17} />
            Recents
          </Link>
          <Link role="menuitem" to="/settings" onClick={closeMenu}>
            <Settings size={17} />
            Settings
          </Link>
          <div className="menu-divider" />
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setDialog("about");
            }}
          >
            <Info size={17} />
            About this demo
          </button>
        </div>
      )}
      {dialog && (
        <dialog
          className="profile-dialog"
          ref={modal}
          aria-labelledby="dialog-title"
          onKeyDown={(e) => {
            if (e.key !== "Tab") return;
            const controls = Array.from(
              e.currentTarget.querySelectorAll<HTMLElement>(
                "button, input, select, a[href]",
              ),
            );
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }}
          onClose={() => {
            setDialog(null);
            trigger.current?.focus();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              const r = e.currentTarget.getBoundingClientRect();
              if (
                e.clientX < r.left ||
                e.clientX > r.right ||
                e.clientY < r.top ||
                e.clientY > r.bottom
              )
                modal.current?.close();
            }
          }}
        >
          <div className="dialog-heading">
            <h2 id="dialog-title">About this demo</h2>
            <button
              autoFocus
              aria-label="Close dialog"
              onClick={() => modal.current?.close()}
            >
              <X size={22} />
            </button>
          </div>
          <div className="about-copy">
            <p>
              A Spotify-inspired student project for the ProductSC Developer
              Challenge.
            </p>
            <p>
              Explore four playlists and twelve original instrumental samples.
              Artwork and audio are original; saved playlists stay on this
              device.
            </p>
            <p>
              This is an independent demo. It is not connected to a Spotify
              account.
            </p>
          </div>
        </dialog>
      )}
    </div>
  );
}

export function SettingsPage() {
  const p = usePlayer();
  return (
    <div className="standard-page settings-page">
      <h1>Settings</h1>
      <p className="subtitle">
        Make yourself at home. Preferences stay on this device.
      </p>
      <section>
        <h2>Playback</h2>
        <label className="setting-row">
          <span>
            Volume<small>Adjust the listening volume.</small>
          </span>
          <input
            aria-label="Settings volume"
            type="range"
            min="0"
            max="1"
            step=".01"
            value={p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
          />
        </label>
        <label className="setting-row">
          <span>
            Shuffle<small>Mix the order of your current queue.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label="Settings shuffle"
            checked={p.shuffle}
            onChange={(e) => p.setShuffle(e.target.checked)}
          />
        </label>
        <label className="setting-row">
          <span>
            Repeat<small>Choose what happens when a song finishes.</small>
          </span>
          <select
            aria-label="Settings repeat"
            value={p.repeat}
            onChange={(e) => p.setRepeat(e.target.value as RepeatMode)}
          >
            <option value="queue">Repeat queue</option>
            <option value="song">Repeat one</option>
            <option value="off">Off</option>
          </select>
        </label>
        <p className="settings-note">
          Skipping to another song exits Repeat One. Previous restarts the
          current song after the first three seconds.
        </p>
      </section>
      <section>
        <h2>Your listening room</h2>
        <p className="subtitle">
          Four playlists. Twelve original instrumental samples. No account
          needed.
        </p>
        <Link className="pill" to="/recents">
          Recently played
        </Link>
        <Link className="settings-profile-link" to="/profile">
          View your profile
        </Link>
      </section>
    </div>
  );
}
