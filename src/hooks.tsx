import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
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
  toggle: (id: string) => void;
  error: string;
}>({ saved: [], toggle: () => {}, error: "" });
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    library
      .getSavedPlaylistIds()
      .then(setSaved)
      .catch(() => setError("Your library could not be loaded."));
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
    <LibraryContext.Provider value={{ saved, toggle, error }}>
      {children}
    </LibraryContext.Provider>
  );
}
export const useLibrary = () => useContext(LibraryContext);
