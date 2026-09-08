import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/hooks/api";
import { requireSelectedFarmId } from "@/utils/farmId";

function unwrap<T>(res: { data?: { data?: T } | T }): T {
  const body = res.data as { data?: T };
  return (body?.data ?? res.data) as T;
}

export type FarmTask = {
  id: string;
  farmId: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  category: string;
  color?: string | null;
  dueDate?: string | null;
  scheduledDate?: string | null;
  completedAt?: string | null;
  hoursSpent?: number | null;
  assigneeUserId?: string | null;
  fieldId?: string | null;
  plantingId?: string | null;
  cattleId?: string | null;
  livestockId?: string | null;
  assignee?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  field?: { id: string; name: string } | null;
  planting?: { id: string; cropType?: { name: string }; field?: { name: string } } | null;
  cattle?: { id: string; tagNumber: string } | null;
  livestock?: { id: string; tagNumber: string; species?: string } | null;
  checklist?: { id?: string; label: string; done: boolean; assigneeUserId?: string | null; sortOrder?: number }[];
};

export type TaskStats = {
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  dueThisWeek: number;
};

export function useFarmTasks() {
  const [items, setItems] = useState<FarmTask[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async (filters?: Record<string, string>) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const q = new URLSearchParams(filters ?? {});
      const res = await api.get(`/farm-tasks/farm/${farmId}?${q.toString()}`);
      setItems(Array.isArray(unwrap(res)) ? unwrap(res) : []);
    } catch {
      toast.error("Could not load activities");
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
      const res = await api.get(`/farm-tasks/stats/${farmId}`);
      setStats(unwrap(res) as TaskStats);
    } catch {
      setStats(null);
    }
  }, []);

  const create = async (payload: Record<string, unknown>) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      toast.error("Select a farm first");
      return;
    }
    await api.post(`/farm-tasks/farm/${farmId}`, payload);
    toast.success("Activity saved");
    await fetchAll();
    await fetchStats();
  };

  const update = async (id: string, payload: Record<string, unknown>) => {
    await api.put(`/farm-tasks/${id}`, payload);
    toast.success("Activity updated");
    await fetchAll();
    await fetchStats();
  };

  const remove = async (id: string) => {
    await api.delete(`/farm-tasks/${id}`);
    toast.success("Activity deleted");
    await fetchAll();
    await fetchStats();
  };

  return { items, stats, loading, fetchAll, fetchStats, create, update, remove };
}

export async function fetchFarmTeamUsers(farmId: string) {
  if (!farmId) return [];
  const res = await api.get(`/users/${farmId}?pageSize=100`);
  const body = unwrap<any>(res);
  return Array.isArray(body?.users) ? body.users : Array.isArray(body) ? body : [];
}
