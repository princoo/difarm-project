import { useState, useCallback } from 'react';
import { api } from '.';

export type ActivityLogFilters = {
    page?: number;
    pageSize?: number;
    accountId?: string;
    action?: string;
    entityType?: string;
};

export const useActivityLogs = (accountId?: string) => {
    const [logs, setLogs] = useState<{ data: any[]; total: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async (params?: ActivityLogFilters) => {
        setLoading(true);
        setError(null);
        try {
            if (accountId) {
                const q = new URLSearchParams();
                if (params?.page) q.set('page', String(params.page));
                if (params?.pageSize) q.set('pageSize', String(params.pageSize));
                const response = await api.get(`/activity-logs/account/${accountId}?${q.toString()}`);
                const payload = response.data?.data ?? {};
                setLogs({ data: payload.data ?? [], total: payload.total ?? 0 });
            } else {
                const q = new URLSearchParams();
                if (params?.page) q.set('page', String(params.page));
                if (params?.pageSize) q.set('pageSize', String(params.pageSize));
                if (params?.accountId) q.set('accountId', params.accountId);
                if (params?.action) q.set('action', params.action);
                if (params?.entityType) q.set('entityType', params.entityType);
                const response = await api.get(`/activity-logs?${q.toString()}`);
                const payload = response.data?.data ?? {};
                setLogs({ data: payload.data ?? [], total: payload.total ?? 0 });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch activity logs');
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    return { logs, loading, error, fetchLogs };
};

export const useActivityLogsFarm = () => {
    const [logs, setLogs] = useState<{ data: any[]; total: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async (params?: ActivityLogFilters) => {
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (params?.page) q.set('page', String(params.page));
            if (params?.pageSize) q.set('pageSize', String(params.pageSize));
            if (params?.accountId) q.set('accountId', params.accountId);
            if (params?.action) q.set('action', params.action);
            if (params?.entityType) q.set('entityType', params.entityType);
            const response = await api.get(`/activity-logs/farm?${q.toString()}`);
            const payload = response.data?.data ?? {};
            setLogs({ data: payload.data ?? [], total: payload.total ?? 0 });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch activity logs');
        } finally {
            setLoading(false);
        }
    }, []);

    return { logs, loading, error, fetchLogs };
};
