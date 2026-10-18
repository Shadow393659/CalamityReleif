import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Radio,
  Copy,
  Check,
  X,
  Clock,
  PhoneCall
} from 'lucide-react';
import { getSocket } from '../services/socket';

export default function LiveTrackingModal({ distressData, onClose, onNewReport }) {
  const [copied, setCopied] = useState(false);
  const [liveTicket, setLiveTicket] = useState(distressData);

  const trackingId =
    distressData.trackingId ||
    `NOOR-DIS-${(distressData._id || '').slice(-4).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`;

  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = (updatedTicket) => {
      if (updatedTicket._id === distressData._id) {
        setLiveTicket(updatedTicket);
      }
    };

    socket.on('distress:updated', handleUpdate);
    socket.on('distress:claimed', handleUpdate);

    return () => {
      socket.off('distress:updated', handleUpdate);
      socket.off('distress:claimed', handleUpdate);
    };
  }, [distressData._id]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentStatus = liveTicket.status || 'Pending';

  // Professional enterprise status styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Claimed':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          dot: 'bg-amber-500',
          label: 'Field Responder Assigned',
        };
      case 'In Progress':
        return {
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          text: 'text-sky-800',
          dot: 'bg-sky-500',
          label: 'In Route to Location',
        };
      case 'Resolved':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          dot: 'bg-emerald-500',
          label: 'Assistance Delivered / Resolved',
        };
      default:
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-800',
          dot: 'bg-rose-500',
          label: 'Pending Dispatch Review',
        };
    }
  };

  const statusStyle = getStatusBadge(currentStatus);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Emergency Alert Successfully Logged
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Your distress dispatch has been registered with the Central Emergency Control Room, local NGO response teams, and marine volunteer squads.
          </p>
        </div>

        {/* Tracking Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Official Incident Reference
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg font-mono font-bold text-slate-900 tracking-wider">
                  {trackingId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
                  title="Copy Tracking ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
              <span>{currentStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block font-medium">Citizen Name</span>
              <span className="font-semibold text-slate-900">{liveTicket.citizenName}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Need Category</span>
              <span className="font-semibold text-blue-700">{liveTicket.needType}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Urgency Triage</span>
              <span className="font-semibold text-rose-700">{liveTicket.urgencyLevel}</span>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <span className="text-slate-500 block font-medium">Location Details</span>
              <span className="text-slate-700">
                {liveTicket.location?.districtZone} — {liveTicket.location?.readableAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Live Timeline */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>Response Timeline</span>
          </div>

          <div className="relative pl-5 space-y-3.5 border-l-2 border-slate-200 ml-1.5">
            {(liveTicket.timeline && liveTicket.timeline.length > 0
              ? liveTicket.timeline
              : [
                  {
                    status: 'Pending',
                    timestamp: new Date(),
                    updaterName: 'Citizen Initial Dispatch',
                    notes: 'Alert registered into Noor platform. Awaiting responder pickup.',
                  },
                ]
            ).map((item, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.status}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{item.notes}</p>
                <span className="text-[10px] text-slate-400">Recorded by: {item.updaterName || 'System'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reassurance Banner */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600 mb-5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            Please remain in a safe, elevated location if possible. Keep your mobile phone accessible. If your life is in imminent danger, contact the emergency helpline at <strong className="text-slate-900 font-bold">112</strong>.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            Keep Live Tracking Active
          </button>
          
          <button
            type="button"
            onClick={onNewReport}
            className="w-full py-2 px-4 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
          >
            Submit Another Report
          </button>
        </div>

      </div>
    </div>
  );
}
