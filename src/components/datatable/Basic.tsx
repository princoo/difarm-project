import { setPageTitle } from "@/store/themeConfigSlice";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const Basic = ({rowData}:any) => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle(' Table'));
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const initialRecords = rowData.slice(0, pageSize);
    const [recordsData, setRecordsData] = useState(initialRecords);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(rowData.slice(from, to));
    }, [page, pageSize]);


    return (
        <div>
            
            <div className="panel mt-6">
                <h5 className="font-semibold text-lg dark:text-white-light mb-5">Title</h5>
                <div className="datatables">
                    <DataTable
                        noRecordsText="No results match your search query"
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'id', title: 'ID' },
                            { accessor: 'firstName', title: 'First Name' },
                            { accessor: 'lastName', title: 'Last Name' },
                            { accessor: 'email' },
                            { accessor: 'phone' },
                        ]}
                        totalRecords={rowData.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }:any) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </div>
    );
};

export default Basic;
