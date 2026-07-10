import { useEffect, useState } from 'react';
import DataTableV2, { TableColumnV2 } from '@/components/datatable';
import { capitalize } from 'lodash';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import { toast } from 'react-hot-toast';
import { useVeterinarians } from '@/hooks/api/vet';
import AddVeterinaryModal from './add_vet';
import UpdateVeterinarianModal from './update_vet';
import ConfirmDeleteModal from './delete';
import { useSearchParams } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { canCreateEntity, canUpdateEntity } from '@/utils/permissions';

const Veterinarians = () => {
    const [searchParams] = useSearchParams();
    const { veterinarians, loading, deleteVeterinarian,getVeterinarians } :any= useVeterinarians();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedVeterinarian, setSelectedVeterinarian] = useState<any>({});
    const role = isLoggedIn()?.role ?? '';
    const canCreate = canCreateEntity('veterinarians', role);
    const canUpdate = canUpdateEntity('veterinarians', role);

  
    const handleDelete = async () => {
        try {
            await deleteVeterinarian(selectedVeterinarian?.id);
            toast.success('Veterinarian deleted successfully');
            getVeterinarians()
        } catch (error) {
            toast.error('Failed to delete veterinarian');
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const handleRefetch = () => {
        getVeterinarians();
    };
    useEffect(() => {
        getVeterinarians(searchParams)
    }, [searchParams])
    

    const columns: TableColumnV2<any>[] = [
        {
            title: 'Full Name',
            accessor: 'name',
            render: row => <p>{row?.name}</p>,
        },
        
        {
            title: 'Email',
            accessor: 'email',
            render: row => <p>{row?.email}</p>,
        },
        
        {
            title: 'Phone',
            accessor: 'phone',
            render: row => <p>{row?.phone}</p>,
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
                                      setSelectedVeterinarian(row);
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
                        Veterinarians
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
                    Add Veterinarian
                </button>
            </div>
            )}

            <AddVeterinaryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                handleRefetch={handleRefetch}
            />
            <UpdateVeterinarianModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                vet={selectedVeterinarian}
                handleRefetch={handleRefetch}
            />
            {/* <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            /> */}

            <div className="w-full">
                <DataTableV2
                    columns={columns}
                    data={veterinarians?.data?.data ?? []}
                    isLoading={loading}
                    currentPage={veterinarians?.data?.currentPage ?? 0}
                    total={veterinarians?.data?.total}
                    lastPage={veterinarians?.data?.totalPages + 1}
                    previousPage={veterinarians?.data?.previousPage}
                    nextPage={veterinarians?.data?.nextPage}
                    tableName={'Veterinarians'}
                />
            </div>
        </div>
    );
};

export default Veterinarians;
