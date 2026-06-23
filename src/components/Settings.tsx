/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, User, Eye, EyeOff, ShieldAlert, Download, Upload, 
  Database, RefreshCw, Trash2, Heart, Info, Volume2, Save, FileText
} from 'lucide-react';
import { HealthProfile, Medicine, Vital, Appointment, MedicineLog } from '../types';

interface SettingsProps {
  profile: HealthProfile;
  setProfile: React.Dispatch<React.SetStateAction<HealthProfile>>;
  medicines: Medicine[];
  vitals: Vital[];
  appointments: Appointment[];
  logs: MedicineLog[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  setLogs: React.Dispatch<React.SetStateAction<MedicineLog[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setVitals: React.Dispatch<React.SetStateAction<Vital[]>>;
  setJournal: React.Dispatch<React.SetStateAction<any[]>>;
  setReports: React.Dispatch<React.SetStateAction<any[]>>;
  setReminders: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SettingsView({ 
  profile, setProfile, medicines, vitals, appointments, logs,
  setMedicines, setLogs, setAppointments, setVitals, setJournal, setReports, setReminders
}: SettingsProps) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('medicare_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      weight_unit: 'kg',
      temp_unit: '°C',
      time_format: '12h',
      sound_enabled: true,
      notifications_enabled: true,
      quiet_hours_enabled: false
    };
  });

  const [importStatus, setImportStatus] = useState('');

  const updateSetting = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('medicare_settings', JSON.stringify(updated));
    
