import { useEffect, useState } from "react";
import { getFarmId } from "@/utils/farmId";

/** Selected farm id for forms — always a concrete farm, never platform-wide "all". */
export function useSelectedFarmId(active = true) {
  const [farmId, setFarmIdState] = useState<string | null>(() =>
    active ? getFarmId() : null
  );

  useEffect(() => {
    if (!active) return;
    const sync = () => setFarmIdState(getFarmId());
    sync();
    window.addEventListener("difarm-farm-changed", sync);
    return () => window.removeEventListener("difarm-farm-changed", sync);
  }, [active]);

  return farmId;
}
