import { useEffect, useState } from 'react';
import DataTableV2, { TableColumnV2 } from '@/components/datatable';
import formatDateToLongForm from '@/utils/DateFormattter';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import { useMedicines } from '@/hooks/api/medicine';
import { isLoggedIn } from '@/hooks/api/auth';
import {
  canCreateEntity,
  canUpdateEntity,
  canDeleteEntity,
} from '@/utils/permissions';
import { getFarmId } from '@/utils/farmId';
import { toast } from 'react-hot-toast';
import { useSafeT } from '@/hooks/useSafeT';
import { useLocation, useNavigate } from '@/lib/router-compat';
import AddMedicineModal from './add_medicine';
import UpdateMedicineModal from './update_medicine';
import AddMedicineUsageModal from './add_usage';
import UpdateMedicineUsageModal from './update_usage';
import ConfirmDeleteModal from './delete';

type MedicineSubTab = 'stock' | 'usage';

const SUB_TABS: { key: MedicineSubTab; labelKey: string }[] = [
  { key: 'stock', labelKey: 'health.purchasesStock' },
  { key: 'usage', labelKey: 'health.usage' },
];

const MedicineRecords = () => {
  const { t } = useSafeT();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    medicines,
    usages,
    loading,
    getMedicines,
    getUsages,
    deleteMedicine,
    deleteUsage,
  } = useMedicines();

  const role = isLoggedIn()?.role ?? '';
  const farmId = getFarmId();
  const canCreate = canCreateEntity('medicines', role) && !!farmId;
  const canUpdate = canUpdateEntity('medicines', role);
  const canDelete = canDeleteEntity('medicines', role);
  const canCreateUsage = canCreateEntity('medicineUsages', role) && !!farmId;
  const canUpdateUsage = canUpdateEntity('medicineUsages', role);
  const canDeleteUsage = canDeleteEntity('medicineUsages', role);

  const searchParams = new URLSearchParams(location.search);
  const medicineTabParam = searchParams.get('medicineTab');
  const activeSubTab: MedicineSubTab =
    medicineTabParam === 'usage' ? 'usage' : 'stock';

  const setActiveSubTab = (key: MedicineSubTab) => {
    const next = new URLSearchParams(location.search);
    next.set('medicineTab', key);
    navigate({
      pathname: location.pathname,
      search: next.toString(),
    });
  };

  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [isUpdateMedicineOpen, setIsUpdateMedicineOpen] = useState(false);
  const [isAddUsageOpen, setIsAddUsageOpen] = useState(false);
  const [isUpdateUsageOpen, setIsUpdateUsageOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'medicine' | 'usage';
    row: any;
  } | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [selectedUsage, setSelectedUsage] = useState<any>(null);

  const handleRefetch = () => {
    getMedicines({ pageSize: 100 });
    getUsages({ pageSize: 100 });
  };

  useEffect(() => {
    handleRefetch();
  }, [farmId]);

  const medicineList = medicines?.data?.data ?? [];
  const usageList = usages?.data?.data ?? [];

  const unitLabel = (unit?: string) =>
    unit === 'LITERS' ? 'L' : unit === 'PIECES' ? 'pcs' : 'g';

  const medicineColumns: TableColumnV2<any>[] = [
    {
      title: 'Type',
      accessor: 'itemType',
      render: (row) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
            row?.itemType === 'TOOL'
              ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
          }`}
        >
          {row?.itemType === 'TOOL' ? 'Tool' : 'Medicine'}
        </span>
      ),
    },
    {
      title: 'Name',
      accessor: 'name',
      render: (row) => <p className="font-medium">{row?.name}</p>,
    },
    {
      title: 'Cures (disease)',
      accessor: 'diseaseName',
      render: (row) => (
        <p>{row?.itemType === 'TOOL' ? '—' : row?.diseaseName || '—'}</p>
      ),
    },
    {
      title: 'Qty on hand',
      accessor: 'quantity',
      render: (row) => (
        <p>
          {Number(row?.quantity).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}{' '}
          {unitLabel(row?.unit)}
        </p>
      ),
    },
    {
      title: 'Cost',
      accessor: 'cost',
      render: (row) => <p>{Number(row?.cost).toLocaleString()}</p>,
    },
    {
      title: 'Purchase date',
      accessor: 'purchaseDate',
      render: (row) => <p>{formatDateToLongForm(row?.purchaseDate)}</p>,
    },
    ...((canUpdate || canDelete)
      ? [
          {
            title: 'Actions',
            accessor: 'actions',
            render: (row: any) => (
              <div className="flex gap-2 justify-center">
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMedicine(row);
                      setIsUpdateMedicineOpen(true);
                    }}
                  >
                    <IconEdit className="text-primary" />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget({ type: 'medicine', row });
                      setIsDeleteOpen(true);
                    }}
                  >
                    <IconTrash className="text-danger" />
                  </button>
                )}
              </div>
            ),
          } as TableColumnV2<any>,
        ]
      : []),
  ];

  const usageColumns: TableColumnV2<any>[] = [
    {
      title: 'Date',
      accessor: 'date',
      render: (row) => <p>{formatDateToLongForm(row?.date)}</p>,
    },
    {
      title: 'Medicine',
      accessor: 'medicine.name',
      render: (row) => <p>{row?.medicine?.name}</p>,
    },
    {
      title: 'Tool used',
      accessor: 'tool.name',
      render: (row) => (
        <p>
          {row?.tool?.name
            ? `${row.tool.name}${
                row.toolQuantity != null
                  ? ` (${Number(row.toolQuantity).toLocaleString()} ${unitLabel(
                      row.tool.unit
                    )})`
                  : ''
              }`
            : '—'}
        </p>
      ),
    },
    {
      title: 'Cattle',
      accessor: 'cattle.tagNumber',
      render: (row) => (
        <p>
          {row?.cattle?.tagNumber}
          {row?.cattle?.breed ? ` (${row.cattle.breed})` : ''}
        </p>
      ),
    },
    {
      title: 'Qty used',
      accessor: 'quantity',
      render: (row) => (
        <p>
          {Number(row?.quantity).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}{' '}
          {unitLabel(row?.medicine?.unit)}
        </p>
      ),
    },
    {
      title: 'Disease',
      accessor: 'diseaseName',
      render: (row) => <p>{row?.diseaseName}</p>,
    },
    ...((canUpdateUsage || canDeleteUsage)
      ? [
          {
            title: 'Actions',
            accessor: 'actions',
            render: (row: any) => (
              <div className="flex gap-2 justify-center">
                {canUpdateUsage && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUsage(row);
                      setIsUpdateUsageOpen(true);
                    }}
                  >
                    <IconEdit className="text-primary" />
                  </button>
                )}
                {canDeleteUsage && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget({ type: 'usage', row });
                      setIsDeleteOpen(true);
                    }}
                  >
                    <IconTrash className="text-danger" />
                  </button>
                )}
              </div>
            ),
          } as TableColumnV2<any>,
        ]
      : []),
  ];

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'medicine') {
        await deleteMedicine(deleteTarget.row.id);
      } else {
        await deleteUsage(deleteTarget.row.id);
      }
      handleRefetch();
    } catch {
      /* toast shown */
    } finally {
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark">
        <li>
          <button type="button" className="hover:text-gray-500/70">
            Home
          </button>
        </li>
        <li className="before:content-['/'] before:px-1.5">
          <button
            type="button"
            className="text-black dark:text-white-light hover:text-black/70"
          >
            Medicine Records
          </button>
        </li>
      </ol>

      {!farmId && (
        <p className="text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
          Select a specific farm to record medicine purchases and usage.
        </p>
      )}

      <div className="mb-3 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex flex-wrap gap-1 -mb-px" aria-label="Medicine sections">
          {SUB_TABS.map((tab) => {
            const active = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSubTab(tab.key)}
                className={`px-3 py-1.5 text-sm font-semibold border-b-2 transition-colors ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>
      </div>

      {activeSubTab === 'stock' ? (
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
            {canCreate && (
              <button
                type="button"
                onClick={() => setIsAddMedicineOpen(true)}
                className="btn btn-primary btn-sm flex items-center gap-1"
              >
                <IconPlus />
                {t('health.addPurchase')}
              </button>
            )}
          </div>
          <DataTableV2
            columns={medicineColumns}
            data={medicineList}
            isLoading={loading}
            currentPage={medicines?.data?.currentPage ?? 1}
            total={medicines?.data?.total ?? medicineList.length}
            lastPage={medicines?.data?.lastPage ?? 1}
            previousPage={medicines?.data?.previousPage ?? 0}
            nextPage={medicines?.data?.nextPage ?? 0}
            tableName="Medicine & tool stock"
          />
        </div>
      ) : (
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
            {canCreateUsage && (
              <button
                type="button"
                onClick={() => {
                  const hasMedicine = medicineList.some(
                    (m: any) => (m.itemType ?? 'MEDICINE') !== 'TOOL'
                  );
                  if (!hasMedicine) {
                    toast.error('Record a medicine purchase first.');
                    return;
                  }
                  setIsAddUsageOpen(true);
                }}
                className="btn btn-primary btn-sm flex items-center gap-1"
              >
                <IconPlus />
                {t('health.recordUsage')}
              </button>
            )}
          </div>
          <DataTableV2
            columns={usageColumns}
            data={usageList}
            isLoading={loading}
            currentPage={usages?.data?.currentPage ?? 1}
            total={usages?.data?.total ?? usageList.length}
            lastPage={usages?.data?.lastPage ?? 1}
            previousPage={usages?.data?.previousPage ?? 0}
            nextPage={usages?.data?.nextPage ?? 0}
            tableName="Medicine usage"
          />
        </div>
      )}

      <AddMedicineModal
        isOpen={isAddMedicineOpen}
        onClose={() => setIsAddMedicineOpen(false)}
        handleRefetch={handleRefetch}
      />
      <UpdateMedicineModal
        isOpen={isUpdateMedicineOpen}
        onClose={() => {
          setIsUpdateMedicineOpen(false);
          setSelectedMedicine(null);
        }}
        medicine={selectedMedicine}
        handleRefetch={handleRefetch}
      />
      <AddMedicineUsageModal
        isOpen={isAddUsageOpen}
        onClose={() => setIsAddUsageOpen(false)}
        handleRefetch={handleRefetch}
        medicinesList={medicineList}
      />
      <UpdateMedicineUsageModal
        isOpen={isUpdateUsageOpen}
        onClose={() => {
          setIsUpdateUsageOpen(false);
          setSelectedUsage(null);
        }}
        usage={selectedUsage}
        handleRefetch={handleRefetch}
        medicinesList={medicineList}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        message={
          deleteTarget?.type === 'medicine'
            ? `Delete this ${
                deleteTarget.row?.itemType === 'TOOL' ? 'tool' : 'medicine'
              } and related usage records? Stock history will be removed.`
            : 'Delete this medicine usage? Medicine and tool stock will be restored.'
        }
      />
    </div>
  );
};

export default MedicineRecords;
