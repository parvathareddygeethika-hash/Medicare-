/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, MapPin, Video, CheckCircle2, XCircle, Edit, Trash2, 
  ChevronLeft, ChevronRight, Plus, X, ListFilter, Activity
} from 'lucide-react';
import { Appointment } from '../types';

interface AppointmentsProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  openFormWithDefault: boolean;
  setOpenFormWithDefault: (val: boolean) => void;
}

export default function Appointments({ 
  appointments, setAppointments, openFormWithDefault, setOpenFormWithDefault 
}: AppointmentsProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Calendar Navigation date
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date(2026, 5, 22)); // June 2026

  // Form State
  const [modalOpen, setModalOpen] = useState(openFormWithDefault);
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);

  // Form Fields
  const [formDoctor, setFormDoctor] = useState('');
  const [formSpec, setFormSpec] = useState('');
  const [formHospital, setFormHospital] = useState('');
  const [formDate, setFormDate] = useState('2026-06-22');
  const [formTime, setFormTime] = useState('10:00');
  const [formType, setFormType] = useState<'in_person' | 'video'>('in_person');
  const [formReminder, setFormReminder] = useState(60);
  const [formNotes, setFormNotes] = useState('');

  // Past appointments accordion toggle
  const [pastExpanded, setPastExpanded] = useState(false);

  // Calendar calculations
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigate Calendar Months
  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  // Days in month grid
  const daysInGrid = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    
    // Empty padding cells for previous month padding
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    
    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAppointments = appointments.filter(a => a.date === dStr);
      cells.push({
        day,
        dateStr: dStr,
        appointments: dayAppointments
      });
    }
    
    return cells;
  }, [year, month, appointments]);

  // Handle Book appointment click
  const handleOpenAddModal = () => {
    setEditingApp(null);
    setFormDoctor('');
    setFormSpec('');
    setFormHospital('');
    setFormDate(`${year}-${String(month + 1).padStart(2, '0')}-22`);
    setFormTime('10:00');
    setFormType('in_person');
    setFormReminder(60);
    setFormNotes('');
    setModalOpen(true);
    setOpenFormWithDefault(false);
  };

  React.useEffect(() => {
    if (openFormWithDefault) {
      handleOpenAddModal();
    }
  }, [openFormWithDefault]);

  // Handle Edit click
  const handleOpenEditModal = (app: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingApp(app);
    setFormDoctor(app.doctor_name);
    setFormSpec(app.specialization);
    setFormHospital(app.hospital);
    setFormDate(app.date);
    setFormTime(app.time);
    setFormType(app.type);
    setFormReminder(app.reminder_before);
    setFormNotes(app.notes);
    setModalOpen(true);
  };

  // Handle Save
  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDoctor || !formHospital) return;

    if (editingApp) {
      // Edit
      const updated = appointments.map(a => {
        if (a.id === editingApp.id) {
          return {
            ...a,
            doctor_name: formDoctor,
            specialization: formSpec,
            hospital: formHospital,
            date: formDate,
            time: formTime,
            type: formType,
            reminder_before: Number(formReminder),
            notes: formNotes
          };
        }
        return a;
      });
      setAppointments(updated);
      localStorage.setItem('medicare_appointments', JSON.stringify(updated));
    } else {
      // Add
      const newApp: Appointment = {
        id: Math.max(...appointments.map(a => a.id), 0) + 1,
        doctor_name: formDoctor,
        specialization: formSpec,
        hospital: formHospital,
        date: formDate,
        time: formTime,
        type: formType,
        status: 'scheduled',
        reminder_before: Number(formReminder),
        notes: formNotes,
        prescription_path: '',
        created_at: new Date().toISOString()
      };
      const updated = [...appointments, newApp];
      setAppointments(updated);
      localStorage.setItem('medicare_appointments', JSON.stringify(updated));
    }
    setModalOpen(false);
    setEditingApp(null);
  };

  // Change Status (Completed / Cancelled)
  const handleChangeStatus = (id: number, status: 'scheduled' | 'completed' | 'cancelled', e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = appointments.map(a => {
      if (a.id === id) {
        return { ...a, status };
      }
      return a;
    });
    setAppointments(updated);
    localStorage.setItem('medicare_appointments', JSON.stringify(updated));
  };

  // Delete Appointment completely
  const handleDeleteApp = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('Delete this appointment record forever?');
    if (!confirmed) return;
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    localStorage.setItem('medicare_appointments', JSON.stringify(updated));
  };

  // Compute stats
  const totalUpcomingCount = appointments.filter(a => a.status === 'scheduled').length;
  const totalCompletedCount = appointments.filter(a => a.status === 'completed').length;

  // Filter lists based on clicked calendar days
  const upcomingFiltered = useMemo(() => {
    const list = appointments.filter(a => a.status === 'scheduled');
    if (selectedDate) {
      return list.filter(a => a.date === selectedDate);
    }
    return list.sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [appointments, selectedDate]);

  const pastAppointments = useMemo(() => {
    return appointments
      .filter(a => a.status === 'completed' || a.status === 'cancelled')
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [appointments]);

  return (
    <div className="space-y-6 animate-fadeIn" id="appointments-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#EAEAEA]">Specialist Appointments Calendar</h1>
          <p className="text-sm text-[#A0A0B0]">Schedule clinical checkups, follow up sessions, and manage specialist notes</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm self-start shadow-md"
        >
          <Plus className="w-5 h-5 animate-pulse" /> + Book Appointment
        </button>
      </div>

      {/* Dual Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT: HTML Custom Month Calendar (2/5 size) */}
        <div className="lg:col-span-2 bg-[#16213E] p-5 rounded-2xl border border-teal-primary/10 space-y-4">
          <div className="flex justify-between items-center text-sm font-bold">
            <h3 className="font-display text-[#EAEAEA] uppercase tracking-wider">{monthNames[month]} {year}</h3>
            
            <div className="flex items-center gap-1 bg-[#1A1A2E] p-1 rounded-lg border border-slate-800">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 rounded hover:bg-slate-800 text-[#A0A0B0] hover:text-[#EAEAEA] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 rounded hover:bg-slate-800 text-[#A0A0B0] hover:text-[#EAEAEA] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-[10px] uppercase font-bold text-[#A0A0B0] font-mono border-b border-slate-800 pb-2 select-none">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <span key={day} className="text-red-400">{day}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono select-none" id="custom-calendar-grid">
            {daysInGrid.map((cell, idx) => {
              if (cell === null) return <span key={idx} className="aspect-square"></span>;
              
              const isSelected = selectedDate === cell.dateStr;
              const hasEvents = cell.appointments.length > 0;
              const isToday = cell.dateStr === '2026-06-22';
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                  className={`aspect-square rounded-xl border flex flex-col justify-between p-1.5 transition text-center relative ${
                    isSelected 
                      ? 'bg-[#0D6E6E] text-white border-[#0D6E6E] font-bold scale-105' 
                      : isToday
                      ? 'bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/40 font-bold'
                      : 'hover:bg-slate-800 text-[#EAEAEA] border-transparent'
                  }`}
                >
                  <span className="text-[11px] font-bold">{cell.day}</span>
                  
                  {/* Calendar Marker Dots for schedule */}
                  {hasEvents && (
                    <div className="flex gap-1 justify-center w-full mt-1">
                      {cell.appointments.map((a, aIdx) => (
                        <span 
                          key={aIdx} 
                          className={`w-1.5 h-1.5 rounded-full ${
                            a.type === 'video' ? 'bg-[#FF6B6B]' : 'bg-emerald-400'
                          }`}
                        ></span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="bg-[#1A1A2E] p-3 rounded-xl border border-[#0D6E6E]/20 flex justify-between items-center text-xs">
              <span>Filtering for date: <strong className="text-emerald-400 font-mono">{selectedDate}</strong></span>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-red-400 hover:underline font-bold text-[10px]"
              >
                Clear Day Filter
              </button>
            </div>
          )}
        </div>


        {/* RIGHT: ITINERARY LISTINGS (3/5 size) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-[#EAEAEA] font-display flex items-center gap-1.5">
              <ListFilter className="w-4 h-4 text-emerald-400" /> Upcoming Scheduled Clinics ({upcomingFiltered.length})
            </h3>
            
            <div className="text-[10px] text-[#A0A0B0] font-mono tracking-wider font-bold">
              Total Active: {totalUpcomingCount} | Attended: {totalCompletedCount}
            </div>
          </div>

          <div className="space-y-4">
            {upcomingFiltered.length === 0 ? (
              <div className="bg-[#16213E] p-12 text-center rounded-2xl border border-dashed border-slate-800">
                <Calendar className="w-12 h-12 text-[#A0A0B0]/40 mx-auto mb-3" />
                <p className="text-[#A0A0B0] text-sm">No clinics or video calls match this selected date.</p>
              </div>
            ) : (
              upcomingFiltered.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-[#16213E] rounded-2xl p-5 border border-teal-primary/10 hover:border-emerald-500/25 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${
                        app.type === 'video' ? 'bg-[#FF6B6B]/15 border-[#FF6B6B]/25 text-coral-accent' : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                      }`}>
                        {app.type === 'video' ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#EAEAEA]">{app.doctor_name}</h4>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            app.type === 'video' ? 'bg-[#FF6B6B]/10 text-coral-accent' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {app.type === 'video' ? 'Video Telehealth' : 'In-Person clinic'}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400 font-semibold mt-0.5">{app.specialization}</p>
                      </div>
                    </div>

                    {/* Completion actions */}
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={(e) => handleChangeStatus(app.id, 'completed', e)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-400 text-emerald-400 hover:text-white transition text-xs font-bold"
                        title="Mark Completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleChangeStatus(app.id, 'cancelled', e)}
                        className="p-1.5 rounded-lg bg-[#FF6B6B]/10 hover:bg-[#FF6B6B] text-coral-accent hover:text-white transition text-xs font-bold"
                        title="Cancel Appointment"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-[#A0A0B0] bg-[#1A1A2E]/60 p-3 rounded-xl border border-teal-primary/5 italic leading-relaxed">
                    "{app.notes || 'Routine consult checkup'}"
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2.5 border-t border-slate-800 font-mono font-bold">
                    <span className="text-[#EAEAEA] break-all">{app.hospital}</span>
                    <span className="text-emerald-400 shrink-0">{app.date} @ {app.time}</span>
                  </div>

                  {/* Actions bar for delete / edit */}
                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button 
                      onClick={(e) => handleOpenEditModal(app, e)}
                      className="text-xs text-[#A0A0B0] hover:text-[#EAEAEA] flex items-center gap-1 px-2.1 py-1 rounded hover:bg-slate-700/40"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={(e) => handleDeleteApp(app.id, e)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2.1 py-1 rounded hover:bg-slate-700/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ACCORDION: Archive clinics (collapsible history stats) */}
      <div className="bg-[#16213E] rounded-2xl border border-teal-primary/10 overflow-hidden select-none">
        <button 
          onClick={() => setPastExpanded(!pastExpanded)}
          className="w-full flex justify-between items-center p-4 text-xs uppercase font-extrabold tracking-wider text-[#A0A0B0] font-sans hover:bg-slate-800/10 transition"
        >
          <span className="flex items-center gap-1.5">
            <Activity className="text-[#FF6B6B] w-4 h-4" /> Collapsible Clinic Archives ({pastAppointments.length})
          </span>
          <span className="text-emerald-400 font-bold">{pastExpanded ? 'Collapse' : 'Expand'}</span>
        </button>

        {pastExpanded && (
          <div className="p-4 border-t border-slate-800 space-y-3 bg-[#1A1A2E]/50 animate-fadeIn text-xs">
            {pastAppointments.length === 0 ? (
              <p className="text-center text-[#A0A0B0] py-4">No completed or non-attended sessions registered.</p>
            ) : (
              pastAppointments.map((app) => (
                <div key={app.id} className="p-3.5 bg-[#16213E] border border-slate-800 rounded-xl flex items-center justify-between gap-3 font-sans">
                  <div>
                    <h5 className="font-bold text-[#EAEAEA]">{app.doctor_name}</h5>
                    <p className="text-[#A0A0B0] mt-0.5">{app.specialization} • {app.hospital}</p>
                    <span className="text-[10px] text-[#A0A0B0] font-mono mt-1 block">{app.date} @ {app.time}</span>
                  </div>

                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border rounded ${
                    app.status === 'completed' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Appointment Modal */}
      {modalOpen && (
        <div id="appointment-form-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#16213E] rounded-2xl max-w-md w-full border border-teal-primary/30 shadow-2xl relative">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center text-[#EAEAEA]">
              <h2 className="text-base font-bold font-display flex items-center gap-1.5">
                <Calendar className="text-emerald-400" /> {editingApp ? 'Alter Booked Clinic' : 'Schedule Specialist Clinic'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#A0A0B0] hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="p-5 space-y-4 text-xs text-[#EAEAEA]">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A0A0B0] mb-1">Doctor Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Thomas Evelyn"
                  value={formDoctor}
                  onChange={(e) => setFormDoctor(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A0A0B0] mb-1">Medical Specialization</label>
                <input 
                  type="text"
                  placeholder="e.g. Cardiologist, Generalist"
                  value={formSpec}
                  onChange={(e) => setFormSpec(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A0A0B0] mb-1">Hospital / Clinic Center *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Valley Cardiology Complex"
                  value={formHospital}
                  onChange={(e) => setFormHospital(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A0A0B0] mb-1">Consultation Date</label>
                  <input 
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A0A0B0] mb-1">Scheduled Hour</label>
                  <input 
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A0A0B0] mb-1">Consult Type Badge</label>
                  <select 
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/10"
                  >
                    <option value="in_person">In-Person Clinic</option>
                    <option value="video">Video Telehealth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A0A0B0] mb-1">Alert Buffer (Mins before)</label>
                  <select 
                    value={formReminder}
                    onChange={(e) => setFormReminder(Number(e.target.value))}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/10"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 Hour before</option>
                    <option value="120">2 Hours before</option>
                    <option value="1440">1 Day before</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A0A0B0] mb-1">Visit notes</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Remember to carry lab test sheets and fast before blood panel."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#A0A0B0] font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white font-bold rounded-xl transition"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
