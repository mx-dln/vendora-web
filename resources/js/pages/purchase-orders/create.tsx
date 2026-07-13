import PurchaseOrderForm from '@/pages/purchase-orders/form';
import purchaseOrders from '@/routes/purchase-orders';
import type { Supplier } from '@/types';

interface Props { suppliers: Supplier[]; }

export default function PurchaseOrdersCreate(props: Props) {
    return <PurchaseOrderForm {...props} />;
}

PurchaseOrdersCreate.layout = {
    breadcrumbs: [
        { title: 'Purchase Orders', href: purchaseOrders.index.url() },
        { title: 'Create', href: purchaseOrders.create.url() },
    ],
};
