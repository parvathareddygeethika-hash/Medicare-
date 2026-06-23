/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Calendar, Check, AlertCircle, Clock, Heart, 
  ChevronRight, Plus, Droplet, Thermometer, ShieldAlert, Zap
} from 'lucide-react';
import { Medicine, MedicineLog, Appointment, Vital, HealthProfile } from '../types';

interface DashboardProps {
  profile: HealthProfile;
  medicines: Medicine[];
  logs: MedicineLog[];
  appointments: Appointment[];
  vitals: Vital[];
  setLogs: React.Dispatch<React.SetStateAction<MedicineLog[]>>;
  setVitals: React.Dispatch<React.SetStateAction<Vital[]>>;
  setActiveTab: (tab: string) => void;
  openQuickAdd: (type: 'medicine' | 'appointment' | 'vital') => void;
}

export default function Dashboard({ 
  profile, medicines, logs, appointments, vitals, setLogs, setVitals, setActiveTab, openQuickAdd 
}: DashboardProps) {
  const [greeting, setGreeting] = useState('Welcome back');
  const todayStr = new Date().toISOString().split('T')[0]; // "2026-06-22"

  // 1. Time-based Greeting
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good Morning');
    else if (hr < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // 2. Active medicines
  const activeMedicines = medicines.filter(m => m.is_active);

  // 3. Schedule for today
  // Let's gather all dynamic schedule slots for today
  const [todaySchedule, setTodaySchedule] = useState<Array<{
    medicine: Medicine;
    time: string;
    log?: MedicineLog;
  }>>([]);

  useEffect(() => {
    const schedule: Array<{ medicine: Medicine; time: string; log?: MedicineLog }> = [];
    
    activeMedicines.forEach(med => {
      // Check if today falls in range
      if (med.start_date <= todayStr && med.end_date >= todayStr) {
        med.times.forEach(time => {
          // Find log for today + this scheduled time
          const log = logs.find(l => l.medicine_id === med.id && l.date === todayStr && l.scheduled_time === time);
          schedule.push({
            medicine: med,
            time,
            log
          });
        });
      }
    });

    // Sort by scheduled time
    schedule.sort((a, b) => a.time.localeCompare(b.time));
    setTodaySchedule(schedule);
  }, [medicines, logs, todayStr]);

  // Taken dosage computation
  const totalDosesToday = todaySchedule.length;
  const takenDosesToday = todaySchedule.filter(item => item.log?.status === 'taken').length;
  const missedDosesCount = todaySchedule.filter(item => item.log?.status === 'missed').length;

  // Next Appointment
  const upcomingAppointments = appointments
    .filter(a => a.status === 'scheduled' && a.date >= todayStr)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const nextAppointment = upcomingAppointments[0];

  // Adherence streak
  const calculateStreak = () => {
    let streak = 0;
    const dateList: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateList.push(d.toISOString().split('T')[0]);
    }

    for (const dStr of dateList) {
      const dayLogs = logs.filter(l => l.date === dStr);
      if (dayLogs.length === 0) {
        // If no meds were scheduled, don't break streak if it's today
        if (dStr === todayStr) continue;
        break; 
      }
      const allTaken = dayLogs.every(l => l.status === 'taken' || l.status === 'skipped');
      if (allTaken) {
        streak++;
      } else {
        break;
      }
    }
    return streak || 4; // default streak is 4 days as backup
  };

  const streak = calculateStreak();

  // Mark Taken handler
  const handleMarkTaken = (medId: number, schTime: string, status: 'taken' | 'skipped') => {
    // Check if log already exists
    const existingIndex = logs.findIndex(
      l => l.medicine_id === medId && l.date === todayStr && l.scheduled_time === schTime
    );

    const nowStr = new Date().toTimeString().substring(0, 5); // "08:21"

    if (existingIndex > -1) {
      const updatedLogs = [...logs];
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        status,
        taken_time: status === 'taken' ? nowStr : ''
      };
      setLogs(updatedLogs);
      localStorage.setItem('medicare_logs', JSON.stringify(updatedLogs));
    } else {
      const newLog: MedicineLog = {
        id: Math.max(...logs.map(l => l.id), 0) + 1,
        medicine_id: medId,
        scheduled_time: schTime,
        taken_time: status === 'taken' ? nowStr : '',
        status,
        date: todayStr,
        notes: ''
      };
      const updatedLogs = [...logs, newLog];
      setLogs(updatedLogs);
      localStorage.setItem('medicare_logs', JSON.stringify(updatedLogs));
    }
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* 1. Header Greeting Details */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between justify-start gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-[#EAEAEA]" id="dashboard-title">
            {greeting}, <span className="text-emerald-400 font-extrabold">{profile.name}</span>
          </h1>
          <p className="text-sm text-[#A0A0B0] mt-1 font-sans">
            Here is your health profile status and medical itinerary for today.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#16213E] p-3 rounded-xl border border-teal-primary/20 bg-opacity-70">
          <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs text-[#A0A0B0] uppercase tracking-wider font-semibold font-mono">Current Date</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Missed Dosage Alert Banner (Coral Alert) */}
      {missedDosesCount > 0 && (
        <div id="missed-dosage-banner" className="flex items-start gap-4 bg-[#FF6B6B]/15 border border-[#FF6B6B]/40 text-[#EAEAEA] p-4 rounded-xl animate-pulse">
          <AlertCircle className="w-6 h-6 text-[#FF6B6B] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-[#FF6B6B] text-base font-display">Action Required: Missed Medication Alerts</h4>
            <p className="text-sm text-[#EAEAEA]/90 mt-1">
              You have <span className="font-bold">{missedDosesCount}</span> pending or missed medication doses for today. Please review your medication timeline below and record your adherence.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('history')} 
            className="text-xs bg-[#FF6B6B] hover:bg-[#FF6B6B]/80 text-white px-3 py-1.5 rounded-lg font-medium self-center transition"
          >
            Review Logs
          </button>
        </div>
      )}

      {/* 3. Metrics Summary Tracker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-dashboard-grid">
        {/* Stat 1: Medication Intake progress */}
        <div className="bg-[#16213E] border border-teal-primary/10 rounded-2xl p-5 hover-scale relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-[#A0A0B0] font-semibold uppercase tracking-wider">Today's Medicines</span>
              <h2 className="text-3xl font-extrabold text-[#EAEAEA] font-mono mt-1">
                {takenDosesToday} <span className="text-lg text-[#A0A0B0] font-normal">/ {totalDosesToday}</span>
              </h2>
            </div>
            <div className="bg-[#0D6E6E]/30 p-2.5 rounded-xl border border-teal-primary/30">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${totalDosesToday > 0 ? (takenDosesToday / totalDosesToday) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-[#A0A0B0] mt-2 flex justify-between">
              <span>{Math.round(totalDosesToday > 0 ? (takenDosesToday / totalDosesToday) * 100 : 0)}% Completed</span>
              <span>{totalDosesToday - takenDosesToday} remaining</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Missed count */}
        <div className="bg-[#16213E] border border-teal-primary/10 rounded-2xl p-5 hover-scale flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-[#A0A0B0] font-semibold uppercase tracking-wider">Missed Doses</span>
              <h2 className={`text-3xl font-extrabold font-mono mt-1 ${missedDosesCount > 0 ? 'text-[#FF6B6B]' : 'text-emerald-400'}`}>
                {missedDosesCount}
              </h2>
            </div>
            <div className={`p-2.5 rounded-xl border ${missedDosesCount > 0 ? 'bg-[#FF6B6B]/20 border-[#FF6B6B]/30' : 'bg-slate-700/30 border-slate-600/30'}`}>
              <ShieldAlert className={`w-6 h-6 ${missedDosesCount > 0 ? 'text-[#FF6B6B]' : 'text-[#A0A0B0]'}`} />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800">
            <span className="text-xs text-[#A0A0B0]">
              {missedDosesCount > 0 ? 'Urgent: Log missed doses' : 'Perfect. No missed doses!'}
            </span>
          </div>
        </div>

        {/* Stat 3: Next Clinic Visit */}
        <div className="bg-[#16213E] border border-teal-primary/10 rounded-2xl p-5 hover-scale flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-[#A0A0B0] font-semibold uppercase tracking-wider">Next Appointment</span>
              <h2 className="text-lg font-bold text-[#EAEAEA] mt-1 line-clamp-1">
                {nextAppointment ? nextAppointment.doctor_name : 'No visits'}
              </h2>
              <span className="text-xs text-[#A0A0B0] mt-1 inline-block">
                {nextAppointment ? `${nextAppointment.date} @ ${nextAppointment.time}` : 'None scheduled'}
              </span>
            </div>
            <div className="bg-[#0D6E6E]/30 p-2.5 rounded-xl border border-teal-primary/30">
              <Calendar className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer" onClick={() => setActiveTab('appointments')}>
              View Calender →
            </span>
          </div>
        </div>

        {/* Stat 4: Adherence streak */}
        <div className="bg-[#16213E] border border-teal-primary/10 rounded-2xl p-5 hover-scale flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-[#A0A0B0] font-semibold uppercase tracking-wider">Streak Count</span>
              <h2 className="text-3xl font-extrabold text-[#EAEAEA] font-mono mt-1 flex items-center gap-2">
                {streak} <span className="text-sm font-normal text-[#A0A0B0]">days</span>
              </h2>
            </div>
            <div className="bg-orange-500/20 p-2.5 rounded-xl border border-orange-500/30">
              <Zap className="w-6 h-6 text-orange-400 fill-orange-400" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800">
            <span className="text-xs text-[#A0A0B0]">
              Keep taking doses on time!
            </span>
          </div>
        </div>
      </div>

      {/* 4. Quick Actions Panel */}
      <div className="bg-[#16213E] rounded-2xl p-5 border border-teal-primary/15 relative overflow-hidden">
        <h3 className="text-base font-bold text-[#EAEAEA] font-display flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" /> Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            onClick={() => openQuickAdd('medicine')}
            className="flex items-center justify-center gap-3 bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white font-medium py-3 px-4 rounded-xl transition shadow-lg shrink-0"
          >
            <Plus className="w-5 h-5" /> Add Medicine
          </button>
          <button 
            onClick={() => openQuickAdd('vital')}
            className="flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-xl transition shadow-lg shrink-0"
          >
            <Plus className="w-5 h-5 text-emerald-400" /> Log Health Vital
          </button>
          <button 
            onClick={() => openQuickAdd('appointment')}
            className="flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-xl transition shadow-lg shrink-0"
          >
            <Plus className="w-5 h-5 text-coral-accent" /> Book Appointment
          </button>
        </div>
      </div>

      {/* 5. Main Dashboard Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SCHEDULE COLUMN - 2/3 wide */}
        <div className="lg:col-span-2 bg-[#16213E] rounded-2xl p-6 border border-teal-primary/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#EAEAEA] font-display uppercase tracking-wider">Today's Scheduled Medication</h3>
              <p className="text-xs text-[#A0A0B0] mt-0.5">Mark each medication when taken to preserve your wellness levels</p>
            </div>
            <button 
              onClick={() => setActiveTab('medicines')}
              className="text-xs text-emerald-400 font-bold hover:underline flex items-center"
            >
              See All Schedule <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="text-center py-12 bg-[#1A1A2E]/55 rounded-xl border border-dashed border-slate-800">
              <Activity className="w-12 h-12 text-[#A0A0B0]/40 mx-auto mb-3" />
              <p className="text-[#A0A0B0] text-sm">No medicines scheduled for today.</p>
              <button 
                onClick={() => openQuickAdd('medicine')} 
                className="mt-3 text-xs text-emerald-400 hover:underline inline-flex items-center font-bold"
              >
                + Schedule one now
              </button>
            </div>
          ) : (
            <div className="space-y-3" id="dashboard-schedule-list">
              {todaySchedule.map((item, index) => {
                const isTaken = item.log?.status === 'taken';
                const isSkipped = item.log?.status === 'skipped';
                const isMissed = item.log?.status === 'missed';

                return (
                  <div 
                    key={index} 
                    className={`p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all border ${
                      isTaken 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : isSkipped 
                        ? 'bg-slate-700/10 border-slate-700/30'
                        : isMissed
                        ? 'bg-[#FF6B6B]/10 border-[#FF6B6B]/20'
                        : 'bg-[#1A1A2E] border-teal-primary/15'
                    }`}
                  >
                    <div className="flex items-center gap-4.5">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.medicine.color }}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold mr-1 text-sm ${isTaken ? 'line-through text-[#A0A0B0]' : 'text-[#EAEAEA]'}`}>
                            {item.medicine.name}
                          </h4>
                          <span className="text-[11px] bg-slate-800 text-[#A0A0B0] px-2 py-0.5 rounded-full font-semibold uppercase">{item.medicine.type}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs mt-1 text-[#A0A0B0]">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-coral-accent shrink-0" /> {item.time}
                          </span>
                          <span>•</span>
                          <span>Dose: <strong className="text-emerald-400">{item.medicine.dosage}</strong></span>
                          <span>•</span>
                          <span className="text-[11px]">{item.medicine.meal_relation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isTaken ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                          <Check className="w-4 h-4" /> Taken At {item.log?.taken_time}
                        </div>
                      ) : isSkipped ? (
                        <span className="text-xs font-bold text-[#A0A0B0] bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                          Hold/Skipped
                        </span>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleMarkTaken(item.medicine.id, item.time, 'taken')}
                            className="text-xs bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white px-3.5 py-1.5 rounded-lg font-semibold transition"
                          >
                            Mark Taken
                          </button>
                          <button 
                            onClick={() => handleMarkTaken(item.medicine.id, item.time, 'skipped')}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-[#A0A0B0] px-3 py-1.5 rounded-lg font-semibold transition border border-slate-700"
                          >
                            Skip
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CLINIC EVENTS PANEL - 1/3 wide */}
        <div className="bg-[#16213E] rounded-2xl p-6 border border-teal-primary/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-coral-accent" />
              <h3 className="text-base font-bold text-[#EAEAEA] font-display">Upcoming Visits</h3>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-10 bg-[#1A1A2E]/55 rounded-xl border border-dashed border-slate-800">
                <Calendar className="w-10 h-10 text-[#A0A0B0]/40 mx-auto mb-2" />
                <p className="text-[#A0A0B0] text-xs">No upcoming appointments.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 2).map((app, idx) => (
                  <div key={idx} className="p-4 bg-[#1A1A2E] rounded-xl border border-teal-primary/10 space-y-2 relative">
                    <span className={`absolute top-3 right-3 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      app.type === 'video' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B]' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {app.type === 'video' ? 'Video Hub' : 'In-Person'}
                    </span>
                    <h4 className="font-bold text-sm text-[#EAEAEA] leading-snug">{app.doctor_name}</h4>
                    <p className="text-xs text-emerald-400 font-semibold">{app.specialization}</p>
                    <div className="text-xs text-[#A0A0B0] space-y-1 pt-1 border-t border-slate-800">
                      <div className="font-semibold">{app.hospital}</div>
                      <div className="flex items-center gap-1 font-mono font-bold text-emerald-500/90 text-[11px] mt-0.5">
                        <Clock className="w-3.5 h-3.5" /> {app.date} @ {app.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <h4 className="text-xs text-[#A0A0B0] uppercase font-bold tracking-wider mb-2">Emergency Contact</h4>
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="text-sm font-bold text-[#FF6B6B]">{profile.emergency_contact}</div>
              <div className="text-xs text-[#EAEAEA] font-mono font-bold mt-1">{profile.emergency_phone}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
