import { BRAND } from '../config/brand';
import type { BookingDoc, PassengerDoc } from '../types/firestore';

/**
 * Generates an HTML invoice for a booking and triggers a download.
 */
export const generateInvoice = (booking: BookingDoc, passengers: PassengerDoc[]) => {
   const passengerNames = passengers.map(p => `${p.firstName} ${p.lastName}`).join(', ');
   const totalAmount = `£${(booking.totalAmount / 100).toFixed(2)}`;
   const dateStr = booking.createdAt?.toDate().toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' }) || 'N/A';
   
   // Hardcoded estimate of taxes & fees for the invoice (typically 20% of fare or so in real app, we use fixed string for demo parity)
   // For realism based on the total, let's keep it styled like the original
   const baseFare = (booking.totalAmount / 100) * 0.8;
   const taxesFixed = (booking.totalAmount / 100) * 0.2;

   const invoiceHTML = `
<!DOCTYPE html><html><head><title>Invoice DJ-${booking.pnr}</title>
<style>
   body{font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#1a1a2e}
   h1{font-size:28px;margin:0 0 4px}h2{font-size:14px;color:#666;text-transform:uppercase;letter-spacing:2px;margin:0 0 30px}
   .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #eee;padding-bottom:20px;margin-bottom:30px}
   .brand{font-size:22px;font-weight:900;letter-spacing:-1px}
   table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:10px 12px;text-align:left;border-bottom:1px solid #eee;font-size:13px}
   th{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700}
   .total-row td{font-weight:900;font-size:18px;border-top:2px solid #1a1a2e;border-bottom:none}
   .footer{margin-top:40px;font-size:10px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:16px}
</style></head><body>
<div class="header"><div><div class="brand">${BRAND.shortName}</div><h2>Booking Invoice</h2></div><div style="text-align:right;font-size:12px"><strong>Invoice #DJ-${booking.pnr}</strong><br>Date: ${dateStr}<br>PNR: ${booking.pnr}</div></div>
<p style="font-size:12px;margin-bottom:20px"><strong>Passengers:</strong> ${passengerNames}<br><strong>Flight:</strong> ${booking.flightNumber} &bull; ${booking.departureTime?.toDate().toLocaleDateString() || 'N/A'}<br><strong>Class:</strong> ${booking.fareClass || 'Economy'}</p>
<table><tr><th>Description</th><th style="text-align:right">Amount</th></tr>
<tr><td>${booking.fareClass || 'Economy'} Class Fare (×${passengers.length} passengers)</td><td style="text-align:right">£${baseFare.toFixed(2)}</td></tr>
<tr><td>Taxes & Fees</td><td style="text-align:right">£${taxesFixed.toFixed(2)}</td></tr>
<tr class="total-row"><td>Total Paid</td><td style="text-align:right">${totalAmount}</td></tr></table>
<p style="font-size:11px;color:#666;margin-top:24px"><strong>Payment:</strong> Recorded against booking</p>
<div class="footer">${BRAND.name} &bull; Invoice generated ${new Date().toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
</body></html>`;

   const blob = new Blob([invoiceHTML], { type: 'text/html' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `Invoice-DJ-${booking.pnr}.html`;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
};
