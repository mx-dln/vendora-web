import { router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type Column<T> = {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    hidden?: boolean;
};

type DataTableProps<T> = {
    data: {
        data: T[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    columns: Column<T>[];
    filters?: Record<string, string | undefined>;
    baseRoute: string;
    searchPlaceholder?: string;
    searchKey?: string;
    bulkActions?: (selected: number[]) => React.ReactNode;
    actions?: (item: T) => React.ReactNode;
    onRowClick?: (item: T) => void;
};

export function DataTable<T extends { id: number }>({
    data,
    columns,
    filters = {},
    baseRoute,
    searchPlaceholder = 'Search...',
    searchKey = 'search',
    bulkActions,
    actions,
    onRowClick,
}: DataTableProps<T>) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchValue, setSearchValue] = useState(filters[searchKey] || '');
    const sortField = filters.sort || '';
    const sortOrder = filters.order || '';

    function updateFilters(updates: Record<string, string | undefined>) {
        const params = new URLSearchParams();
        Object.entries({ ...filters, ...updates }).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });
        if (!('page' in updates)) {
            params.set('page', '1');
        }
        router.get(`${baseRoute}?${params.toString()}`);
    }

    function handleSort(key: string) {
        if (sortField === key) {
            updateFilters({ sort: key, order: sortOrder === 'asc' ? 'desc' : 'asc' });
        } else {
            updateFilters({ sort: key, order: 'asc' });
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        updateFilters({ [searchKey]: searchValue });
    }

    function toggleSelect(id: number) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }

    function toggleSelectAll() {
        if (selectedIds.length === data.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data.data.map(i => i.id));
        }
    }

    const visibleColumns = columns.filter(c => !c.hidden);

    return (
        <Card>
            <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        className="pl-9"
                    />
                </form>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && bulkActions && (
                        <>{bulkActions(selectedIds)}</>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10 px-4">
                                    <input
                                        type="checkbox"
                                        checked={data.data.length > 0 && selectedIds.length === data.data.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </TableHead>
                                {visibleColumns.map(col => (
                                    <TableHead
                                        key={col.key}
                                        className={cn(col.sortable && 'cursor-pointer select-none')}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            {col.sortable && (
                                                sortField === col.key ? (
                                                    sortOrder === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                                                ) : (
                                                    <ChevronsUpDown className="size-3 text-muted-foreground/50" />
                                                )
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                                {actions && <TableHead className="w-20 text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleColumns.length + 2} className="h-32 text-center text-muted-foreground">
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.data.map(item => (
                                    <TableRow
                                        key={item.id}
                                        className={cn(onRowClick && 'cursor-pointer')}
                                        onClick={() => onRowClick?.(item)}
                                    >
                                        <TableCell className="px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                                onClick={e => e.stopPropagation()}
                                                className="rounded border-gray-300"
                                            />
                                        </TableCell>
                                        {visibleColumns.map(col => (
                                            <TableCell key={col.key}>
                                                {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                                            </TableCell>
                                        ))}
                                        {actions && (
                                            <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                                {actions(item)}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            {data.last_page > 1 && (
                <CardFooter className="flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                        Showing {data.from} to {data.to} of {data.total} results
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={data.current_page === 1}
                            onClick={() => updateFilters({ page: String(data.current_page - 1) })}
                        >
                            Previous
                        </Button>
                        {Array.from({ length: Math.min(5, data.last_page) }, (_, i) => {
                            let pageNum: number;

                            if (data.last_page <= 5) {
                                pageNum = i + 1;
                            } else if (data.current_page <= 3) {
                                pageNum = i + 1;
                            } else if (data.current_page >= data.last_page - 2) {
                                pageNum = data.last_page - 4 + i;
                            } else {
                                pageNum = data.current_page - 2 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={data.current_page === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => updateFilters({ page: String(pageNum) })}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={data.current_page === data.last_page}
                            onClick={() => updateFilters({ page: String(data.current_page + 1) })}
                        >
                            Next
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
