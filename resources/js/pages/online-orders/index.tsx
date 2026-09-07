import { Head, router } from '@inertiajs/react';
import { ClipboardCheck, PackageCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import type { OnlineOrder, PaginatedData } from '@/types';

interface Props {
    orders: PaginatedData<OnlineOrder>;
    filters: Record<string, string | undefined>;
    onlineOrderingEnabled: boolean;
}

const statuses = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'completed',
    'cancelled',
] as const;

const paymentStatuses = ['unpaid', 'paid', 'refunded'] as const;
const orderTypes = ['pickup', 'delivery'] as const;

export default function OnlineOrdersIndex({
    orders,
    onlineOrderingEnabled,
}: Props) {
    function updateOrder(order: OnlineOrder, updates: Partial<OnlineOrder>) {
        router.patch(
            `/online-orders/${order.id}`,
            {
                order_type: updates.order_type ?? order.order_type,
                status: updates.status ?? order.status,
                payment_status: updates.payment_status ?? order.payment_status,
            },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Order updated'),
                onError: () => toast.error('Failed to update order'),
            },
        );
    }

    return (
        <>
            <Head title="Online Orders" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader
                    title="Online Orders"
                    description="Manage storefront delivery and pickup orders"
                    actions={
                        <Badge
                            variant={
                                onlineOrderingEnabled ? 'default' : 'secondary'
                            }
                        >
                            {onlineOrderingEnabled
                                ? 'Ordering enabled'
                                : 'Ordering disabled'}
                        </Badge>
                    }
                />

                <div className="grid gap-3 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <ClipboardCheck className="size-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {orders.total}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total orders
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <PackageCheck className="size-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {
                                        orders.data.filter(
                                            (order) =>
                                                order.order_type === 'pickup',
                                        ).length
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Pickup on this page
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <Truck className="size-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {
                                        orders.data.filter(
                                            (order) =>
                                                order.order_type === 'delivery',
                                        ).length
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Delivery on this page
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="text-sm text-muted-foreground">
                        Outside orders from the storefront will appear here once
                        online checkout is connected.
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No online orders yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        orders.data.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {order.reference_number}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {order.item_count} item
                                                        {order.item_count === 1
                                                            ? ''
                                                            : 's'}{' '}
                                                        ·{' '}
                                                        {new Date(
                                                            order.created_at,
                                                        ).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {order.customer_name ||
                                                            'Guest customer'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {order.customer_phone ||
                                                            order.customer_email ||
                                                            'No contact provided'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={order.order_type}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            updateOrder(order, {
                                                                order_type:
                                                                    value as OnlineOrder['order_type'],
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {orderTypes.map(
                                                                (type) => (
                                                                    <SelectItem
                                                                        key={
                                                                            type
                                                                        }
                                                                        value={
                                                                            type
                                                                        }
                                                                    >
                                                                        {type}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={order.status}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            updateOrder(order, {
                                                                status: value as OnlineOrder['status'],
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-40">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {statuses.map(
                                                                (status) => (
                                                                    <SelectItem
                                                                        key={
                                                                            status
                                                                        }
                                                                        value={
                                                                            status
                                                                        }
                                                                    >
                                                                        {status.replaceAll(
                                                                            '_',
                                                                            ' ',
                                                                        )}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={
                                                            order.payment_status
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            updateOrder(order, {
                                                                payment_status:
                                                                    value as OnlineOrder['payment_status'],
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {paymentStatuses.map(
                                                                (status) => (
                                                                    <SelectItem
                                                                        key={
                                                                            status
                                                                        }
                                                                        value={
                                                                            status
                                                                        }
                                                                    >
                                                                        {status}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ₱
                                                    {Number(
                                                        order.total,
                                                    ).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {orders.last_page > 1 && (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            disabled={orders.current_page === 1}
                            onClick={() =>
                                router.get(
                                    '/online-orders',
                                    { page: orders.current_page - 1 },
                                    { preserveState: true },
                                )
                            }
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            disabled={orders.current_page === orders.last_page}
                            onClick={() =>
                                router.get(
                                    '/online-orders',
                                    { page: orders.current_page + 1 },
                                    { preserveState: true },
                                )
                            }
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

OnlineOrdersIndex.layout = {
    breadcrumbs: [{ title: 'Online Orders', href: '/online-orders' }],
};
