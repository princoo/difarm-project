import { useState, useEffect } from 'react';
import DataTableV2, { TableColumnV2 } from '@/components/datatable';
import formatDateToLongForm from '@/utils/DateFormattter';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import { toast } from 'react-hot-toast';
import { useVaccineRecords } from '@/hooks/api/vaccinr';
import AddVaccineRecordModal from './add_vaccine';
import UpdateVaccineModal from './update_vaccine';
import { useSearchParams } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { canCreateEntity, canUpdateEntity } from '@/utils/permissions';
import { resolveApiBaseURL } from '@/hooks/api';


const VaccineRecords = () => {
    const [searchParams] = useSearchParams();
    const { vaccineRecords, loading, getVaccineRecords, deleteVaccineRecord }: any = useVaccineRecords();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>({});
    const role = isLoggedIn()?.role ?? '';
    const canCreate = canCreateEntity('vaccinations', role);
    const canUpdate = canUpdateEntity('vaccinations', role);

    useEffect(() => {
        getVaccineRecords(searchParams);
    }, [searchParams]);

    const handleDelete = async () => {
        try {
            await deleteVaccineRecord(selectedRecord?.id);
            toast.success('Vaccine record deleted successfully');
            getVaccineRecords();
        } catch (error) {
            toast.error('Failed to delete vaccine record');
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const handleRefetch = () => {
        getVaccineRecords();
    };

    const columns: TableColumnV2<any>[] = [
        {
            title: 'Cattle ',
            accessor: 'cattle.tagNumber',
            render: row => <p>{row?.cattle.breed}({row?.cattle.tagNumber})</p>,
        },
        {
            title: 'Date',
            accessor: 'date',
            render: row => <p>{formatDateToLongForm(row?.date)}</p>,
        },
        {
            title: 'Vaccine Type',
            accessor: 'vaccineType',
            render: row => <p>{row?.vaccineType}</p>,
        },
        {
            title: 'Vaccine price',
            accessor: 'price',
            render: row => <p>{row?.price}</p>,
        },
        {
            title: 'Veterinarian ',
            accessor: 'vet.name',
            render: row => <p>{row?.veterinarian?.name}</p>,
        },
        {
            title: 'Veterinarian Email',
            accessor: 'vet.email',
            render: row => <p>{row?.veterinarian?.email}</p>,
        },
        {
            title: 'Document',
            accessor: 'documentUrl',
            render: (row) => {
                if (!row?.documentUrl) {
                    return <p className="text-gray-400">—</p>;
                }
                const href = `${resolveApiBaseURL()}${row.documentUrl}`;
                return (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm font-medium"
                        title={row.documentName || 'View scanned document'}
                    >
                        {row.documentName ? 'View scan' : 'View document'}
                    </a>
                );
            },
        },
        ...(canUpdate
            ? [
                  {
                      title: 'Actions',
                      accessor: 'actions',
                      render: (row: any) => (
                          <div className="flex gap-2 justify-center">
                              <button
                                  onClick={() => {
                                      setSelectedRecord(row);
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
                        Vaccine Records
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
                    Add Vaccine Record
                </button>
            </div>
            )}

            <AddVaccineRecordModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                handleRefetch={handleRefetch}
            />
            <UpdateVaccineModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                vaccine={selectedRecord}
                handleRefetch={handleRefetch}
            />
          

            <div className="w-full">
                <DataTableV2
                    columns={columns}
                    data={vaccineRecords?.data?.data ?? []}
                    isLoading={loading}
                    currentPage={vaccineRecords?.data?.currentPage ?? 0}
                    total={vaccineRecords?.data?.total}
                    lastPage={vaccineRecords?.data?.totalPages + 1}
                    previousPage={vaccineRecords?.data?.previousPage}
                    nextPage={vaccineRecords?.data?.nextPage}
                    tableName={'Vaccine Records'}
                />
            </div>
        </div>
    );
};

export default VaccineRecords;
