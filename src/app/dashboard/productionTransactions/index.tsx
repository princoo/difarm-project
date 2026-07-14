import { useEffect, useState } from 'react';
import DataTableV2, { TableColumnV2 } from '@/components/datatable';
import IconPlus from '@/components/Icon/IconPlus';
import formatDateToLongForm from '@/utils/DateFormattter';
import AddProductionTransactionModal, {
  SaleDraft,
} from './add';
import {
  DailySaleRow,
  useProductionTransaction,
} from '@/hooks/api/production_transaction';
import { isLoggedIn } from '@/hooks/api/auth';
import { getFarmId } from '@/utils/farmId';
import { canCreateEntity } from '@/utils/permissions';
import ProductionTabs from '../production/ProductionTabs';
import { toast } from 'react-hot-toast';

const ProductionTransactions = () => {
  const { dailySales, getDailySales, loading }: any =
    useProductionTransaction();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saleDraft, setSaleDraft] = useState<SaleDraft | null>(null);
  const role = isLoggedIn()?.role ?? '';
  const [farmId, setFarmIdState] = useState<string | null>(() => getFarmId());
  const canCreateRole = canCreateEntity('productionTransactions', role);
  const canCreate = canCreateRole && !!farmId;

  useEffect(() => {
    const syncFarm = () => setFarmIdState(getFarmId());
    window.addEventListener('difarm-farm-changed', syncFarm);
    return () => window.removeEventListener('difarm-farm-changed', syncFarm);
  }, []);

  useEffect(() => {
    getDailySales();
  }, [farmId]);

  const handleRefetch = () => {
    getDailySales();
  };

  const openSell = (row?: DailySaleRow) => {
    if (!farmId) {
      toast.error('Select a specific farm before recording a sale.');
      return;
    }
    if (row && row.farmId !== farmId) {
      toast.error('Switch to that farm to record this sale.');
      return;
    }
    if (row && row.remaining <= 0) {
      toast.error('Nothing left unsold for this day.');
      return;
    }
    if (row && (!row.pricePerUnit || row.pricePerUnit <= 0)) {
      toast.error('Set the sale price on Production Overview first.');
      return;
    }
    setSaleDraft(
      row
        ? {
            date: row.date,
            productType: row.productType,
            remaining: row.remaining,
            pricePerUnit: row.pricePerUnit,
          }
        : null
    );
    setIsAddModalOpen(true);
  };

  const columns: TableColumnV2<DailySaleRow>[] = [
    {
      title: 'Date',
      accessor: 'date',
      render: (row) => <p>{formatDateToLongForm(row.date)}</p>,
    },
    ...(!farmId
      ? [
          {
            title: 'Farm',
            accessor: 'farmName',
            render: (row: DailySaleRow) => <p>{row.farmName ?? '—'}</p>,
          } as TableColumnV2<DailySaleRow>,
        ]
      : []),
    {
      title: 'Product',
      accessor: 'productType',
      render: (row) => <p>{row.productType}</p>,
    },
    {
      title: 'Produced',
      accessor: 'produced',
      render: (row) => <p>{row.produced}</p>,
    },
    {
      title: 'Sold',
      accessor: 'sold',
      render: (row) => <p>{row.sold}</p>,
    },
    {
      title: 'Remaining',
      accessor: 'remaining',
      render: (row) => <p>{row.remaining}</p>,
    },
    {
      title: 'Sale value',
      accessor: 'saleValue',
      render: (row) => <p>{Number(row.saleValue).toLocaleString()}</p>,
    },
    {
      title: 'Paid',
      accessor: 'amountPaid',
      render: (row) => <p>{Number(row.amountPaid).toLocaleString()}</p>,
    },
    {
      title: 'Unpaid',
      accessor: 'unpaid',
      render: (row) => (
        <p className={row.unpaid > 0 ? 'text-amber-600 font-semibold' : ''}>
          {Number(row.unpaid).toLocaleString()}
        </p>
      ),
    },
    ...(canCreate
      ? [
          {
            title: 'Actions',
            accessor: 'actions',
            render: (row: DailySaleRow) => (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={row.remaining <= 0 || !row.pricePerUnit}
                onClick={() => openSell(row)}
              >
                Sell
              </button>
            ),
          } as TableColumnV2<DailySaleRow>,
        ]
      : []),
  ];

  return (
    <div className="">
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark">
        <li>
          <button
            type="button"
            className="hover:text-gray-500/70 dark:hover:text-white-dark/70"
          >
            Home
          </button>
        </li>
        <li className="before:content-['/'] before:px-1.5">
          <button
            type="button"
            className="text-black dark:text-white-light hover:text-black/70 dark:hover:text-white-light/70"
          >
            Production
          </button>
        </li>
      </ol>

      <ProductionTabs />

      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Daily totals from production records — sell and track paid amounts per
          day.
        </p>
        {canCreateRole && (
          <div className="flex flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => openSell()}
              className="btn btn-primary flex items-center gap-1"
              disabled={!farmId}
              title={
                !farmId
                  ? 'Select a specific farm to record a sale'
                  : 'Record a sale'
              }
            >
              <IconPlus />
              Add Sale
            </button>
          </div>
        )}
      </div>

      {!farmId && canCreateRole && (
        <p className="mb-3 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
          Viewing all farms. Select a specific farm to record sales.
        </p>
      )}

      <AddProductionTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSaleDraft(null);
        }}
        handleRefetch={handleRefetch}
        draft={saleDraft}
      />

      <div className="w-full">
        <DataTableV2
          columns={columns}
          data={dailySales ?? []}
          isLoading={loading}
          currentPage={1}
          total={dailySales?.length ?? 0}
          lastPage={1}
          previousPage={0}
          nextPage={0}
          tableName={'Daily production sales'}
        />
      </div>
    </div>
  );
};

export default ProductionTransactions;
