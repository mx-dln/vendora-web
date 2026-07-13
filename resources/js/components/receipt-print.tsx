import { useImperativeHandle, forwardRef } from 'react';
import type { Transaction } from '@/types';

type ReceiptPrintProps = {
    transaction: Transaction;
    settings?: {
        store_name?: string;
        store_address?: string;
        store_city?: string;
        store_province?: string;
        store_phone?: string;
        store_tin?: string;
        receipt_footer?: string;
        receipt_show_logo?: boolean;
        receipt_show_tax?: boolean;
        receipt_show_discount?: boolean;
        receipt_width?: string;
    };
};

function formatCurrency(amount: number): string {
    return `₱${Number(amount).toFixed(2)}`;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleString('en-PH', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

function buildReceiptHtml(transaction: Transaction, settings?: ReceiptPrintProps['settings']): string {
    const width = settings?.receipt_width === '58' ? '58mm' : '80mm';
    const is58 = width === '58mm';
    const showLogo = settings?.receipt_show_logo !== false;
    const showDiscount = settings?.receipt_show_discount !== false;
    const footer = settings?.receipt_footer || 'Thank you for your purchase!';
    const fs = is58 ? 11 : 14;
    const sm = is58 ? 9 : 11;
    const xs = is58 ? 8 : 9;

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt - ${transaction.reference_number}</title>
<style>
    @page { margin: 0; size: ${width} auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: white; width: 100%; height: auto; min-height: 0; }
    body {
        font-family: 'Courier New', 'Lucida Console', monospace;
        font-size: ${fs}px;
        line-height: 1.35;
        color: #000;
        padding: 2mm 3mm;
        max-width: 100%;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .header { text-align: center; margin-bottom: 4px; width: 100%; }
    .logo { height: ${is58 ? 22 : 28}px; width: auto; margin: 0 auto 3px; display: block; }
    .store-name { font-size: ${is58 ? 14 : 17}px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px; }
    .store-info { font-size: ${sm}px; line-height: 1.25; color: #333; }

    .divider { border-top: 1px dashed #000; margin: 3px 0; width: 100%; }
    .divider-thin { border-top: 1px solid #999; margin: 2px 0; width: 100%; }

    .info { font-size: ${sm}px; width: 100%; }
    .info-row { display: flex; justify-content: space-between; width: 100%; line-height: 1.5; }

    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th { font-weight: bold; font-size: ${sm}px; text-align: left; padding: 1px 0; }
    .items-table th:nth-child(2) { text-align: center; width: ${is58 ? 22 : 30}px; }
    .items-table th:nth-child(3) { text-align: right; width: ${is58 ? 38 : 50}px; }
    .items-table th:nth-child(4) { text-align: right; width: ${is58 ? 38 : 50}px; }
    .items-table td { font-size: ${sm}px; padding: 0.5px 0; vertical-align: top; }
    .items-table td:nth-child(1) { text-align: left; word-break: break-word; }
    .items-table td:nth-child(2) { text-align: center; width: ${is58 ? 22 : 30}px; }
    .items-table td:nth-child(3) { text-align: right; width: ${is58 ? 38 : 50}px; }
    .items-table td:nth-child(4) { text-align: right; width: ${is58 ? 38 : 50}px; }

    .totals { width: 100%; margin: 2px 0; }
    .total-row { display: flex; justify-content: space-between; width: 100%; font-size: ${sm}px; line-height: 1.6; }
    .grand-total { display: flex; justify-content: space-between; width: 100%; font-size: ${fs}px; font-weight: bold; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px; }
    .discount { color: #16A34A; }

    .payment { width: 100%; }
    .payment-row { display: flex; justify-content: space-between; width: 100%; font-size: ${sm}px; line-height: 1.6; }
    .uppercase { text-transform: uppercase; }

    .footer { text-align: center; width: 100%; }
    .footer-text { font-size: ${sm}px; margin-bottom: 1px; }
    .footer-small { font-size: ${xs}px; color: #666; }
</style>
</head>
<body>
    <div class="header">
        ${showLogo ? `<img src="/brand/logo-dark.png" alt="" class="logo" />` : ''}
        <div class="store-name">${settings?.store_name || 'Vendora'}</div>
        ${settings?.store_address ? `<div class="store-info">${settings.store_address}</div>` : ''}
        ${settings?.store_city && settings?.store_province ? `<div class="store-info">${settings.store_city}, ${settings.store_province}</div>` : ''}
        ${settings?.store_phone ? `<div class="store-info">Tel: ${settings.store_phone}</div>` : ''}
        ${settings?.store_tin ? `<div class="store-info">TIN: ${settings.store_tin}</div>` : ''}
    </div>

    <div class="divider"></div>

    <div class="info">
        <div class="info-row"><span>Receipt #:</span><span>${transaction.reference_number}</span></div>
        <div class="info-row"><span>Date:</span><span>${formatDate(transaction.created_at)}</span></div>
        <div class="info-row"><span>Cashier:</span><span>${transaction.user?.name || 'N/A'}</span></div>
        ${transaction.customer ? `<div class="info-row"><span>Customer:</span><span>${transaction.customer.name}</span></div>` : ''}
    </div>

    <div class="divider"></div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${(transaction.items || []).map(item => `
                <tr>
                    <td>${item.product_name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unit_price)}</td>
                    <td>${formatCurrency(item.total)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="divider"></div>

    <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>${formatCurrency(transaction.subtotal)}</span></div>
        ${showDiscount && Number(transaction.discount_amount) > 0 ? `<div class="total-row discount"><span>Discount</span><span>-${formatCurrency(transaction.discount_amount)}</span></div>` : ''}
        ${settings?.receipt_show_tax && Number(transaction.tax_amount) > 0 ? `<div class="total-row"><span>Tax (${transaction.tax_rate}%)</span><span>${formatCurrency(transaction.tax_amount)}</span></div>` : ''}
        <div class="grand-total"><span>TOTAL</span><span>${formatCurrency(transaction.total)}</span></div>
    </div>

    <div class="divider"></div>

    <div class="payment">
        <div class="payment-row"><span>Payment Method</span><span class="uppercase">${transaction.payment_method}</span></div>
        <div class="payment-row"><span>Amount Tendered</span><span>${formatCurrency(transaction.tendered_amount)}</span></div>
        <div class="payment-row"><span>Change</span><span>${formatCurrency(transaction.change_amount)}</span></div>
    </div>

    <div class="divider"></div>

    <div class="footer">
        <div class="footer-text">${footer}</div>
        <div class="footer-small">${new Date().toLocaleString('en-PH', { dateStyle: 'full', timeStyle: 'short' })}</div>
    </div>
</body>
</html>`;
}

const ReceiptPrint = forwardRef<{ print: () => void }, ReceiptPrintProps>(
    function ReceiptPrint({ transaction, settings }, ref) {
        useImperativeHandle(ref, () => ({
            print() {
                const html = buildReceiptHtml(transaction, settings);
                const win = window.open('', '_blank');
                if (!win) {
                    alert('Please allow popups to print receipts.');
                    return;
                }
                win.document.write(html);
                win.document.close();
                win.focus();
                setTimeout(() => {
                    win.print();
                    win.close();
                }, 500);
            },
        }));

        return null;
    }
);

export { buildReceiptHtml };
export default ReceiptPrint;
