import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { api } from '.';
import toast from 'react-hot-toast';

export type FarmFilters = {
    status?: string;
    search?: string;
    location?: string;
    ownerId?: string;
    unassigned?: boolean;
};

export const useFarms = (options?: { autoFetch?: boolean }) => {
    const autoFetch = options?.autoFetch !== false;
    const [farms, setFarms] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFarms = useCallback(async (params?: FarmFilters) => {
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (params?.status !== undefined && params?.status !== '') q.set('status', params.status);
            if (params?.search?.trim()) q.set('search', params.search.trim());
            if (params?.location?.trim()) q.set('location', params.location.trim());
            if (params?.ownerId?.trim()) q.set('ownerId', params.ownerId.trim());
            if (params?.unassigned) q.set('unassigned', 'true');
            const query = q.toString();
            const response = await api.get(query ? `/farms?${query}` : '/farms');
            setFarms(response.data);
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred while fetching farms.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (autoFetch) {
            fetchFarms();
        }
    }, [autoFetch, fetchFarms]);

    return {
        farms,
        loading,
        error,
        fetchFarms
    };
};



const useAddFarm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addFarm = async (farmData:any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/farms', farmData);
            const message =
                response.data?.message ||
                (response.data?.data?.status === false
                    ? 'Farm registered. Waiting for super admin activation.'
                    : 'Farm added successfully');
            toast.success(message);
            return response.data;
            
        } catch (err:any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error?.join?.(', ') ||
                'An error occurred while adding the farm.';
            toast.error(message);
            setError(err.response?.data?.message || message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, addFarm };
};

export default useAddFarm;

export const useUpdateFarm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateFarm = async (id: string, updatedData: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/farms/${id}`, updatedData);
            toast.success('Farm updated successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while updating the farm.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { updateFarm, loading, error };
};


export const useDeleteFarm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteFarm = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/farms/${id}`);
            toast.success("Farm deleted successfully");
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "An error occurred while deleting the farm.";
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { deleteFarm, loading, error };
};



export const useGetFarmById = (id: string) => {
    const [farm, setFarm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFarm = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/farms/farm/${id}`);
                setFarm(response.data);
            } catch (error: any) {
                const errorMessage =
                    error.response?.data?.message ||
                    'An error occurred while fetching the farm.';
                toast.error(errorMessage);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchFarm();
        }
    }, [id]);

    return { farm, loading, error };
};

export const activateFarm = (farmId: string) =>
    api.patch(`/farms/${farmId}/activate`);