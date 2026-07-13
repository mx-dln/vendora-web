import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Download, Trash2, Database, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import backups from '@/routes/backups';
import type { PaginatedData } from '@/types';

interface Backup {
    id: number;
    filename: string;
    size: number;
    type: string;
    user_id: number | null;
    user?: { name: string } | null;
    created_at: string;
}

interface Props {
    backups: PaginatedData<Backup>;
    database_size: number;
    filters: Record<string, string | undefined>;
}

export default function BackupsIndex({ backups: backupsData, database_size, filters }: Props) {
    const [creating, setCreating] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    function handleCreate() {
        setCreating(true);
        router.post(backups.create.url(), {}, {
            onSuccess: () => toast.success('Backup created successfully'),
            onError: () => toast.error('Failed to create backup'),
            onFinish: () => setCreating(false),
        });
    }

    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(backups.destroy.url(deleteId), {
            onSuccess: () => { toast.success('Backup deleted'); setDeleteId(null); },
            onError: () => toast.error('Failed to delete backup'),
            onFinish: () => setDeleting(false),
        });
    }

    function formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const columns: Column<Backup>[] = [
        {
            key: 'filename',
            label: 'Filename',
            sortable: true,
            render: (b) => <span className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" />{b.filename}</span>,
        },
        {
            key: 'size',
            label: 'Size',
            sortable: true,
            render: (b) => formatBytes(b.size),
        },
        {
            key: 'type',
            label: 'Type',
            render: (b) => <Badge variant="secondary" className="capitalize">{b.type}</Badge>,
        },
        {
            key: 'created_at',
            label: 'Date',
            sortable: true,
            render: (b) => new Date(b.created_at).toLocaleString(),
        },
        {
            key: 'user',
            label: 'Created By',
            render: (b) => b.user?.name || 'System',
        },
    ];

    return (
        <>
            <Head title="Backup & Recovery" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader
                    title="Backup & Recovery"
                    description="Create and manage database backups"
                    actions={
                        <Button onClick={handleCreate} disabled={creating}>
                            <Database className="mr-1 size-4" />
                            {creating ? 'Creating...' : 'Create Backup'}
                        </Button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <Database className="size-8 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Database Size</p>
                                <p className="text-2xl font-bold">{formatBytes(database_size)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <FileText className="size-8 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Backups</p>
                                <p className="text-2xl font-bold">{backupsData.total}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DataTable<Backup>
                    data={backupsData}
                    columns={columns}
                    filters={filters}
                    baseRoute={backups.index.url()}
                    searchPlaceholder="Search backups..."
                    actions={(b) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                                <a href={backups.download.url(b.id)}><Download className="size-4" /></a>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)}>
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        </div>
                    )}
                />
            </div>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={() => setDeleteId(null)}
                title="Delete Backup"
                description="Are you sure you want to delete this backup? This action cannot be undone."
                onConfirm={handleDelete}
                loading={deleting}
            />
        </>
    );
}

BackupsIndex.layout = {
    breadcrumbs: [{ title: 'Backup & Recovery', href: backups.index.url() }],
};
