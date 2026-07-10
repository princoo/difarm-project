import { useEffect, useState } from 'react';
import DataTableV2, { TableColumnV2 } from '@/components/datatable';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import { toast } from 'react-hot-toast';
import { useStockTransaction } from '@/hooks/api/stock_transactions';
import { get } from 'lodash';
import formatDateToLongForm from '@/utils/DateFormattter';
import AddStockTransactionModal from '../stock_transaction/add';
import UpdateProductionTransactionModal from './update';
import AddProductionTransactionModal from './add';
import { useProductionTransaction } from '@/hooks/api/production_transaction';
import { useSearchParams } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { canCreateEntity, canUpdateEntity } from '@/utils/permissions';

interface StockTransactionRecord {
    id: string;
    stockId: string;
    quantity: number;
    type: 'IN' | 'OUT';
    stock: any;

    date: string;
}

const ProductionTransactions = () => {
    const [searchParams] = useSearchParams();
    const {
        production_transactions,
        getProductionTransactions,
        createProductionTransaction,
        updateProductionTransaction,
        deleteProductionTransaction,
        loading,
        error,
    }: any = useProductionTransaction();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] =
        useState<StockTransactionRecord | null>(null);
    const role = isLoggedIn()?.role ?? '';
    const canCreate = canCreateEntity('productionTransactions', role);
    const canUpdate = canUpdateEntity('productionTransactions', role);

    useEffect(() => {
        getProductionTransactions(searchParams);
    }, [searchParams]);

    const handleRefetch = () => {
        getProductionTransactions();
    };
    const handleDelete = async () => {
        if (selectedTransaction) {
            try {
                await deleteProductionTransaction(selectedTransaction.id);
                getProductionTransactions();
            } catch (error) {
                toast.error('Failed to delete stock transaction');
            } finally {
                setIsDeleteModalOpen(false);
            }
        }
    };
    const columns: TableColumnV2<any>[] = [
        {
            title: 'Product Type',
            accessor: 'productType',
            render: row => <p>{row.productType}</p>,
        },
        {
            title: 'Total',
            accessor: 'total',
            render: row => <p>{row.total}</p>,
        },
        {
            title: 'Quantity',
            accessor: 'quantity',
            render: row => <p>{row.quantity}</p>,
        },
        {
            title: 'Value',
            accessor: 'value',
            render: row => <p>{row.value}</p>,
        },
        {
            title: 'Date',
            accessor: 'date',
            render: row => <p>{formatDateToLongForm(row.date)}</p>,
        },
        {
            title: 'Consumer',
            accessor: 'consumer',
            render: row => <p>{row.consumer}</p>,
        },
        ...(canUpdate
            ? [
                  {
                      title: 'Actions',
                      accessor: 'actions',
                      render: (row: any) => (
                          <div className="flex gap-2 justify-start">
                              <button
                                  onClick={() => {
                                      setSelectedTransaction(row);
                                      setIsUpdateModalOpen(true);
                                  }}
                                  className=""
                              >
                                  <IconEdit className="text-primary" />
                              </button>
                          </div>
                      ),
                  } as TableColumnV2<any>,
              ]
            : []),
    ];
    
    return (
        <div className="">
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark">
                <li>
                    <button className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Home
                    </button>
                </li>
                <li className="before:content-['/'] before:px-1.5">
                    <button className="text-black dark:text-white-light hover:text-black/70 dark:hover:text-white-light/70">
                        Productions Transaction
                    </button>
                </li>
            </ol>

            {canCreate && (
            <div className="flex flex-row justify-end gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary flex items-center gap-1"
                >
                    <IconPlus />
                    Add Transaction
                </button>
            </div>
            )}

            <AddProductionTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                handleRefetch={handleRefetch}
            />
            <UpdateProductionTransactionModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                transaction={selectedTransaction}
                handleRefetch={handleRefetch}
            />

            <div className="w-full">
                <DataTableV2
                    columns={columns}
                    data={production_transactions?.data?.data ?? []}
                    isLoading={loading}
                    currentPage={production_transactions?.data?.currentPage ?? 0}
                    total={production_transactions?.data?.total}
                    lastPage={production_transactions?.data?.totalPages + 1}
                    previousPage={production_transactions?.data?.previousPage}
                    nextPage={production_transactions?.data?.nextPage}
                    tableName={'Production Transactions'}
                />
            </div>
        </div>
    );
};

export default ProductionTransactions;
