import { useCallback, useEffect, useState } from "react";
import { api } from "@/hooks/api";
import { getFarmId } from "@/utils/farmId";

export type SelectedFarm = {
  id: string;
  name: string;
  farmCategory?: "LIVESTOCK" | "AGRICULTURE";
  type?: string;
  location?: string;
  status?: boolean;
};

export function useSelectedFarm() {
  const [farm, setFarm] = useState<SelectedFarm | null>(null);
  const [loading, setLoading] = useState(false);

  const farmId = getFarmId();

  const load = useCallback(async () => {
    if (!farmId) {
      setFarm(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/farms/farm/${farmId}`);
      const data = (res.data as { data?: SelectedFarm })?.data ?? res.data;
      setFarm(data as SelectedFarm);
    } catch {
      setFarm(null);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("difarm-farm-changed", onChange);
    return () => window.removeEventListener("difarm-farm-changed", onChange);
  }, [load]);

  const farmCategory = farm?.farmCategory ?? "LIVESTOCK";
  const isLivestock = farmCategory === "LIVESTOCK";
  const isAgriculture = farmCategory === "AGRICULTURE";

  return { farm, farmCategory, isLivestock, isAgriculture, loading, reload: load };
}
