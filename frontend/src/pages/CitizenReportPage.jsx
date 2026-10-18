import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Ambulance,
  LifeBuoy,
  Tent,
  Utensils,
  Info
} from 'lucide-react';
import LocationPickerMap from '../components/LocationPickerMap';
import LiveTrackingModal from '../components/LiveTrackingModal';
import { api } from '../services/api';

const NEED_TYPES = [
  {
    id: 'Rescue / Evacuation',
    title: 'Rescue / Evacuation',
    desc: 'Surrounded by flood water, trapped on roof, structural risk. High-clearance boat or air-rescue required.',
    icon: LifeBuoy,
    colorClass: 'border-slate-200 text-slate-800 bg-white hover:border-slate-300',
    activeClass: 'border-rose-600 bg-rose-50/50 ring-1 ring-rose-600 shadow-sm',
    badgeClass: 'text-rose-700 bg-rose-50',
  },
  {
    id: 'Medical Emergency',
    title: 'Medical Emergency',
    desc: 'Severe injuries, dialysis, hypothermia, acute pediatric trauma, oxygen or prescription medication needed.',
    icon: Ambulance,
    colorClass: 'border-slate-200 text-slate-800 bg-white hover:border-slate-300',
    activeClass: 'border-rose-600 bg-rose-50/50 ring-1 ring-rose-600 shadow-sm',
    badgeClass: 'text-rose-700 bg-rose-50',
  },
  {
    id: 'Food & Water',
    title: 'Food & Water',
    desc: 'Drinking water source flooded/saline contaminated, dry rations exhausted, baby formula needed.',
    icon: Utensils,
    colorClass: 'border-slate-200 text-slate-800 bg-white hover:border-slate-300',
    activeClass: 'border-sky-600 bg-sky-50/50 ring-1 ring-sky-600 shadow-sm',
    badgeClass: 'text-sky-700 bg-sky-50',
  },
  {
    id: 'Emergency Shelter',
    title: 'Emergency Shelter',
    desc: 'House uninhabitable or roof blown away. Require immediate safe transport to nearest cyclone shelter.',
    icon: Tent,
    colorClass: 'border-slate-200 text-slate-800 bg-white hover:border-slate-300',
    activeClass: 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600 shadow-sm',
    badgeClass: 'text-amber-800 bg-amber-50',
  },
];

const URGENCY_LEVELS = [
  {
    id: 'Critical (Life-Threatening)',
    label: 'Critical / Life-Threatening',
    badge: 'Immediate Priority 1',
    activeBg: 'bg-rose-50 text-rose-800 border-rose-400 ring-1 ring-rose-400 font-bold',
    inactiveBg: 'bg-white text-slate-700 border-slate-200 hover:border-slate-300',
    dot: 'bg-rose-600',
  },
  {
    id: 'High',
    label: 'High Priority',
    badge: 'Priority 2',
    activeBg: 'bg-amber-50 text-amber-800 border-amber-400 ring-1 ring-amber-400 font-bold',
    inactiveBg: 'bg-white text-slate-700 border-slate-200 hover:border-slate-300',
    dot: 'bg-amber-500',
  },
  {
    id: 'Moderate',
    label: 'Moderate Priority',
    badge: 'Priority 3',
    activeBg: 'bg-sky-50 text-sky-800 border-sky-400 ring-1 ring-sky-400 font-bold',
    inactiveBg: 'bg-white text-slate-700 border-slate-200 hover:border-slate-300',
    dot: 'bg-sky-500',
  },
  {
    id: 'Low',
    label: 'Low / Information',
    badge: 'Priority 4',
    activeBg: 'bg-slate-100 text-slate-800 border-slate-400 ring-1 ring-slate-400 font-bold',
    inactiveBg: 'bg-white text-slate-700 border-slate-200 hover:border-slate-300',
    dot: 'bg-slate-500',
  },
];

const DISTRICT_ZONES = [
  'Sundarbans Delta',
  'Kendrapara & Coastal Zone',
  'Paradip Port & Jagatsinghpur',
  'Puri Coastal Sector',
  'Balasore Sector',
  'Coastal Command General',
];

