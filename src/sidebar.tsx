import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Library,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Search,
  X,
  List,
  LayoutGrid,
  Check,
  Play,
  Pause,
} from "lucide-react";
import { LikedSongsLink } from "./save-track";
import { catalog } from "./data";
import { useAsync, useLibrary } from "./hooks";
import { usePlayer } from "./player";
import { useView } from "./view-state";

export function Sidebar() {
  const view = useView();
  const player = usePlayer();
  const location = useLocation();
  const { saved, liked, error: libraryError } = useLibrary();
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.listPlaylists(), []),
  );
  const [filter, setFilter] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [sort, setSort] = useState("Recents");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const sortRoot = useRef<HTMLDivElement>(null);
  const sortButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const minimizeButton = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(false);
  const compact = view.compactLibrary && !view.libraryExpanded;
  const grid = view.libraryExpanded || layout === "grid";
  const closeMenu = (focus = true) => {
    setMenuOpen(false);
    if (focus) sortButton.current?.focus();
  };
  useEffect(() => {
    if (searching) searchInput.current?.focus();
  }, [searching]);
  useEffect(() => {
    if (view.libraryExpanded) minimizeButton.current?.focus();
    else if (wasExpanded.current) expandButton.current?.focus();
    wasExpanded.current = view.libraryExpanded;
  }, [view.libraryExpanded]);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitemradio"]')?.focus();
    const outside = (e: MouseEvent) => {
      if (!sortRoot.current?.contains(e.target as Node)) closeMenu(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [menuOpen]);
  const playlists = (data ?? [])
    .filter(
      (p) =>
        saved.includes(p.id) &&
        p.title.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "Alphabetical") return a.title.localeCompare(b.title);
      const recent = (ids: string[]) => {
        const i = player.recentIds.findIndex((id) => ids.includes(id));
        return i < 0 ? Infinity : i;
      };
      if (sort === "Recents") {
        const difference = recent(a.trackIds) - recent(b.trackIds);
        if (difference && !Number.isNaN(difference)) return difference;
      }
      return saved.indexOf(b.id) - saved.indexOf(a.id);
    });
  return (
    <div className="library-slot" inert={view.expanded}>
      <aside
        className={`sidebar library-browser ${compact ? "is-compact" : "is-open"} ${view.libraryExpanded ? "is-expanded" : ""}`}
        aria-label="Your library"
        onKeyDown={(e) => {
          if (
            e.key === "Escape" &&
            view.libraryExpanded &&
            !menuOpen &&
            !searching
          ) {
            e.preventDefault();
            view.setLibraryExpanded(false);
          }
        }}
      >
        <div className="library-heading">
          {view.libraryExpanded ? (
            <h2>Your Library</h2>
          ) : (
            <button
              className="library-heading-toggle"
              title={compact ? "Open Your Library" : "Collapse Your Library"}
              aria-label={
                compact ? "Open Your Library" : "Collapse Your Library"
              }
              aria-expanded={!compact}
              onClick={() => view.setCompactLibrary(!compact)}
            >
              {compact ? (
                <PanelLeftOpen size={22} />
              ) : (
                <PanelLeftClose size={22} />
              )}
              {!compact && <span>Your Library</span>}
            </button>
          )}
          {!compact && (
            <button
              className="library-expand"
              ref={view.libraryExpanded ? minimizeButton : expandButton}
              title={
                view.libraryExpanded
                  ? "Minimize Your Library"
                  : "Expand Your Library"
              }
              aria-label={
                view.libraryExpanded
                  ? "Minimize Your Library"
                  : "Expand Your Library"
              }
              onClick={() => {
                closeMenu(false);
                view.setLibraryExpanded(!view.libraryExpanded);
              }}
            >
              {view.libraryExpanded ? (
                <Minimize2 size={18} />
              ) : (
                <Maximize2 size={18} />
              )}
            </button>
          )}
        </div>
        {!compact && (
          <>
            <div
              className="library-filters"
              role="group"
              aria-label="Library filters"
            >
              {filter && (
                <button
                  className="library-clear"
                  aria-label="Clear library filters"
                  title="Clear library filters"
                  onClick={() => setFilter(false)}
                >
                  <X size={17} />
                </button>
              )}
              <button
                className={filter ? "active" : ""}
                aria-pressed={filter}
                onClick={() => setFilter(!filter)}
              >
                Playlists
              </button>
            </div>
            <div className="library-toolbar">
              {searching ? (
                <div className="library-search">
                  <Search size={16} />
                  <input
                    ref={searchInput}
                    aria-label="Search in Your Library"
                    placeholder="Search in Your Library"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setQuery("");
                        setSearching(false);
                        requestAnimationFrame(() =>
                          searchButton.current?.focus(),
                        );
                      }
                    }}
                  />
                  <button
                    aria-label="Clear library search"
                    onClick={() => {
                      setQuery("");
                      searchInput.current?.focus();
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  className="library-search-button"
                  ref={searchButton}
                  title="Search in Your Library"
                  aria-label="Search in Your Library"
                  onClick={() => setSearching(true)}
                >
                  <Search size={19} />
                </button>
              )}
              <div className="library-sort" ref={sortRoot}>
                <button
                  ref={sortButton}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Sort and view library"
                  onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
                >
                  <span>{sort}</span>
                  {grid ? <LayoutGrid size={17} /> : <List size={19} />}
                </button>
                {menuOpen && (
                  <div
                    className="library-sort-menu"
                    role="menu"
                    aria-label="Sort and view library"
                    ref={menu}
                    onKeyDown={(e) => {
                      const items = Array.from(
                        menu.current?.querySelectorAll<HTMLElement>(
                          '[role="menuitemradio"]',
                        ) ?? [],
                      );
                      const index = items.indexOf(
                        document.activeElement as HTMLElement,
                      );
                      if (e.key === "Escape") {
                        e.preventDefault();
                        e.stopPropagation();
                        closeMenu();
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
                      } else if (e.key === "Tab") closeMenu(false);
                    }}
                  >
                    <div role="group" aria-label="Sort by">
                      <p>Sort by</p>
                      {["Recents", "Recently added", "Alphabetical"].map(
                        (value) => (
                          <button
                            key={value}
                            role="menuitemradio"
                            aria-checked={sort === value}
                            onClick={() => {
                              setSort(value);
                              closeMenu();
                            }}
                          >
                            {value}
                            {sort === value && <Check size={17} />}
                          </button>
                        ),
                      )}
                    </div>
                    {!view.libraryExpanded && (
                      <div role="group" aria-label="View as">
                        <p>View as</p>
                        {(["list", "grid"] as const).map((value) => (
                          <button
                            key={value}
                            role="menuitemradio"
                            aria-checked={layout === value}
                            onClick={() => {
                              setLayout(value);
                              closeMenu();
                            }}
                          >
                            {value === "list" ? "List" : "Grid"}
                            {layout === value && <Check size={17} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        <div
          className={`library-items ${grid && !compact ? "library-grid" : ""}`}
        >
          {liked.length > 0 &&
            "liked songs".includes(query.trim().toLowerCase()) && (
              <LikedSongsLink />
            )}
          {error || libraryError ? (
            <div className="library-message" role="alert">
              <p>Couldn’t load your library.</p>
              {error && <button onClick={retry}>Try again</button>}
            </div>
          ) : !data ? (
            <p className="library-message" role="status">
              Loading…
            </p>
          ) : (
            playlists.map((p) => {
              const current =
                player.queue.source?.kind === "playlist" &&
                player.queue.source.id === p.id;
              return (
                <div
                  className={`library-entry ${location.pathname === `/playlist/${p.id}` ? "selected" : ""}`}
                  key={p.id}
                >
                  <Link
                    to={`/playlist/${p.id}`}
                    title={p.title}
                    aria-label={`Open saved playlist ${p.title}`}
                    aria-current={
                      location.pathname === `/playlist/${p.id}`
                        ? "page"
                        : undefined
                    }
                  >
                    <img src={p.artwork} alt="" />
                    <div>
                      <strong className={current ? "current" : ""}>
                        {p.title}
                      </strong>
                      <span>
                        {filter
                          ? "Listening room"
                          : "Playlist · Listening room"}
                      </span>
                    </div>
                  </Link>
                  {!compact && (
                    <button
                      className="library-item-play"
                      title={`${current && player.playing ? "Pause" : "Play"} ${p.title}`}
                      aria-label={`${current && player.playing ? "Pause" : "Play"} saved playlist ${p.title}`}
                      onClick={() => void player.playPlaylist(p)}
                    >
                      {current && player.playing ? (
                        <Pause size={18} fill="currentColor" />
                      ) : (
                        <Play size={18} fill="currentColor" />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
          {data &&
            !error &&
            !playlists.length &&
            !compact &&
            !(
              liked.length > 0 &&
              "liked songs".includes(query.trim().toLowerCase())
            ) && (
              <div className="library-message" role="status">
                <Library size={28} />
                <h3>
                  {query
                    ? "No matches in Your Library"
                    : "Make it your library"}
                </h3>
                <p>
                  {query
                    ? `No saved playlists match “${query}”.`
                    : "Save the playlists you love. Find them right here."}
                </p>
                {query ? (
                  <button className="pill" onClick={() => setQuery("")}>
                    Clear search
                  </button>
                ) : (
                  <Link className="pill" to="/?facet=music">
                    Browse music
                  </Link>
                )}
              </div>
            )}
        </div>
      </aside>
    </div>
  );
}
