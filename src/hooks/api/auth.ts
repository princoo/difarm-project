import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, queryString } from '.';
import { storage } from '@/utils';
import { clearFarmId } from '@/utils/farmId';
import jwt_decode from 'jwt-decode';
import { useNavigate } from '@/lib/router-compat';

export const useLogin = () => {
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    const login = async (credentials: {
        username: string;
        password: string;
    }) => {
        setLoadingLogin(true);
        setLoginError(null);
        try {
            const response = await api.post(`/auth/login`, credentials);
            const { token, userFound } = response.data.user;
            storage.setToken(token);
            clearFarmId();
            localStorage.setItem('Farm_user', JSON.stringify(userFound));
            setLoginSuccess(true);
            toast.success(`Login successful! Welcome ${userFound.username}`);
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                (error.request && !error.response
                    ? 'Cannot reach the API. If you are on localhost, restart npm run dev after clearing NEXT_PUBLIC_SERVER_URL (do not use port 4000).'
                    : 'An error occurred during login.');
            toast.error(errorMessage);
            setLoginError(errorMessage);
        } finally {
            setLoadingLogin(false);
        }
    };

    return {
        loadingLogin,
        login,
        loginSuccess,
        loginError,
    };
};

export const isLoggedIn = () => {
 
    const token = storage.getToken();
    if (token) {
        const decodedToken: any = jwt_decode(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
            storage.removeToken();
            localStorage.removeItem('Farm_user');
            window.location.href = '/login';
            return false;
        }

        const user = localStorage.getItem('Farm_user');
        if (user) {
            return JSON.parse(user);
        }
    }
    return false;
};

export const useFetchUsers = () => {
    const [users, setUsers] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async (params?: { role?: string; status?: string; page?: number; pageSize?: number }) => {
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (params?.role) q.set('role', params.role);
            if (params?.status !== undefined && params?.status !== '') q.set('status', params.status === 'active' || params.status === 'true' ? 'true' : 'false');
            if (params?.page) q.set('page', String(params.page));
            if (params?.pageSize) q.set('pageSize', String(params.pageSize));
            const response = await api.get(`/auth/users?${q.toString()}`);
            setUsers(response.data);
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while fetching users.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        users,
        loading,
        error,
        fetchUsers,
    };
};

export const activateAccount = (accountId: string) =>
    api.patch(`/auth/accounts/${accountId}/activate`);

export const registerVeterinarian = (data: any) =>
    api.post('/auth/register/veterinarian', data);

export const fetchUserDetail = (userId: string) =>
    api.get(`/users/detail/${userId}`);

export const useAdminTeam = () => {
    const [team, setTeam] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTeam = async (params?: { page?: number; pageSize?: number }) => {
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (params?.page) q.set('page', String(params.page));
            if (params?.pageSize) q.set('pageSize', String(params.pageSize));
            const query = q.toString();
            const response = await api.get(query ? `/users/team?${query}` : '/users/team');
            setTeam(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load team.');
        } finally {
            setLoading(false);
        }
    };

    return { team, loading, error, fetchTeam };
};


export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const farmId = localStorage.getItem('FarmId');
    const fetchUsers = async (query?:string) => {
        setLoading(true);
        try {
            const response = await api.get(`/users/${farmId}?${queryString(query)}`);
            setUsers(response.data);
       
        } catch (error:any) {
            setError(error.response?.data?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const addUser = async (user: any) => {
        setLoading(true);
        try {
          const response = await api.post('/auth/signup', user);
          toast.success(response.data?.message || 'User created and assigned to farm successfully.');
        } catch (error: any) {
          if (error.response && error.response.status === 400) {
            if (error.response.data.error) {
              const errorMessage = error.response.data.error.join(', ') ||error?.response?.data?.message;
              toast.error(errorMessage);
            } else if (error.response.data.message === 'An account with this phone address already exists.') {
              toast.error('An account with this phone number already exists.');
            } else {
              toast.error('Failed to create user. Please try again later.');
            }
          } else {
            toast.error('An unexpected error occurred. Please try again later.');
          }
          setError(errorMessage || 'Failed to create user.');
        } finally {
          setLoading(false);
        }
      };
    const updateUser = async (id: any, user: any) => {
        setLoading(true);
        setError(null);
        try {
            await api.put(`/users/${id}`, user);
            await fetchUsers();
            return true;
        } catch (error: any) {
            const message =
                error.response?.data?.error ||
                error.response?.data?.message ||
                'Failed to update user.';
            setError(message);
            toast.error(message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id: any) => {
        setLoading(true);
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error:any) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    return {
        users,
        loading,
        error,
        addUser,
        updateUser,
        deleteUser,
        refetch: fetchUsers,
    };
};