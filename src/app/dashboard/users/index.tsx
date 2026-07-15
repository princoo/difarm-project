import { useEffect, useState, useMemo } from 'react';
import DataTableV2, { TableColumnV2 } from '@/components/datatable';
import { capitalize } from 'lodash';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import { toast } from 'react-hot-toast';
import { useUsers, useFetchUsers, isLoggedIn, activateAccount, useAdminTeam } from '@/hooks/api/auth';
import { api } from '@/hooks/api';
import { canActivateAccount, canCreateEntity, roleLabel } from '@/utils/permissions';
import { useActivityLogs, useActivityLogsFarm } from '@/hooks/api/activityLog';
import AddUserModal from './add_user';
import UpdateUserModal from './update_user';
import SetPasswordModal from './set_password';
import AddVeterinarianModal from './add_veterinarian';
import ConfirmDeleteModal from './delete';
import UserAvatar from './UserAvatar';
import { useNavigate } from '@/lib/router-compat';
import { MagnifyingGlassIcon, FunnelIcon, EnvelopeIcon, PhoneIcon, DocumentTextIcon, XMarkIcon, Squares2X2Icon, TableCellsIcon, KeyIcon } from '@heroicons/react/24/outline';

type UsersViewMode = 'cards' | 'table';
const USERS_VIEW_KEY = 'difarm-users-view';

