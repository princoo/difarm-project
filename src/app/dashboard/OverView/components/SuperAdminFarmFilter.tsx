'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFarms } from '@/hooks/api/farms';
import {
  ALL_FARMS_SCOPE,
  clearFarmId,
  getFarmId,
  setFarmId,
} from '@/utils/farmId';

type FarmOption = { id: string; name: string; status?: boolean };

type Props = {
  /** Called after the selected farm scope changes */
  onChange?: (scope: string) => void;
  className?: string;
};

/**
 * Super-admin farm filter: "All farms" or a specific farm.
 * Persists selection via FarmId (cleared when All farms).
 */
export default function SuperAdminFarmFilter({ onChange, className }: Props) {
  const { farms, loading, fetchFarms } = useFarms({ autoFetch: true });
  const [value, setValue] = useState<string>(() => getFarmId() ?? ALL_FARMS_SCOPE);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  // Keep in sync if FarmId changes elsewhere (e.g. Farms list "view")
  useEffect(() => {
    const sync = () => setValue(getFarmId() ?? ALL_FARMS_SCOPE);
    window.addEventListener('storage', sync);
    window.addEventListener('difarm-farm-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('difarm-farm-changed', sync);
    };
  }, []);

  const options: FarmOption[] = useMemo(() => {
    const list = Array.isArray(farms?.data)
      ? farms.data
      : farms?.data?.data ?? [];
    if (!Array.isArray(list)) return [];
    return list.map((f: any) => ({
      id: f.id,
      name: f.name || 'Unnamed farm',
      status: f.status,
    }));
  }, [farms]);

  const handleChange = (next: string) => {
    setValue(next);
    if (next === ALL_FARMS_SCOPE) {
      clearFarmId();
    } else {
      setFarmId(next);
    }
    onChange?.(next);
  };

  return (
    <div className={className}>
      <label htmlFor="sa-farm-filter" className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
        Farm filter
      </label>
      <select
        id="sa-farm-filter"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="form-select min-w-[220px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value={ALL_FARMS_SCOPE}>All farms</option>
        {options.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
            {f.status === false ? ' (inactive)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
