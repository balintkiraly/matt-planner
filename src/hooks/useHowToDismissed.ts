import { useEffect, useState } from "react";
import { HOW_TO_DISMISSED_KEY } from "../constants";

export function useHowToDismissed(): [boolean, (show: boolean) => void] {
  const [showHowTo, setShowHowTo] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(HOW_TO_DISMISSED_KEY) !== "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!showHowTo) {
      window.localStorage.setItem(HOW_TO_DISMISSED_KEY, "1");
    }
  }, [showHowTo]);

  return [showHowTo, setShowHowTo];
}
