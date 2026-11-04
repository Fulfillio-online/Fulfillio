import { MemoPaperSize, MemoTemplateLayout } from '@fulfillio/shared';

/**
 * Generate a standalone SVG barcode for any alphanumeric text (Code 128 subset B)
 */
export function generateSvgBarcode(text: string, height = 45): string {
  // Basic Code 128B table for alphanumeric representation
  const patterns: { [key: number]: string } = {
    0: '212222', 1: '222122', 2: '222221', 3: '121223', 4: '121322', 5: '131222',
    6: '122213', 7: '122312', 8: '132212', 9: '221213', 10: '221312', 11: '231212',
    12: '112232', 13: '122132', 14: '122231', 15: '113222', 16: '123122', 17: '123221',
    18: '223211', 19: '221132', 20: '221231', 21: '213212', 22: '223112', 23: '312131',
    24: '311222', 25: '321122', 26: '321221', 27: '312212', 28: '322112', 29: '322211',
    30: '212123', 31: '212321', 32: '232121', 33: '111323', 34: '131123', 35: '131321',
    36: '112313', 37: '132113', 38: '132311', 39: '211313', 40: '231113', 41: '231311',
    42: '112133', 43: '112331', 44: '132131', 45: '113123', 46: '113321', 47: '133121',
    48: '313121', 49: '211331', 50: '231131', 51: '213113', 52: '213311', 53: '213131',
    54: '311123', 55: '311321', 56: '331121', 57: '312113', 58: '312311', 59: '332111',
    60: '314111', 61: '221411', 62: '431111', 63: '111224', 64: '111422', 65: '121124',
    66: '121421', 67: '141122', 68: '141221', 69: '112214', 70: '112412', 71: '122114',
    72: '122411', 73: '142112', 74: '142211', 75: '241211', 76: '221114', 77: '413111',
    78: '241112', 79: '134111', 80: '111242', 81: '121142', 82: '121241', 83: '114212',
    84: '124112', 85: '124211', 86: '411212', 87: '421112', 88: '421211', 89: '212141',
    90: '214121', 91: '412121', 92: '111143', 93: '111341', 94: '131141', 95: '114113',
    96: '114311', 97: '411113', 98: '411311', 99: '113141', 100: '114131', 101: '311141',
    102: '411131', 103: '211412', 104: '211214', 105: '211232', 106: '2331112'
  };

  const START_B = 104;
  const STOP = 106;
  const codes: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    const validCode = code >= 0 && code <= 95 ? code : 0;
    codes.push(validCode);
    checksum += validCode * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(STOP);

  let barString = '';
  for (const c of codes) {
    const pat = patterns[c] || '212222';
    barString += pat;
  }

  let x = 10;
  let rects = '';
  for (let i = 0; i < barString.length; i++) {
    const width = parseInt(barString[i], 10);
    const isBar = i % 2 === 0;
    if (isBar) {
      rects += `<rect x="${x}" y="5" width="${width * 1.5}" height="${height}" fill="#000000" />`;
    }
    x += width * 1.5;
  }

  const totalWidth = x + 10;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height + 25}" width="100%" height="auto">
      ${rects}
      <text x="${totalWidth / 2}" y="${height + 18}" font-family="Courier, monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="#111827">${text}</text>
    </svg>
  `;
}

export interface InvoiceTemplateData {
  orderId: string;
  memoCode: string;
  template: MemoTemplateLayout;
  merchant: {
    name: string;
    phone?: string;
    address?: string;
  };
  customer: {
    name: string;
    phone: string;
    address: string;
    city?: string;
  };
  items: Array<{
    productTitle: string;
    sku: string;
    quantity: number;
    unitPrice: string | number;
    total: number;
  }>;
  financials: {
    totalAmount: string | number;
    codAmount: string | number;
    packagingCost?: string | number;
  };
  courier?: {
    provider?: string;
    trackingCode?: string;
    consignmentId?: string;
  };
  compiledAt: string;
}

export function compileInvoiceHtml(data: InvoiceTemplateData): string {
  const isThermal = data.template.paperSize === MemoPaperSize.THERMAL_4X6 || data.template.paperSize === MemoPaperSize.POS_80MM;
  const barcodeSvg = data.template.fields.showBarcode ? generateSvgBarcode(data.orderId.substring(0, 16)) : '';
  const trackingBarcodeSvg = data.courier?.trackingCode ? generateSvgBarcode(data.courier.trackingCode, 35) : '';

  const brandColor = data.template.header.brandColor || '#1e3a8a';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${data.orderId}</title>
  <style>
    @page {
      size: ${isThermal ? '4in 6in' : data.template.paperSize === MemoPaperSize.A5 ? 'A5' : 'A4'};
      margin: ${isThermal ? '5mm' : '12mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #111827;
      font-size: ${isThermal ? '11px' : '13px'};
      line-height: 1.4;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid ${brandColor};
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: ${isThermal ? '16px' : '22px'};
      font-weight: 800;
      color: ${brandColor};
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #4b5563;
      margin-top: 2px;
    }
    .barcode-container {
      max-width: ${isThermal ? '180px' : '220px'};
    }
    .info-grid {
      display: grid;
      grid-template-columns: ${isThermal ? '1fr' : '1fr 1fr'};
      gap: 10px;
      margin-bottom: 14px;
      background: #f9fafb;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    .info-card h4 {
      margin: 0 0 4px 0;
      font-size: 11px;
      text-transform: uppercase;
      color: #6b7280;
    }
    .info-card p {
      margin: 0;
      font-size: ${isThermal ? '11px' : '12px'};
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    th {
      background: #f3f4f6;
      border-bottom: 1px solid #d1d5db;
      padding: 6px 8px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #374151;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: ${isThermal ? '10px' : '12px'};
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 12px;
    }
    .totals-table {
      width: ${isThermal ? '100%' : '50%'};
    }
    .totals-table td {
      border: none;
      padding: 3px 6px;
    }
    .cod-highlight {
      background: #fef2f2;
      border: 1px dashed #ef4444 !important;
      font-weight: bold;
      color: #991b1b;
      font-size: ${isThermal ? '13px' : '15px'};
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
      margin-top: auto;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
      background: #e0e7ff;
      color: #3730a3;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">${data.template.header.storeName || data.merchant.name}</h1>
      <div class="brand-subtitle">${data.merchant.phone ? 'Phone: ' + data.merchant.phone : ''} ${data.merchant.address ? '| ' + data.merchant.address : ''}</div>
      <div style="margin-top: 4px;">
        <span class="badge">Memo: ${data.memoCode}</span>
        ${data.courier?.provider ? `<span class="badge" style="background:#fef3c7;color:#92400e;">Courier: ${data.courier.provider}</span>` : ''}
      </div>
    </div>
    ${barcodeSvg ? `<div class="barcode-container">${barcodeSvg}</div>` : ''}
  </div>

  <div class="info-grid">
    <div class="info-card">
      <h4>Delivery Details</h4>
      <p><strong>Customer:</strong> ${data.customer.name}</p>
      <p><strong>Contact:</strong> ${data.customer.phone}</p>
      <p><strong>Address:</strong> ${data.customer.address} ${data.customer.city ? ', ' + data.customer.city : ''}</p>
    </div>
    <div class="info-card">
      <h4>Order Reference</h4>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <p><strong>Date:</strong> ${new Date(data.compiledAt).toLocaleDateString('en-GB')}</p>
      ${data.courier?.trackingCode ? `<p><strong>Tracking:</strong> ${data.courier.trackingCode}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        ${data.template.fields.showSKU ? '<th>SKU</th>' : ''}
        <th class="text-center">Qty</th>
        ${data.template.fields.showUnitPrice ? '<th class="text-right">Price</th>' : ''}
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => `
        <tr>
          <td><strong>${item.productTitle}</strong></td>
          ${data.template.fields.showSKU ? `<td><code>${item.sku}</code></td>` : ''}
          <td class="text-center">${item.quantity}</td>
          ${data.template.fields.showUnitPrice ? `<td class="text-right">৳${Number(item.unitPrice).toFixed(2)}</td>` : ''}
          <td class="text-right">৳${Number(item.total).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals-section">
    <table class="totals-table">
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">৳${Number(data.financials.totalAmount).toFixed(2)}</td>
      </tr>
      ${data.financials.packagingCost ? `
      <tr>
        <td>Packaging Handling:</td>
        <td class="text-right">৳${Number(data.financials.packagingCost).toFixed(2)}</td>
      </tr>
      ` : ''}
      <tr class="cod-highlight">
        <td>C.O.D Amount:</td>
        <td class="text-right">৳${Number(data.financials.codAmount).toFixed(2)}</td>
      </tr>
    </table>
  </div>

  ${trackingBarcodeSvg && data.template.fields.showCourierSlip ? `
    <div style="border: 1px dashed #9ca3af; padding: 6px; margin-bottom: 8px; text-align: center;">
      <div style="font-size: 10px; font-weight: bold; color: #4b5563; text-transform: uppercase;">Courier Tracking Code</div>
      <div style="max-width: 200px; margin: 0 auto;">${trackingBarcodeSvg}</div>
    </div>
  ` : ''}

  <div class="footer">
    <p>${data.template.footer.thankYouMessage || 'Thank you for shopping with us!'}</p>
    ${data.template.footer.terms ? `<p style="font-size: 9px; color: #9ca3af;">${data.template.footer.terms}</p>` : ''}
    <p style="font-size: 8px; color: #9ca3af;">Generated automatically by Fulfillio WMS • fulfillio.online</p>
  </div>
</body>
</html>
  `.trim();
}
