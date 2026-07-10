import { useEffect, useState } from 'react';
import { useActivityLogs } from '@/hooks/api/activityLog';
import { isLoggedIn } from '@/hooks/api/auth';

const ActivityLogs = () => {
    const user = isLoggedIn();
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const { logs, loading, fetchLogs } = useActivityLogs(isSuperAdmin ? undefined : user?.id);

    useEffect(() => {
        fetchLogs({ page: 1, pageSize: 50 });
    }, []);

    const list = logs?.data ?? [];

    return (
        <div className="p-4">
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li><button type="button" className="hover:text-gray-500/70">Home</button></li>
                <li className="before:content-['/'] before:px-1.5"><span className="text-black dark:text-white-light">Activity logs</span></li>
            </ol>
            <h1 className="text-xl font-bold mb-4">User activity logs</h1>
            {loading ? <p>Loading...</p> : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="text-left p-3">Time</th>
                                {isSuperAdmin && <th className="text-left p-3">User</th>}
                                <th className="text-left p-3">Action</th>
                                <th className="text-left p-3">Entity</th>
                                <th className="text-left p-3">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((log: any) => (
                                <tr key={log.id} className="border-b dark:border-gray-700">
                                    <td className="p-3">{new Date(log.createdAt).toLocaleString()}</td>
                                    {isSuperAdmin && <td className="p-3">{log.account?.username ?? log.accountId}</td>}
                                    <td className="p-3">{log.action}</td>
                                    <td className="p-3">{log.entityType}</td>
                                    <td className="p-3">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {list.length === 0 && <p className="text-gray-500 p-4">No activity logs yet.</p>}
                </div>
            )}
        </div>
    );
};

export default ActivityLogs;