    // Quick theme class modifications
    if (key === 'theme') {
      if (value === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.style.setProperty('--color-dark-bg', '#F3F4F6');
        document.documentElement.style.setProperty('--color-card-bg', '#FFFFFF');
        document.documentElement.style.setProperty('--color-main-text', '#111827');
        document.documentElement.style.setProperty('--color-sub-text', '#4B5563');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.style.setProperty('--color-dark-bg', '#1A1A2E');
        document.documentElement.style.setProperty('--color-card-bg', '#16213E');
        document.documentElement.style.setProperty('--color-main-text', '#EAEAEA');
        document.documentElement.style.setProperty('--color-sub-text', '#A0A0B0');
      }
    }
    alert(`Setting changed: ${key.toUpperCase()} set to ${value}`);
  };

  // -------------------------------------------------------------
  // DATA EXPORTS LOGIC (Browser blob CSV files!)
  // -------------------------------------------------------------
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    if (data.length === 0) {
      alert(`Export canceled: The requested database is currently empty.`);
      return;
    }

    const csvRows = [headers.join(',')];
    data.forEach(item => {
      const values = headers.map(header => {
        const val = item[header];
        if (val === undefined || val === null) return '';
        // If it's an array or nested object, encode cleanly
        const strVal = typeof val === 'object' ? JSON.stringify(val).replace(/"/g, '""') : String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMedicines = () => {
    exportToCSV(medicines, 'medicines', ['id', 'name', 'type', 'dosage', 'frequency', 'meal_relation', 'start_date', 'end_date', 'is_active', 'notes']);
  };

  const handleExportVitals = () => {
    exportToCSV(vitals, 'vitals_bio', ['id', 'type', 'value1', 'value2', 'unit', 'reading_time', 'notes', 'date']);
  };

  const handleExportAppointments = () => {
    exportToCSV(appointments, 'appointments', ['id', 'doctor_name', 'specialization', 'hospital', 'date', 'time', 'type', 'status', 'notes']);
  };

  const handleExportComplianceLogs = () => {
    exportToCSV(logs, 'compliance_logs', ['id', 'medicine_id', 'scheduled_time', 'taken_time', 'status', 'date', 'notes']);
  };

  // Printable full medical report
  const handlePrintFullReport = () => {
    window.print();
  };


  // -------------------------------------------------------------
  // MEDICINES IMPORT SIMULATION
  // -------------------------------------------------------------
  const handleImportMedicines = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Parsing file...');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        if (lines.length <= 1) {
          throw new Error('CSV is empty or missing headers.');
        }

        const newMeds: Medicine[] = [];
        // Basic parser
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Split loosely by comma, stripping quotes
          const cols = line.split(',').map(c => c.replace(/^"(.*)"$/, '$1').trim());
          if (cols.length < 5) continue;

          newMeds.push({
            id: Math.max(...medicines.map(m => m.id), 0) + i,
            name: cols[1] || 'Imported Compound',
            type: cols[2] || 'Tablet',
            dosage: cols[3] || '5mg',
            frequency: cols[4] || 'Daily',
            times: ['08:00'],
            meal_relation: cols[5] || 'With Meal',
            start_date: cols[6] || new Date().toISOString().split('T')[0],
            end_date: cols[7] || '2026-12-31',
            notes: cols[9] || 'Imported configuration.',
            color: '#2ECC71',
            refill_alert_days: 7,
            is_active: cols[8] === 'true' || cols[8] === '1',
            created_at: new Date().toISOString()
          });
        }

        if (newMeds.length === 0) {
          throw new Error('No valid medicine rows parsed.');
        }

        const updated = [...medicines, ...newMeds];
        setMedicines(updated);
        localStorage.setItem('medicare_medicines', JSON.stringify(updated));
        setImportStatus(`Success! Successfully loaded ${newMeds.length} medicines into schedule.`);
        setTimeout(() => setImportStatus(''), 5000);
      } catch (err: any) {
        setImportStatus(`Failed to import: ${err.message}`);
        setTimeout(() => setImportStatus(''), 5000);
      }
    };
    reader.readAsText(file);
  };


  // -------------------------------------------------------------
  // DANGER WIPE DATABASE RESET
  // -------------------------------------------------------------
  const handleResetApplication = () => {
    const confirmation = window.confirm('DANGER ACTION: Are you sure you wish to wipe the entire local database? This deletes all body vitals, schedules, medication history logs, and profile records permanently. This cannot be undone.');
    if (!confirmation) return;

    localStorage.clear();
    alert('Database successfully wiped! Refreshing the platform to default settings. The default demo data will be seeded.');
    window.location.reload();
  };

  // Simulating backup and restore
  const handleBackupDatabase = () => {
    const state = {
      profile, medicines, vitals, appointments, logs, settings
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `medicare_database_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  return (
    <div className="space-y-6" id="settings-tab">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#EAEAEA]">MediCare+ Control Panel</h1>
        <p className="text-sm text-[#A0A0B0]">Configure localized body metrics, perform secure backups, and manage CSV interoperability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: System Toggles & Layout Options */}
        <div className="bg-[#16213E] rounded-xl p-5 border border-teal-primary/10 space-y-5 select-none">
          <h3 className="text-base font-bold text-[#EAEAEA] pb-2 border-b border-slate-800 flex items-center gap-1.5">
            <Settings className="w-5 h-5 text-emerald-400" /> System Unit Adjustments
          </h3>

          {/* Theme Switcher Toggle */}
          <div className="flex justify-between items-center text-sm">
            <div>
              <h4 className="font-bold text-[#EAEAEA]">Visual Aesthetics Theme</h4>
              <p className="text-xs text-[#A0A0B0] mt-0.5">Toggle between eyesafe dark and clinical layouts</p>
            </div>
            <div className="flex bg-[#1A1A2E] p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => updateSetting('theme', 'dark')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition ${settings.theme === 'dark' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'}`}
              >
                Dark Mode
              </button>
              <button 
                onClick={() => updateSetting('theme', 'light')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition ${settings.theme === 'light' ? 'bg-[#0D6E6E] text-white shadow-sm' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'}`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Weight Indicator Switch */}
          <div className="flex justify-between items-center text-sm">
            <div>
              <h4 className="font-bold text-[#EAEAEA]">Body Mass Indicators</h4>
              <p className="text-xs text-[#A0A0B0] mt-0.5">Measurement scale representation units</p>
            </div>
            <div className="flex bg-[#1A1A2E] p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => updateSetting('weight_unit', 'kg')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition ${settings.weight_unit === 'kg' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'}`}
              >
                kg (Metric)
              </button>
              <button 
                onClick={() => updateSetting('weight_unit', 'lbs')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition ${settings.weight_unit === 'lbs' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'}`}
              >
                lbs
              </button>
            </div>
          </div>

          {/* Temperature Selector */}
          <div className="flex justify-between items-center text-sm">
            <div>
              <h4 className="font-bold text-[#EAEAEA]">Thermal Indicators</h4>
              <p className="text-xs text-[#A0A0B0] mt-0.5">Fever thermal representation</p>
            </div>
            <div className="flex bg-[#1A1A2E] p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => updateSetting('temp_unit', '°C')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition ${settings.temp_unit === '°C' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'}`}
              >
                °C (Celsius)
              </button>
              <button 
                onClick={() => updateSetting('temp_unit', '°F')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition ${settings.temp_unit === '°F' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'}`}
              >
                °F
              </button>
            </div>
          </div>

          {/* Time format Toggle */}
          <div className="flex justify-between items-center text-sm">
            <div>
              <h4 className="font-bold text-[#EAEAEA]">Hourly System Displays</h4>
              <p className="text-xs text-[#A0A0B0] mt-0.5">Shorthand notation or standard 24h clocks</p>
            </div>
            <div className="flex bg-[#1A1A2E] p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => updateSetting('time_format', '12h')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition ${settings.time_format === '12h' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0]'}`}
              >
                12h AM/PM
              </button>
              <button 
                onClick={() => updateSetting('time_format', '24h')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition ${settings.time_format === '24h' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0]'}`}
              >
                Military 24h
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Data Transfer, Imports & Backup */}
        <div className="bg-[#16213E] rounded-xl p-5 border border-teal-primary/10 space-y-4">
          <h3 className="text-base font-bold text-[#EAEAEA] pb-2 border-b border-slate-800 flex items-center gap-1.5">
            <Database className="w-5 h-5 text-coral-accent" /> Data Sharing Options
          </h3>

          <div className="space-y-2 text-xs">
            <span className="font-mono font-bold uppercase text-[#A0A0B0]">Export to spreadsheet formats:</span>
            <div className="grid grid-cols-2 gap-2 text-center" id="settings-csv-exports">
              <button 
                onClick={handleExportMedicines}
                className="p-2 bg-slate-800 text-sans hover:bg-slate-700 hover:text-white transition rounded-lg text-[11px] font-bold text-[#EAEAEA] border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Export Medicines
              </button>
              <button 
                onClick={handleExportVitals}
                className="p-2 bg-slate-800 text-sans hover:bg-slate-700 hover:text-white transition rounded-lg text-[11px] font-bold text-[#EAEAEA] border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Export Bio Vitals
              </button>
              <button 
                onClick={handleExportAppointments}
                className="p-2 bg-slate-800 text-sans hover:bg-slate-700 hover:text-white transition rounded-lg text-[11px] font-bold text-[#EAEAEA] border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 inline mr-1 text-coral-accent" /> Export Clinics
              </button>
              <button 
                onClick={handleExportComplianceLogs}
                className="p-2 bg-slate-800 text-sans hover:bg-slate-700 hover:text-white transition rounded-lg text-[11px] font-bold text-[#EAEAEA] border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 inline mr-1 text-[#F39C12]" /> Export Logs
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={handlePrintFullReport}
              className="w-full bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Print Full Bio-Medical Report (PDF)
            </button>
          </div>

          {/* Import CSV */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold uppercase text-[#A0A0B0]">Import Medication Inventory (CSV)</span>
            <div className="flex gap-2">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleImportMedicines}
                className="hidden" 
                id="csv-file-import-btn"
              />
              <label 
                htmlFor="csv-file-import-btn"
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-[#EAEAEA] border border-slate-700 text-center py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1"
              >
                <Upload className="w-4 h-4 text-emerald-400" /> Select Medicines CSV
              </label>
            </div>
            {importStatus && <p className="text-[10px] text-emerald-400 font-bold font-mono mt-1 text-center">{importStatus}</p>}
          </div>
        </div>
      </div>

      {/* Danger Zone Controls and Backup Database */}
      <div className="bg-[#16213E] rounded-xl p-5 border border-red-500/10 space-y-4">
        <h3 className="text-base font-bold text-[#FF6B6B] pb-2 border-b border-red-500/15 flex items-center gap-1.5">
          <ShieldAlert className="w-5 h-5 text-[#FF6B6B]" /> System Diagnostics & Maintenance
        </h3>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div>
            <h4 className="font-bold text-[#EAEAEA]">Local Database Maintenance Backup</h4>
            <p className="text-[#A0A0B0] mt-1">Download a completely raw JSON dump of your local MediCare+ database configuration to load later.</p>
          </div>
          <button 
            type="button"
            onClick={handleBackupDatabase}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#EAEAEA] rounded-lg transition shrink-0 font-bold border border-slate-700"
          >
            Backup Local DB
          </button>
        </div>

        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div>
            <h4 className="font-bold text-[#FF6B6B]">Factory Reset Database Wipes</h4>
            <p className="text-[#A0A0B0] mt-1">Wipes local browser storage caches completely and returns to default demo state.</p>
          </div>
          <button 
            onClick={handleResetApplication}
            className="px-4 py-2 bg-[#FF6B6B]/15 hover:bg-[#FF6B6B] text-coral-accent hover:text-white rounded-lg transition shrink-0 font-bold border border-[#FF6B6B]/30"
          >
            Reset Application
          </button>
        </div>
      </div>

      {/* About Box */}
      <div className="bg-[#16213E] p-5 rounded-xl border border-teal-primary/10 select-none text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Info className="w-5 h-5 text-emerald-400" />
          <h4 className="font-bold text-sm text-[#EAEAEA]">About MediCare+ Desktop Application</h4>
        </div>
        <p className="text-xs text-[#A0A0B0] max-w-lg mx-auto leading-relaxed">
          MediCare+ is designed for active biomedical tracks, compliance scheduling, and diagnostics log preservation. Developed originally for custom cross-platform Tkinter interfaces, integrated here for web previews.
        </p>
        <div className="text-[10px] text-[#A0A0B0]/70 font-mono mt-3">
          Version 1.4.0 (Stable release) • Apache-2.0 License • 2026 Medicare Systems Corp.
        </div>
      </div>
    </div>
  );
}
