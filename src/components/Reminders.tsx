/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell as BellIcon, Clock as ClockIcon, CheckCircle2 as CheckCircleIcon, 
  Settings as SettingsIcon, Volume2 as VolumeIcon, VolumeX as VolumeXIcon, 
  History as HistoryIcon, ShieldAlert as ShieldIcon, Play as PlayIcon, Moon as MoonIcon,
  Eye, Sliders, AlertTriangle, Check
} from 'lucide-react';
import { Reminder, MedicineLog, Medicine } from '../types';

interface RemindersProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  medicines: Medicine[];
  logs: MedicineLog[];
}

export default function Reminders({ reminders, setReminders, medicines, logs }: RemindersProps) {
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'history' | 'settings'>('upcoming');
  const [notifySettings, setNotifySettings] = useState(() => {
    const saved = localStorage.getItem('medicare_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      weight_unit: 'kg',
      temp_unit: '°C',
      time_format: '12h',
      sound_enabled: true,
      notifications_enabled: true,
      quiet_hours_enabled: false,
      lead_time: 15, // minutes
      repeat_interval: 10, // minutes
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00'
    };
  });

  const updateSetting = (key: string, value: any) => {
    const updated = { ...notifySettings, [key]: value };
    setNotifySettings(updated);
    localStorage.setItem('medicare_settings', JSON.stringify(updated));
  };

  // 1. Upcoming Reminders (Status is pending or snoozed)
  const upcomingReminders = reminders.filter(r => r.status === 'pending' || r.status === 'snoozed');

  // 2. History Reminders (Dismissed, sent)
  const historyReminders = reminders.filter(r => r.status === 'dismissed' || r.status === 'sent');

  // Handle Dismiss action
  const handleDismiss = (id: number) => {
    const updated = reminders.map(r => {
      if (r.id === id) {
        return { ...r, status: 'dismissed' as const };
      }
      return r;
    });
    setReminders(updated);
    localStorage.setItem('medicare_reminders', JSON.stringify(updated));
  };

  // Handle Snooze action of Reminders
  const handleSnooze = (id: number, minutes: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const snoozeTimeStr = now.toISOString().replace('Z', '').split('.')[0]; // simple ISO format local

    const updated = reminders.map(r => {
      if (r.id === id) {
        return { 
          ...r, 
          status: 'snoozed' as const,
          snooze_until: snoozeTimeStr,
          message: `${r.message} (Snoozed for ${minutes}m)`
        };
      }
      return r;
    });
    setReminders(updated);
    localStorage.setItem('medicare_reminders', JSON.stringify(updated));
    alert(`Alert snoozed for ${minutes} minutes (until ${now.toLocaleTimeString()}).`);
  };

  // Trigger test sound & notification
  const handleTestAlert = () => {
    if (notifySettings.sound_enabled) {
      // Use Javascript synthesized AudioContext which is fully compatible with browser clients
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = 880; // beautiful clean 880Hz A note
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
      } catch (err) {
        console.log('AudioContext blocked', err);
      }
    }

    // Trigger normal browser audio notification
    if (Notification.permission === 'granted') {
      new Notification('MediCare+ Test Notification', {
        body: 'Your medicine reminders are working properly!',
        icon: '/logo.png'
      });
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('MediCare+ Notification Enabled!');
        } else {
          alert('Test Alert: Reminders are operational but web browser notifications are blocked. Check your address-bar permissions.');
        }
      });
    }
  };

  return (
    <div className="space-y-6" id="reminders-tab">
      {/* Tab Header with Page Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#EAEAEA]">Alarms & Notification Center</h1>
          <p className="text-sm text-[#A0A0B0]">Configure notifications, manage snoozes, and review alert history logs</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#16213E] p-1 rounded-xl border border-teal-primary/20 shrink-0 select-none">
          <button 
            onClick={() => setActiveSubTab('upcoming')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'upcoming' ? 'bg-[#0D6E6E] text-white shadow-md' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'
            }`}
          >
            <ClockIcon className="w-4 h-4" /> Upcoming
          </button>
          <button 
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'history' ? 'bg-[#0D6E6E] text-white shadow-md' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'
            }`}
          >
            <HistoryIcon className="w-4 h-4" /> History Logs
          </button>
          <button 
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'settings' ? 'bg-[#0D6E6E] text-white shadow-md' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'
            }`}
          >
            <SettingsIcon className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      {/* 2. SUB-TABS VIEWS */}
      
      {/* Tab 1: UPCOMING ALERTS */}
      {activeSubTab === 'upcoming' && (
        <div className="space-y-4" id="upcoming-reminders-subview">
          <div className="bg-[#16213E]/60 text-xs px-4 py-3 rounded-xl border border-teal-primary/10 text-[#A0A0B0]">
            The next scheduled medicine, appointment, and refill reminders are listed below. Dismiss to log compliance.
          </div>

          {upcomingReminders.length === 0 ? (
            <div className="text-center py-20 bg-[#16213E] rounded-xl border border-dashed border-slate-800">
              <CheckCircleIcon className="w-16 h-16 text-emerald-400 opacity-60 mx-auto mb-4" />
              <h3 className="font-bold text-[#EAEAEA] text-base font-display">No Pending Reminders</h3>
              <p className="text-[#A0A0B0] text-sm mt-1">All your medications and appointments are fully up-to-date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((rem) => (
                <div 
                  key={rem.id}
                  className="bg-[#16213E] border border-teal-primary/15 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#0D6E6E]/40 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#0D6E6E]/10 border border-[#0D6E6E]/30 rounded-xl shrink-0 mt-0.5">
                      <BellIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-800 rounded-md text-emerald-400 border border-slate-700 font-mono">
                        {rem.type} ALERT
                      </span>
                      <h4 className="font-semibold text-sm text-[#EAEAEA] mt-1.5 leading-snug">{rem.message}</h4>
                      <p className="text-xs text-[#A0A0B0] flex items-center gap-1 mt-1 font-mono">
                        <ClockIcon className="w-3.5 h-3.5 text-coral-accent shrink-0" /> Expected at: {rem.scheduled_time.replace('T', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    {/* Snooze Options */}
                    <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 gap-1">
                      <span className="text-[10px] text-[#A0A0B0] font-bold px-2">Snooze:</span>
                      <button 
                        onClick={() => handleSnooze(rem.id, 5)}
                        className="text-[10px] px-2 py-1 bg-slate-900 rounded hover:bg-[#0D6E6E] text-[#EAEAEA] transition"
                      >
                        5m
                      </button>
                      <button 
                        onClick={() => handleSnooze(rem.id, 15)}
                        className="text-[10px] px-2 py-1 bg-slate-900 rounded hover:bg-[#0D6E6E] text-[#EAEAEA] transition"
                      >
                        15m
                      </button>
                      <button 
                        onClick={() => handleSnooze(rem.id, 60)}
                        className="text-[10px] px-2 py-1 bg-slate-900 rounded hover:bg-[#0D6E6E] text-[#EAEAEA] transition"
                      >
                        1h
                      </button>
                    </div>

                    <button 
                      onClick={() => handleDismiss(rem.id)}
                      className="text-xs bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white px-4 py-2 rounded-lg font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5 text-white" /> Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: HISTORY LOGS */}
      {activeSubTab === 'history' && (
        <div className="space-y-4" id="history-reminders-subview">
          <div className="bg-[#16213E] p-4 rounded-xl border border-teal-primary/10 flex justify-between items-center">
            <span className="text-xs text-[#A0A0B0]">Displaying alerts fired in the past 7 days</span>
            <button 
              onClick={() => {
                const clearLogs = window.confirm('Do you want to restore all history alerts into active pending alarms?');
                if (clearLogs) {
                  const restored = reminders.map(r => ({ ...r, status: 'pending' as const }));
                  setReminders(restored);
                  localStorage.setItem('medicare_reminders', JSON.stringify(restored));
                }
              }}
              className="text-xs text-emerald-400 hover:underline font-bold"
            >
              Reset History Status
            </button>
          </div>

          {historyReminders.length === 0 ? (
            <div className="text-center py-20 bg-[#16213E] rounded-xl border border-dashed border-slate-800">
              <HistoryIcon className="w-12 h-12 text-[#A0A0B0]/30 mx-auto mb-3" />
              <p className="text-[#A0A0B0] text-sm">No alert history registered yet within 7 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyReminders.map((rem) => (
                <div key={rem.id} className="p-4 bg-[#16213E]/50 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#A0A0B0] shrink-0"></div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#EAEAEA]">{rem.message}</h4>
                      <div className="flex items-center gap-2 text-xs text-[#A0A0B0] mt-1 font-mono">
                        <span>Fired at: {rem.scheduled_time.replace('T', ' ')}</span>
                        <span>•</span>
                        <span className="text-emerald-400 capitalize bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">{rem.type}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border rounded ${
                    rem.status === 'dismissed' 
                      ? 'bg-slate-700/10 text-[#A0A0B0] border-slate-700' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {rem.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: SETTINGS CONFIGURATION */}
      {activeSubTab === 'settings' && (
        <div className="bg-[#16213E] rounded-xl p-6 border border-teal-primary/10 grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-reminders-subview">
          
          {/* Left Block */}
          <div className="space-y-5">
            <h3 className="text-base font-bold font-display text-[#EAEAEA] flex items-center gap-2 pb-2 border-b border-slate-800">
              <VolumeIcon className="w-5 h-5 text-emerald-400" /> Notifications & Sound Options
            </h3>

            {/* Enable systems notifications */}
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-[#EAEAEA]">Desktop Notifications</h4>
                <p className="text-xs text-[#A0A0B0] mt-0.5">Toggle browser desktop system alert windows</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={notifySettings.notifications_enabled} 
                  onChange={(e) => updateSetting('notifications_enabled', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D6E6E]"></div>
              </label>
            </div>

            {/* Enable Chimes */}
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-[#EAEAEA]">Alarm Audio Chimes</h4>
                <p className="text-xs text-[#A0A0B0] mt-0.5">Play bell audio synthesizers on alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={notifySettings.sound_enabled} 
                  onChange={(e) => updateSetting('sound_enabled', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D6E6E]"></div>
              </label>
            </div>

            {/* Interactive Alert Test Button */}
            <div className="bg-[#1A1A2E] p-4 rounded-xl border border-teal-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-xs uppercase text-emerald-400 tracking-wider">Diagnostic Tool</h4>
                <p className="text-xs text-[#A0A0B0] mt-1">Simulate reminder alarms to inspect browser volume.</p>
              </div>
              <button 
                onClick={handleTestAlert}
                className="text-xs bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 self-end sm:self-center"
              >
                <PlayIcon className="w-3.5 h-3.5 shrink-0" /> Fire Daily Test
              </button>
            </div>
          </div>

          {/* Right Block: Schedulers & Exclusions */}
          <div className="space-y-5">
            <h3 className="text-base font-bold font-display text-[#EAEAEA] flex items-center gap-2 pb-2 border-b border-slate-800">
              <MoonIcon className="w-5 h-5 text-coral-accent" /> Off-Hours & Buffer Timing
            </h3>

            {/* Trigger Lead Times */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-bold text-sm text-[#EAEAEA]">Lead Alarm Time</h4>
                <span className="text-xs text-emerald-400 font-mono font-bold">{notifySettings.lead_time} minutes before</span>
              </div>
              <p className="text-xs text-[#A0A0B0] mb-2">Advance buffer before scheduled medicine intakes</p>
              <input 
                type="range" 
                min="0" 
                max="60" 
                step="5"
                value={notifySettings.lead_time}
                onChange={(e) => updateSetting('lead_time', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0D6E6E]"
              />
            </div>

            {/* Sinks Quiet Hours */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-[#EAEAEA]">Inhibit Quiet Hours</h4>
                  <p className="text-xs text-[#A0A0B0] mt-0.5">Mute visual and sound alerts during night sleep</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={notifySettings.quiet_hours_enabled} 
                    onChange={(e) => updateSetting('quiet_hours_enabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D6E6E]"></div>
                </label>
              </div>

              {notifySettings.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-3 bg-[#1A1A2E] p-3 rounded-lg border border-slate-800 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] text-[#A0A0B0] uppercase font-bold mb-1">Quiet Start Hour</label>
                    <input 
                      type="time" 
                      value={notifySettings.quiet_hours_start} 
                      onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-[#EAEAEA] text-xs rounded p-1.5 w-full font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#A0A0B0] uppercase font-bold mb-1">Quiet End Hour</label>
                    <input 
                      type="time" 
                      value={notifySettings.quiet_hours_end} 
                      onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-[#EAEAEA] text-xs rounded p-1.5 w-full font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
