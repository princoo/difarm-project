import { useState } from "react";
import toast from "react-hot-toast";
import { api, queryString } from ".";
import { getFarmId, getReadFarmScope } from "@/utils/farmId";
import { isLoggedIn } from "@/hooks/api/auth";

export type LivestockSpecies =
  | "GOAT"
  | "SHEEP"
  | "PIG"
  | "POULTRY"
  | "RABBIT"
  | "OTHER";

export type LivestockStatus =
  | "HEALTHY"
  | "SICK"
  | "SOLD"
  | "PROCESSED"
  | "DECEASED";

export type LivestockRow = {
  id: string;
  farmId: string;
  tagNumber: string;
  species: LivestockSpecies;
  breed?: string | null;
  gender: "MALE" | "FEMALE";
  status: LivestockStatus;
  DOB?: string | null;
  weight?: number | null;
  location?: string | null;
  motherTag?: string | null;
  createdAt: string;
  farm?: { name?: string; location?: string };
};

export type LivestockStats = {
  totalAnimals: number;
  bySpecies: { species: LivestockSpecies; animals: number }[];
  byStatus: { status: LivestockStatus; animals: number }[];
};

const extractError = (error: any, fallback: string) => {
  const apiErrors = error.response?.data?.error;
  if (Array.isArray(apiErrors)) return apiErrors.join(", ");
  return (
    error.response?.data?.message ||
    (error.request && !error.response
      ? "Cannot reach the API server. Restart with npm run dev:all."
      : fallback)
  );
};

export const useLivestock = () => {
  const [livestock, setLivestock] = useState<any>(null);
  const [allLivestock, setAllLivestock] = useState<any>(null);
  const [stats, setStats] = useState<LivestockStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLivestock = async (query: any = {}) => {
    const farmId = getReadFarmScope(isLoggedIn()?.role);
    if (!farmId) {
      setError("No farm selected. Choose a farm first.");
      setLivestock(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params =
        typeof query === "string"
          ? query
          : queryString({ ...query, _t: Date.now() });
      const response = await api.get(`/livestock/${farmId}?${params}`, {
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      setLivestock(response.data);
    } catch (err: any) {
      const message = extractError(err, "An error occurred while fetching livestock.");
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivestockOnSelectedFarm = async () => {
    const farmId = getFarmId();
    if (!farmId) {
      setError("No farm selected. Choose a farm first.");
      setAllLivestock(null);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/livestock/${farmId}?pageSize=500`);
      setAllLivestock(response.data);
    } catch (err: any) {
      setError(extractError(err, "An error occurred while fetching livestock."));
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLivestock = async () => {
    const farmId = getReadFarmScope(isLoggedIn()?.role);
    if (!farmId) return;
    setLoading(true);
    try {
      const response = await api.get(`/livestock/${farmId}?pageSize=500`);
      setAllLivestock(response.data);
    } catch (err: any) {
      setError(extractError(err, "An error occurred while fetching livestock."));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const farmId = getReadFarmScope(isLoggedIn()?.role);
    if (!farmId) return;
    try {
      const response = await api.get(`/livestock/stats/${farmId}`);
      setStats(response.data?.data ?? null);
    } catch {
      // stats are supplementary — the list already surfaces errors
    }
  };

  const addLivestock = async (data: any) => {
    const farmId = data?.farmId || getFarmId();
    if (!farmId) {
      toast.error("No farm selected. Choose a farm first.");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/livestock/${farmId}`, data);
      toast.success("Animal recorded successfully");
      return true;
    } catch (err: any) {
      const message = extractError(err, "An error occurred while recording the animal.");
      toast.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateLivestock = async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/livestock/${id}`, data);
      toast.success("Animal updated successfully");
      return true;
    } catch (err: any) {
      const message = extractError(err, "An error occurred while updating the animal.");
      toast.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteLivestock = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/livestock/${id}`);
      toast.success("Animal deleted successfully");
      return true;
    } catch (err: any) {
      const message = extractError(err, "An error occurred while deleting the animal.");
      toast.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    livestock,
    allLivestock,
    stats,
    loading,
    error,
    fetchLivestock,
    fetchAllLivestock,
    fetchLivestockOnSelectedFarm,
    fetchStats,
    addLivestock,
    updateLivestock,
    deleteLivestock,
  };
};

export const fetchLivestockDetail = (livestockId: string) =>
  api.get(`/livestock/animal/${livestockId}`);
