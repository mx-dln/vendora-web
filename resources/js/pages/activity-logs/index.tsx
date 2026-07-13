import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import activityLogs from '@/routes/activity-logs';
import type { ActivityLog } from '@/types';

interface Props {
    logs: { data: ActivityLog[]; current_page: number; last_page: number; total: number; from: number; to: number };
    filters: Record<string, string | undefined>;
}

export default function ActivityLogsIndex({ logs, filters }: Props) {
    const columns: Column<ActivityLog>[] = [
        { key: 'created_at', label: 'Date', sortable: true, render: (l) => new Date(l.created_at).toLocaleString() },
        { key: 'user', label: 'User', render: (l) => l.user?.name || 'System' },
        {
            key: 'action',
            label: 'Action',
            render: (l) => <Badge variant="secondary" className="capitalize">{l.action}</Badge>,
        },
        { key: 'module', label: 'Module', render: (l) => <Badge variant="outline" className="capitalize">{l.module}</Badge> },
        { key: 'description', label: 'Description' },
        { key: 'ip_address', label: 'IP Address' },
    ];

    return (
        <>
            <Head title="Activity Logs" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Activity Logs" description="Audit trail of system activities" />
                <DataTable<ActivityLog>
                    data={logs}
                    columns={columns}
                    filters={filters}
                    baseRoute={activityLogs.index.url()}
                    searchPlaceholder="Search by description..."
                />
            </div>
        </>
    );
}

ActivityLogsIndex.layout = {
    breadcrumbs: [{ title: 'Activity Logs', href: activityLogs.index.url() }],
};
