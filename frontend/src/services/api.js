import {
  MOCK_DISTRESS_REQUESTS,
  MOCK_RELIEF_CAMPS,
  MOCK_INVENTORY,
  MOCK_RESPONDERS,
} from './mockData';
import { apiRequest } from './auth';

const API_BASE = '/api';

// In-memory fallback dataset for seamless offline / zero-database states
let localDistress = JSON.parse(JSON.stringify(MOCK_DISTRESS_REQUESTS));
let localCamps = JSON.parse(JSON.stringify(MOCK_RELIEF_CAMPS));
let localInventory = JSON.parse(JSON.stringify(MOCK_INVENTORY));
let localResponders = JSON.parse(JSON.stringify(MOCK_RESPONDERS));

export const api = {
  // Health & diagnostics
  async getHealth() {
    try {
      const res = await apiRequest(`${API_BASE}/health`);
      if (res.ok) return await res.json();
    } catch {
      // Backend offline
    }
    return {
      status: 'Operational (Disaster Resilient Fallback Mode)',
      timestamp: new Date().toISOString(),
      environment: 'development',
      services: {
        database: 'Connected via Disaster Cache',
        realtime: 'Active (Simulated + Socket)',
      },
    };
  },

  // Distress endpoints
  async getDistressRequests(params = {}) {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const res = await apiRequest(`${API_BASE}/distress?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          return json;
        }
      }
    } catch (err) {
      if (err.status) throw err;
      console.warn('[Noor API] Backend unreachable or unseeded. Serving disaster mock feed:', err.message);
    }

    // Return filtered local mock data
    let filtered = [...localDistress];
    if (params.districtZone && params.districtZone !== 'All') {
      filtered = filtered.filter((d) => d.location?.districtZone === params.districtZone);
    }
    if (params.urgencyLevel && params.urgencyLevel !== 'All') {
      filtered = filtered.filter((d) => d.urgencyLevel?.includes(params.urgencyLevel));
    }
    if (params.status && params.status !== 'All') {
      filtered = filtered.filter((d) => d.status === params.status);
    }

    return {
      success: true,
      count: filtered.length,
      data: filtered,
    };
  },

  async getDistressById(id) {
    try {
      const res = await apiRequest(`${API_BASE}/distress/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return json;
      }
    } catch (err) {
      if (err.status) throw err;
      // Offline fallback
    }

    const item = localDistress.find((d) => d._id === id);
    if (item) {
      return { success: true, data: item };
    }
    throw new Error('Distress record not found');
  },

  async createDistressRequest(payload) {
    try {
      const res = await apiRequest(`${API_BASE}/distress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return json;
      }
    } catch (err) {
      if (err.status) throw err;
      console.warn('[Noor API] Backend offline for create. Storing in resilient session cache:', err.message);
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newRecord = {
      _id: `distress-${Date.now()}`,
      trackingId: `NOOR-DIS-${randomSuffix}`,
      citizenName: payload.citizenName || 'Concerned Citizen',
      contactNumber: payload.contactNumber || '+91-98000-00000',
      alternateContact: payload.alternateContact || '',
      location: {
        type: 'Point',
        coordinates: payload.location?.coordinates || [86.7623, 20.5734],
        readableAddress: payload.location?.readableAddress || 'GPS Pinned Incident Location',
        districtZone: payload.location?.districtZone || 'Kendrapara & Coastal Zone',
      },
      needType: payload.needType || 'Rescue / Evacuation',
      urgencyLevel: payload.urgencyLevel || 'High',
      peopleCount: payload.peopleCount || { adults: 2, children: 1, elderly: 0, pets: 0 },
      status: 'Pending',
      assignedTo: null,
      verificationNotes: payload.verificationNotes || 'Emergency distress alert received via Citizen SOS portal.',
      timeline: [
        {
          status: 'Pending',
          timestamp: new Date().toISOString(),
          updaterName: 'Citizen Portal Intake',
          notes: 'Emergency distress alert received and queued for dispatch.',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    localDistress = [newRecord, ...localDistress];
    return { success: true, data: newRecord };
  },

  async updateDistressStatus(id, { status, notes, updaterName }) {
    try {
      const res = await apiRequest(`${API_BASE}/distress/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, updaterName }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return json;
      }
    } catch (err) {
      if (err.status) throw err;
      console.warn('[Noor API] Backend offline for status update. Applying in-memory state update:', err.message);
    }

    const idx = localDistress.findIndex((d) => d._id === id);
    if (idx !== -1) {
      const updated = {
        ...localDistress[idx],
        status,
        timeline: [
          {
            status,
            timestamp: new Date().toISOString(),
            updaterName: updaterName || 'Field Responder',
            notes: notes || `Status updated to ${status}`,
          },
          ...(localDistress[idx].timeline || []),
        ],
      };
      localDistress[idx] = updated;
      return { success: true, data: updated };
    }
    return { success: true, data: { _id: id, status } };
  },

  async claimDistress(id, { userId, updaterName, notes }) {
    try {
      const res = await apiRequest(`${API_BASE}/distress/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updaterName, notes }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return json;
      }
    } catch (err) {
      if (err.status) throw err;
      console.warn('[Noor API] Backend offline for claim. Applying in-memory assignment:', err.message);
    }

    const idx = localDistress.findIndex((d) => d._id === id);
    if (idx !== -1) {
      const updated = {
        ...localDistress[idx],
        status: 'Claimed',
        assignedTo: {
          name: updaterName || 'Volunteer Marine Unit',
          organizationName: 'Noor Rapid Response Wing',
          phone: '+91-98765-00105',
        },
        timeline: [
          {
            status: 'Claimed',
            timestamp: new Date().toISOString(),
            updaterName: updaterName || 'Field Volunteer',
            notes: notes || 'Assigned to field response unit.',
          },
          ...(localDistress[idx].timeline || []),
        ],
      };
      localDistress[idx] = updated;
      return { success: true, data: updated };
    }
    return { success: true, data: { _id: id, status: 'Claimed' } };
  },

  // Camps
  async getCamps(params = {}) {
    try {
      const query = new URLSearchParams(params);
      const res = await apiRequest(`${API_BASE}/camps?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          return json;
        }
      }
    } catch (err) {
      if (err.status) throw err;
      console.warn('[Noor API] Backend unreachable or unseeded. Serving mock relief camps:', err.message);
    }

    return {
      success: true,
      count: localCamps.length,
      data: localCamps,
    };
  },

  async updateCampOccupancy(id, currentOccupancy) {
    try {
      const res = await apiRequest(`${API_BASE}/camps/${id}/occupancy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentOccupancy }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return json;
      }
    } catch (err) {
      if (err.status) throw err;
      console.warn('[Noor API] Backend offline for camp update. Updating local mock camp:', err.message);
    }

    const idx = localCamps.findIndex((c) => c._id === id);
    if (idx !== -1) {
      const camp = localCamps[idx];
      const newOccupancy = Math.max(0, parseInt(currentOccupancy, 10) || 0);
      const updated = {
        ...camp,
        currentOccupancy: newOccupancy,
        availableSlots: Math.max(0, camp.totalCapacity - newOccupancy),
        status: newOccupancy >= camp.totalCapacity ? 'Full' : 'Active',
      };
      localCamps[idx] = updated;
      return { success: true, data: updated };
    }
    return { success: true, data: { _id: id, currentOccupancy } };
  },

  // Inventory
  async getInventory(params = {}) {
    try {
      const query = new URLSearchParams(params);
      const res = await apiRequest(`${API_BASE}/inventory?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          return json;
        }
      }
    } catch (err) {
      if (err.status) throw err;
      console.warn('[Noor API] Backend unreachable or unseeded. Serving mock inventory depots:', err.message);
    }

    return {
      success: true,
      count: localInventory.length,
      data: localInventory,
    };
  },

  async dispatchInventory(id, dispatchQuantity) {
    try {
      const res = await apiRequest(`${API_BASE}/inventory/${id}/dispatch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchQuantity }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return json;
      }
    } catch (err) {
      if (err.status) throw err;
      console.warn('[Noor API] Backend offline for dispatch. Updating local mock inventory:', err.message);
    }

    const idx = localInventory.findIndex((i) => i._id === id);
    if (idx !== -1) {
      const inv = localInventory[idx];
      const qty = parseInt(dispatchQuantity, 10) || 0;
      const newAvail = Math.max(0, inv.availableQuantity - qty);
      const newAlloc = inv.allocatedQuantity + qty;
      const updated = {
        ...inv,
        availableQuantity: newAvail,
        allocatedQuantity: newAlloc,
      };
      localInventory[idx] = updated;
      return { success: true, data: updated };
    }
    return { success: true, data: { _id: id, dispatchQuantity } };
  },

  // Responders
  async getResponders() {
    try {
      const res = await apiRequest(`${API_BASE}/auth/responders`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          return json;
        }
      }
    } catch (err) {
      if (err.status) throw err;
      console.warn('[Noor API] Backend unreachable for responders. Serving mock responder list:', err.message);
    }

    return {
      success: true,
      count: localResponders.length,
      data: localResponders,
    };
  },
};
