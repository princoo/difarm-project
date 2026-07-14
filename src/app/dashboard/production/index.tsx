import { useEffect, useState } from 'react';
import DataTableV2, { TableColumnV2 } from '@/components/datatable';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import { toast } from 'react-hot-toast';
import AddProductionModal from './create_prod';
import UpdateProduction from './update_prod';
import { useProduction } from '@/hooks/api/productions';
import { useProductionTransaction as useProductionTotals } from '@/hooks/api/production_totals';
import formatDateToLongForm from '@/utils/DateFormattter';
import ConfirmDeleteModal from './delete';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { getFarmId } from '@/utils/farmId';
import { canCreateEntity, canUpdateEntity, canDeleteEntity } from '@/utils/permissions';
import ProductionTabs from './ProductionTabs';
import UpdateProductionPriceModal from '../productionTotals/updatePrice';

interface ProductionRecord {
  id: string;
  farm: any;
  cattleId: string;
  productName: string;
  quantity: number;
  productionDate: string;
  expirationDate: string;
  cattle: any;
}

const Production = () => {
  const [searchParams] = useSearchParams();
  const { deleteProduction, loading, getProductions, productions }: any =
    useProduction();
  const {
    production_transactions: productionTotals,
    getProductionTransactions: getProductionTotals,
    loading: totalsLoading,
  }: any = useProductionTotals();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] =
    useState<ProductionRecord | null>(null);
  const [selectedTotal, setSelectedTotal] = useState<any | null>(null);
  const [farmId, setFarmIdState] = useState<string | null>(() => getFarmId());
  const role = isLoggedIn()?.role ?? '';
  const canCreate = canCreateEntity('production', role);
  const canUpdate = canUpdateEntity('production', role);
  const canDelete = canDeleteEntity('production', role);
  const canUpdateTotals = canUpdateEntity('productionTotals', role) && !!farmId;

  const openAddProduction = () => {
    if (!farmId) {
      toast.error('Select a specific farm before recording production.');
      return;
    }
    setIsAddModalOpen(true);
  };

  const totalsList: any[] = productionTotals?.data?.data ?? [];

  useEffect(() => {
    const syncFarm = () => setFarmIdState(getFarmId());
    window.addEventListener('difarm-farm-changed', syncFarm);
    return () => window.removeEventListener('difarm-farm-changed', syncFarm);
  }, []);

  useEffect(() => {
    getProductions(searchParams);
    getProductionTotals();
  }, [searchParams, farmId]);

  const handleDelete = async () => {
    if (selectedProduction) {
      try {
        await deleteProduction(selectedProduction.id);
        getProductions();
        getProductionTotals();
      } catch (error) {
        toast.error('Failed to delete production');
      } finally {
        setIsDeleteModalOpen(false);
      }
    }
  };

  const handleRefetch = () => {
    getProductions();
    getProductionTotals();
  };

  const columns: TableColumnV2<ProductionRecord>[] = [
    {
      title: 'Cattle Tag',
      accessor: 'cattle.tagNumber',
      render: (row) => <p>{row?.cattle?.tagNumber}</p>,
    },
    {
      title: 'Cattle Breed',
      accessor: 'cattle.breed',
      render: (row) => <p>{row.cattle.breed}</p>,
    },
    {
      title: 'Product Name',
      accessor: 'productName',
      render: (row) => <p>{row.productName}</p>,
    },
    {
      title: 'Quantity',
      accessor: 'quantity',
      render: (row) => <p>{row.quantity}</p>,
    },
    {
      title: 'Production Date',
      accessor: 'productionDate',
      render: (row) => <p>{formatDateToLongForm(row.productionDate)}</p>,
    },
    {
      title: 'Expiration Date',
      accessor: 'expirationDate',
      render: (row) => <p>{formatDateToLongForm(row.expirationDate)}</p>,
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: 'Actions',
            accessor: 'actions',
            render: (row: ProductionRecord) => (
              <div className="flex gap-2 justify-center">
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduction(row);
                      setIsUpdateModalOpen(true);
                    }}
                  >
                    <IconEdit className="text-primary" />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduction(row);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <TrashIcon className="text-danger w-5 h-5" />
                  </button>
                )}
              </div>
            ),
          } as TableColumnV2<ProductionRecord>,
        ]
      : []),
  ];

  return (
    <div className="">
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark">
        <li>
          <button type="button" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
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

      {/* Stock on hand from ProductionTotals — shown on Overview instead of a separate tab */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Stock on hand
        </h3>
        {totalsLoading && totalsList.length === 0 ? (
          <p className="text-sm text-gray-500">Loading totals…</p>
        ) : totalsList.length === 0 ? (
          <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-6 text-center">
            No production totals yet. Record milking or other production below.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {totalsList.map((row: any) => (
              <div
                key={row.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {row.productType}
                  </p>
                  {canUpdateTotals && (
                    <button
                      type="button"
                      className="text-primary"
                      title="Edit sale price"
                      onClick={() => {
                        setSelectedTotal(row);
                        setIsPriceModalOpen(true);
                      }}
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {row.totalQuantity ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Available (kg / litres)
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  Sale price:{' '}
                  <span className="font-semibold">
                    {row.pricePerUnit != null
                      ? `${Number(row.pricePerUnit).toLocaleString()} / unit`
                      : 'Not set'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {canCreate && (
        <div className="flex flex-col items-end gap-2 mb-2">
          {!farmId && (
            <p className="text-sm text-amber-700 dark:text-amber-200 w-full sm:w-auto text-left sm:text-right">
              Select a specific farm to record production.
            </p>
          )}
          <button
            type="button"
            onClick={openAddProduction}
            className="btn btn-primary flex items-center gap-1"
            title={
              !farmId
                ? 'Select a specific farm to record production'
                : 'Add production'
            }
          >
            <IconPlus />
            Add Production
          </button>
        </div>
      )}

      <AddProductionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        handleRefetch={handleRefetch}
      />
      <UpdateProduction
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        production={selectedProduction}
        handleRefetch={handleRefetch}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
      <UpdateProductionPriceModal
        isOpen={isPriceModalOpen}
        onClose={() => {
          setSelectedTotal(null);
          setIsPriceModalOpen(false);
        }}
        transaction={selectedTotal}
        handleRefetch={handleRefetch}
      />

      <div className="w-full">
        <DataTableV2
          columns={columns}
          data={productions?.data?.data ?? []}
          isLoading={loading}
          currentPage={productions?.data?.currentPage ?? 0}
          total={productions?.data?.total}
          lastPage={productions?.data?.totalPages + 1}
          previousPage={productions?.data?.previousPage}
          nextPage={productions?.data?.nextPage}
          tableName={'Production records'}
        />
      </div>
    </div>
  );
};

export default Production;