const ROLES = ['', 'SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'] as const;
const LOG_ACTIONS = ['', 'LOGIN', 'LOGOUT', 'CREATE_FARM', 'ACTIVATE_FARM', 'CREATE_USER', 'ACTIVATE_ACCOUNT', 'UPDATE_USER', 'DELETE_USER', 'CREATE_VETERINARIAN', 'OTHER'] as const;
const LOG_ENTITY_TYPES: { value: string; label: string }[] = [
    { value: '', label: 'All entity types' },
    { value: 'account', label: 'Account' },
    { value: 'auth', label: 'Auth' },
    { value: 'farm', label: 'Farm' },
    { value: 'user', label: 'User' },
];
const STATUS_OPTIONS = [{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' }];

const Users = () => {
    const navigate = useNavigate();
    const user = isLoggedIn();
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const hasFullUsersUI = isSuperAdmin || isAdmin;
    const { users: farmUsers, loading: farmLoading, refetch } = useUsers();
    const { users: allUsers, loading: allLoading, fetchUsers } = useFetchUsers();
    const { team: adminTeam, loading: teamLoading, fetchTeam } = useAdminTeam();
    const { logs: logsAll, loading: logsLoadingAll, fetchLogs: fetchLogsAll } = useActivityLogs();
    const { logs: logsFarm, loading: logsLoadingFarm, fetchLogs: fetchLogsFarm } = useActivityLogsFarm();
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isVetModalOpen, setIsVetModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>({});
    const [selectedAccountIdForLogs, setSelectedAccountIdForLogs] = useState<string | null>(null);
    const [logActionFilter, setLogActionFilter] = useState<string>('');
    const [logEntityFilter, setLogEntityFilter] = useState<string>('');
    const [viewMode, setViewMode] = useState<UsersViewMode>(() => {
        if (typeof window === 'undefined') return 'cards';
        const saved = localStorage.getItem(USERS_VIEW_KEY);
        return saved === 'table' ? 'table' : 'cards';
    });

    const setUsersViewMode = (mode: UsersViewMode) => {
        setViewMode(mode);
        localStorage.setItem(USERS_VIEW_KEY, mode);
    };

    useEffect(() => {
        if (isSuperAdmin) {
            fetchUsers({ role: roleFilter || undefined, status: statusFilter || undefined });
        } else if (isAdmin) {
            fetchTeam();
        } else {
            refetch();
        }
    }, [isSuperAdmin, isAdmin, roleFilter, statusFilter]);

    useEffect(() => {
        if (!hasFullUsersUI) return;
        const params = {
            page: 1,
            pageSize: 50,
            accountId: selectedAccountIdForLogs || undefined,
            action: logActionFilter || undefined,
            entityType: logEntityFilter || undefined,
        };
        if (isSuperAdmin) fetchLogsAll(params);
        else if (isAdmin) fetchLogsFarm(params);
    }, [hasFullUsersUI, isSuperAdmin, isAdmin, selectedAccountIdForLogs, logActionFilter, logEntityFilter, fetchLogsAll, fetchLogsFarm]);

    const handleActivate = async (accountId: string) => {
        try {
            await activateAccount(accountId);
            toast.success('Account activated');
            fetchUsers({ role: roleFilter || undefined, status: statusFilter || undefined });
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to activate');
        }
    };

    const handleDelete = async () => {
        if (!selectedUser?.id) return;
        if (selectedUser?.account?.role === 'SUPERADMIN') {
            toast.error('Super admin accounts cannot be deleted.');
            setIsDeleteModalOpen(false);
            return;
        }
        try {
            await api.delete(`/users/${selectedUser.id}`);
            toast.success('User deleted successfully');
            handleRefetch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const handleRefetch = () => {
        if (isSuperAdmin) {
            return fetchUsers({
                role: roleFilter || undefined,
                status: statusFilter || undefined,
                page: 1,
                pageSize: 100,
            });
        }
        if (isAdmin) return fetchTeam();
        return refetch();
    };

    const logs = isSuperAdmin ? logsAll : logsFarm;
    const logsLoading = isSuperAdmin ? logsLoadingAll : logsLoadingFarm;

    const farmData = (farmUsers as any)?.data;
    const rawList = isSuperAdmin
        ? (allUsers?.data?.data ?? [])
        : isAdmin
          ? (adminTeam?.data?.data ?? [])
          : (farmData?.data ?? []);
    const list = useMemo(() => {
        let result = rawList;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (u: any) =>
                    (u.fullname || '').toLowerCase().includes(q) ||
                    (u.account?.username || '').toLowerCase().includes(q) ||
                    (u.account?.email || '').toLowerCase().includes(q) ||
                    (u.account?.phone || '').toLowerCase().includes(q)
            );
        }
        if (roleFilter) result = result.filter((u: any) => (u.account?.role || '') === roleFilter);
        if (statusFilter) {
            const wantActive = statusFilter === 'active';
            result = result.filter((u: any) => !!u.account?.status === wantActive);
        }
        return result;
    }, [rawList, searchQuery, roleFilter, statusFilter]);
    const loading = isSuperAdmin ? allLoading : isAdmin ? teamLoading : farmLoading;

    const roleCounts = useMemo(() => {
        const counts: Record<string, number> = { '': rawList.length };
        rawList.forEach((u: any) => {
            const r = u.account?.role || 'Other';
            counts[r] = (counts[r] || 0) + 1;
        });
        return counts;
    }, [rawList]);

    const displayCount = (r: string) => (roleFilter === r ? list.length : (roleCounts[r] ?? 0));

    const columns: TableColumnV2<any>[] = [
        { title: 'Full Name', accessor: 'fullname', render: (row: any) => <p>{row?.fullname}</p> },
        { title: 'Username', accessor: 'username', render: (row: any) => <p>{row?.account?.username}</p> },
        { title: 'Email', accessor: 'email', render: (row: any) => <p>{row?.account?.email}</p> },
        { title: 'Gender', accessor: 'gender', render: (row: any) => <p>{capitalize(row?.gender)}</p> },
        { title: 'Phone', accessor: 'phone', render: (row: any) => <p>{row?.account?.phone}</p> },
        { title: 'Role', accessor: 'role', render: (row: any) => <p>{roleLabel(row?.account?.role)}</p> },
        {
            title: 'Assigned farm',
            accessor: 'assignedFarms',
            render: (row: any) => (
                <p className="text-xs">
                    {(row?.assignedFarms ?? [])
                        .map((f: { name?: string }) => f?.name)
                        .filter(Boolean)
                        .join(', ') || '—'}
                </p>
            ),
        },
        {
            title: 'Status',
            accessor: 'status',
            render: (row: any) => (
                <span className={row?.account?.status ? 'text-success' : 'text-warning'}>
                    {row?.account?.status ? 'Active' : 'Pending'}
                </span>
            ),
        },
        {
            title: 'Actions',
            accessor: 'actions',
            render: (row: any) => (
                <div className="flex flex-wrap gap-2 justify-center items-center">
                    <button type="button" onClick={() => navigate(`/account/users/detail/${row?.id}`)} className="text-primary text-sm">
                        View
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedAccountIdForLogs(row?.account?.id ?? null);
                            document.getElementById('user-logs-table')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-primary text-sm inline-flex items-center gap-1"
                    >
                        <DocumentTextIcon className="w-4 h-4" /> Logs
                    </button>
                    {isSuperAdmin && !row?.account?.status && (
                        <button
                            type="button"
                            onClick={() => handleActivate(row?.account?.id)}
                            className="text-primary hover:underline text-sm"
                        >
                            Activate
                        </button>
                    )}
                    {isSuperAdmin && row?.account?.role !== 'SUPERADMIN' && (
                        <>
                            <button
                                type="button"
                                onClick={() => { setSelectedUser(row); setIsUpdateModalOpen(true); }}
                                className="text-primary text-sm inline-flex items-center gap-1"
                                title="Edit user"
                            >
                                <IconEdit className="w-4 h-4" /> Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedUser(row); setIsPasswordModalOpen(true); }}
                                className="text-primary text-sm inline-flex items-center gap-1"
                                title="Set new password"
                            >
                                <KeyIcon className="w-4 h-4" /> Password
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedUser(row); setIsDeleteModalOpen(true); }}
                                className="text-danger text-sm inline-flex items-center gap-1"
                                title="Delete user"
                            >
                                <IconTrash className="w-4 h-4" /> Delete
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    if (hasFullUsersUI) {
        return (
            <div className="p-4">
                {/* Breadcrumb + Title + Add buttons (top) */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                        <ol className="flex text-gray-500 font-semibold dark:text-white-dark text-sm">
                            <li><button type="button" onClick={() => navigate('/account')} className="hover:text-gray-700 dark:hover:text-white">Dashboard</button></li>
                            <li className="before:content-['/'] before:px-1.5"><span className="text-black dark:text-white-light">Users</span></li>
                        </ol>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {isSuperAdmin ? 'Users' : 'My team'}
                        </h1>
                        {isAdmin && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Managers and veterinarians across your farms. New managers need super admin activation.
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setIsAddModalOpen(true)} className="btn btn-primary inline-flex items-center gap-2">
                            <IconPlus className="w-5 h-5" /> {isSuperAdmin ? 'Add Farm Admin' : 'Add Manager'}
                        </button>
                        {canCreateEntity('veterinarians', user?.role ?? '') && (
                        <button type="button" onClick={() => setIsVetModalOpen(true)} className="btn btn-outline-primary inline-flex items-center gap-2">
                            <IconPlus className="w-5 h-5" /> Add Veterinarian
                        </button>
                        )}
                    </div>
                </div>

                {/* Role filter pills with counts */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {['', ...(isSuperAdmin ? ['ADMIN'] : []), 'MANAGER', 'VETERINARIAN'].map((r) => (
                        <button
                            key={r || 'all'}
                            type="button"
                            onClick={() => setRoleFilter(r)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                roleFilter === r
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {r || 'All'} ({displayCount(r)})
                        </button>
                    ))}
                </div>

                {/* Search + view toggle */}
                <div className="flex flex-wrap gap-2 mb-6 items-center">
                    <div className="relative flex-1 max-w-md min-w-[200px]">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search user"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1">
                        <button
                            type="button"
                            onClick={() => setUsersViewMode('cards')}
                            title="Card view"
                            className={`p-2 rounded-md transition-colors ${
                                viewMode === 'cards'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Squares2X2Icon className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setUsersViewMode('table')}
                            title="Table view"
                            className={`p-2 rounded-md transition-colors ${
                                viewMode === 'table'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <TableCellsIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <button type="button" className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700" title="Filter">
                        <FunnelIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* User list — cards or table */}
                {loading && <p className="text-gray-500">Loading...</p>}
                {!loading && list.length === 0 && <p className="text-gray-500">No users found.</p>}
                {!loading && list.length > 0 && viewMode === 'cards' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {list.map((u: any) => (
                            <div
                                key={u.id}
                                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow overflow-hidden"
                            >
                                <div className="p-4">
                                    <div className="flex flex-col items-center text-center">
                                        <UserAvatar fullname={u.fullname} profilePic={u.profilePic} size="md" className="mb-2" />
                                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate w-full">{u.fullname}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">{u.account?.username}</p>
                                        <div className="flex flex-wrap gap-1.5 justify-center mt-1.5">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {roleLabel(u.account?.role)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.account?.status ? 'bg-success-light text-success dark:bg-success-dark-light dark:text-success' : 'bg-warning-light text-warning dark:bg-warning-dark-light dark:text-warning'}`}>
                                                {u.account?.status ? 'Active' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                                        {u.account?.phone && (
                                            <div className="flex items-center gap-1.5 truncate">
                                                <PhoneIcon className="w-4 h-4 shrink-0 text-gray-400" />
                                                <span className="truncate">{u.account.phone}</span>
                                            </div>
                                        )}
                                        {u.account?.email && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <EnvelopeIcon className="w-4 h-4 shrink-0 text-gray-400" />
                                                <span className="truncate">{u.account.email}</span>
                                            </div>
                                        )}
                                        {(u.assignedFarms ?? []).length > 0 && (
                                            <p className="text-xs text-gray-500 truncate">
                                                Farm: {(u.assignedFarms as { name?: string }[]).map((f) => f.name).filter(Boolean).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/account/users/detail/${u.id}`)}
                                            className="btn btn-primary flex-1 min-w-0 py-1.5 text-xs font-medium"
                                        >
                                            View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedAccountIdForLogs(u.account?.id ?? null);
                                                document.getElementById('user-logs-table')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="btn btn-outline-primary py-1.5 px-2 text-xs font-medium inline-flex items-center gap-1"
                                            title="Show this user's logs"
                                        >
                                            <DocumentTextIcon className="w-4 h-4" /> Logs
                                        </button>
                                        {isSuperAdmin && u.account?.role !== 'SUPERADMIN' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedUser(u); setIsUpdateModalOpen(true); }}
                                                    className="btn btn-outline-primary py-1.5 px-2 text-xs font-medium inline-flex items-center gap-1"
                                                >
                                                    <IconEdit className="w-4 h-4" /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedUser(u); setIsPasswordModalOpen(true); }}
                                                    className="btn btn-outline-primary py-1.5 px-2 text-xs font-medium inline-flex items-center gap-1"
                                                    title="Set new password"
                                                >
                                                    <KeyIcon className="w-4 h-4" /> Password
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedUser(u); setIsDeleteModalOpen(true); }}
                                                    className="btn btn-outline-danger py-1.5 px-2 text-xs font-medium inline-flex items-center gap-1"
                                                >
                                                    <IconTrash className="w-4 h-4" /> Delete
                                                </button>
                                            </>
                                        )}
                                        {!u.account?.status && canActivateAccount(user?.role) && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleActivate(u.account?.id); }}
                                                className="btn btn-outline-primary py-1.5 px-2 text-xs font-medium"
                                            >
                                                Activate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!loading && list.length > 0 && viewMode === 'table' && (
                    <div className="w-full">
                        <DataTableV2
                            columns={columns}
                            data={list}
                            isLoading={loading}
                            currentPage={1}
                            total={list.length}
                            lastPage={1}
                            previousPage={0}
                            nextPage={0}
                            tableName="Users"
                        />
                    </div>
                )}

                {/* Results footer */}
                {!loading && rawList.length > 0 && (
                    <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                        Show {list.length} of {rawList.length} results
                    </p>
                )}

                {/* User activity logs table (super-admin only) */}
                <section className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700" id="user-logs-table">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User activity logs</h2>
                    <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            {selectedAccountIdForLogs ? (
                                <>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Showing logs for:</span>
                                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                                        {rawList.find((u: any) => u.account?.id === selectedAccountIdForLogs)?.fullname ?? rawList.find((u: any) => u.account?.id === selectedAccountIdForLogs)?.account?.username ?? 'User'}
                                    </span>
                                    <button type="button" onClick={() => setSelectedAccountIdForLogs(null)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500" title="Show all users">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <span className="text-sm text-gray-600 dark:text-gray-400">All users</span>
                            )}
                        </div>
                        <select
                            value={logActionFilter}
                            onChange={(e) => setLogActionFilter(e.target.value)}
                            className="form-select rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 pr-8"
                        >
                            <option value="">All actions</option>
                            {LOG_ACTIONS.filter(Boolean).map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                        <select
                            value={logEntityFilter}
                            onChange={(e) => setLogEntityFilter(e.target.value)}
                            className="form-select rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 pr-8"
                        >
                            {LOG_ENTITY_TYPES.map((opt) => (
                                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    {logsLoading ? (
                        <p className="text-gray-500 py-4">Loading logs...</p>
                    ) : (
                        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Time</th>
                                        <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">User</th>
                                        <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Action</th>
                                        <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Entity</th>
                                        <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(logs?.data ?? []).map((log: any) => (
                                        <tr key={log.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-3 text-gray-600 dark:text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                                            <td className="p-3">{log.account?.username ?? log.accountId}</td>
                                            <td className="p-3">{log.action}</td>
                                            <td className="p-3">{log.entityType}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">{log.details ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(logs?.data ?? []).length === 0 && (
                                <p className="text-gray-500 p-4">No activity logs match the current filters.</p>
                            )}
                        </div>
                    )}
                    {(logs?.data ?? []).length > 0 && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Showing {logs?.data?.length ?? 0} of {logs?.total ?? 0} log(s)
                        </p>
                    )}
                </section>

                <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} handleRefetch={handleRefetch} />
                <AddVeterinarianModal isOpen={isVetModalOpen} onClose={() => setIsVetModalOpen(false)} handleRefetch={handleRefetch} />
                <UpdateUserModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} user={selectedUser} handleRefetch={handleRefetch} />
                <SetPasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} user={selectedUser} />
                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    userName={selectedUser?.fullname || selectedUser?.account?.username}
                />
            </div>
        );
    }

    return (
        <div className="">
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark">
                <li><button className="hover:text-gray-500/70">Home</button></li>
                <li className="before:content-['/'] before:px-1.5"><button className="text-black dark:text-white-light">Users</button></li>
            </ol>
            <div className="flex flex-row justify-end gap-2 mb-2">
                <button type="button" onClick={() => setIsAddModalOpen(true)} className="btn btn-primary flex items-center gap-1">
                    <IconPlus /> Add User
                </button>
            </div>
            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} handleRefetch={handleRefetch} />
            <UpdateUserModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} user={selectedUser} handleRefetch={handleRefetch} />
            <SetPasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} user={selectedUser} />
            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                userName={selectedUser?.fullname || selectedUser?.account?.username}
            />
            <div className="w-full">
                <DataTableV2
                    columns={columns}
                    data={list}
                    isLoading={loading}
                    currentPage={farmData?.currentPage ?? 0}
                    total={farmData?.total}
                    lastPage={(farmData?.totalPages ?? 0) + 1}
                    previousPage={farmData?.previousPage}
                    nextPage={farmData?.nextPage}
                    tableName="Users"
                />
            </div>
        </div>
    );
};

export default Users;
