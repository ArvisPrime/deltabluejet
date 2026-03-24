/**
 * Table Export Utilities — CSV download & Print-to-PDF
 */

/** Download data as a CSV file */
export function downloadCSV(rows: Record<string, string | number>[], filename: string) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [
        headers.join(','),
        ...rows.map(row =>
            headers.map(h => {
                const val = String(row[h] ?? '').replace(/"/g, '""');
                return `"${val}"`;
            }).join(',')
        ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/** Print an HTML table or content block styled for PDF */
export function printTable(title: string, htmlContent: string) {
    const win = window.open('', '_blank', 'width=1000,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
        <title>${title} — DeltaBlue Jet Air</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { margin: 1cm; }
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1f36; padding: 24px; }
            .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #0066ff; }
            .header h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
            .header .meta { font-size: 10px; color: #6b7280; text-align: right; }
            .header .brand { font-size: 12px; font-weight: 800; color: #0066ff; text-transform: uppercase; letter-spacing: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
            th { background: #f0f4ff; color: #374151; font-weight: 800; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #d1d5db; }
            td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) { background: #fafbff; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            .badge-active { background: #ecfdf5; color: #059669; }
            .badge-on_leave { background: #fffbeb; color: #d97706; }
            .badge-training { background: #eff6ff; color: #2563eb; }
            .badge-inactive { background: #f3f4f6; color: #6b7280; }
            .badge-flight { background: #eff6ff; color: #0066ff; }
            .badge-standby_office { background: #fffbeb; color: #d97706; }
            .badge-standby_home { background: #ecfdf5; color: #059669; }
            .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }
            @media print { body { padding: 0; } }
        </style>
    </head><body>
        <div class="header">
            <div>
                <div class="brand">DeltaBlue Jet Air</div>
                <h1>${title}</h1>
            </div>
            <div class="meta">
                <div>Generated: ${new Date().toLocaleString()}</div>
                <div>Document: Confidential</div>
            </div>
        </div>
        ${htmlContent}
        <div class="footer">
            <span>DeltaBlue Jet Air — Crew Operations</span>
            <span>Page 1</span>
        </div>
        <script>window.onload = function() { window.print(); }</script>
    </body></html>`);
    win.document.close();
}
