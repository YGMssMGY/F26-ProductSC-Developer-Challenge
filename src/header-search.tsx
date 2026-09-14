import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, X, Disc3, ArrowUpRight } from "lucide-react";
import { catalog } from "./data";
import { useAsync } from "./hooks";
export function HeaderSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get("q") ?? "";
  const [draft, setDraft] = useState(query);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const editVersion = useRef(0);
  const pendingNavigation = useRef<number | null>(null);
  const { data, error, retry } = useAsync(
    useCallback(() => catalog.search(draft), [draft]),
  );
  const options = data
    ? [
        ...data.tracks.slice(0, 4).map((t) => ({
          id: `song-${t.id}`,
          title: t.title,
          detail: `Song · ${t.artist}`,
          artwork: t.artwork,
          url: `/track/${t.id}`,
        })),
        ...data.playlists.slice(0, 3).map((p) => ({
          id: `playlist-${p.id}`,
          title: p.title,
          detail: "Playlist",
          artwork: p.artwork,
          url: `/playlist/${p.id}`,
        })),
      ]
    : [];
  useLayoutEffect(() => {
    // A route transition must not erase text entered after that navigation began.
    if (
      pendingNavigation.current === null ||
      pendingNavigation.current === editVersion.current
    ) {
      setDraft(query);
      setOpen(false);
      setActive(-1);
    }
    pendingNavigation.current = null;
  }, [location.key, query]);
  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  const visible = open && !!draft.trim();
  const submit = (
    url = `/search${draft.trim() ? `?q=${encodeURIComponent(draft.trim())}` : ""}`,
  ) => {
    setOpen(false);
    pendingNavigation.current = editVersion.current;
    navigate(url, {
      replace: location.pathname === "/search" && url.startsWith("/search"),
    });
  };
  return (
    <div
      className="searchbar search-combobox"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <Search size={22} />
      <input
        ref={input}
        role="combobox"
        aria-label="Search tracks, artists, and playlists"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={visible ? "search-suggestions" : undefined}
        aria-activedescendant={
          visible && options[active]
            ? `suggestion-${options[active].id}`
            : undefined
        }
        placeholder="What do you want to play?"
        value={draft}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          editVersion.current++;
          setDraft(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            setActive(-1);
          } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setActive((i) =>
              options.length
                ? i === -1
                  ? e.key === "ArrowDown"
                    ? 0
                    : options.length - 1
                  : (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) %
                    options.length
                : -1,
            );
          } else if (e.key === "Enter") {
            e.preventDefault();
            submit(
              visible && options[active] ? options[active].url : undefined,
            );
          }
        }}
      />
      {draft ? (
        <button
          title="Clear search"
          aria-label="Clear search"
          onClick={() => {
            editVersion.current++;
            pendingNavigation.current = editVersion.current;
            setDraft("");
            setActive(-1);
            setOpen(false);
            if (location.pathname === "/search")
              navigate("/search", { replace: true });
            input.current?.focus();
          }}
        >
          <X size={19} />
        </button>
      ) : (
        <Link to="/search" title="Browse music" aria-label="Browse music">
          <Disc3 size={21} />
        </Link>
      )}
      {visible && (
        <div className="suggestion-popover">
          <div
            id="search-suggestions"
            role="listbox"
            aria-label="Search suggestions"
          >
            {!data ? (
              <p role="status">
                {error ? "Search could not load." : "Searching…"}
              </p>
            ) : !options.length ? (
              <p role="status">No matches. Try another song or artist.</p>
            ) : (
              options.map((option, i) => (
                <button
                  id={`suggestion-${option.id}`}
                  key={option.id}
                  role="option"
                  aria-selected={i === active}
                  tabIndex={-1}
                  className="suggestion-row"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => submit(option.url)}
                >
                  <img src={option.artwork} alt="" />
                  <span>
                    <strong>{option.title}</strong>
                    <small>{option.detail}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))
            )}
          </div>
          {error && (
            <button className="suggestion-all" onClick={retry}>
              Retry search
            </button>
          )}
          <button
            className="suggestion-all"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => submit()}
          >
            View all results for “{draft}”<ArrowUpRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
