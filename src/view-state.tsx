import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
export type Panel = "now-playing" | "queue" | null;
const Context = createContext<{
  panel: Panel;
  desktop: boolean;
  expanded: boolean;
  compactLibrary: boolean;
  libraryExpanded: boolean;
  setLibraryExpanded: (value: boolean) => void;
  setCompactLibrary: (value: boolean) => void;
  setPanel: (panel: Panel) => void;
  openView: (panel: Exclude<Panel, null>) => void;
  expand: () => void;
  minimize: () => void;
}>({
  panel: null,
  desktop: false,
  expanded: false,
  compactLibrary: false,
  libraryExpanded: false,
  setLibraryExpanded: () => {},
  setCompactLibrary: () => {},
  setPanel: () => {},
  openView: () => {},
  expand: () => {},
  minimize: () => {},
});
export function ViewProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [desktop, setDesktop] = useState(
    () => window.matchMedia("(min-width: 700px)").matches,
  );
  const [panel, updatePanel] = useState<Panel>(null);
  const [expanded, setExpanded] = useState(false);
  const [compactLibrary, updateCompactLibrary] = useState(
    () => window.innerWidth < 1200,
  );
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  const setCompactLibrary = (compact: boolean) => {
    updateCompactLibrary(compact);
    if (!compact && window.innerWidth < 1100) updatePanel(null);
  };
  const setPanel = (next: Panel) => {
    updatePanel(next);
    if (next && window.innerWidth < 1100) updateCompactLibrary(true);
  };
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 700px)");
    const update = () => {
      setDesktop(media.matches);
      setLibraryExpanded(false);
      if (window.innerWidth < 1200) updateCompactLibrary(true);
    };
    const narrow = window.matchMedia("(max-width: 1199px)");
    const updateLibrary = () => updateCompactLibrary(narrow.matches);
    media.addEventListener("change", update);
    narrow.addEventListener("change", updateLibrary);
    return () => {
      media.removeEventListener("change", update);
      narrow.removeEventListener("change", updateLibrary);
    };
  }, []);
  const minimize = () => {
    setExpanded(false);
    requestAnimationFrame(
      () => returnFocus.current?.isConnected && returnFocus.current.focus(),
    );
  };
  const openView = (view: Exclude<Panel, null>) => {
    setExpanded(false);
    if (desktop) setPanel(panel === view ? null : view);
    else navigate(`/${view}`);
  };
  return (
    <Context.Provider
      value={{
        panel,
        desktop,
        expanded,
        compactLibrary,
        libraryExpanded,
        setLibraryExpanded,
        setCompactLibrary,
        setPanel,
        openView,
        minimize,
        expand: () => {
          returnFocus.current = document.activeElement as HTMLElement;
          setLibraryExpanded(false);
          setExpanded(true);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useView = () => useContext(Context);
