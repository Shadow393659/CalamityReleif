import React, { useRef } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  FileText
} from 'lucide-react';

export default function SitRepModal({ data, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef(null);

  const {
    distress = [],
    camps = [],
    inventory = [],
    responders = [],
    metrics = {},
  } = data;

  const sitrepNumber = `NOOR-SITREP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`;
  const reportDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const totalPeopleImpacted = distress.reduce((acc, d) => {
    return acc + (d.peopleCount?.adults || 0) + (d.peopleCount?.children || 0) + (d.peopleCount?.elderly || 0);
  }, 0);

  const criticalCases = distress.filter((d) => d.urgencyLevel?.includes('Critical')).length;
  const resolvedCases = distress.filter((d) => d.status === 'Resolved').length;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textReport = `
================================================================================
OFFICIAL SITUATION REPORT (SITREP) - NOOR DISASTER PLATFORM
INCIDENT: BAY OF BENGAL COASTAL CYCLONE & TIDAL SURGE AFTERMATH
SITREP ID: ${sitrepNumber}
TIMESTAMP: ${reportDate}
CLASSIFICATION: OFFICIAL PUBLIC SAFETY DIRECTIVE
================================================================================

1. EXECUTIVE SUMMARY:
- Total Logged Distress Incidents: ${distress.length}
- Life-Threatening (Critical P1): ${criticalCases}
- Successfully Resolved / Evacuated: ${resolvedCases}
- Citizens Rescued / Assisted: ${totalPeopleImpacted} individuals
- Relief Shelters Active: ${camps.length}
- Average Initial Triage Response Time: ${metrics.avgResponseTime || '18.4 mins'}

2. OPERATIONAL SECTORS:
${['Sundarbans Delta', 'Kendrapara & Coastal Zone', 'Paradip Port & Jagatsinghpur', 'Puri Coastal Sector', 'Balasore Sector']
  .map((zone) => {
    const count = distress.filter((d) => d.location?.districtZone === zone).length;
    return `* ${zone}: ${count} active distress cases`;
  })
  .join('\n')}

3. RELIEF SUPPLIES DISPATCHED:
${inventory
  .map(
    (item) =>
      `* ${item.itemType}: ${item.allocatedQuantity?.toLocaleString()} dispatched / ${item.availableQuantity?.toLocaleString()} available (${item.managedByOrg})`
  )
  .join('\n')}

4. KEY DIRECTIVES:
- Maintain high-speed boat staging in Kumirmari & Satabhaya.
- Preposition chlorine purification packets and pediatric nutrition to cut-off coastal pockets.
- Dispatch mobile medical triage van to Kendrapara sector.

Report Issued By: State Emergency Operations Center (SEOC) & Noor Coordination Team
================================================================================
    `.trim();

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-slate-900/30 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      
      {/* Printable Report Document Container */}
      <div
        ref={printRef}
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-10 text-slate-800 print:bg-white print:text-black print:border-none print:shadow-none print:p-6"
      >
        
        {/* Top Action Toolbar (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            <span className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Executive Situation Report (SitRep)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Text' : 'Copy Briefing'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="space-y-6 font-sans">
          
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-900 text-white uppercase tracking-wider">
                  OFFICIAL SITREP
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {sitrepNumber}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                DISASTER RESPONSE OPERATIONAL BULLETIN
              </h1>
              <p className="text-xs text-slate-600">
                Joint Coordination: State Emergency Operations Center (SEOC) & Noor Relief Command
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-0.5 text-slate-600">
              <div className="font-mono text-[11px]">{reportDate}</div>
              <div className="font-semibold text-rose-700">ALERT STAGE: ACTIVE DISASTER TRIAGE</div>
            </div>
          </div>

          {/* Key Incident Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Distress SOS</span>
              <span className="text-xl font-bold font-mono text-slate-900">{distress.length}</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Critical Triage (P1)</span>
              <span className="text-xl font-bold font-mono text-rose-700">{criticalCases}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Citizens Impacted</span>
              <span className="text-xl font-bold font-mono text-blue-700">{totalPeopleImpacted}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Resolution Rate</span>
              <span className="text-xl font-bold font-mono text-emerald-800">
                {distress.length > 0 ? Math.round((resolvedCases / distress.length) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              1. Ground Situation Summary
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Coastal tidal surges and river breaches have flooded coastal sectors in Kendrapara and the Sundarbans Delta. Primary operational priorities remain boat-based rescues for stranded families and expedited medical evacuation for acute trauma and pediatric emergencies.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              2. Distress Incident Density by Operational Sector
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                'Sundarbans Delta',
                'Kendrapara & Coastal Zone',
                'Paradip Port & Jagatsinghpur',
                'Puri Coastal Sector',
                'Balasore Sector',
              ].map((zone) => {
                const zoneCalls = distress.filter((d) => d.location?.districtZone === zone);
                const zoneCrit = zoneCalls.filter((d) => d.urgencyLevel?.includes('Critical')).length;
                return (
                  <div key={zone} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 block">{zone}</span>
                      <span className="text-[10px] text-slate-500">{zoneCalls.length} Reported Calls</span>
                    </div>
                    {zoneCrit > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {zoneCrit} Critical
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              3. Critical Resource Distribution Summary
            </h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                  <th className="py-1.5">Item Type</th>
                  <th className="py-1.5">Allocated / Dispatched</th>
                  <th className="py-1.5">Remaining Stock</th>
                  <th className="py-1.5">Managing Organization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((inv) => (
                  <tr key={inv._id}>
                    <td className="py-1.5 font-bold text-slate-900">{inv.itemType}</td>
                    <td className="py-1.5 font-mono text-amber-800 font-semibold">
                      {inv.allocatedQuantity?.toLocaleString()} {inv.unit}
                    </td>
                    <td className="py-1.5 font-mono text-emerald-800 font-semibold">
                      {inv.availableQuantity?.toLocaleString()} {inv.unit}
                    </td>
                    <td className="py-1.5 text-slate-600">{inv.managedByOrg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Sign-off */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-slate-500 gap-3">
            <div>
              <span>Generated by: <strong>Noor Disaster Response Operations Grid</strong></span>
              <br />
              <span>Authority: <strong>State Disaster Management Directorate</strong></span>
            </div>
            <div className="sm:text-right">
              <span className="font-mono text-slate-700 font-semibold">OFFICIAL PUBLIC SAFETY BRIEFING</span>
              <br />
              <span>Page 1 of 1</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
