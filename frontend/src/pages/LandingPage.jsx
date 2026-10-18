import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Radio,
  Map,
  BarChart3,
  ShieldCheck,
  Tent,
  LifeBuoy,
  Users,
  ChevronRight,
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function LandingPage({ user }) {
  const [stats, setStats] = useState({
    distressCount: 14,
    criticalCount: 3,
    campsCount: 5,
    shelteredCount: 3965,
  });

  useEffect(() => {
    const requests = user.accessRole === 'citizen'
      ? Promise.resolve(null)
      : api.getDistressRequests();

    Promise.all([requests, api.getCamps()])
      .then(([distressRes, campsRes]) => {
        const dList = distressRes?.data || [];
        const cList = campsRes.data || [];
        const crit = dList.filter((d) => d.urgencyLevel?.includes('Critical')).length;
        const sheltered = cList.reduce((acc, c) => acc + (c.currentOccupancy || 0), 0);

        setStats({
          distressCount: dList.length,
          criticalCount: crit,
          campsCount: cList.length,
          shelteredCount: sheltered,
        });
      })
      .catch((err) => console.warn('Loading live stats in background:', err));
  }, [user.accessRole]);

  const portals = [
    {
      title: 'Citizen Distress Reporting (SOS)',
      subtitle: 'Public Emergency Intake Portal',
      desc: 'Submit high-priority emergency alerts for immediate rescue boats, medical trauma triage, emergency shelter, or infant nutrition.',
      icon: Flame,
      to: '/report',
      cta: 'Submit Emergency SOS',
      highlight: true,
      badge: 'Immediate Citizen Action',
      cardClass: 'border-rose-200 hover:border-rose-400 bg-white shadow-sm hover:shadow',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
      iconClass: 'text-rose-600 bg-rose-50 border border-rose-200',
      roles: ['citizen', 'admin'],
    },
    {
      title: 'Field Responder Dispatch',
      subtitle: 'Volunteer & NGO Coordination Desk',
      desc: 'Real-time claimed and pending dispatch feed. Claim tickets, update ground rescue progress, and log evacuation milestones.',
      icon: Radio,
      to: '/field-feed',
      cta: 'Open Dispatch Feed',
      highlight: false,
      badge: 'Field Operations',
      cardClass: 'border-slate-200/90 hover:border-slate-300 bg-white shadow-sm hover:shadow',
      badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200',
      iconClass: 'text-blue-600 bg-blue-50 border border-blue-200',
      roles: ['ngo', 'admin'],
    },
    {
      title: 'Incident Command Center',
      subtitle: 'Macro Situational Tactical Map',
      desc: 'Full-spectrum spatial situational awareness map displaying distress clusters, cyclone shelter occupancies, and supply depots.',
      icon: Map,
      to: '/command-center',
      cta: 'Launch Tactical Map',
      highlight: false,
      badge: 'Incident Command',
      cardClass: 'border-slate-200/90 hover:border-slate-300 bg-white shadow-sm hover:shadow',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
      iconClass: 'text-slate-700 bg-slate-100 border border-slate-200',
      roles: ['admin'],
    },
    {
      title: 'Coverage & Analytics (SitRep)',
      subtitle: 'Resource Tracking & Situation Reports',
      desc: 'Monitor resource depletion rates, identify underserved flood zones, track shelter saturation, and export official PDF SitReps.',
      icon: BarChart3,
      to: '/admin',
      cta: 'View SitRep & Gaps',
      highlight: false,
      badge: 'Executive Oversight',
      cardClass: 'border-slate-200/90 hover:border-slate-300 bg-white shadow-sm hover:shadow',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      iconClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
      roles: ['admin'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-sans">
      
      {/* Institutional Hero Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>National Disaster Coordination Grid • Coastal Sector Response</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Unified Emergency Relief & Crisis Dispatch
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          <strong>Noor (نور)</strong> connects affected citizens, volunteer rescue boat squads, frontline medical units, and government emergency operations centers through structured real-time triage.
        </p>
      </div>

      {/* Operational Summary KPI Cards */}
      <div className={`grid grid-cols-2 ${user.accessRole === 'citizen' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
        {user.accessRole !== 'citizen' && (
          <>
            <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Distress Calls</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">{stats.distressCount || '—'}</div>
              <span className="text-xs text-slate-500">Logged into system queue</span>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white border border-rose-200 shadow-sm space-y-1 border-t-4 border-t-rose-600">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Critical Priority 1</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-600">{stats.criticalCount || '—'}</div>
              <span className="text-xs text-slate-500">Trauma & roof strandings</span>
            </div>
          </>
        )}

        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Relief Shelters</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">{stats.campsCount || '—'}</div>
          <span className="text-xs text-slate-500">Prepositioned cyclone hubs</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Citizens Sheltered</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700">{stats.shelteredCount.toLocaleString() || '—'}</div>
          <span className="text-xs text-slate-500">Safe in multi-purpose camps</span>
        </div>
      </div>

      {/* 4 Portals Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Operations Portal
          </h2>
          <span className="text-xs text-slate-400">Institutional Role-Based Access</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {portals.filter((portal) => portal.roles.includes(user.accessRole)).map((portal) => {
            const Icon = portal.icon;

            return (
              <div
                key={portal.to}
                className={`p-6 rounded-xl border transition-all duration-150 flex flex-col justify-between ${portal.cardClass}`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg ${portal.iconClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${portal.badgeClass}`}>
                      {portal.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{portal.title}</h3>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">{portal.subtitle}</div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{portal.desc}</p>
                  </div>
                </div>

                <div className="pt-5">
                  <Link
                    to={portal.to}
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                      portal.highlight
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{portal.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
