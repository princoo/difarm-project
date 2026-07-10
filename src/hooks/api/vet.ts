import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';

interface VeterinarianData {
    name: string;
    phone: string;
    email: string;
}

export const useVeterinarians = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [veterinarians, setVeterinarians] = useState([]);
    const farmId =  localStorage.getItem('FarmId') 
    const getVeterinarians = async (query?:string) => {
        setLoading(true);
        setError(null);
        try {
            const response:any = await api.get(`/veterinarians/${farmId}?${queryString(query)}`);
            setVeterinarians(response?.data);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'An error occurred while fetching veterinarians.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const createVeterinarian = async (data: VeterinarianData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/veterinarians`, data);
            toast.success('Veterinarian created successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while creating the veterinarian.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateVeterinarian = async (id: string, data: VeterinarianData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/veterinarians/${id}`, data);
            toast.success('Veterinarian updated successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while updating the veterinarian.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteVeterinarian = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/veterinarians/${id}`);
            toast.success('Veterinarian deleted successfully');
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while deleting the veterinarian.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { veterinarians, getVeterinarians, createVeterinarian, updateVeterinarian, deleteVeterinarian, loading, error };
};
