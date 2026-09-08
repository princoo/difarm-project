import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/hooks/api";
import { requireSelectedFarmId } from "@/utils/farmId";

function unwrap<T>(res: { data?: { data?: T } | T }): T {
  const body = res.data as { data?: T };
  return (body?.data ?? res.data) as T;
}

function farmRequiredToast() {
  toast.error("Select a farm first");
}

export function useCropTypes() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/crop-types/farm/${farmId}`);
      setItems(Array.isArray(unwrap(res)) ? unwrap(res) : []);
    } catch {
      toast.error("Could not load crop types");
    } finally {
      setLoading(false);
    }
  }, []);

  const create = async (payload: Record<string, unknown>) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) return farmRequiredToast();
    await api.post(`/crop-types/farm/${farmId}`, payload);
    toast.success("Crop type saved");
    await fetchAll();
  };

  const update = async (id: string, payload: Record<string, unknown>) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) return farmRequiredToast();
    await api.put(`/crop-types/${id}/farm/${farmId}`, payload);
    toast.success("Crop type updated");
    await fetchAll();
  };

  const remove = async (id: string) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) return farmRequiredToast();
    await api.delete(`/crop-types/${id}/farm/${farmId}`);
    toast.success("Crop type deleted");
    await fetchAll();
  };

  return { items, loading, fetchAll, create, update, remove };
}

export function useGrowFields() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/fields/farm/${farmId}`);
      setItems(Array.isArray(unwrap(res)) ? unwrap(res) : []);
    } catch {
      toast.error("Could not load fields");
    } finally {
      setLoading(false);
    }
  }, []);

  const create = async (payload: Record<string, unknown>) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) return farmRequiredToast();
    await api.post(`/fields/farm/${farmId}`, payload);
    toast.success("Field saved");
    await fetchAll();
  };

  const update = async (id: string, payload: Record<string, unknown>) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) return farmRequiredToast();
    await api.put(`/fields/${id}/farm/${farmId}`, payload);
    toast.success("Field updated");
    await fetchAll();
  };

  const remove = async (id: string) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) return farmRequiredToast();
    await api.delete(`/fields/${id}/farm/${farmId}`);
    toast.success("Field deleted");
    await fetchAll();
  };

  return { items, loading, fetchAll, create, update, remove };
}

export function usePlantings() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/plantings/farm/${farmId}`);
      setItems(Array.isArray(unwrap(res)) ? unwrap(res) : []);
    } catch {
      toast.error("Could not load plantings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      setStats(null);
      return;
    }
    try {
      const res = await api.get(`/plantings/stats/${farmId}`);
      setStats(unwrap(res));
    } catch {
      setStats(null);
    }
  }, []);

  const create = async (payload: Record<string, unknown>) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) return farmRequiredToast();
    await api.post(`/plantings/farm/${farmId}`, payload);
    toast.success("Planting saved");
    await fetchAll();
    await fetchStats();
  };

  const update = async (id: string, payload: Record<string, unknown>) => {
    await api.put(`/plantings/${id}`, payload);
    toast.success("Planting updated");
    await fetchAll();
  };

  const remove = async (id: string) => {
    await api.delete(`/plantings/${id}`);
    toast.success("Planting deleted");
    await fetchAll();
  };

  const addTreatment = async (plantingId: string, payload: Record<string, unknown>) => {
    await api.post(`/treatments/planting/${plantingId}`, payload);
    toast.success("Treatment recorded");
    await fetchAll();
  };

  const addHarvest = async (plantingId: string, payload: Record<string, unknown>) => {
    await api.post(`/harvests/planting/${plantingId}`, payload);
    toast.success("Harvest recorded");
    await fetchAll();
    await fetchStats();
  };

  return { items, stats, loading, fetchAll, fetchStats, create, update, remove, addTreatment, addHarvest };
}

export function useFarmHarvests() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/harvests/farm/${farmId}`);
      setItems(Array.isArray(unwrap(res)) ? unwrap(res) : []);
    } catch {
      toast.error("Could not load harvests");
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, fetchAll };
}

export function useCropPlan() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPlan = useCallback(async (year?: number) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      setPlan(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/crop-plan/farm/${farmId}`, {
        params: year ? { year } : undefined,
      });
      setPlan(unwrap(res));
    } catch {
      toast.error("Could not load crop plan");
    } finally {
      setLoading(false);
    }
  }, []);

  return { plan, loading, fetchPlan };
}
