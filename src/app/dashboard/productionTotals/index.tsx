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
import { useProductionTransaction } from '@/hooks/api/production_totals';
import UpdateProductionTransactionModal from './updatePrice';
import { useSearchParams } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { canUpdateEntity } from '@/utils/permissions';

const ProductionTotals = () => {
    const [searchParams] = useSearchParams();
    const {
        production_transactions, 
        getProductionTransactions,
        loading, 
    }: any = useProductionTransaction();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] =
        useState<any | null>(null);
    const canUpdate = canUpdateEntity('productionTotals', isLoggedIn()?.role ?? '');

    useEffect(() => {
        getProductionTransactions(searchParams);
    }, [searchParams]);

    const handleRefetch = () => {
        getProductionTransactions();
    };

    const columns: TableColumnV2<any>[] = [
        {
            title: 'Product Type',
            accessor: 'productType',
            render: row => <p>{row.productType}</p>,
        },
        {
            title: 'Quantity (kg or Litres)',
            accessor: 'totalQuantity',
            render: row => <p>{row.totalQuantity}</p>,
        },
        {
            title: 'Price ',
            accessor: 'pricePerUnit',
            render: row => <p>{row.pricePerUnit}</p>,
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
                        Production Totals
                    </button>
                </li>
            </ol>
           

           
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
                    tableName={'Production Totals'}
                />
            </div>
        </div>
    );
};

export default ProductionTotals;
