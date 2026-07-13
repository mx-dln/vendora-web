import PurchaseOrderForm from '@/pages/purchase-orders/form';
import purchaseOrders from '@/routes/purchase-orders';
import type { Supplier, PurchaseOrder } from '@/types';

interface Props { suppliers: Supplier[]; purchaseOrder: PurchaseOrder; }

export default function PurchaseOrdersEdit(props: Props) {
    return <PurchaseOrderForm {...props} />;
}

PurchaseOrdersEdit.layout = {
    breadcrumbs: [
        { title: 'Purchase Orders', href: purchaseOrders.index.url() },
        { title: 'Edit', href: '' },
    ],
};
