import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import IconEdit from "@/components/Icon/IconEdit";
import IconPlus from "@/components/Icon/IconPlus";
import IconTrash from "@/components/Icon/IconTrash";
import { useWasteLog } from "@/hooks/api/waste";
import formatDateToLongForm from "@/utils/DateFormattter";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import AddWasteLogModal from "./add";
import UpdateWasteLogModal from "./update";
import ConfirmDeleteModal from "./delete";
import { useSearchParams } from "@/lib/router-compat";
import { isLoggedIn } from "@/hooks/api/auth";
import { canCreateEntity, canUpdateEntity, canDeleteEntity } from "@/utils/permissions";

interface WasteLogRecord {
    id: string;
    type: string;
    quantity: number;
    date: string;
}

const WasteLogManagement = () => {
    const [searchParams] = useSearchParams();
    const { createWasteLog, updateWasteLog, deleteWasteLog, loading, error, getWasteLogs, wasteLogs }:any = useWasteLog();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedWasteLog, setSelectedWasteLog] = useState<WasteLogRecord | null>(null);
    const role = isLoggedIn()?.role ?? '';
    const canCreate = canCreateEntity('wasteLogs', role);
    const canUpdate = canUpdateEntity('wasteLogs', role);
    const canDelete = canDeleteEntity('wasteLogs', role);

    const handleRefresh = () => {
        getWasteLogs();
    };

    const handleDelete = async () => {
        if (selectedWasteLog) {
            try {
                await deleteWasteLog(selectedWasteLog.id);
                getWasteLogs();
            } catch (error) {
                toast.error('Failed to delete waste log');
            } finally {
                setIsDeleteModalOpen(false);
            }
        }
    };

    useEffect(() => {
        getWasteLogs(searchParams);
    }, [searchParams]);

    const columns: TableColumnV2<WasteLogRecord>[] = [
        {
            title: 'Type',
            accessor: 'type',
            render: row => <p>{row?.type}</p>,
        },
        {
            title: 'Quantity (kg or liters)',
            accessor: 'quantity',
            render: row => <p>{row?.quantity}</p>,
        },
        {
            title: 'Date',
            accessor: 'date',
            render: row => <p>{formatDateToLongForm(row?.date)}</p>,
        },
        ...(canUpdate || canDelete
            ? [
                  {
                      title: 'Actions',
                      accessor: 'actions',
                      render: (row: WasteLogRecord) => (
                          <div className="flex gap-2 justify-start">
                              {canUpdate && (
                                  <button
                                      onClick={() => {
                                          setSelectedWasteLog(row);
                                          setIsUpdateModalOpen(true);
                                      }}
                                      className=""
                                  >
                                      <IconEdit className="text-primary" />
                                  </button>
                              )}
                              {canDelete && (
                                  <button
                                      onClick={() => {
                                          setSelectedWasteLog(row);
                                          setIsDeleteModalOpen(true);
                                      }}
                                      className=""
                                  >
                                      <IconTrash className="text-danger" />
                                  </button>
                              )}
                          </div>
                      ),
                  } as TableColumnV2<WasteLogRecord>,
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
                        Waste Logs
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
                    Add Waste Log
                </button>
            </div>
            )}

            <AddWasteLogModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                handleRefetch={handleRefresh}
            />
            <UpdateWasteLogModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                wasteLog={selectedWasteLog}
                handleRefetch={handleRefresh}
            />
            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            />

            <div className="w-full">
                <DataTableV2
                    columns={columns}
                    data={wasteLogs?.data?.data ?? []}
                    isLoading={loading}
                    currentPage={wasteLogs?.data?.currentPage ?? 0}
                    total={wasteLogs?.data?.total}
                    lastPage={wasteLogs?.data?.totalPages + 1}
                    previousPage={wasteLogs?.data?.previousPage}
                    nextPage={wasteLogs?.data?.nextPage}
                    tableName={'Waste Logs'}
                />
            </div>
        </div>
    );
};

export default WasteLogManagement;
