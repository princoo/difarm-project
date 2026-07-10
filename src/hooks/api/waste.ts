import toast from "react-hot-toast";
import { api, queryString } from ".";
import { useState } from "react";
import { getFarmId, getReadFarmScope } from "@/utils/farmId";
import { isLoggedIn } from "@/hooks/api/auth";

interface WasteLogData {
    type: string;
    quantity: number;
    date: string;
}

export const useWasteLog = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wasteLogs, setWasteLogs] = useState([]);

    const getWasteLogs = async (query?:string) => {
        const FarmId = getReadFarmScope(isLoggedIn()?.role);
        if (!FarmId) {
            setError('No farm selected.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/waste-logs/${FarmId}?${queryString(query)}`);
            setWasteLogs(response.data);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'An error occurred while fetching waste logs.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const createWasteLog = async (data: WasteLogData) => {
        const FarmId = getFarmId();
        if (!FarmId) {
            toast.error('Select a specific farm before creating a waste log.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/waste-logs/${FarmId}`, data);
            toast.success('Waste log created successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'An error occurred while creating the waste log.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateWasteLog = async (id: string, data: WasteLogData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.patch(`/waste-logs/${id}`, data);
            toast.success('Waste log updated successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'An error occurred while updating the waste log.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteWasteLog = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/waste-logs/${id}`);
            toast.success('Waste log deleted successfully');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'An error occurred while deleting the waste log.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { wasteLogs, createWasteLog, updateWasteLog, deleteWasteLog, loading, error, getWasteLogs };
};
