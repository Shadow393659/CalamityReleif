import React, { useState, useEffect } from 'react';
import {
  Radio,
  CheckCircle2,
  PhoneCall,
  MapPin,
  RefreshCw,
  Search,
  UserCheck,
  Ban,
  LayoutList,
  Map as MapIcon,
  Users,
  AlertTriangle,
  Flame,
  LifeBuoy,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { MOCK_DISTRESS_REQUESTS } from '../services/mockData';

// Custom Map Marker for Field Map
const createFieldPin = (urgency, status) => {
  const isCritical = urgency?.includes('Critical');
  const isResolved = status === 'Resolved';
  const bg = isResolved ? '#10b981' : isCritical ? '#dc2626' : '#f59e0b';

  return L.divIcon({
    className: 'custom-field-pin',
    html: `
      <div style="
        background-color: ${bg};
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #ffffff;"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

export default function FieldFeedPage() {
  const [requests, setRequests] = useState(MOCK_DISTRESS_REQUESTS);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [districtFilter, setDistrictFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [responderName, setResponderName] = useState('Volunteer Boat Squad #2');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getDistressRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    const socket = getSocket();
    socket.emit('join:control_room');

    const handleCreated = (newReq) => {
      setRequests((prev) => [newReq, ...prev]);
    };

    const handleUpdated = (updatedReq) => {
      setRequests((prev) =>
        prev.map((r) => (r._id === updatedReq._id ? updatedReq : r))
      );
    };

    socket.on('distress:created', handleCreated);
    socket.on('distress:updated', handleUpdated);
    socket.on('distress:claimed', handleUpdated);

    return () => {
      socket.off('distress:created', handleCreated);
      socket.off('distress:updated', handleUpdated);
      socket.off('distress:claimed', handleUpdated);
    };
  }, []);

  const handleStatusChange = async (reqId, newStatus) => {
    setActionSubmitting(true);
    try {
      const res = await api.updateDistressStatus(reqId, {
        status: newStatus,
        notes: actionNotes || `Status updated to ${newStatus} by ${responderName}`,
        updaterName: responderName,
      });

      setRequests((prev) =>
        prev.map((r) => (r._id === reqId ? res.data : r))
      );
      setSelectedRequest(null);
      setActionNotes('');
    } catch (err) {
      alert(err.message || 'Error updating status');
    } finally {
      setActionSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (districtFilter !== 'All' && r.location?.districtZone !== districtFilter) return false;
    if (urgencyFilter !== 'All' && !r.urgencyLevel?.includes(urgencyFilter)) return false;
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.citizenName?.toLowerCase().includes(q);
      const matchAddress = r.location?.readableAddress?.toLowerCase().includes(q);
      const matchNeed = r.needType?.toLowerCase().includes(q);
      if (!matchName && !matchAddress && !matchNeed) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Field Responder & Volunteer Dispatch
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time incident stream for volunteer boat squads, medical units, and NGO field coordinators.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Cards ({filteredRequests.length})</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Live Field Map</span>
            </button>
          </div>

          <button
            onClick={loadRequests}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Search Incidents
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search citizen or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            District Sector
          </label>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Districts</option>
            <option value="Sundarbans Delta">Sundarbans Delta</option>
            <option value="Kendrapara & Coastal Zone">Kendrapara & Coastal Zone</option>
            <option value="Paradip Port & Jagatsinghpur">Paradip Port & Jagatsinghpur</option>
            <option value="Puri Coastal Sector">Puri Coastal Sector</option>
            <option value="Balasore Sector">Balasore Sector</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Urgency Triage
          </label>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical Priority 1</option>
            <option value="High">High Priority</option>
            <option value="Moderate">Moderate Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Dispatch Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Claimed">Claimed</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="False Alarm">False Alarm</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: LIVE FIELD LEAFLET MAP */}
      {viewMode === 'map' && (
        <div className="relative w-full h-[600px] min-h-[500px] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm z-0">
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
            {filteredRequests.map((req) => {
              const coords = req.location?.coordinates;
              if (!coords || coords.length < 2) return null;
              const [lon, lat] = coords;
              const isCritical = req.urgencyLevel?.includes('Critical');

              return (
                <Marker
                  key={req._id}
                  position={[lat, lon]}
                  icon={createFieldPin(req.urgencyLevel, req.status)}
                >
                  <Popup>
                    <div className="p-1 space-y-2 text-xs font-sans min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-bold text-slate-900">{req.needType}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <p className="font-semibold text-slate-800">{req.citizenName}</p>
                        <p className="text-[11px] text-slate-500">{req.location?.readableAddress}</p>
                        <p className="text-[11px] font-mono text-slate-500">{req.contactNumber}</p>
                        <p className="text-[11px] text-slate-600">
                          <strong>Urgency:</strong> {req.urgencyLevel}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="w-full mt-2 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm text-center"
                      >
                        Update / Dispatch SOS
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2.5 text-[11px] shadow-sm flex items-center gap-3">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Map Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white"></span>
              <span className="text-slate-600">Critical Priority 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
              <span className="text-slate-600">High / Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
              <span className="text-slate-600">Resolved</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: INCIDENT CARDS STREAM */}
      {viewMode === 'list' && (
        <div className="space-y-3.5">
          {filteredRequests.length === 0 ? (
            <div className="p-10 text-center rounded-xl bg-white border border-slate-200 text-slate-500 space-y-2">
              <Radio className="w-8 h-8 mx-auto text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">No Matching Distress Incidents</h3>
              <p className="text-xs">Adjust your active filters or clear search query to inspect live feed.</p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isCritical = req.urgencyLevel?.includes('Critical');
              const isHigh = req.urgencyLevel?.includes('High');

              const borderAccent = isCritical
                ? 'border-l-4 border-l-rose-600'
                : isHigh
                ? 'border-l-4 border-l-amber-500'
                : 'border-l-4 border-l-sky-500';

              return (
                <div
                  key={req._id}
                  className={`p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-shadow ${borderAccent}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-slate-900">{req.needType}</span>
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          REF: NOOR-{(req._id || '').slice(-4).toUpperCase()}
                        </span>

                        {/* Urgency Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isCritical
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isHigh
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {req.urgencyLevel}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            req.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'Claimed'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : req.status === 'In Progress'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          Status: {req.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.location?.readableAddress} ({req.location?.districtZone})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${req.contactNumber}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                        <span>{req.contactNumber}</span>
                      </a>

                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm"
                      >
                        Update / Dispatch
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-2.5">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Citizen</span>
                      <span className="font-semibold text-slate-800">{req.citizenName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stranded Group</span>
                      <span className="text-slate-700 font-medium">
                        {req.peopleCount?.adults || 0} Adults, {req.peopleCount?.children || 0} Kids, {req.peopleCount?.elderly || 0} Elders
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Unit</span>
                      <span className="text-blue-700 font-semibold">
                        {req.assignedTo?.name || 'Unclaimed'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Coordinates</span>
                      <span className="font-mono text-slate-600">
                        {req.location?.coordinates ? `${req.location.coordinates[1].toFixed(4)}, ${req.location.coordinates[0].toFixed(4)}` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {req.verificationNotes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <strong className="text-slate-800 font-semibold">Field Report:</strong> {req.verificationNotes}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Action / Dispatch Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Update Dispatch Status
                </h3>
                <span className="text-xs text-slate-500">Citizen: {selectedRequest.citizenName}</span>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Responding Unit / Officer Name
                </label>
                <input
                  type="text"
                  value={responderName}
                  onChange={(e) => setResponderName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operational Progress Note
                </label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g., Rescue Boat #4 deployed; navigating canal road..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-blue-600 resize-none"
                />
              </div>

              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={() => handleStatusChange(selectedRequest._id, 'Claimed')}
                  className="py-1.5 px-2.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold hover:bg-amber-100 transition"
                >
                  Claim SOS
                </button>

                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={() => handleStatusChange(selectedRequest._id, 'In Progress')}
                  className="py-1.5 px-2.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-semibold hover:bg-sky-100 transition"
                >
                  In Route
                </button>

                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={() => handleStatusChange(selectedRequest._id, 'Resolved')}
                  className="py-1.5 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hover:bg-emerald-100 transition"
                >
                  Resolved
                </button>

                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={() => handleStatusChange(selectedRequest._id, 'False Alarm')}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold hover:bg-slate-200 transition"
                >
                  False Alarm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
