import { useState } from "react";
import toast from "react-hot-toast";
import { api, queryString } from ".";
import { getFarmId, getReadFarmScope } from "@/utils/farmId";
import { isLoggedIn } from "@/hooks/api/auth";

export const useCattle = () => {
  const [cattle, setCattle] = useState([]);
  const [allCattles, setallCattles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCattle = async (query: any) => {
    const role = isLoggedIn()?.role;
    const farmId = getReadFarmScope(role);
    if (!farmId) {
      setError("No farm selected. Choose a farm first.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/cattles/${farmId}?${queryString(query)}`);
      setCattle(response.data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while fetching cattle.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const fetchAllCattle = async () => {
    const role = isLoggedIn()?.role;
    const farmId = getReadFarmScope(role);
    if (!farmId) {
      return;
    }
    try {
      const response = await api.get(`/cattles/${farmId}?pageSize=500`);
      setallCattles(response.data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while fetching cattle.";
      setError(errorMessage);
    }
  };

  const addCattle = async (cattleData: any) => {
    const farmId = getFarmId();
    if (!farmId) {
      toast.error("No farm selected. Choose a farm first.");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/cattles/${farmId}`, cattleData);
      toast.success("Cattle added successfully");
      fetchCattle({});
      return true;
    } catch (error: any) {
      const apiErrors = error.response?.data?.error;
      const errorMessage = Array.isArray(apiErrors)
        ? apiErrors.join(", ")
        : error.response?.data?.message ||
          (error.request && !error.response
            ? "Cannot reach the API server. Restart with npm run dev:all."
            : "An error occurred while adding cattle.");
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCattle = async (id: number, cattleData: any) => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/cattles/${id}`, cattleData);
      toast.success("Cattle updated successfully");
      fetchCattle({});
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while updating cattle.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteCattle = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/cattles/${id}`);
      toast.success("Cattle deleted successfully");
      fetchCattle({});
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while deleting cattle.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    cattle,
    allCattles,
    loading,
    error,
    fetchCattle,
    fetchAllCattle,
    addCattle,
    updateCattle,
    deleteCattle,
  };
};

export const fetchCattleDetail = (cattleId: string) =>
  api.get(`/cattles/cattle/${cattleId}`);

export const fetchCattleReport = (cattleId: string) =>
  api.get(`/cattles/cattle/${cattleId}/report`);
