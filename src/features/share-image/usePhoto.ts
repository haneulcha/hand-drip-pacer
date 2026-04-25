import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type PhotoState =
  | { readonly kind: "empty" }
  | { readonly kind: "loaded"; readonly url: string; readonly file: File };

const EMPTY_STATE: PhotoState = { kind: "empty" };

export const usePhoto = (): {
  state: PhotoState;
  setFile: (file: File) => void;
  clear: () => void;
} => {
  const [state, setState] = useState<PhotoState>(EMPTY_STATE);
  const currentUrlRef = useRef<string | null>(null);

  const revokeCurrent = useCallback(() => {
    if (currentUrlRef.current != null) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  }, []);

  const setFile = useCallback(
    (file: File) => {
      revokeCurrent();
      const url = URL.createObjectURL(file);
      currentUrlRef.current = url;
      setState({ kind: "loaded", url, file });
    },
    [revokeCurrent],
  );

  // Bails out when already empty — preserves reference equality so
  // callers depending on `clear` in effect deps don't re-render in a loop.
  const clear = useCallback(() => {
    revokeCurrent();
    setState((prev) => (prev.kind === "empty" ? prev : EMPTY_STATE));
  }, [revokeCurrent]);

  useEffect(() => () => revokeCurrent(), [revokeCurrent]);

  return useMemo(() => ({ state, setFile, clear }), [state, setFile, clear]);
};