export default function CitizenReportPage() {
  const [citizenName, setCitizenName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [alternateContact, setAlternateContact] = useState('');

  const [coordinates, setCoordinates] = useState({ lat: 20.5734, lng: 86.7623 });
  const [readableAddress, setReadableAddress] = useState('');
  const [districtZone, setDistrictZone] = useState('Kendrapara & Coastal Zone');

  const [needType, setNeedType] = useState('Rescue / Evacuation');
  const [urgencyLevel, setUrgencyLevel] = useState('Critical (Life-Threatening)');

  const [peopleCount, setPeopleCount] = useState({
    adults: 2,
    children: 1,
    elderly: 1,
    pets: 0,
  });

  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const updateCount = (key, delta) => {
    setPeopleCount((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + delta),
    }));
  };

  const totalPeople = peopleCount.adults + peopleCount.children + peopleCount.elderly;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!citizenName.trim()) {
      setFormError('Please provide your name or the contact person on-site.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    if (!contactNumber.trim()) {
      setFormError('Please enter a reachable contact phone number for rescue coordination.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    if (!readableAddress.trim()) {
      setFormError('Please describe your landmark or address so rescue teams can locate you.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        citizenName: citizenName.trim(),
        contactNumber: contactNumber.trim(),
        alternateContact: alternateContact.trim(),
        location: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat],
          readableAddress: readableAddress.trim(),
          districtZone: districtZone,
        },
        needType,
        urgencyLevel,
        peopleCount,
        status: 'Pending',
        verificationNotes: verificationNotes.trim(),
      };

      const result = await api.createDistressRequest(payload);
      setSubmittedTicket(result.data);
    } catch (err) {
      console.error('Submission failed:', err);
      setFormError(err.message || 'Failed to submit emergency alert. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCitizenName('');
    setContactNumber('');
    setAlternateContact('');
    setReadableAddress('');
    setVerificationNotes('');
    setPeopleCount({ adults: 2, children: 0, elderly: 0, pets: 0 });
    setSubmittedTicket(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      
      {/* Alert Header Banner */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-rose-600">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
            <Flame className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Emergency Distress Reporting (SOS)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Official intake form for stranded citizens, affected families, and emergency triage coordinators.
            </p>
          </div>
        </div>

        <div className="self-stretch sm:self-auto flex items-center justify-end">
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Priority Intake Active
          </span>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-sm">Please Check Required Fields:</strong>
            <span>{formError}</span>
          </div>
        </div>
      )}

      {/* Main Reporting Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. CONTACT INFO */}
        <section className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Citizen & Contact Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name of Stranded Contact <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="e.g., Rabindra Majumdar"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Phone Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g., +91-98311-XXXXX"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition font-mono shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alternate Phone Number / Neighbor Phone (Optional)
              </label>
              <input
                type="tel"
                value={alternateContact}
                onChange={(e) => setAlternateContact(e.target.value)}
                placeholder="e.g., Relative or neighbor with cellular reception"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition font-mono shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* 2. LOCATION & MAP */}
        <section className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Location & Spatial Pinpoint
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  District Sector <span className="text-rose-600">*</span>
                </label>
                <select
                  value={districtZone}
                  onChange={(e) => setDistrictZone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  {DISTRICT_ZONES.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Landmark / Village / Physical Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={readableAddress}
                  onChange={(e) => setReadableAddress(e.target.value)}
                  placeholder="e.g., Near Satabhaya Ward 3, by the River Embankment breach"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            <LocationPickerMap
              latitude={coordinates.lat}
              longitude={coordinates.lng}
              onLocationChange={setCoordinates}
            />
          </div>
        </section>

        {/* 3. EMERGENCY CLASSIFICATION & NEED TYPE */}
        <section className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Emergency Classification
            </h2>
          </div>

          {/* Need Type Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2.5">
              Select Assistance Category <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NEED_TYPES.map((item) => {
                const Icon = item.icon;
                const isSelected = needType === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNeedType(item.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      item.colorClass
                    } ${isSelected ? item.activeClass : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-900">{item.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency Level Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2.5">
              Urgency Triage Level <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {URGENCY_LEVELS.map((level) => {
                const isSelected = urgencyLevel === level.id;

                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setUrgencyLevel(level.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected ? level.activeBg : level.inactiveBg
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <span className={`w-2 h-2 rounded-full ${level.dot}`} />
                      <span className="text-xs font-bold">{level.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">{level.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* People Count Counters */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-slate-700">
                Number of Stranded Individuals
              </label>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Total Stranded: {totalPeople} Individuals {peopleCount.pets > 0 ? `+ ${peopleCount.pets} Pets` : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Adults */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Adults</span>
                  <span className="text-[10px] text-slate-500">18-59 yrs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateCount('adults', -1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-xs text-slate-900">
                    {peopleCount.adults}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCount('adults', 1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Children</span>
                  <span className="text-[10px] text-slate-500">&lt; 18 yrs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateCount('children', -1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-xs text-slate-900">
                    {peopleCount.children}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCount('children', 1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Elderly */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Elderly</span>
                  <span className="text-[10px] text-slate-500">60+ yrs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateCount('elderly', -1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-xs text-slate-900">
                    {peopleCount.elderly}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCount('elderly', 1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Pets */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Pets</span>
                  <span className="text-[10px] text-slate-500">Animals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateCount('pets', -1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-xs text-slate-900">
                    {peopleCount.pets}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCount('pets', 1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ADDITIONAL HAZARDS & NOTES */}
        <section className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              4
            </span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              On-Ground Hazards & Special Assistance Notes
            </h2>
          </div>

          <div>
            <textarea
              rows={3}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="e.g., Water level rising to roof; elderly cardiac patient needing stretcher; downed high-voltage power cables in water..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 shadow-sm resize-none"
            />
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-colors
              bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Broadcasting to Emergency Control Room...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Transmit Emergency SOS Now</span>
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center gap-1.5 mt-2.5 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted dispatch logged directly with the National Disaster Operations Center</span>
          </div>
        </div>

      </form>

      {/* Live Tracking Modal */}
      {submittedTicket && (
        <LiveTrackingModal
          distressData={submittedTicket}
          onClose={() => setSubmittedTicket(null)}
          onNewReport={resetForm}
        />
      )}

    </div>
  );
}
