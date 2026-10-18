import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Activity,
  Flame,
  Tent,
  Package,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Users,
  Layers,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Send,
  Plus,
  Minus,
  CheckCircle2,
  PhoneCall,
  Search,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import {
  MOCK_DISTRESS_REQUESTS,
  MOCK_RELIEF_CAMPS,
  MOCK_INVENTORY,
} from '../services/mockData';

// ==========================================
// 1. REFINED ENTERPRISE MAP MARKERS
// ==========================================

const createDistressMarker = (urgency) => {
  const isCrit = urgency?.includes('Critical');
  const isHigh = urgency?.includes('High');
  const color = isCrit ? '#dc2626' : isHigh ? '#ea580c' : '#ca8a04';
  const size = isCrit ? 28 : 22;

  return L.divIcon({
    className: 'enterprise-distress-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px;">
        <div style="width: ${size - 6}px; height: ${size - 6}px; border-radius: 50%; background-color: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 4px; height: 4px; border-radius: 50%; background-color: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createCampMarker = (isFull) => {
  const color = isFull ? '#dc2626' : '#059669';
  return L.divIcon({
    className: 'enterprise-camp-pin',
    html: `
      <div style="width: 24px; height: 24px; border-radius: 6px; background-color: ${color}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 20 10 4 1 20h18Z"/><path d="m5 20 5-10 5 10"/></svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const warehouseMarkerIcon = L.divIcon({
  className: 'enterprise-warehouse-pin',
  html: `
    <div style="width: 24px; height: 24px; border-radius: 6px; background-color: #2563eb; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function FlyToTarget({ target, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, zoom, { duration: 1.2 });
    }
  }, [target, zoom, map]);
  return null;
}

const DISASTER_RISK_ZONES = [
  {
    name: 'Sundarbans Delta Inundation Arc',
    center: [21.65, 88.0833],
    radius: 20000,
    riskLevel: 'Severe Tidal Surge (Cat 4)',
    color: '#dc2626',
  },
  {
    name: 'Kendrapara River Breach Zone',
    center: [20.5734, 86.7623],
    radius: 17000,
    riskLevel: 'Critical Flash Flood & Embankment Breach',
    color: '#dc2626',
  },
  {
    name: 'Paradip Port High Wind Perimeter',
    center: [20.3165, 86.6114],
    radius: 14000,
    riskLevel: 'Severe Coastal Wind & Surge',
    color: '#ea580c',
  },
  {
    name: 'Puri Beach Sector Risk Zone',
    center: [19.8135, 85.8312],
    radius: 15000,
    riskLevel: 'Moderate Surge & Structural Risk',
    color: '#ca8a04',
  },
  {
    name: 'Balasore Defense Perimeter Sector',
    center: [21.4682, 87.0135],
    radius: 14000,
    riskLevel: 'Moderate Coastal Flood Buffer',
    color: '#0284c7',
  },
];

export default function CommandCenterPage() {
  const [distressList, setDistressList] = useState(MOCK_DISTRESS_REQUESTS);
  const [campsList, setCampsList] = useState(MOCK_RELIEF_CAMPS);
  const [inventoryList, setInventoryList] = useState(MOCK_INVENTORY);
  const [loading, setLoading] = useState(false);

  const [flyTarget, setFlyTarget] = useState(null);
  const [flyZoom, setFlyZoom] = useState(13);

  const [showDistress, setShowDistress] = useState(true);
  const [showCamps, setShowCamps] = useState(true);
  const [showDepots, setShowDepots] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState('inventory');
  const [searchIncident, setSearchIncident] = useState('');

  const [allocatingItem, setAllocatingItem] = useState(null);
  const [dispatchQty, setDispatchQty] = useState(50);
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);

  const [editingCamp, setEditingCamp] = useState(null);
  const [campOccupancyInput, setCampOccupancyInput] = useState(0);
  const [campSubmitting, setCampSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, cRes, iRes] = await Promise.all([
        api.getDistressRequests(),
        api.getCamps(),
        api.getInventory(),
      ]);
      setDistressList(dRes.data || []);
      setCampsList(cRes.data || []);
      setInventoryList(iRes.data || []);
    } catch (err) {
      console.error('Failed to load command center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    socket.emit('join:control_room');

    socket.on('distress:created', (newReq) => {
      setDistressList((prev) => [newReq, ...prev]);
    });

    socket.on('distress:updated', (updated) => {
      setDistressList((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
    });

    socket.on('camp:occupancy_changed', (camp) => {
      setCampsList((prev) =>
        prev.map((c) => (c._id === camp._id ? camp : c))
      );
    });

    socket.on('inventory:updated', (inv) => {
      setInventoryList((prev) =>
        prev.map((i) => (i._id === inv._id ? inv : i))
      );
    });

    return () => {
      socket.off('distress:created');
      socket.off('distress:updated');
      socket.off('camp:occupancy_changed');
      socket.off('inventory:updated');
    };
  }, []);

  const totalActiveSignals = distressList.length;
  const criticalUnresolved = distressList.filter(
    (d) => d.urgencyLevel?.includes('Critical') && d.status !== 'Resolved'
  ).length;

  const totalCampCapacity = campsList.reduce((acc, c) => acc + (c.totalCapacity || 0), 0);
  const totalCampOccupancy = campsList.reduce((acc, c) => acc + (c.currentOccupancy || 0), 0);
  const availableCampSlots = Math.max(0, totalCampCapacity - totalCampOccupancy);
  const activeCampsCount = campsList.filter((c) => c.status === 'Active').length;

  const totalDispatched = inventoryList.reduce((acc, i) => acc + (i.allocatedQuantity || 0), 0);
  const totalAvailableStock = inventoryList.reduce((acc, i) => acc + (i.availableQuantity || 0), 0);

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!allocatingItem) return;

    setDispatchSubmitting(true);
    try {
      const res = await api.dispatchInventory(allocatingItem._id, dispatchQty);
      setInventoryList((prev) =>
        prev.map((i) => (i._id === allocatingItem._id ? res.data : i))
      );
      setAllocatingItem(null);
    } catch (err) {
      alert(err.message || 'Dispatch failed');
    } finally {
      setDispatchSubmitting(false);
    }
  };

  const handleCampOccupancySubmit = async (e) => {
    e.preventDefault();
    if (!editingCamp) return;

    setCampSubmitting(true);
    try {
      const res = await api.updateCampOccupancy(editingCamp._id, campOccupancyInput);
      setCampsList((prev) =>
        prev.map((c) => (c._id === editingCamp._id ? res.data : c))
      );
      setEditingCamp(null);
    } catch (err) {
      alert(err.message || 'Failed to update camp occupancy');
    } finally {
      setCampSubmitting(false);
    }
  };

  const handleToggleCampFull = async (camp) => {
    const newOccupancy = camp.status === 'Full' ? Math.floor(camp.totalCapacity * 0.7) : camp.totalCapacity;
    try {
      const res = await api.updateCampOccupancy(camp._id, newOccupancy);
      setCampsList((prev) =>
        prev.map((c) => (c._id === camp._id ? res.data : c))
      );
    } catch (err) {
      alert('Error changing camp status');
    }
  };

  const filteredIncidents = distressList.filter((r) => {
    if (!searchIncident.trim()) return true;
    const q = searchIncident.toLowerCase();
    return (
      r.citizenName?.toLowerCase().includes(q) ||
      r.needType?.toLowerCase().includes(q) ||
      r.location?.readableAddress?.toLowerCase().includes(q) ||
      r.location?.districtZone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-100 font-sans text-slate-800">
      
      {/* ======================================================== */}
      {/* 1. TOP METRIC TICKER BAR (CLEAN WHITE GOVERNMENT BAR)    */}
      {/* ======================================================== */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 shrink-0 shadow-sm z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              National Operations Center • Live Situational Awareness
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-0.5">
            {/* Metric 1 */}
            <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-blue-600" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block leading-tight">
                  Active Signals
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 leading-tight">
                  {totalActiveSignals}
                </span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-700 block leading-tight">
                  Critical SOS
                </span>
                <span className="text-sm font-bold font-mono text-rose-700 leading-tight">
                  {criticalUnresolved}
                </span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <Tent className="w-3.5 h-3.5 text-emerald-700" />
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block leading-tight">
                  Camps & Slots
                </span>
                <span className="text-sm font-bold font-mono text-emerald-900 leading-tight">
                  {activeCampsCount} <span className="text-xs text-emerald-700 font-normal">({availableCampSlots.toLocaleString()} free)</span>
                </span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block leading-tight">
                  Dispatched Stock
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 leading-tight">
                  {totalDispatched.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">units</span>
                </span>
              </div>
            </div>

            <button
              onClick={loadData}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition shadow-sm"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN TACTICAL WORKSPACE: SIDEBARS + FULLSCREEN MAP    */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT COLLAPSIBLE SIDEBAR: INCIDENT QUEUE */}
        <div
          className={`h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-200 z-20 shrink-0 shadow-sm ${
            leftSidebarOpen ? 'w-80 md:w-96' : 'w-0 border-r-0'
          }`}
        >
          {leftSidebarOpen && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Incident Queue
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                    {filteredIncidents.length}
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search incident by citizen, zone..."
                    value={searchIncident}
                    onChange={(e) => setSearchIncident(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              </div>

              {/* Incidents List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredIncidents.map((req) => {
                  const isCrit = req.urgencyLevel?.includes('Critical');
                  const coords = req.location?.coordinates;

                  return (
                    <div
                      key={req._id}
                      onClick={() => {
                        if (coords && coords.length === 2) {
                          setFlyTarget([coords[1], coords[0]]);
                          setFlyZoom(15);
                        }
                      }}
                      className={`p-3 hover:bg-slate-50 cursor-pointer transition space-y-1 ${
                        isCrit ? 'bg-rose-50/40 border-l-3 border-l-rose-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5 truncate">
                          {isCrit && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />}
                          {req.needType}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                            req.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'Claimed'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 font-medium truncate">
                        {req.citizenName} — {req.location?.readableAddress}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{req.location?.districtZone}</span>
                        <span className="font-mono text-slate-400">
                          {req.peopleCount?.adults + req.peopleCount?.children + req.peopleCount?.elderly} people
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Left Toggle */}
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="absolute left-0 top-12 z-30 p-1.5 rounded-r-lg bg-white border-r border-t border-b border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          title={leftSidebarOpen ? 'Collapse Queue' : 'Expand Queue'}
        >
          {leftSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* MAP CONTAINER */}
        <div className="flex-1 h-full min-h-[500px] relative z-0">
          
          {/* Floating Map Controls */}
          <div className="absolute top-3 left-10 md:left-4 z-[400] flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-600" />
              Layers:
            </span>

            <button
              onClick={() => setShowDistress(!showDistress)}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                showDistress
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              SOS ({distressList.length})
            </button>

            <button
              onClick={() => setShowCamps(!showCamps)}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                showCamps
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              Camps ({campsList.length})
            </button>

            <button
              onClick={() => setShowDepots(!showDepots)}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                showDepots
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              Depots ({inventoryList.length})
            </button>

            <button
              onClick={() => setShowRiskZones(!showRiskZones)}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                showRiskZones
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              Risk Zones
            </button>

            <button
              onClick={() => {
                setFlyTarget([20.5734, 86.7623]);
                setFlyZoom(9);
              }}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
            >
              <Crosshair className="w-3 h-3" />
              Recenter
            </button>
          </div>

          <MapContainer
            center={[20.5734, 86.7623]}
            zoom={9}
            scrollWheelZoom={true}
            className="w-full h-full min-h-[500px] z-0"
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FlyToTarget target={flyTarget} zoom={flyZoom} />

            {/* Risk Zones Circles */}
            {showRiskZones &&
              DISASTER_RISK_ZONES.map((zone, idx) => (
                <Circle
                  key={idx}
                  center={zone.center}
                  radius={zone.radius}
                  pathOptions={{
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.08,
                    weight: 1.5,
                    dashArray: '5, 5',
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs p-1 font-sans">
                      <strong className="block text-slate-900 font-bold">{zone.name}</strong>
                      <span className="text-[11px] text-slate-600">{zone.riskLevel}</span>
                    </div>
                  </Tooltip>
                </Circle>
              ))}

            {/* Distress Markers */}
            {showDistress &&
              distressList.map((req) => {
                const coords = req.location?.coordinates;
                if (!coords || coords.length !== 2) return null;
                const pos = [coords[1], coords[0]];

                return (
                  <Marker
                    key={req._id}
                    position={pos}
                    icon={createDistressMarker(req.urgencyLevel)}
                  >
                    <Popup>
                      <div className="text-xs space-y-1.5 p-1 w-56 font-sans">
                        <div className="flex items-center justify-between border-b pb-1">
                          <strong className="text-sm font-bold text-rose-700">{req.needType}</strong>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-800">
                            {req.status}
                          </span>
                        </div>
                        <div><strong>Citizen:</strong> {req.citizenName} ({req.contactNumber})</div>
                        <div><strong>Urgency:</strong> <span className="text-rose-700 font-semibold">{req.urgencyLevel}</span></div>
                        <div><strong>Stranded:</strong> {req.peopleCount?.adults} Adults, {req.peopleCount?.children} Kids, {req.peopleCount?.elderly} Elders</div>
                        <div><strong>Address:</strong> {req.location?.readableAddress}</div>
                        {req.verificationNotes && (
                          <div className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-700">
                            {req.verificationNotes}
                          </div>
                        )}
                        <div className="pt-1">
                          <a
                            href={`tel:${req.contactNumber}`}
                            className="w-full text-center py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold block"
                          >
                            Call Citizen
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Relief Camps Markers */}
            {showCamps &&
              campsList.map((camp) => {
                const coords = camp.location?.coordinates;
                if (!coords || coords.length !== 2) return null;
                const pos = [coords[1], coords[0]];
                const isFull = camp.status === 'Full';
                const occupancyPct = camp.totalCapacity > 0 ? Math.round((camp.currentOccupancy / camp.totalCapacity) * 100) : 0;

                return (
                  <Marker key={camp._id} position={pos} icon={createCampMarker(isFull)}>
                    <Popup>
                      <div className="text-xs space-y-2 p-1 w-60 font-sans">
                        <div className="flex items-center justify-between border-b pb-1">
                          <strong className="text-sm font-bold text-slate-900">{camp.campName}</strong>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isFull ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>
                            {camp.status}
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-semibold mb-1 text-slate-600">
                            <span>Occupancy ({occupancyPct}%)</span>
                            <span>{camp.currentOccupancy} / {camp.totalCapacity}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${occupancyPct > 90 ? 'bg-rose-600' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                              style={{ width: `${Math.min(100, occupancyPct)}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            {camp.availableSlots} beds available
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600">
                          <div><strong>Address:</strong> {camp.address}</div>
                          <div><strong>Contact:</strong> {camp.contactPerson} ({camp.phone})</div>
                        </div>

                        <div className="pt-1 flex gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCamp(camp);
                              setCampOccupancyInput(camp.currentOccupancy);
                            }}
                            className="w-full py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px]"
                          >
                            Set Occupancy
                          </button>
                          <button
                            onClick={() => handleToggleCampFull(camp)}
                            className={`w-full py-1 rounded font-semibold text-[11px] text-white ${isFull ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                          >
                            {isFull ? 'Reopen Camp' : 'Mark Full'}
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Warehouse Markers */}
            {showDepots &&
              inventoryList.map((inv) => {
                const coords = inv.warehouseLocation?.coordinates;
                if (!coords || coords.length !== 2) return null;
                const pos = [coords[1], coords[0]];

                return (
                  <Marker key={inv._id} position={pos} icon={warehouseMarkerIcon}>
                    <Popup>
                      <div className="text-xs space-y-1.5 p-1 w-56 font-sans">
                        <div className="flex items-center justify-between border-b pb-1">
                          <strong className="text-sm font-bold text-blue-900">{inv.itemType}</strong>
                          <span className="text-[10px] font-mono font-semibold text-slate-600">REGIONAL HUB</span>
                        </div>
                        <div><strong>Available:</strong> <span className="font-bold text-emerald-700">{inv.availableQuantity?.toLocaleString()}</span> {inv.unit}</div>
                        <div><strong>Allocated:</strong> {inv.allocatedQuantity?.toLocaleString()} {inv.unit}</div>
                        <div><strong>Manager:</strong> {inv.managedByOrg}</div>
                        <div><strong>Location:</strong> {inv.warehouseLocation?.address}</div>

                        <div className="pt-1">
                          <button
                            onClick={() => {
                              setAllocatingItem(inv);
                              setDispatchQty(50);
                            }}
                            className="w-full py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px]"
                          >
                            Allocate Stock
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>
        </div>

        {/* Right Toggle */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="absolute right-0 top-12 z-30 p-1.5 rounded-l-lg bg-white border-l border-t border-b border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          title={rightPanelOpen ? 'Collapse Allocation' : 'Expand Allocation'}
        >
          {rightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* RIGHT COLLAPSIBLE PANEL: ALLOCATION & SHELTER MONITOR */}
        <div
          className={`h-full bg-white border-l border-slate-200 flex flex-col transition-all duration-200 z-20 shrink-0 shadow-sm ${
            rightPanelOpen ? 'w-80 md:w-96' : 'w-0 border-l-0'
          }`}
        >
          {rightPanelOpen && (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 p-2 gap-1.5 bg-slate-50/50">
                <button
                  onClick={() => setRightPanelTab('inventory')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                    rightPanelTab === 'inventory'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                  <span>Logistics ({inventoryList.length})</span>
                </button>

                <button
                  onClick={() => setRightPanelTab('camps')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                    rightPanelTab === 'camps'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tent className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                  <span>Shelters ({campsList.length})</span>
                </button>
              </div>

              {/* Tab 1: Inventory Stocks */}
              {rightPanelTab === 'inventory' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                    <span>Prepositioned Stocks</span>
                    <span className="font-mono text-slate-900 font-bold">{totalAvailableStock.toLocaleString()} Available</span>
                  </div>

                  {inventoryList.map((item) => {
                    const availPct = item.totalQuantity > 0 ? Math.round((item.availableQuantity / item.totalQuantity) * 100) : 0;

                    return (
                      <div
                        key={item._id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">{item.itemType}</span>
                            <span className="text-[10px] text-slate-500 block">{item.managedByOrg}</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold bg-white border border-slate-200 text-slate-700">
                            {availPct}% Ready
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-500 block font-semibold">Available</span>
                            <span className="text-sm font-mono font-bold text-emerald-700">
                              {item.availableQuantity?.toLocaleString()}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-500 block font-semibold">Allocated</span>
                            <span className="text-sm font-mono font-bold text-amber-700">
                              {item.allocatedQuantity?.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAllocatingItem(item);
                            setDispatchQty(Math.min(50, item.availableQuantity));
                          }}
                          className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Allocate to Mission</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Shelter Occupancy */}
              {rightPanelTab === 'camps' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                    <span>Emergency Shelters</span>
                    <span className="font-mono text-emerald-700 font-bold">{availableCampSlots.toLocaleString()} Slots Free</span>
                  </div>

                  {campsList.map((camp) => {
                    const isFull = camp.status === 'Full';
                    const occupancyPct = camp.totalCapacity > 0 ? Math.round((camp.currentOccupancy / camp.totalCapacity) * 100) : 0;

                    return (
                      <div
                        key={camp._id}
                        className={`p-3 rounded-xl border transition space-y-2.5 ${
                          isFull ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200/90'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">{camp.campName}</span>
                            <span className="text-[10px] text-slate-500 block">{camp.districtZone}</span>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              isFull ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-600 font-mono mb-1">
                            <span>Occupancy: {occupancyPct}%</span>
                            <span>{camp.currentOccupancy} / {camp.totalCapacity}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isFull ? 'bg-rose-600' : occupancyPct > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.min(100, occupancyPct)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCamp(camp);
                              setCampOccupancyInput(camp.currentOccupancy);
                            }}
                            className="flex-1 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                          >
                            Set Count
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleCampFull(camp)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                              isFull
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isFull ? 'Mark Active' : 'Broadcast Full'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ALLOCATION MODAL */}
      {allocatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Allocate Resource Stock</h3>
                <span className="text-xs text-blue-700 font-semibold">{allocatingItem.itemType}</span>
              </div>
              <button
                onClick={() => setAllocatingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Warehouse Depot:</span>
                  <span className="text-slate-800 font-medium">{allocatingItem.warehouseLocation?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available to Dispatch:</span>
                  <span className="text-emerald-700 font-mono font-bold">{allocatingItem.availableQuantity} {allocatingItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quantity to Dispatch ({allocatingItem.unit})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDispatchQty((prev) => Math.max(1, prev - 10))}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={allocatingItem.availableQuantity}
                    value={dispatchQty}
                    onChange={(e) => setDispatchQty(Math.min(allocatingItem.availableQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-center font-bold text-base focus:border-blue-600"
                  />

                  <button
                    type="button"
                    onClick={() => setDispatchQty((prev) => Math.min(allocatingItem.availableQuantity, prev + 10))}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAllocatingItem(null)}
                  className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={dispatchSubmitting || allocatingItem.availableQuantity <= 0}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm disabled:opacity-50"
                >
                  {dispatchSubmitting ? 'Dispatching...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CAMP OCCUPANCY MODAL */}
      {editingCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Camp Occupancy</h3>
                <span className="text-xs text-slate-500">{editingCamp.campName}</span>
              </div>
              <button
                onClick={() => setEditingCamp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCampOccupancySubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Capacity:</span>
                  <span className="text-slate-900 font-mono font-bold">{editingCamp.totalCapacity} beds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Count:</span>
                  <span className="text-amber-800 font-mono font-bold">{editingCamp.currentOccupancy} persons</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Updated Headcount
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCampOccupancyInput((prev) => Math.max(0, prev - 25))}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    max={editingCamp.totalCapacity * 1.5}
                    value={campOccupancyInput}
                    onChange={(e) => setCampOccupancyInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-center font-bold text-base focus:border-blue-600"
                  />

                  <button
                    type="button"
                    onClick={() => setCampOccupancyInput((prev) => prev + 25)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCamp(null)}
                  className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={campSubmitting}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
                >
                  {campSubmitting ? 'Updating...' : 'Broadcast Occupancy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
