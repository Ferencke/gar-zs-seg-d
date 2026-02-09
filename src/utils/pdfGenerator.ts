import jsPDF from 'jspdf';
import { ServiceRecord, Vehicle, Customer, Part } from '@/types';
import { CompanySettings } from '@/hooks/useCompanySettings';

interface PdfData {
  service: ServiceRecord;
  vehicle: Vehicle | null;
  customer: Customer | null;
  companySettings: CompanySettings;
}

export function generateWorksheetPdf(data: PdfData): jsPDF {
  const { service, vehicle, customer, companySettings } = data;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  const valueColumnX = rightMargin - 5; // Right-aligned column for amounts
  
  // Helper functions
  const addText = (text: string, x: number, yPos: number, options?: { fontSize?: number; fontStyle?: 'normal' | 'bold'; align?: 'left' | 'center' | 'right' }) => {
    doc.setFontSize(options?.fontSize || 10);
    doc.setFont('helvetica', options?.fontStyle || 'normal');
    
    if (options?.align === 'center') {
      doc.text(text, pageWidth / 2, yPos, { align: 'center' });
    } else if (options?.align === 'right') {
      doc.text(text, rightMargin, yPos, { align: 'right' });
    } else {
      doc.text(text, x, yPos);
    }
  };

  const addLine = (yPos: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, yPos, rightMargin, yPos);
  };

  const addSectionTitle = (title: string, yPos: number) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, 8, 'F');
    addText(title, leftMargin + 3, yPos, { fontSize: 11, fontStyle: 'bold' });
    return yPos + 10;
  };

  // Company Header
  const hasCompanyInfo = companySettings.name || companySettings.address || companySettings.phone;
  if (hasCompanyInfo) {
    if (companySettings.name) {
      addText(companySettings.name, 0, y, { fontSize: 16, fontStyle: 'bold', align: 'center' });
      y += 7;
    }
    
    const companyDetails: string[] = [];
    if (companySettings.address) companyDetails.push(companySettings.address);
    if (companyDetails.length > 0) {
      addText(companyDetails.join(' | '), 0, y, { fontSize: 9, align: 'center' });
      y += 5;
    }
    
    const contactDetails: string[] = [];
    if (companySettings.phone) contactDetails.push(`Tel: ${companySettings.phone}`);
    if (companySettings.email) contactDetails.push(companySettings.email);
    if (contactDetails.length > 0) {
      addText(contactDetails.join(' | '), 0, y, { fontSize: 9, align: 'center' });
      y += 5;
    }

    const taxDetails: string[] = [];
    if (companySettings.taxNumber) taxDetails.push(`Adószám: ${companySettings.taxNumber}`);
    if (companySettings.bankAccount) taxDetails.push(`Bankszámla: ${companySettings.bankAccount}`);
    if (taxDetails.length > 0) {
      addText(taxDetails.join(' | '), 0, y, { fontSize: 9, align: 'center' });
      y += 5;
    }

    if (companySettings.website) {
      addText(companySettings.website, 0, y, { fontSize: 9, align: 'center' });
      y += 5;
    }

    addLine(y);
    y += 10;
  }

  // Worksheet Title
  addText('MUNKALAP', 0, y, { fontSize: 20, fontStyle: 'bold', align: 'center' });
  y += 15;

  // Vehicle Data Section
  y = addSectionTitle('JÁRMŰ ADATOK', y);
  
  const vehicleData = [
    ['Típus:', `${vehicle?.brand || ''} ${vehicle?.model || ''}`],
    ['Rendszám:', vehicle?.licensePlate || '-'],
    ['Évjárat:', vehicle?.year?.toString() || '-'],
    ['Üzemanyag:', vehicle?.fuelType || '-'],
    ['Alvázszám:', vehicle?.vin || '-'],
    ['Motorkód:', vehicle?.engineCode || '-'],
    ['Hengerűrtartalom:', vehicle?.displacement ? `${vehicle.displacement} cm³` : '-'],
    ['Teljesítmény:', vehicle?.power ? `${vehicle.power} kW` : '-'],
    ['Km óra állás:', service.mileage ? `${service.mileage.toLocaleString()} km` : '-'],
  ];

  const colWidth = (rightMargin - leftMargin) / 2;
  for (let i = 0; i < vehicleData.length; i += 2) {
    addText(vehicleData[i][0], leftMargin, y, { fontSize: 9 });
    addText(vehicleData[i][1], leftMargin + 35, y, { fontSize: 9, fontStyle: 'bold' });
    
    if (vehicleData[i + 1]) {
      addText(vehicleData[i + 1][0], leftMargin + colWidth, y, { fontSize: 9 });
      addText(vehicleData[i + 1][1], leftMargin + colWidth + 35, y, { fontSize: 9, fontStyle: 'bold' });
    }
    y += 6;
  }
  y += 5;

  // Owner Section
  y = addSectionTitle('TULAJDONOS', y);
  
  addText('Név:', leftMargin, y, { fontSize: 9 });
  addText(customer?.name || '-', leftMargin + 35, y, { fontSize: 9, fontStyle: 'bold' });
  addText('Telefon:', leftMargin + colWidth, y, { fontSize: 9 });
  addText(customer?.phone || '-', leftMargin + colWidth + 35, y, { fontSize: 9, fontStyle: 'bold' });
  y += 6;

  if (customer?.email) {
    addText('Email:', leftMargin, y, { fontSize: 9 });
    addText(customer.email, leftMargin + 35, y, { fontSize: 9, fontStyle: 'bold' });
    y += 6;
  }
  if (customer?.address) {
    addText('Cím:', leftMargin, y, { fontSize: 9 });
    addText(customer.address, leftMargin + 35, y, { fontSize: 9, fontStyle: 'bold' });
    y += 6;
  }
  y += 5;

  // Work Description Section
  y = addSectionTitle('ELVÉGZETT MUNKÁK', y);
  
  const descLines = doc.splitTextToSize(service.description, rightMargin - leftMargin - 5);
  doc.setFontSize(10);
  doc.text(descLines, leftMargin, y);
  y += descLines.length * 5 + 3;

  if (service.notes) {
    addText('Megjegyzések:', leftMargin, y, { fontSize: 9, fontStyle: 'bold' });
    y += 5;
    const notesLines = doc.splitTextToSize(service.notes, rightMargin - leftMargin - 5);
    doc.setFontSize(9);
    doc.text(notesLines, leftMargin, y);
    y += notesLines.length * 4 + 3;
  }
  y += 5;

  // Parts Section
  y = addSectionTitle('BEÉPÍTETT ALKATRÉSZEK', y);
  
  const parts = service.parts || [];
  if (parts.length > 0) {
    // Table header
    doc.setFillColor(245, 245, 245);
    doc.rect(leftMargin, y - 4, rightMargin - leftMargin, 7, 'F');
    addText('Megnevezés', leftMargin + 2, y, { fontSize: 8, fontStyle: 'bold' });
    addText('Cikkszám', leftMargin + 70, y, { fontSize: 8, fontStyle: 'bold' });
    addText('Menny.', leftMargin + 110, y, { fontSize: 8, fontStyle: 'bold' });
    doc.text('Ár', valueColumnX, y, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    y += 7;

    parts.forEach((part: Part) => {
      const partName = part.name.length > 35 ? part.name.substring(0, 32) + '...' : part.name;
      addText(partName, leftMargin + 2, y, { fontSize: 9 });
      addText(part.partNumber || '-', leftMargin + 70, y, { fontSize: 9 });
      addText(part.quantity.toString(), leftMargin + 110, y, { fontSize: 9 });
      // Right-align the price
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(part.price ? `${(part.price * part.quantity).toLocaleString()} Ft` : '-', valueColumnX, y, { align: 'right' });
      y += 6;
    });
  } else {
    addText('Nincs beépített alkatrész', leftMargin, y, { fontSize: 9 });
    y += 6;
  }
  y += 10;

  // Summary Section
  const partsTotal = parts.reduce((sum, p) => sum + (p.price || 0) * p.quantity, 0);
  const laborCost = service.cost ? service.cost - partsTotal : 0;

  addLine(y - 3);
  y += 5;

  // Right-aligned summary lines
  if (service.laborHours) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Munkaórák: ${service.laborHours} óra`, valueColumnX, y, { align: 'right' });
    y += 6;
  }
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Alkatrészek összesen: ${partsTotal.toLocaleString()} Ft`, valueColumnX, y, { align: 'right' });
  y += 6;
  doc.text(`Munkadíj: ${laborCost.toLocaleString()} Ft`, valueColumnX, y, { align: 'right' });
  y += 8;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(rightMargin - 80, y - 5, 75, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`VÉGÖSSZEG: ${(service.cost || 0).toLocaleString()} Ft`, valueColumnX, y + 1, { align: 'right' });
  y += 20;

  // Footer
  addLine(y - 5);
  const footerContent = [
    service.location ? service.location : null,
    new Date(service.date).toLocaleDateString('hu-HU')
  ].filter(Boolean).join(' • ');
  addText(footerContent, 0, y, { fontSize: 9, align: 'center' });

  return doc;
}

