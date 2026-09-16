import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { library } from "./data";
export function useAsync<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(undefined);
    setError(false);
    load()
      .then((v) => {
        if (active) setData(v);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [load, attempt]);
  return { data, error, retry: () => setAttempt((a) => a + 1) };
}
const LibraryContext = createContext<{
  saved: string[];
  liked: string[];
  toggleTrack: (id: string) => void;
  toggle: (id: string) => void;
  error: string;
}>({
  saved: [],
  liked: [],
  toggleTrack: () => {},
  toggle: () => {},
  error: "",
});
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [trackError, setTrackError] = useState("");
  const trackOperations = useRef(Promise.resolve());
  const [error, setError] = useState("");
  useEffect(() => {
    library
      .getSavedPlaylistIds()
      .then(setSaved)
      .catch(() => setError("Your library could not be loaded."));
  }, []);
  useEffect(() => {
    library
      .getSavedTrackIds()
      .then(setLiked)
      .catch(() => setTrackError("Your saved songs could not be loaded."));
  }, []);
  const toggleTrack = useCallback((id: string) => {
    // Serialize clicks so rapid toggles always use the latest saved collection.
    trackOperations.current = trackOperations.current
      .then(async () => {
        setTrackError("");
        const current = await library.getSavedTrackIds();
        setLiked(await library.setTrackSaved(id, !current.includes(id)));
      })
      .catch(() =>
        setTrackError("Could not save this song. Please try again."),
      );
  }, []);
  const toggle = useCallback(
    (id: string) => {
      library
        .setSaved(id, !saved.includes(id))
        .then(setSaved)
        .catch(() =>
          setError("Could not save this playlist. Please try again."),
        );
    },
    [saved],
  );
  return (
    <LibraryContext.Provider
      value={{ saved, liked, toggleTrack, toggle, error }}
    >
      {children}
      {trackError && (
        <div className="library-save-error" role="alert">
          {trackError}
          <button onClick={() => setTrackError("")}>Dismiss</button>
        </div>
      )}
    </LibraryContext.Provider>
  );
}
export const useLibrary = () => useContext(LibraryContext);
