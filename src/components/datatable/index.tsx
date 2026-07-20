import { ReactNode, useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { downloadExcel } from 'react-export-table-to-excel';
import IconFile from '@/components/Icon/IconFile';
import { useLocation, useNavigate } from '@/lib/router-compat';
import formatDateToLongForm from '@/utils/DateFormattter';


export type TableColumnV2<Entry> = {
    title: string;
    accessor: string;
    sortable?: boolean;
    textAlign?: string;
    render: (row: Entry, index: number) => ReactNode;
};

type DataTableProps<Entry> = {
    tableName: string; // New prop for table name
    columns: TableColumnV2<Entry>[];
    data: Entry[];
    total: number;
    currentPage: number;
    nextPage: number;
    previousPage: number;
    lastPage: number;
    isLoading: boolean;
    header?: JSX.Element;
    /** Extra controls on the same row as export buttons + search */
    actions?: ReactNode;
    /** Controls placed after export buttons (e.g. period filters) */
    toolbarLeading?: ReactNode;
    /** Content rendered between the toolbar and the table (e.g. summary cards) */
    beforeTable?: ReactNode;
};
export default function DataTableV2<Entry>(
    props: DataTableProps<Entry>
) {
    const all: any = 'View all';

    const PAGE_SIZES = [10, 20, 30, 50, 100, all];

    const [search, setSearch] = useState('');
    function handleDownloadExcel() {
        const tableName: string = `${
            props.tableName
        } - ${new Date().toLocaleString()}`;
        const fileName = 'table';
        const sheet = 'react-export-table-to-excel';

        const filteredColumns = props.columns.filter(
            column => column.accessor !== 'actions'
        );

        const formatDate = (date: string) => {
            const [year, month, day] = date.split('-');
            return `${day}-${month}-${year.slice(-2)}`;
        };

        const tablePayload = {
            header: filteredColumns.map(header => header.title),
            body: props.data.map(rowData => {
                const row: any = {};
                filteredColumns.forEach(column => {
                    const accessorKeys: any = column.accessor.split('.');
                    let value: any = rowData;
                    accessorKeys.forEach((key: string) => {
                        if (
                            value &&
                            typeof value === 'object' &&
                            value.hasOwnProperty(key)
                        ) {
                            if (
                                typeof value[key] === 'string' &&
                                value[key].match(/\d{4}-\d{2}-\d{2}/)
                            ) {
                                value[key] = formatDateToLongForm(value[key]);
                            }
                            value = value[key];
                        } else {
                            value = '';
                        }
                    });
                    row[column.title] = value || '';
                });
                return row;
            }),
        };

        downloadExcel({
            fileName: tableName,
            sheet,
            tablePayload,
        });
    }

    const exportTable = (type: any) => {
        const columns: any = props.columns
            .map(item => item.accessor)
            .filter(value => value !== 'actions');
        const filename = 'table';

        const newVariable: any = window.navigator;

        if (type === 'csv') {
            const coldelimiter = ';';
            const linedelimiter = '\n';
            let result = columns
                .map((d: any) => {
                    return capitalize(d);
                })
                .join(coldelimiter);
            result += linedelimiter;
            // eslint-disable-next-line array-callback-return
            props.data.map((item: any, index: any) => {
                // eslint-disable-next-line array-callback-return
                columns.map((d: any, index: any) => {
                    if (index > 0) {
                        result += coldelimiter;
                    }
                    const val = item[columns[index]];
                    result += val;
                });
                result += linedelimiter;
            });

            if (result == null) return;
            if (
                !result.match(/^data:text\/csv/i) &&
                !newVariable.msSaveOrOpenBlob
            ) {
                const data =
                    'data:application/csv;charset=utf-8,' +
                    encodeURIComponent(result);
                const link = document.createElement('a');
                link.setAttribute('href', data);
                link.setAttribute('download', filename + '.csv');
                link.click();
            } else {
                const blob = new Blob([result]);
                if (newVariable.msSaveOrOpenBlob) {
                    newVariable.msSaveBlob(blob, filename + '.csv');
                }
            }
        } else if (type === 'print') {
            let rowhtml = '<p>' + filename + '</p>';
            rowhtml +=
                '<table style="width: 100%; " cellpadding="0" cellcpacing="0"><thead><tr style="color: #515365; background: #eff5ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; "> ';
            // eslint-disable-next-line array-callback-return
            columns.map((d: any) => {
                rowhtml += '<th>' + capitalize(d) + '</th>';
            });
            rowhtml += '</tr></thead>';
            rowhtml += '<tbody>';

            // eslint-disable-next-line array-callback-return
            props.data.map((item: any) => {
                rowhtml += '<tr>';
                // eslint-disable-next-line array-callback-return
                columns.map((d: any, index: any) => {
                    const val = item[columns[index]];
                
                    rowhtml += '<td>' + val + '</td>';
                });
                rowhtml += '</tr>';
            });
            rowhtml +=
                '<style>body {font-family:Arial; color:#495057;}p{text-align:center;font-size:18px;font-weight:bold;margin:15px;}table{ border-collapse: collapse; border-spacing: 0; }th,td{font-size:12px;text-align:left;padding: 4px;}th{padding:8px 4px;}tr:nth-child(2n-1){background:#f7f7f7; }</style>';
            rowhtml += '</tbody></table>';
            const winPrint: any = window.open(
                '',
                '',
                'left=0,top=0,width=1000,height=600,toolbar=0,scrollbars=0,status=0'
            );
            winPrint.document.write('<title>Print</title>' + rowhtml);
            winPrint.document.close();
            winPrint.focus();
            winPrint.print();
        } else if (type === 'txt') {
            const coldelimiter = ',';
            const linedelimiter = '\n';
            let result = columns
                .map((d: any) => {
                    return capitalize(d);
                })
                .join(coldelimiter);
            result += linedelimiter;
            // eslint-disable-next-line array-callback-return
            props.data.map((item: any) => {
                // eslint-disable-next-line array-callback-return
                columns.map((d: any, index: any) => {
                    if (index > 0) {
                        result += coldelimiter;
                    }
                    const val = item[columns[index]];
                    result += val;
                });
                result += linedelimiter;
            });

            if (result == null) return;
            if (
                !result.match(/^data:text\/txt/i) &&
                !newVariable.msSaveOrOpenBlob
            ) {
                const data1 =
                    'data:application/txt;charset=utf-8,' +
                    encodeURIComponent(result);
                const link1 = document.createElement('a');
                link1.setAttribute('href', data1);
                link1.setAttribute('download', filename + '.txt');
                link1.click();
            } else {
                const blob1 = new Blob([result]);
                if (newVariable.msSaveOrOpenBlob) {
                    newVariable.msSaveBlob(blob1, filename + '.txt');
                }
            }
        }
    };

    const capitalize = (text: any) => {
        return text
            .replace('_', ' ')
            .replace('-', ' ')
            .toLowerCase()
            .split(' ')
            .map((s: any) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');
    };

    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const [paginate, setPaginate] = useState({
        pageNumber: queryParams.get('page')
            ? Number(queryParams.get('page'))
            : 1,
        pageSize: queryParams.get('pageSize')
            ? Number(queryParams.get('pageSize'))
            : 10,
    });

    const updateQueryParams = (params: {
        pageNumber: number;
        pageSize: number;
    }) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('page', params.pageNumber.toString());
        searchParams.set('pageSize', params.pageSize.toString());
        searchParams.set('search', search.toString());
        const newSearch = searchParams.toString();
        const nextUrl = `${location.pathname}?${newSearch}`;
        const currentUrl = `${location.pathname}${location.search}`;
        if (nextUrl === currentUrl) return;
        navigate(nextUrl);
    };

    function onClickFirstPage() {
        setPaginate((prev: any) => {
            return {
                ...prev,
                pageNumber: 1,
            };
        });
    }

    function onClickLastPage() {
        setPaginate((prev: any) => {
            return {
                ...prev,
                pageNumber: props.lastPage,
            };
        });
    }

    function onClickPage(page: number) {
        setPaginate((prev: any) => {
            return {
                ...prev,
                pageNumber: page,
            };
        });
    }

    function onpageSizeChange(pageSize: number | string) {
        if (pageSize === 'View all') {
            setPaginate((prev: any) => ({
                ...prev,
                pageSize: props.total,
                pageNumber: 1,
            }));
        } else {
            setPaginate((prev: any) => ({
                ...prev,
                pageSize: Number(pageSize),
            }));
        }
    }

    useEffect(() => {
        updateQueryParams({
            pageNumber: paginate.pageNumber,
            pageSize: paginate.pageSize,
        });
    }, [paginate, search]);

    return (
        <div>
            <div className="panel">
                {props.header}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3 px-3 py-2.5 bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => exportTable('csv')}
                            className="btn btn-primary btn-sm flex items-center gap-1.5"
                        >
                            <IconFile className="w-4 h-4" />
                            <span>CSV</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => exportTable('txt')}
                            className="btn btn-primary btn-sm flex items-center gap-1.5"
                        >
                            <IconFile className="w-4 h-4" />
                            <span>TXT</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm flex items-center gap-1.5"
                            onClick={handleDownloadExcel}
                        >
                            <IconFile className="w-4 h-4" />
                            <span>EXCEL</span>
                        </button>
                        {props.toolbarLeading}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end">
                        <input
                            type="text"
                            className="form-input w-full sm:w-48 lg:w-56 py-1.5 px-2 text-sm border rounded"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {props.actions}
                    </div>
                </div>
                {props.beforeTable}


                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={props.data}
                        fetching={props.isLoading}
                        columns={[
                            {
                                title: '#',
                                accessor: '',
                                sortable: false,
                                render: (_, index) => (
                                    <p>
                                        {paginate.pageSize * props.currentPage -
                                            paginate.pageSize +
                                            index +
                                            1}
                                    </p>
                                ),
                            },
                            ...props.columns,
                        ]}
                        totalRecords={props.total}
                        recordsPerPage={paginate.pageSize}
                        page={props.currentPage}
                        onPageChange={p => onClickPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={e => onpageSizeChange(e)}
                        minHeight={200}
                        loaderSize="sm"
                        loaderVariant="dots"
                        loaderColor="#4BC2C2"
                        loaderBackgroundBlur={2}
                        paginationText={({ from, to, totalRecords }) =>
                            `Showing  ${from} to ${to} of ${totalRecords} entries`
                        }
                    />
                    {/* <MantineReactTable table={table} /> */}
                </div>
            </div>
        </div>
    );
}