export function downloadWorksheetPdf(data: PdfData): void {
  const doc = generateWorksheetPdf(data);
  const fileName = `munkalap_${data.vehicle?.licensePlate || 'ismeretlen'}_${new Date(data.service.date).toISOString().split('T')[0]}.pdf`;
  
  // Use blob URL for better mobile compatibility
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getWorksheetPdfBlob(data: PdfData): Blob {
  const doc = generateWorksheetPdf(data);
  return doc.output('blob');
}

export async function sharePdfViaMessaging(data: PdfData): Promise<boolean> {
  const { service, vehicle, customer } = data;
  const blob = getWorksheetPdfBlob(data);
  const fileName = `munkalap_${vehicle?.licensePlate || 'ismeretlen'}_${new Date(service.date).toISOString().split('T')[0]}.pdf`;
  
  // Try Web Share API with file sharing
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const shareData = {
      files: [file],
      title: `Munkalap - ${vehicle?.licensePlate || ''}`,
      text: `Munkalap a(z) ${vehicle?.brand || ''} ${vehicle?.model || ''} (${vehicle?.licensePlate || ''}) járműhöz.\nVégösszeg: ${(service.cost || 0).toLocaleString()} Ft`
    };
    
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return false;
        }
      }
    }
  }
  
  // Fallback: download the file
  downloadWorksheetPdf(data);
  return false;
}

export function openEmailWithPdf(data: PdfData): void {
  const { service, vehicle, customer, companySettings } = data;
  
  const subject = encodeURIComponent(`Munkalap - ${vehicle?.licensePlate || ''} - ${new Date(service.date).toLocaleDateString('hu-HU')}`);
  
  const body = encodeURIComponent(`Tisztelt ${customer?.name || 'Ügyfelünk'}!

Mellékelten küldjük a munkalapot a(z) ${vehicle?.brand || ''} ${vehicle?.model || ''} (${vehicle?.licensePlate || ''}) járműhöz elvégzett munkáról.

Összesen: ${(service.cost || 0).toLocaleString()} Ft

Üdvözlettel,
${companySettings.name || 'Autószerviz'}`);

  // Download the PDF first
  downloadWorksheetPdf(data);
  
  // Open email client
  const emailTo = customer?.email || '';
  window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
}
