import { useCallback, useEffect, useRef, useState } from "react";

export type PhotoState =
  | { readonly kind: "empty" }
  | { readonly kind: "loaded"; readonly url: string; readonly file: File };

export const usePhoto = (): {
  state: PhotoState;
  setFile: (file: File) => void;
  clear: () => void;
} => {
  const [state, setState] = useState<PhotoState>({ kind: "empty" });
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

  const clear = useCallback(() => {
    revokeCurrent();
    setState({ kind: "empty" });
  }, [revokeCurrent]);

  useEffect(() => () => revokeCurrent(), [revokeCurrent]);

  return { state, setFile, clear };
};
