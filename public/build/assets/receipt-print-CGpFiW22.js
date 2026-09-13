import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{l as t,n}from"./jsx-runtime-Dnhok7-n.js";var r=n(),i=e(t(),1);function a(e){return`₱${Number(e).toFixed(2)}`}function o(e){return new Date(e).toLocaleString(`en-PH`,{year:`numeric`,month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`,hour12:!0})}function s(e,t){let n=t?.receipt_width===`58`?`58mm`:`80mm`,r=n===`58mm`,i=t?.receipt_show_logo!==!1,s=t?.receipt_show_discount!==!1,c=t?.receipt_footer||`Thank you for your purchase!`,l=r?11:14,u=r?9:11,d=r?8:9;return`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt - ${e.reference_number}</title>
<style>
    @page { margin: 0; size: ${n} auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: white; width: 100%; height: auto; min-height: 0; }
    body {
        font-family: 'Courier New', 'Lucida Console', monospace;
        font-size: ${l}px;
        line-height: 1.35;
        color: #000;
        padding: 2mm 3mm;
        max-width: 100%;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .header { text-align: center; margin-bottom: 4px; width: 100%; }
    .logo { height: ${r?22:28}px; width: auto; margin: 0 auto 3px; display: block; }
    .store-name { font-size: ${r?14:17}px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px; }
    .store-info { font-size: ${u}px; line-height: 1.25; color: #333; }

    .divider { border-top: 1px dashed #000; margin: 3px 0; width: 100%; }
    .divider-thin { border-top: 1px solid #999; margin: 2px 0; width: 100%; }

    .info { font-size: ${u}px; width: 100%; }
    .info-row { display: flex; justify-content: space-between; width: 100%; line-height: 1.5; }

    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th { font-weight: bold; font-size: ${u}px; text-align: left; padding: 1px 0; }
    .items-table th:nth-child(2) { text-align: center; width: ${r?22:30}px; }
    .items-table th:nth-child(3) { text-align: right; width: ${r?38:50}px; }
    .items-table th:nth-child(4) { text-align: right; width: ${r?38:50}px; }
    .items-table td { font-size: ${u}px; padding: 0.5px 0; vertical-align: top; }
    .items-table td:nth-child(1) { text-align: left; word-break: break-word; }
    .items-table td:nth-child(2) { text-align: center; width: ${r?22:30}px; }
    .items-table td:nth-child(3) { text-align: right; width: ${r?38:50}px; }
    .items-table td:nth-child(4) { text-align: right; width: ${r?38:50}px; }

    .totals { width: 100%; margin: 2px 0; }
    .total-row { display: flex; justify-content: space-between; width: 100%; font-size: ${u}px; line-height: 1.6; }
    .grand-total { display: flex; justify-content: space-between; width: 100%; font-size: ${l}px; font-weight: bold; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px; }
    .discount { color: #16A34A; }

    .payment { width: 100%; }
    .payment-row { display: flex; justify-content: space-between; width: 100%; font-size: ${u}px; line-height: 1.6; }
    .uppercase { text-transform: uppercase; }

    .footer { text-align: center; width: 100%; }
    .footer-text { font-size: ${u}px; margin-bottom: 1px; }
    .footer-small { font-size: ${d}px; color: #666; }
</style>
</head>
<body>
    <div class="header">
        ${i?`<img src="/brand/logo-dark.png" alt="" class="logo" />`:``}
        <div class="store-name">${t?.store_name||`Vendora`}</div>
        ${t?.store_address?`<div class="store-info">${t.store_address}</div>`:``}
        ${t?.store_city&&t?.store_province?`<div class="store-info">${t.store_city}, ${t.store_province}</div>`:``}
        ${t?.store_phone?`<div class="store-info">Tel: ${t.store_phone}</div>`:``}
        ${t?.store_tin?`<div class="store-info">TIN: ${t.store_tin}</div>`:``}
    </div>

    <div class="divider"></div>

    <div class="info">
        <div class="info-row"><span>Receipt #:</span><span>${e.reference_number}</span></div>
        <div class="info-row"><span>Date:</span><span>${o(e.created_at)}</span></div>
        <div class="info-row"><span>Cashier:</span><span>${e.user?.name||`N/A`}</span></div>
        ${e.customer?`<div class="info-row"><span>Customer:</span><span>${e.customer.name}</span></div>`:``}
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
            ${(e.items||[]).map(e=>`
                <tr>
                    <td>${e.product_name}</td>
                    <td>${e.quantity}</td>
                    <td>${a(e.unit_price)}</td>
                    <td>${a(e.total)}</td>
                </tr>
            `).join(``)}
        </tbody>
    </table>

    <div class="divider"></div>

    <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>${a(e.subtotal)}</span></div>
        ${s&&Number(e.discount_amount)>0?`<div class="total-row discount"><span>Discount</span><span>-${a(e.discount_amount)}</span></div>`:``}
        ${t?.receipt_show_tax&&Number(e.tax_amount)>0?`<div class="total-row"><span>Tax (${e.tax_rate}%)</span><span>${a(e.tax_amount)}</span></div>`:``}
        <div class="grand-total"><span>TOTAL</span><span>${a(e.total)}</span></div>
    </div>

    <div class="divider"></div>

    <div class="payment">
        <div class="payment-row"><span>Payment Method</span><span class="uppercase">${e.payment_method}</span></div>
        <div class="payment-row"><span>Amount Tendered</span><span>${a(e.tendered_amount)}</span></div>
        <div class="payment-row"><span>Change</span><span>${a(e.change_amount)}</span></div>
    </div>

    <div class="divider"></div>

    <div class="footer">
        <div class="footer-text">${c}</div>
        <div class="footer-small">${new Date().toLocaleString(`en-PH`,{dateStyle:`full`,timeStyle:`short`})}</div>
    </div>
</body>
</html>`}var c=(0,i.forwardRef)(function(e,t){let n=(0,r.c)(3),{transaction:a,settings:o}=e,c;return n[0]!==o||n[1]!==a?(c=()=>({print(){let e=s(a,o),t=window.open(``,`_blank`);if(!t){alert(`Please allow popups to print receipts.`);return}t.document.write(e),t.document.close(),t.focus(),setTimeout(()=>{t.print(),t.close()},500)}}),n[0]=o,n[1]=a,n[2]=c):c=n[2],(0,i.useImperativeHandle)(t,c),null});export{c as t};