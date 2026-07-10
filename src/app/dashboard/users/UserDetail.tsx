import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@/lib/router-compat';
import { fetchUserDetail } from '@/hooks/api/auth';
import { useActivityLogs } from '@/hooks/api/activityLog';
import { capitalize } from 'lodash';

const UserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const accountId = user?.account?.id ?? user?.accountId;
    const { logs, loading: logsLoading, fetchLogs } = useActivityLogs(accountId);

    useEffect(() => {
        if (!userId) return;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const id = Array.isArray(userId) ? userId[0] : userId;
                if (!id) return;
                const res = await fetchUserDetail(id);
                const data = res.data?.data ?? res.data;
                setUser(data);
            } catch (e: any) {
                setError(e.response?.data?.message || 'Failed to load user');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    useEffect(() => {
        if (accountId) fetchLogs();
    }, [accountId]);

    if (loading) return <div className="p-4">Loading...</div>;
    if (error || !user) return <div className="p-4 text-red-500">{error || 'User not found'}</div>;

    const account = user.account || {};
    const farms = user.farms || [];

    return (
        <div className="p-4">
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li><button type="button" onClick={() => navigate('/account/users')} className="hover:text-gray-500/70">Home</button></li>
                <li className="before:content-['/'] before:px-1.5"><button type="button" className="hover:text-gray-500/70">Users</button></li>
                <li className="before:content-['/'] before:px-1.5"><span className="text-black dark:text-white-light">{user.fullname}</span></li>
            </ol>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4">Profile</h2>
                    <dl className="space-y-2">
                        <dt className="text-gray-500">Full name</dt><dd>{user.fullname}</dd>
                        <dt className="text-gray-500">Username</dt><dd>{account.username}</dd>
                        <dt className="text-gray-500">Email</dt><dd>{account.email}</dd>
                        <dt className="text-gray-500">Phone</dt><dd>{account.phone}</dd>
                        <dt className="text-gray-500">Gender</dt><dd>{capitalize(user.gender)}</dd>
                        <dt className="text-gray-500">Role</dt><dd>{account.role}</dd>
                        <dt className="text-gray-500">Status</dt>
                        <dd><span className={account.status ? 'text-green-600' : 'text-amber-600'}>{account.status ? 'Active' : 'Pending'}</span></dd>
                    </dl>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4">Farms</h2>
                    {farms.length === 0 ? <p className="text-gray-500">No farms</p> : (
                        <ul className="space-y-2">
                            {farms.map((f: any) => (
                                <li key={f.id} className="flex justify-between">
                                    <span>{f.name}</span>
                                    <span className="text-sm text-gray-500">{f.location} · {f.status ? 'Active' : 'Pending'}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4">Activity log</h2>
                {logsLoading ? <p>Loading logs...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Time</th>
                                    <th className="text-left py-2">Action</th>
                                    <th className="text-left py-2">Entity</th>
                                    <th className="text-left py-2">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(logs?.data ?? []).map((log: any) => (
                                    <tr key={log.id} className="border-b">
                                        <td className="py-2">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td>{log.action}</td>
                                        <td>{log.entityType}</td>
                                        <td>{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(logs?.data ?? []).length === 0 && <p className="text-gray-500 py-4">No activity yet.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetail;
