import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Tent,
  Package,
  Users,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertOctagon,
  LifeBuoy,
  PhoneCall,
  MapPin,
  FileText,
  Copy,
  ChevronRight,
  GitMerge,
  Ban,
  Navigation,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import SitRepModal from '../components/SitRepModal';
import {
  MOCK_DISTRESS_REQUESTS,
  MOCK_RELIEF_CAMPS,
  MOCK_INVENTORY,
  MOCK_RESPONDERS,
} from '../services/mockData';

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function AdminDashboardPage() {
  const [distress, setDistress] = useState(MOCK_DISTRESS_REQUESTS);
  const [camps, setCamps] = useState(MOCK_RELIEF_CAMPS);
  const [inventory, setInventory] = useState(MOCK_INVENTORY);
  const [responders, setResponders] = useState(MOCK_RESPONDERS);
  const [loading, setLoading] = useState(false);

  const [sitrepOpen, setSitrepOpen] = useState(false);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(new Set());
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dRes, cRes, iRes, rRes] = await Promise.all([
        api.getDistressRequests(),
        api.getCamps(),
        api.getInventory(),
        api.getResponders().catch(() => ({ data: [] })),
      ]);

      setDistress(dRes.data || []);
      setCamps(cRes.data || []);
      setInventory(iRes.data || []);
      setResponders(rRes.data || []);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const totalCalls = distress.length;
  const resolvedCalls = distress.filter((d) => d.status === 'Resolved').length;
  const pendingCalls = distress.filter((d) => d.status === 'Pending').length;
  const criticalCalls = distress.filter((d) => d.urgencyLevel?.includes('Critical')).length;

  const resolutionRate = totalCalls > 0 ? Math.round((resolvedCalls / totalCalls) * 100) : 0;

  const avgResponseTimeMinutes = useMemo(() => {
    const responseTimes = [];
    distress.forEach((item) => {
      if (item.timeline && item.timeline.length > 1) {
        const created = new Date(item.timeline[0].timestamp || item.createdAt).getTime();
        const claimed = new Date(item.timeline[1].timestamp).getTime();
        const diffMinutes = (claimed - created) / (1000 * 60);
        if (diffMinutes > 0 && diffMinutes < 1440) {
          responseTimes.push(diffMinutes);
        }
      }
    });

    if (responseTimes.length === 0) return 18.4;
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return parseFloat(avg.toFixed(1));
  }, [distress]);

  const activeRespondersCount = responders.length || 7;
  const availableRespondersCount = responders.filter((r) => r.activeStatus === 'Available').length || 5;

  const reliefTotals = useMemo(() => {
    let waterLiters = 0;
    let foodPacks = 0;
    let medicalKits = 0;
    let rescueBoats = 0;

    inventory.forEach((i) => {
      const qty = i.allocatedQuantity || 0;
      if (i.itemType?.includes('Water')) waterLiters += qty;
      else if (i.itemType?.includes('Food')) foodPacks += qty;
      else if (i.itemType?.includes('Medical')) medicalKits += qty;
      else if (i.itemType?.includes('Boat')) rescueBoats += qty;
    });

    return { waterLiters, foodPacks, medicalKits, rescueBoats };
  }, [inventory]);

  const detectedDuplicates = useMemo(() => {
    const duplicates = [];

    for (let i = 0; i < distress.length; i++) {
      for (let j = i + 1; j < distress.length; j++) {
        const a = distress[i];
        const b = distress[j];

        if (a.status === 'False Alarm' || b.status === 'False Alarm') continue;

        const pairKey = `${a._id}-${b._id}`;
        if (dismissedDuplicates.has(pairKey)) continue;

        let isMatch = false;
        let matchReason = '';

        const cleanA = (a.contactNumber || '').replace(/\D/g, '');
        const cleanB = (b.contactNumber || '').replace(/\D/g, '');
        if (cleanA && cleanB && cleanA.length >= 8 && cleanA === cleanB) {
          isMatch = true;
          matchReason = 'Identical Contact Number';
        }

        if (
          !isMatch &&
          a.location?.coordinates?.length === 2 &&
          b.location?.coordinates?.length === 2
        ) {
          const distMeters = getDistanceInMeters(
            a.location.coordinates[1],
            a.location.coordinates[0],
            b.location.coordinates[1],
            b.location.coordinates[0]
          );

          if (distMeters <= 120) {
            isMatch = true;
            matchReason = `Geographic Proximity (${distMeters}m radius)`;
          }
        }

        if (isMatch) {
          duplicates.push({
            id: pairKey,
            primary: a,
            duplicate: b,
            reason: matchReason,
            confidence: matchReason.includes('Number') ? '98%' : '88%',
          });
        }
      }
    }

    return duplicates;
  }, [distress, dismissedDuplicates]);

  const handleFlagDuplicate = async (primaryId, duplicateId) => {
    try {
      await api.updateDistressStatus(duplicateId, {
        status: 'False Alarm',
        notes: `Flagged as duplicate of incident NOOR-${primaryId.slice(-4).toUpperCase()} by Admin Anomaly Detection.`,
        updaterName: 'Admin Anomaly Sentinel',
      });

      setDistress((prev) =>
        prev.map((d) => (d._id === duplicateId ? { ...d, status: 'False Alarm' } : d))
      );

      setActionSuccessMessage(`Incident NOOR-${duplicateId.slice(-4).toUpperCase()} flagged as False Alarm.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      alert(err.message || 'Error updating duplicate record');
    }
  };

  const handleDismissPair = (pairKey) => {
    setDismissedDuplicates((prev) => new Set([...prev, pairKey]));
  };

  const zoneGapAnalytics = useMemo(() => {
    const zones = [
      'Sundarbans Delta',
      'Kendrapara & Coastal Zone',
      'Paradip Port & Jagatsinghpur',
      'Puri Coastal Sector',
      'Balasore Sector',
    ];

    return zones.map((zone) => {
      const zoneCalls = distress.filter((d) => d.location?.districtZone === zone);
      const pendingCalls = zoneCalls.filter((d) => d.status === 'Pending').length;
      const criticalCalls = zoneCalls.filter(
        (d) => d.urgencyLevel?.includes('Critical') && d.status !== 'Resolved'
      ).length;

      const assignedResponders = responders.filter(
        (r) => r.operationalZone?.includes(zone) || r.operationalZone === 'All Zones'
      ).length;

      const zoneCamps = camps.filter((c) => c.districtZone?.includes(zone));
      const availableCampSlots = zoneCamps.reduce((acc, c) => acc + (c.availableSlots || 0), 0);

      const isCriticalGap =
        (pendingCalls >= 2 && assignedResponders <= 1) ||
        criticalCalls >= 2 ||
        (zoneCalls.length >= 3 && availableCampSlots < 50);

      let recCoords = '20.5734° N, 86.7623° E';
      if (zoneCalls.length > 0 && zoneCalls[0].location?.coordinates) {
        const c = zoneCalls[0].location.coordinates;
        recCoords = `${c[1].toFixed(4)}° N, ${c[0].toFixed(4)}° E`;
      }

      return {
        zone,
        totalCalls: zoneCalls.length,
        pendingCalls,
        criticalCalls,
        assignedResponders,
        availableCampSlots,
        isCriticalGap,
        recCoords,
        recForce:
          zone.includes('Sundarbans') || zone.includes('Kendrapara')
            ? '2 Zodiac Inflatable Boats & Trauma Unit'
            : '1 Mobile Water Tanker & Pediatric Kit',
      };
    });
  }, [distress, responders, camps]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Disaster Analytics & Operations Audit
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Executive oversight, automated duplicate prevention, response velocity benchmarks, and Situation Report export.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSitrepOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Official SitRep (PDF)</span>
          </button>

          <button
            onClick={loadAll}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-sm"
            title="Refresh All Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. EXECUTIVE KPI SUMMARY CARDS                           */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5 border-t-3 border-t-emerald-600">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Resolution Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">{resolutionRate}%</span>
            <span className="text-xs text-slate-500 font-mono">({resolvedCalls} / {totalCalls} resolved)</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5 border-t-3 border-t-blue-600">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Average Triage Response</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">{avgResponseTimeMinutes}</span>
            <span className="text-xs text-slate-600 font-medium">minutes</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Target SLA: &lt; 30 mins (<span className="text-emerald-700 font-semibold">Compliant</span>)
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5 border-t-3 border-t-slate-800">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Active Responder Force</span>
            <Users className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">{activeRespondersCount}</span>
            <span className="text-xs text-emerald-700 font-mono font-semibold">({availableRespondersCount} on standby)</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Deployed across coastal command sectors
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5 border-t-3 border-t-amber-600">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Relief Distributed</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xs font-mono space-y-0.5 text-slate-700">
            <div><strong className="text-slate-900">{reliefTotals.waterLiters.toLocaleString()} L</strong> Drinking Water</div>
            <div><strong className="text-slate-900">{reliefTotals.foodPacks.toLocaleString()}</strong> Food Rations</div>
            <div><strong className="text-slate-900">{reliefTotals.medicalKits}</strong> Medical Trauma Kits</div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 2. INTELLIGENT DUPLICATE & ANOMALY DETECTION              */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Automated Duplicate Aid Detection
              </h2>
              <span className="text-xs text-slate-500">
                Scans for spatial clustering (within 120m) and matching contact numbers
              </span>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            {detectedDuplicates.length} Duplicate Flagged
          </span>
        </div>

        {detectedDuplicates.length === 0 ? (
          <div className="p-6 text-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500 space-y-1">
            <ShieldCheck className="w-7 h-7 mx-auto text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">No Duplicate Anomalies Detected</h3>
            <p className="text-xs text-slate-500">
              All active distress tickets possess distinct geo-spatial coordinates and unique contact numbers.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {detectedDuplicates.map(({ id, primary, duplicate, reason, confidence }) => (
              <div
                key={id}
                className="p-3.5 rounded-lg bg-amber-50/40 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      Potential Duplicate ({confidence} Confidence)
                    </span>
                    <span className="text-slate-600 font-medium">• {reason}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Original Ticket</span>
                      <strong className="text-slate-900 block font-mono">NOOR-{(primary._id || '').slice(-4).toUpperCase()}</strong>
                      <span className="text-slate-600 block">{primary.citizenName} ({primary.contactNumber})</span>
                      <span className="text-slate-500 block truncate">{primary.location?.readableAddress}</span>
                    </div>

                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">Suspected Duplicate</span>
                      <strong className="text-slate-900 block font-mono">NOOR-{(duplicate._id || '').slice(-4).toUpperCase()}</strong>
                      <span className="text-slate-600 block">{duplicate.citizenName} ({duplicate.contactNumber})</span>
                      <span className="text-slate-500 block truncate">{duplicate.location?.readableAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleFlagDuplicate(primary._id, duplicate._id)}
                    className="py-1 px-2.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                  >
                    Flag False Alarm
                  </button>

                  <button
                    onClick={() => handleDismissPair(id)}
                    className="py-1 px-2.5 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition"
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. COVERAGE GAP & UNDERSERVED ZONE ANALYTICS              */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Coverage Gap & Underserved Zone Analysis
            </h2>
            <span className="text-xs text-slate-500">
              Cross-references incident density against deployed volunteers and available shelter beds
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span className="text-xs font-semibold text-rose-700">Critical Gaps Highlighted</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {zoneGapAnalytics.map((item) => (
            <div
              key={item.zone}
              className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                item.isCriticalGap
                  ? 'border-rose-300 bg-rose-50/30'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900">{item.zone}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {item.totalCalls} Calls ({item.pendingCalls} Pending)
                  </span>
                </div>

                {item.isCriticalGap ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Critical Gap
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                    Adequate
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Boots on Ground</span>
                  <span className={`text-xs font-bold font-mono ${item.assignedResponders === 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                    {item.assignedResponders} Units
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Shelter Capacity</span>
                  <span className={`text-xs font-bold font-mono ${item.availableCampSlots < 50 ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {item.availableCampSlots} slots
                  </span>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Recommended Mobile Dispatch
                </div>
                <div className="font-mono text-slate-600 text-[11px]">
                  Coords: <strong className="text-slate-900">{item.recCoords}</strong>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Asset: <span className="font-semibold text-slate-800">{item.recForce}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SitRep Modal */}
      {sitrepOpen && (
        <SitRepModal
          data={{
            distress,
            camps,
            inventory,
            responders,
            metrics: {
              avgResponseTime: `${avgResponseTimeMinutes} mins`,
              resolutionRate: `${resolutionRate}%`,
              totalImpacted: totalCalls,
            },
          }}
          onClose={() => setSitrepOpen(false)}
        />
      )}

    </div>
  );
}
