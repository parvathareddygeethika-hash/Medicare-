/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Pill, Calendar, Activity, BookOpen, Clock, Heart, 
  Settings as SettingsIcon, Bell, Shield, LogOut, CheckCircle, Menu, X, Timer
} from 'lucide-react';

import { initializeDemoData } from './utils/demoData';
import { Medicine, MedicineLog, Appointment, Vital, HealthProfile, LabReport, HealthNote, Reminder } from './types';

// Importing Tab Components
import Dashboard from './components/Dashboard';
import MedicineView from './components/MedicineView';
import Reminders from './components/Reminders';
import HealthRecords from './components/HealthRecords';
import Appointments from './components/Appointments';
import SettingsView from './components/Settings';

export default function App() {
  // 1. Initialise local mock DB
  useEffect(() => {
    initializeDemoData();
  }, []);

  // 2. Local State variables loaded from browser storage or defaults
  const [profile, setProfile] = useState<HealthProfile>(() => {
    const saved = localStorage.getItem('medicare_profile');
    return saved ? JSON.parse(saved) : {
      id: 1, name: 'Alex Mercer', age: 35, gender: 'Male', blood_type: 'O+', height: 180, weight: 78,
      allergies: [], conditions: [], emergency_contact: 'Family', emergency_phone: '911'
    };
  });

  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('medicare_medicines');
    return saved ? JSON.parse(saved) : [];
  });

  const [vitals, setVitals] = useState<Vital[]>(() => {
    const saved = localStorage.getItem('medicare_vitals');
    return saved ? JSON.parse(saved) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('medicare_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<MedicineLog[]>(() => {
    const saved = localStorage.getItem('medicare_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [reports, setReports] = useState<LabReport[]>(() => {
    const saved = localStorage.getItem('medicare_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [journal, setJournal] = useState<HealthNote[]>(() => {
    const saved = localStorage.getItem('medicare_journal');
    return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('medicare_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  // Current active viewport tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Quick Action form overlays trigger state
  const [medicineFormTrigger, setMedicineFormTrigger] = useState(false);
  const [appointmentFormTrigger, setAppointmentFormTrigger] = useState(false);
  const [activeRecordsType, setActiveRecordsType] = useState('vitals');

  // Real-time time UTC string clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Quick launch helper coordinates
  const handleOpenQuickForm = (type: 'medicine' | 'appointment' | 'vital') => {
    if (type === 'medicine') {
      setActiveTab('medicines');
      setMedicineFormTrigger(true);
    } else if (type === 'appointment') {
      setActiveTab('appointments');
      setAppointmentFormTrigger(true);
    } else if (type === 'vital') {
      setActiveTab('history');
      setActiveRecordsType('vitals');
    }
  };

  // Pending reminder counters
  const activeAlertsCount = reminders.filter(r => r.status === 'pending' || r.status === 'snoozed').length;

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#EAEAEA] flex flex-col md:flex-row relative">
      
      {/* 1. LAYOUT SIDEBAR - 200px equivalent responsive slide pane */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#16213E] border-r border-teal-primary/15 flex flex-col justify-between z-40 transition-transform duration-300 md:transform-none select-none ${
        isSidebarOpen ? 'transform-none' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Branding coordinates */}
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#0D6E6E] p-2 rounded-xl text-white shadow-md">
                <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold font-display text-[#EAEAEA] tracking-tight">MediCare+</h1>
                <span className="text-[10px] text-[#A0A0B0] font-bold uppercase tracking-wider font-mono">My Wellness Suite</span>
              </div>
            </div>
            <button className="md:hidden text-[#A0A0B0] hover:text-[#EAEAEA]" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links items */}
          <nav className="p-4 space-y-1.5 mt-4" id="main-sidebar-nav">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'medicines', label: 'Medicine Schedule', icon: Pill },
              { id: 'history', label: 'Health Vault', icon: BookOpen },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'reminders', label: 'Alarm Center', icon: Clock, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition font-medium text-xs font-display ${
                    isActive 
                      ? 'bg-[#0D6E6E] text-white font-extrabold shadow-lg' 
                      : 'text-[#A0A0B0] hover:bg-slate-800/50 hover:text-[#EAEAEA]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#A0A0B0]'}`} />
                    {link.label}
                  </span>
                  {link.badge && (
                    <span className="bg-[#FF6B6B] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Small Patient card footer */}
        <div className="p-4 border-t border-slate-800" id="sidebar-patient-footer">
          <div className="flex items-center gap-3 bg-[#1A1A2E]/50 p-2 rounded-xl border border-teal-primary/5">
            <div className="w-9 h-9 rounded-full bg-[#0D6E6E]/20 text-[#0D6E6E] font-bold border border-teal-primary/20 flex items-center justify-center font-display">
              {profile.name[0]}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold font-display truncate text-[#EAEAEA]">{profile.name}</div>
              <div className="text-[10px] font-mono text-[#A0A0B0]">Blood: {profile.blood_type}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* 2. TOP HEADER BAR */}
        <header className="sticky top-0 bg-[#1A1A2E] border-b border-teal-primary/10 px-6 py-4 flex justify-between items-center z-10 select-none">
          
          {/* Mobile sidebar hamburger trigger */}
          <div className="flex items-center gap-3 md:gap-0">
            <button className="md:hidden text-[#A0A0B0] hover:text-[#EAEAEA]" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#A0A0B0] hidden md:inline font-mono">
              System Coordinates: Online
            </span>
          </div>

          {/* Clock & Notification trigger */}
          <div className="flex items-center gap-5">
            
            {/* Clock display */}
            <div className="text-right hidden sm:block">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>

            {/* Bell Icon triggering notification view */}
            <button 
              onClick={() => setActiveTab('reminders')}
              className="relative p-1.5 bg-[#16213E] rounded-xl border border-teal-primary/10 hover:border-teal-primary/30 text-[#A0A0B0] hover:text-[#EAEAEA] transition"
            >
              <Bell className="w-4.5 h-4.5 text-[#A0A0B0]" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF6B6B] text-white text-[9px] font-bold font-mono rounded-full flex items-center justify-center scale-90">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* 3. SCROLLABLE TAB PAGE SECTION */}
        <main className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-64px)] print:overflow-visible">
          {activeTab === 'dashboard' && (
            <Dashboard 
              profile={profile}
              medicines={medicines}
              logs={logs}
              appointments={appointments}
              vitals={vitals}
              setLogs={setLogs}
              setVitals={setVitals}
              setActiveTab={setActiveTab}
              openQuickAdd={handleOpenQuickForm}
            />
          )}

          {activeTab === 'medicines' && (
            <MedicineView 
              medicines={medicines}
              setMedicines={setMedicines}
              logs={logs}
              setLogs={setLogs}
              openFormWithDefault={medicineFormTrigger}
              setOpenFormWithDefault={setMedicineFormTrigger}
            />
          )}

          {activeTab === 'history' && (
            <HealthRecords 
              profile={profile}
              setProfile={setProfile}
              vitals={vitals}
              setVitals={setVitals}
              reports={reports}
              setReports={setReports}
              journal={journal}
              setJournal={setJournal}
              openSetupType={activeRecordsType}
            />
          )}

          {activeTab === 'appointments' && (
            <Appointments 
              appointments={appointments}
              setAppointments={setAppointments}
              openFormWithDefault={appointmentFormTrigger}
              setOpenFormWithDefault={setAppointmentFormTrigger}
            />
          )}

          {activeTab === 'reminders' && (
            <Reminders 
              reminders={reminders}
              setReminders={setReminders}
              medicines={medicines}
              logs={logs}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              profile={profile}
              setProfile={setProfile}
              medicines={medicines}
              vitals={vitals}
              appointments={appointments}
              logs={logs}
              setMedicines={setMedicines}
              setLogs={setLogs}
              setAppointments={setAppointments}
              setVitals={setVitals}
              setJournal={setJournal}
              setReports={setReports}
              setReminders={setReminders}
            />
          )}
        </main>
      </div>
    </div>
  );
}
