import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = ({
  flatData,
  apartmentName,
  apartmentAddress = '',
  month,
  societyBills,
  numFlats,
  paymentStatus = 'UNPAID',
  apartmentContact = { phone: '+91 XXXXX XXXXX', email: 'admin@apartment.com' },
  returnBase64 = false
}) => {
  // A4 portrait with 20mm margins
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'mm' });
  const pageWidth  = doc.internal.pageSize.getWidth();   // 210mm
  const pageHeight = doc.internal.pageSize.getHeight();  // 297mm
  const ML = 14; // margin left
  const MR = 14; // margin right
  const CW = pageWidth - ML - MR; // content width

  // ─── Colors ───────────────────────────────────────────────────────────────────
  const blue   = [30, 64, 175];   // #1e40af
  const slate  = [71, 85, 105];   // #475569
  const dark   = [15, 23, 42];    // #0f172a
  const waterC = [3, 105, 161];   // #0369a1
  const red    = [185, 28, 28];   // #b91c1c
  const green  = [22, 101, 52];   // for PAID status
  const lightGray = [248, 250, 252]; // row bg

  // ─── Date helpers ─────────────────────────────────────────────────────────────
  const now = new Date();
  const fmt = d => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const generatedOn = fmt(now);
  const dueDateObj  = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const dueDateStr  = fmt(dueDateObj);
  const [invYear, invMonth] = (month || '').split('-');
  const invoiceNo = `INV-${invYear || now.getFullYear()}-${invMonth || String(now.getMonth() + 1).padStart(2, '0')}-${flatData.flatNo}`;

  // ─── Rounding (sum-of-rounded-items strategy) ─────────────────────────────────
  const grouped = {};
  societyBills.forEach(b => {
    const cat = b.category || 'Other';
    grouped[cat] = (grouped[cat] || 0) + Number(b.amount || 0);
  });
  const commonLineItems = Object.entries(grouped).map(([cat, total]) => ({
    label: cat, value: Math.round(total / numFlats)
  }));
  commonLineItems.push({ label: 'Common Area Water', value: Math.round(flatData.commonWater || 0) });
  const totalCommon = commonLineItems.reduce((s, i) => s + i.value, 0);

  const roundedWater       = Math.round(flatData.waterCost   || 0);
  const roundedElectricity = Math.round(flatData.electricity || 0);
  const roundedSecurity    = Math.round(flatData.security    || 0);
  const roundedArrears     = Math.round(flatData.arrears     || 0);
  const calculatedTotal    = totalCommon + roundedWater + roundedElectricity + roundedSecurity + roundedArrears;
  const fmtRs = n => `Rs. ${Number(n).toLocaleString('en-IN')}`;

  // ─── SECTION 1: Blue Banner Header ───────────────────────────────────────────
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFontSize(20);           // Apartment Name: 20pt
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(apartmentName || 'Apartment', pageWidth / 2, apartmentAddress ? 10 : 13, { align: 'center' });

  if (apartmentAddress) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(apartmentAddress, pageWidth / 2, 17, { align: 'center' });
  }

  doc.setFontSize(14);           // Invoice Title: 14pt
  doc.setFont('helvetica', 'normal');
  doc.text('Monthly Maintenance Invoice', pageWidth / 2, apartmentAddress ? 23 : 21, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Billing Month: ${month || 'N/A'}`, pageWidth / 2, apartmentAddress ? 29 : 28, { align: 'center' });

  // ─── SECTION 2: Meta card (Invoice No, dates, status, resident) ─────────────
  // Light background card
  let y = 38;
  doc.setFillColor(...lightGray);
  doc.roundedRect(ML, y, CW, 30, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(ML, y, CW, 30, 2, 2, 'S');

  // Left column labels
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slate);
  const lblX = ML + 4;
  const valX = ML + 34;
  doc.text('Invoice No:', lblX, y + 7);
  doc.text('Generated On:', lblX, y + 14);
  doc.text('Due Date:', lblX, y + 21);
  doc.text('Status:', lblX, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(invoiceNo, valX, y + 7);
  doc.text(generatedOn, valX, y + 14);
  doc.text(dueDateStr, valX, y + 21);

  const isPaid = paymentStatus === 'PAID';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(isPaid ? green : red));
  doc.text(paymentStatus, valX, y + 28);

  // Right column — Resident
  const rLblX = pageWidth / 2 + 4;
  const rValX = pageWidth / 2 + 28;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slate);
  doc.text('Flat No:', rLblX, y + 7);
  doc.text('Owner:', rLblX, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(String(flatData.flatNo), rValX, y + 7);
  doc.text(String(flatData.owner || 'Resident'), rValX, y + 14);

  // ─── SECTION 3: Common Charges Table ─────────────────────────────────────────
  autoTable(doc, {
    startY: y + 35,
    head: [['Common Charge Category', 'Amount Per Flat']],
    body: commonLineItems.map(({ label, value }) => [label, fmtRs(value)]),
    foot: [['Total Common Charges', fmtRs(totalCommon)]],
    theme: 'grid',
    headStyles: { fillColor: blue, fontStyle: 'bold', fontSize: 11 },
    bodyStyles: { fontSize: 10 },
    footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: ML, right: MR }
  });

  // ─── SECTION 4: Water Meter Table ────────────────────────────────────────────
  const waterUsage = Math.max(0, Number(flatData.currentReading || 0) - Number(flatData.previousReading || 0));
  const rate = waterUsage > 0 ? (flatData.waterCost || 0) / waterUsage : 0;
  const exactAmount = waterUsage > 0 ? (waterUsage * rate).toFixed(2) : '0.00';
  const formula = waterUsage > 0
    ? `${waterUsage} L x Rs.${rate.toFixed(3)}/L = Rs.${exactAmount}\nRounded Amount = Rs.${roundedWater}`
    : 'No metered water usage';

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Water Meter Details', 'Value']],
    body: [
      ['Previous Reading', String(flatData.previousReading || 0)],
      ['Current Reading',  String(flatData.currentReading  || 0)],
      ['Total Usage',      `${waterUsage} Liters`],
      ['Rate per Liter',   `Rs. ${rate.toFixed(3)}`],
      ['Water Cost Calculation', formula]
    ],
    foot: [['Total Metered Water Cost', fmtRs(roundedWater)]],
    theme: 'grid',
    headStyles: { fillColor: waterC, fontStyle: 'bold', fontSize: 11 },
    bodyStyles: { fontSize: 10 },
    footStyles: { fillColor: [240, 249, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
    columnStyles: { 1: { halign: 'right' }, 0: { cellWidth: 90 } },
    margin: { left: ML, right: MR }
  });

  // ─── SECTION 5: Bill Summary Table ───────────────────────────────────────────
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Bill Summary', 'Amount']],
    body: [
      ['Common Charges',       fmtRs(totalCommon)],
      ['Metered Water',        fmtRs(roundedWater)],
      ['Electricity',          fmtRs(roundedElectricity)],
      ['Security',             fmtRs(roundedSecurity)],
      ['Previous Outstanding', fmtRs(roundedArrears)]
    ],
    // No foot row here — we draw a custom standout TOTAL block below
    theme: 'striped',
    headStyles: { fillColor: dark, fontStyle: 'bold', fontSize: 11 },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: ML, right: MR }
  });

  // ─── SECTION 6: Prominent TOTAL AMOUNT DUE Block ─────────────────────────────
  const totalBlockY = doc.lastAutoTable.finalY + 6;
  const totalBlockH = 20;

  // Dark background block spanning full content width
  doc.setFillColor(...dark);
  doc.rect(ML, totalBlockY, CW, totalBlockH, 'F');

  // Separator lines above and below (golden)
  doc.setDrawColor(255, 220, 50);
  doc.setLineWidth(0.5);
  doc.line(ML, totalBlockY, ML + CW, totalBlockY);
  doc.line(ML, totalBlockY + totalBlockH, ML + CW, totalBlockY + totalBlockH);
  doc.setLineWidth(0.2);

  // Left label
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL AMOUNT DUE', ML + 5, totalBlockY + 13);

  // Right amount — 20pt golden bold
  doc.setFontSize(20);
  doc.setTextColor(255, 220, 50); // Golden yellow
  doc.text(fmtRs(calculatedTotal), pageWidth - MR - 4, totalBlockY + 14, { align: 'right' });

  // ─── SECTION 7: Contact Footer ────────────────────────────────────────────────
  const footerY = totalBlockY + totalBlockH + 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(ML, footerY, pageWidth - MR, footerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...blue);
  doc.text(apartmentName || 'Residential Society', ML, footerY + 6);
  if (apartmentAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate);
    doc.setFontSize(8);
    doc.text(apartmentAddress, ML, footerY + 11);
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate);
  doc.text(`Contact: ${apartmentContact.phone}   |   Email: ${apartmentContact.email}`, ML, footerY + 12);

  doc.setFontSize(8);
  doc.text('This is a computer-generated invoice and does not require a physical signature.', pageWidth / 2, footerY + 20, { align: 'center' });
  doc.text('Please pay your dues within 5 days to avoid late payment penalties.', pageWidth / 2, footerY + 26, { align: 'center' });

  if (returnBase64) {
    // Return the base64 string without the data URI prefix
    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1];
  }

  // ─── Open Preview with a proper tab title ────────────────────────────────────
  const filename = `Invoice_${flatData.flatNo}_${month || 'current'}`;
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #525659; }
            embed { display: block; width: 100vw; height: 100vh; }
          </style>
        </head>
        <body>
          <embed src="${blobUrl}" type="application/pdf" width="100%" height="100%" />
        </body>
      </html>
    `);
    previewWindow.document.close();
  }
};
