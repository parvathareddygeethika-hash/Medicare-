/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  User, Activity, FileText, BookOpen, AlertCircle, Trash2, Plus, 
  File, Heart, Check, Trash, Smile, Frown, LogIn, ChevronDown, Sparkles, X
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea 
} from 'recharts';
import { HealthProfile, Vital, LabReport, HealthNote } from '../types';

interface HealthRecordsProps {
  profile: HealthProfile;
  setProfile: React.Dispatch<React.SetStateAction<HealthProfile>>;
  vitals: Vital[];
  setVitals: React.Dispatch<React.SetStateAction<Vital[]>>;
  reports: LabReport[];
  setReports: React.Dispatch<React.SetStateAction<LabReport[]>>;
  journal: HealthNote[];
  setJournal: React.Dispatch<React.SetStateAction<HealthNote[]>>;
  openSetupType?: string;
}

export default function HealthRecords({ 
  profile, setProfile, vitals, setVitals, reports, setReports, journal, setJournal, openSetupType 
}: HealthRecordsProps) {
  // Tabs: profile | vitals | reports | journal
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'vitals' | 'reports' | 'journal'>(() => {
    if (openSetupType === 'vital') return 'vitals';
    return 'vitals'; // Default to Vitals as it has gorgeous charts!
  });

  // -------------------------------------------------------------
  // PROFILE SUB-TAB LOGIC & FORMS
  // -------------------------------------------------------------
  const [profName, setProfName] = useState(profile.name);
  const [profAge, setProfAge] = useState(String(profile.age));
  const [profGender, setProfGender] = useState(profile.gender);
  const [profBloodType, setProfBloodType] = useState(profile.blood_type);
  const [profHeight, setProfHeight] = useState(String(profile.height));
  const [profWeight, setProfWeight] = useState(String(profile.weight));
  const [profContact, setProfContact] = useState(profile.emergency_contact);
  const [profPhone, setProfPhone] = useState(profile.emergency_phone);
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  // Calculate body mass index
  const bmiInfo = useMemo(() => {
    const hM = Number(profHeight) / 100;
    const wK = Number(profWeight);
    if (!hM || !wK) return { value: 0, category: 'N/A', color: 'text-[#A0A0B0]' };
    
    const bmi = wK / (hM * hM);
    const value = Math.round(bmi * 10) / 10;
    
    let category = 'Normal';
    let color = 'text-[#2ECC71]';
    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-blue-400';
    } else if (bmi >= 25 && bmi < 29.9) {
      category = 'Overweight';
      color = 'text-[#F39C12]';
    } else if (bmi >= 30) {
      category = 'Obese';
      color = 'text-[#FF6B6B] animate-pulse';
    }
    return { value, category, color };
  }, [profHeight, profWeight]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: HealthProfile = {
      ...profile,
      name: profName,
      age: Number(profAge),
      gender: profGender,
      blood_type: profBloodType,
      height: Number(profHeight),
      weight: Number(profWeight),
      emergency_contact: profContact,
      emergency_phone: profPhone
    };
    setProfile(updated);
    localStorage.setItem('medicare_profile', JSON.stringify(updated));
    alert('Health Profile updated successfully!');
  };

  const handleAddAllergy = () => {
    if (!allergyInput.trim()) return;
    const updated = { ...profile, allergies: [...profile.allergies, allergyInput.trim()] };
    setProfile(updated);
    localStorage.setItem('medicare_profile', JSON.stringify(updated));
    setAllergyInput('');
  };

  const handleRemoveAllergy = (index: number) => {
    const updatedAllergies = profile.allergies.filter((_, idx) => idx !== index);
    const updated = { ...profile, allergies: updatedAllergies };
    setProfile(updated);
    localStorage.setItem('medicare_profile', JSON.stringify(updated));
  };

  const handleAddCondition = () => {
    if (!conditionInput.trim()) return;
    const updated = { ...profile, conditions: [...profile.conditions, conditionInput.trim()] };
    setProfile(updated);
    localStorage.setItem('medicare_profile', JSON.stringify(updated));
    setConditionInput('');
  };

  const handleRemoveCondition = (index: number) => {
    const updatedConditions = profile.conditions.filter((_, idx) => idx !== index);
    const updated = { ...profile, conditions: updatedConditions };
    setProfile(updated);
    localStorage.setItem('medicare_profile', JSON.stringify(updated));
  };


  // -------------------------------------------------------------
  // VITALS SUB-TAB LOGIC (Charts & Logging)
  // -------------------------------------------------------------
  const [selectedVitalType, setSelectedVitalType] = useState<'bp' | 'sugar' | 'heart_rate' | 'weight' | 'temp' | 'spo2'>('bp');
  
  // Vital Form Fields
  const [vitalVal1, setVitalVal1] = useState('');
  const [vitalVal2, setVitalVal2] = useState(''); // Only for BP diastolic
  const [vitalNotes, setVitalNotes] = useState('');

  // Handle Vital Logging
  const handleLogVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalVal1) return;

    let unit = 'mmHg';
    if (selectedVitalType === 'sugar') unit = 'mg/dL';
    if (selectedVitalType === 'heart_rate') unit = 'bpm';
    if (selectedVitalType === 'weight') unit = 'kg';
    if (selectedVitalType === 'temp') unit = '°C';
    if (selectedVitalType === 'spo2') unit = '%';

    const now = new Date();
    const newVital: Vital = {
      id: Math.max(...vitals.map(v => v.id), 0) + 1,
      type: selectedVitalType,
      value1: Number(vitalVal1),
      value2: vitalVal2 ? Number(vitalVal2) : undefined,
      unit,
      reading_time: now.toISOString().replace('Z', '').split('.')[0],
      notes: vitalNotes,
      date: now.toISOString().split('T')[0]
    };

    const updated = [...vitals, newVital];
    setVitals(updated);
    localStorage.setItem('medicare_vitals', JSON.stringify(updated));
    
    // Reset inputs
    setVitalVal1('');
    setVitalVal2('');
    setVitalNotes('');
    alert(`${selectedVitalType.toUpperCase()} logged successfully!`);
  };

  const handleDeleteVital = (id: number) => {
    const updated = vitals.filter(v => v.id !== id);
    setVitals(updated);
    localStorage.setItem('medicare_vitals', JSON.stringify(updated));
  };

  // Prepare Chart Vitals data
  const chartData = useMemo(() => {
    // Filter by type, sort by reading_time asc, limit to last 30
    const filtered = vitals
      .filter(v => v.type === selectedVitalType)
      .sort((a, b) => a.reading_time.localeCompare(b.reading_time))
      .slice(-30);

    return filtered.map(v => {
      // For line-plots, we'll format date beautifully
      const cleanDate = new Date(v.reading_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: cleanDate,
        value: v.value1,
        systolic: selectedVitalType === 'bp' ? v.value1 : undefined,
        diastolic: selectedVitalType === 'bp' ? v.value2 : undefined,
        notes: v.notes,
        fullTime: v.reading_time
      };
    });
  }, [vitals, selectedVitalType]);

  // Vitals Ranges Specifications (Normal / Critical Zones for graphics)
  const ranges = useMemo(() => {
    switch (selectedVitalType) {
      case 'bp':
        return { normalSys: 120, warningSys: 135, normalDia: 80, warningDia: 85 };
      case 'sugar':
        return { low: 70, target: 100, warningHigh: 125 };
      case 'heart_rate':
        return { min: 60, max: 100 };
      case 'temp':
        return { min: 36.1, max: 37.2 };
      case 'spo2':
        return { min: 95 };
      default:
        return {};
    }
  }, [selectedVitalType]);


  // -------------------------------------------------------------
  // LAB REPORTS SUB-TAB LOGIC (Upload / Listing)
  // -------------------------------------------------------------
  const [reportTitle, setReportTitle] = useState('');
  const [reportDoc, setReportDoc] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportFile, setReportFile] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  const handleUploadReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle) return;

    const newReport: LabReport = {
      id: Math.max(...reports.map(r => r.id), 0) + 1,
      title: reportTitle,
      date: reportDate,
      doctor: reportDoc || 'Self-logged',
      file_path: reportFile || 'scanned_report.pdf',
      notes: reportNotes,
      created_at: new Date().toISOString()
    };

    const updated = [...reports, newReport];
    setReports(updated);
    localStorage.setItem('medicare_reports', JSON.stringify(updated));

    // Reset Form fields
    setReportTitle('');
    setReportDoc('');
    setReportFile('');
    setReportNotes('');
    alert('Lab Report registered successfully in vault.');
  };


  // -------------------------------------------------------------
  // JOURNAL LOGIC (Mood tracking, Symptom clouds, Timeline)
  // -------------------------------------------------------------
  const [journalMood, setJournalMood] = useState(3); // 1-5
  const [journalSymptoms, setJournalSymptoms] = useState<string[]>([]);
  const [journalNoteText, setJournalNoteText] = useState('');

  const availableSymptoms = ['No Symptoms', 'Headache', 'Dizziness', 'Fatigue', 'Chest Tightness', 'Nausea', 'Restless', 'Anxious', 'Muscle Ache', 'Palpitations'];

  const toggleSymptomTag = (sym: string) => {
    if (journalSymptoms.includes(sym)) {
      setJournalSymptoms(journalSymptoms.filter(s => s !== sym));
    } else {
      setJournalSymptoms([...journalSymptoms, sym]);
    }
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const newNote: HealthNote = {
      id: Math.max(...journal.map(j => j.id), 0) + 1,
      date: now.toISOString().split('T')[0],
      mood: journalMood,
      symptoms: journalSymptoms.length > 0 ? journalSymptoms : ['Normal Energy'],
      note: journalNoteText,
      created_at: now.toISOString()
    };

    const updated = [newNote, ...journal]; // Put latest timeline entries on top
    setJournal(updated);
    localStorage.setItem('medicare_journal', JSON.stringify(updated));

    // Reset fields
    setJournalMood(3);
    setJournalSymptoms([]);
    setJournalNoteText('');
    alert('Congratulations on logging your health journal for today!');
  };

  const handleDeleteJournal = (id: number) => {
    const updated = journal.filter(j => j.id !== id);
    setJournal(updated);
    localStorage.setItem('medicare_journal', JSON.stringify(updated));
  };

  const getMoodEmoji = (score: number) => {
    switch (score) {
      case 1: return '😢 Tired/Ill';
      case 2: return '😐 Sluggish';
      case 3: return '🙂 Stable';
      case 4: return '😃 Energetic';
      case 5: return '🌟 Phenomenal';
      default: return '🙂';
    }
  };

  return (
    <div className="space-y-6" id="health-records-tab">
      {/* 1. Header with Tabview triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#EAEAEA]">Health Metrics Vault</h1>
          <p className="text-sm text-[#A0A0B0]">Track dynamic bio-measurements, review lab reports, update profile, and write logs</p>
        </div>

        {/* Tab view controllers */}
        <div className="flex bg-[#16213E] p-1 rounded-xl border border-teal-primary/20 flex-wrap select-none">
          <button 
            onClick={() => setActiveSubTab('vitals')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'vitals' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" /> Vitals Log
          </button>
          <button 
            onClick={() => setActiveSubTab('journal')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'journal' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" /> Daily Journal
          </button>
          <button 
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'reports' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" /> Lab Reports
          </button>
          <button 
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'profile' ? 'bg-[#0D6E6E] text-white' : 'text-[#A0A0B0] hover:text-[#EAEAEA]'
            }`}
          >
            <User className="w-4 h-4 shrink-0" /> Bio Profile
          </button>
        </div>
      </div>


      {/* 2. SUB-TAB VIEW RENDERERS */}

      {/* SUB-VIEW 1: VITALS (Matplotlib replacement inside browsers) */}
      {activeSubTab === 'vitals' && (
        <div className="space-y-6" id="vitals-subview">
          {/* Segmented type buttons */}
          <div className="flex flex-wrap gap-1.5 bg-[#16213E] p-1.5 rounded-xl border border-slate-800">
            {[
              { type: 'bp', label: 'Blood Pressure', symbol: 'mmHg' },
              { type: 'sugar', label: 'Blood Glucose', symbol: 'mg/dL' },
              { type: 'heart_rate', label: 'Heart Rate', symbol: 'bpm' },
              { type: 'weight', label: 'Weight Tracker', symbol: 'kg' },
              { type: 'temp', label: 'Temperature', symbol: '°C' },
              { type: 'spo2', label: 'Oxygen SpO2', symbol: '%' }
            ].map((vConf) => (
              <button
                key={vConf.type}
                onClick={() => {
                  setSelectedVitalType(vConf.type as any);
                  setVitalVal1('');
                  setVitalVal2('');
                }}
                className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition shrink-0 ${
                  selectedVitalType === vConf.type 
                    ? 'bg-[#0D6E6E] text-white font-extrabold' 
                    : 'text-[#A0A0B0] hover:bg-[#1A1A2E] hover:text-[#EAEAEA]'
                }`}
              >
                {vConf.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area - 2/3 Wide */}
            <div className="lg:col-span-2 bg-[#16213E] rounded-2xl p-5 border border-teal-primary/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold font-display text-[#EAEAEA] uppercase tracking-wider">
                      {selectedVitalType.toUpperCase()} Progress Plot
                    </h3>
                    <p className="text-xs text-[#A0A0B0] mt-0.5">Plotting last 30 logs recorded securely</p>
                  </div>
                  <div className="text-[11px] bg-slate-800 border border-slate-700 px-3 py-1 rounded-md text-emerald-400 font-mono font-bold">
                    Target Bands Engaged
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <div className="text-center py-24 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 flex flex-col justify-center items-center">
                    <Activity className="w-12 h-12 text-[#A0A0B0]/35 mb-2" />
                    <p className="text-sm text-[#A0A0B0]">No measurement entries found for {selectedVitalType.toUpperCase()}.</p>
                  </div>
                ) : (
                  <div className="w-full h-72 pr-4 text-xs font-mono select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 3, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2b4d" vertical={false} />
                        <XAxis dataKey="date" stroke="#A0A0B0" />
                        <YAxis stroke="#A0A0B0" domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#16213E', borderColor: '#0D6E6E', color: '#EAEAEA' }}
                          labelStyle={{ fontWeight: 'bold', color: '#FF6B6B' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: 10 }} />
                        
                        {/* Reference lines simulating normal / threshold bands */}
                        {selectedVitalType === 'bp' ? (
                          <>
                            <ReferenceLine y={120} label={{ value: 'Normal Sys', position: 'right', fill: '#2ECC71', fontSize: 10 }} stroke="#2ECC71" strokeDasharray="3 3" />
                            <ReferenceLine y={80} label={{ value: 'Normal Dia', position: 'right', fill: '#3498DB', fontSize: 10 }} stroke="#3498DB" strokeDasharray="3 3" />
                            <Line name="Systolic (mmHg)" type="monotone" dataKey="systolic" stroke="#FF6B6B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line name="Diastolic (mmHg)" type="monotone" dataKey="diastolic" stroke="#3498DB" strokeWidth={3} dot={{ r: 4 }} />
                          </>
                        ) : selectedVitalType === 'sugar' ? (
                          <>
                            <ReferenceLine y={100} label={{ value: 'Normal Fasting', position: 'left', fill: '#2ECC71', fontSize: 10 }} stroke="#2ECC71" strokeDasharray="3 3" />
                            <ReferenceLine y={140} label={{ value: 'Post-Meal Peak', position: 'left', fill: '#F39C12', fontSize: 10 }} stroke="#F39C12" strokeDasharray="3 3" />
                            <Line name="Glucose (mg/dL)" type="monotone" dataKey="value" stroke="#0D6E6E" strokeWidth={3} dot={{ r: 4 }} />
                          </>
                        ) : selectedVitalType === 'spo2' ? (
                          <>
                            <ReferenceLine y={95} label={{ value: 'Critical Threshold', position: 'left', fill: '#FF6B6B', fontSize: 10 }} stroke="#FF6B6B" strokeDasharray="3 3" />
                            <Line name="SpO2 (%)" type="monotone" dataKey="value" stroke="#2ECC71" strokeWidth={3} dot={{ r: 4 }} />
                          </>
                        ) : (
                          <Line name={selectedVitalType.toUpperCase()} type="monotone" dataKey="value" stroke="#F39C12" strokeWidth={3} dot={{ r: 4 }} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Threshold indicator notes */}
              <div className="mt-4 p-3 bg-[#1A1A2E] rounded-xl border border-slate-800 flex justify-between gap-4 text-xs">
                <span className="flex items-center gap-1 text-[#A0A0B0]">
                  <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Target values display dynamic reference boundaries depending on the specific vital type selected.
                </span>
              </div>
            </div>

            {/* Logger Form Area - 1/3 Wide */}
            <div className="bg-[#16213E] rounded-2xl p-5 border border-teal-primary/10 select-none">
              <h3 className="text-base font-bold font-display text-[#EAEAEA] mb-4">Log New Reading</h3>
              <form onSubmit={handleLogVital} className="space-y-4 text-sm">
                
                {selectedVitalType === 'bp' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Systolic *</label>
                      <input 
                        type="number"
                        required
                        placeholder="e.g. 120"
                        value={vitalVal1}
                        onChange={(e) => setVitalVal1(e.target.value)}
                        className="w-full bg-[#1A1A2E] text-[#EAEAEA] p-2.5 rounded-lg border border-teal-primary/20 text-center font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Diastolic *</label>
                      <input 
                        type="number"
                        required
                        placeholder="e.g. 80"
                        value={vitalVal2}
                        onChange={(e) => setVitalVal2(e.target.value)}
                        className="w-full bg-[#1A1A2E] text-[#EAEAEA] p-2.5 rounded-lg border border-teal-primary/20 text-center font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">
                      {selectedVitalType === 'sugar' ? 'Glucose Reading (mg/dL) *' : 
                       selectedVitalType === 'heart_rate' ? 'Pulse (bpm) *' : 
                       selectedVitalType === 'weight' ? 'Weight measurement (kg) *' : 
                       selectedVitalType === 'temp' ? 'Temperature (°C) *' : 'SpO2 Saturation (%) *'}
                    </label>
                    <input 
                      type="number"
                      required
                      step="any"
                      placeholder={`Enter ${selectedVitalType.toUpperCase()} value`}
                      value={vitalVal1}
                      onChange={(e) => setVitalVal1(e.target.value)}
                      className="w-full bg-[#1A1A2E] text-[#EAEAEA] p-2.5 rounded-lg border border-teal-primary/20 font-bold focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Symptoms / Reading Context</label>
                  <input 
                    type="text"
                    placeholder="e.g. Fasting, rest state, feeling slight fever"
                    value={vitalNotes}
                    onChange={(e) => setVitalNotes(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] p-2.5 rounded-lg border border-teal-primary/20 text-xs text-sans focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 text-xs uppercase tracking-wider shadow"
                >
                  <Plus className="w-4 h-4" /> Save Vital Entry
                </button>
              </form>
            </div>
          </div>

          {/* History Records Table */}
          <div className="bg-[#16213E] rounded-2xl p-5 border border-teal-primary/10">
            <h3 className="text-base font-bold font-display text-[#EAEAEA] mb-3">Measurement History Database</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1A1A2E] text-[#A0A0B0] border-b border-slate-800 uppercase tracking-wider font-mono">
                    <th className="p-3.5">Reading Type</th>
                    <th className="p-3.5">Measurement Value</th>
                    <th className="p-3.5">Logged Date & Time</th>
                    <th className="p-3.5">Clinical Context</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-sans">
                  {vitals.filter(v => v.type === selectedVitalType).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#A0A0B0]">
                        No logged events registered for this metric.
                      </td>
                    </tr>
                  ) : (
                    vitals
                      .filter(v => v.type === selectedVitalType)
                      .sort((a, b) => b.reading_time.localeCompare(a.reading_time))
                      .map((vit) => (
                        <tr key={vit.id} className="hover:bg-slate-800/35 transition">
                          <td className="p-3.5 font-bold uppercase text-emerald-400">{vit.type}</td>
                          <td className="p-3.5 font-mono font-bold text-sm">
                            {vit.value1} {vit.value2 ? ` / ${vit.value2}` : ''} <span className="text-xs text-[#A0A0B0] font-normal">{vit.unit}</span>
                          </td>
                          <td className="p-3.5 font-mono text-[#A0A0B0]">{vit.reading_time.replace('T', ' ')}</td>
                          <td className="p-3.5 italic text-[#EAEAEA]">{vit.notes || 'Routine follow-up'}</td>
                          <td className="p-3.5 text-center">
                            <button 
                              onClick={() => handleDeleteVital(vit.id)}
                              className="p-1 px-2.5 rounded hover:bg-red-500/10 text-[#A0A0B0] hover:text-[#FF6B6B]"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* SUB-VIEW 2: JOURNAL (timeline of daily moods and tags) */}
      {activeSubTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="journal-subview">
          {/* Create timeline entry */}
          <div className="bg-[#16213E] rounded-2xl p-5 border border-teal-primary/10 h-fit">
            <h3 className="text-base font-bold font-display text-[#EAEAEA] mb-4 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Wavelength Mood Journal
            </h3>
            
            <form onSubmit={handleSaveJournal} className="space-y-5 text-sm select-none">
              {/* Mood meter with dynamic scores */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-2">How do you feel today? *</label>
                <div className="flex justify-between items-center bg-[#1A1A2E] p-3 rounded-xl border border-slate-800">
                  <span className="text-lg font-bold text-emerald-400 font-display">Mood score:</span>
                  <span className="text-sm font-bold font-display px-2.5 py-1 bg-[#0D6E6E]/20 text-emerald-400 rounded-lg">{getMoodEmoji(journalMood)}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5"
                  required
                  value={journalMood}
                  onChange={(e) => setJournalMood(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 mt-2.5"
                />
              </div>

              {/* Symptom Tag select */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1.5">Symptom Checklist / Observations</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableSymptoms.map((sym) => {
                    const active = journalSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptomTag(sym)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-full font-bold border transition ${
                          active 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                            : 'bg-slate-800 text-[#A0A0B0] border-slate-700 hover:text-[#EAEAEA]'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note text box */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Daily Log / Observations</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record food notes, sleep cycles, activity levels, or stress factors..."
                  value={journalNoteText}
                  onChange={(e) => setJournalNoteText(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] p-3 rounded-xl border border-teal-primary/20 focus:outline-none focus:border-[#0D6E6E]"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white font-bold py-2.5 rounded-xl transition text-xs uppercase tracking-wider text-center"
              >
                Log Journal Entry
              </button>
            </form>
          </div>

          {/* Timeline Feed - 2/3 Wide */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold font-display text-[#EAEAEA] uppercase tracking-wider">Historical Timeline logs</h3>

            {journal.length === 0 ? (
              <div className="text-center py-20 bg-[#16213E] rounded-xl border border-dashed border-slate-800">
                <BookOpen className="w-12 h-12 text-[#A0A0B0]/40 mx-auto mb-2" />
                <p className="text-[#A0A0B0] text-sm">No journal updates recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {journal.map((item) => (
                  <div key={item.id} className="p-5 bg-[#16213E] border border-teal-primary/10 rounded-2xl relative block hover:border-[#0D6E6E]/30 transition pb-4">
                    <button 
                      onClick={() => handleDeleteJournal(item.id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-red-500/15 text-[#A0A0B0] hover:text-[#FF6B6B] transition"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-800 px-2 rounded border border-slate-700">{item.date}</span>
                      <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">{getMoodEmoji(item.mood)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {item.symptoms.map((sym, idx) => (
                        <span key={idx} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[#A0A0B0]">
                          {sym}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm mt-3 text-[#EAEAEA] leading-relaxed italic bg-[#1A1A2E]/55 p-3 rounded-xl border border-teal-primary/5">
                      "{item.note}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* SUB-VIEW 3: LAB REPORTS (scanned pdf folder) */}
      {activeSubTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="reports-subview">
          
          {/* File scan uploader */}
          <div className="bg-[#16213E] p-5 rounded-xl border border-teal-primary/10 h-fit">
            <h3 className="text-base font-bold text-[#EAEAEA] mb-4">Register Lab Scans</h3>
            <form onSubmit={handleUploadReport} className="space-y-4 text-sm text-[#EAEAEA]">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Report Description Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Lipid Blood Panel, Hemoglobin A1c"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Physician / Doctor name</label>
                <input 
                  type="text"
                  placeholder="e.g. Dr. Thomas Evelyn"
                  value={reportDoc}
                  onChange={(e) => setReportDoc(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Reading Scan Date</label>
                <input 
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Scanned Report Document</label>
                <input 
                  type="text"
                  placeholder="e.g. lipid_report_june2026.pdf"
                  value={reportFile}
                  onChange={(e) => setReportFile(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 border border-teal-primary/20 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-[#A0A0B0] mt-1.5 block">Simulate report filenames to archive PDFs neatly.</span>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Personal Diagnostics / Notes</label>
                <textarea 
                  rows={2}
                  placeholder="Key summaries like Cholesterol: 198, Triglycerides: 145"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white font-bold py-2.5 rounded-xl transition text-xs uppercase tracking-wider text-center"
              >
                Register File
              </button>
            </form>
          </div>

          {/* List of attachments */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold font-display text-[#EAEAEA] uppercase tracking-wider">Lab Chest Vault</h3>

            {reports.length === 0 ? (
              <div className="text-center py-20 bg-[#16213E] rounded-xl border border-dashed border-slate-800">
                <FileText className="w-12 h-12 text-[#A0A0B0]/30 mx-auto mb-2" />
                <p className="text-[#A0A0B0] text-sm">No report records verified in chest.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reports.map((rep) => (
                  <div key={rep.id} className="bg-[#16213E] p-4 rounded-xl border border-teal-primary/10 hover:border-emerald-500/20 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-[#FF6B6B]/10 rounded-xl text-coral-accent border border-[#FF6B6B]/25">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-[#EAEAEA] leading-snug line-clamp-1">{rep.title}</h4>
                          <p className="text-xs text-[#A0A0B0] mt-0.5">Signed by: <strong className="text-emerald-400">{rep.doctor}</strong></p>
                        </div>
                      </div>

                      <div className="space-y-1 bg-[#1A1A2E]/60 p-2.5 rounded-lg text-xs leading-relaxed italic text-[#EAEAEA] border border-teal-primary/5">
                        "{rep.notes || 'No custom metrics registered'}"
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono font-bold text-[#A0A0B0]">
                      <span>Issued: {rep.date}</span>
                      <button 
                        onClick={() => {
                          alert(`Simulating secure downloading client for file: [${rep.file_path}]. Clear connections secured.`);
                        }}
                        className="text-emerald-400 hover:underline hover:text-emerald-300 font-bold"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* SUB-VIEW 4: PROFILE SETTINGS & BMI ACTIONS */}
      {activeSubTab === 'profile' && (
        <div className="bg-[#16213E] rounded-xl p-6 border border-teal-primary/10 grid grid-cols-1 md:grid-cols-3 gap-6" id="profile-subview">
          
          {/* Main Edit Bio Form - 2/3 Wide */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-base font-bold font-display text-[#EAEAEA] pb-2 border-b border-slate-800">Biometric Health Profile</h3>
            <form onSubmit={handleSaveProfile} className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Full Patient Name *</label>
                <input 
                  type="text" 
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 text-sans focus:outline-none focus:border-[#0D6E6E]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Patient Age (Years) *</label>
                <input 
                  type="number" 
                  required
                  value={profAge}
                  onChange={(e) => setProfAge(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 text-mono focus:outline-none focus:border-[#0D6E6E]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Gender Identification</label>
                <select 
                  value={profGender}
                  onChange={(e) => setProfGender(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-[#0D6E6E]/20"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Blood Type Category</label>
                <select 
                  value={profBloodType}
                  onChange={(e) => setProfBloodType(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-[#0D6E6E]/20"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Height (cm) *</label>
                <input 
                  type="number" 
                  required
                  value={profHeight}
                  onChange={(e) => setProfHeight(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 text-center font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Weight (kg) *</label>
                <input 
                  type="number" 
                  required
                  value={profWeight}
                  onChange={(e) => setProfWeight(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 text-center font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Emergency contact name *</label>
                <input 
                  type="text" 
                  required
                  value={profContact}
                  onChange={(e) => setProfContact(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Emergency phone *</label>
                <input 
                  type="text" 
                  required
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 font-mono"
                />
              </div>

              <div className="col-span-2 pt-3">
                <button 
                  type="submit"
                  className="bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white font-bold py-2 px-6 rounded-xl transition text-xs uppercase tracking-wider shadow"
                >
                  Save Demographics
                </button>
              </div>
            </form>
          </div>

          {/* Right Metrics / BMI Card - 1/3 Wide */}
          <div className="space-y-6">
            <h3 className="text-base font-bold font-display text-[#EAEAEA] pb-2 border-b border-slate-800">Biometric Calculation</h3>
            
            {/* BMI visual block */}
            <div className="bg-[#1A1A2E] p-4 rounded-xl border border-teal-primary/10 space-y-2.5 text-center select-none">
              <span className="text-[11px] uppercase tracking-wider text-[#A0A0B0] font-bold">Body Mass Index (BMI)</span>
              
              <h2 className="text-4xl font-extrabold font-mono text-[#EAEAEA] py-2">
                {bmiInfo.value || 'N/A'}
              </h2>
              
              <div className={`text-sm font-bold ${bmiInfo.color}`}>
                Category: {bmiInfo.category}
              </div>

              {/* Slider simulation of healthy weights */}
              <div className="w-full bg-slate-800 h-1 rounded overflow-hidden mt-3 text-center">
                <div 
                  className="bg-emerald-500 h-1 transition-all" 
                  style={{ width: `${bmiInfo.value ? Math.min((bmiInfo.value / 40) * 100, 100) : 0}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-[#A0A0B0] block text-center">Computed instantly from weight and heights</span>
            </div>

            {/* Allergies & Conditions input bubbles */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1.5 font-display">Allergies Vault</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Add e.g. Penicillin"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    className="flex-1 bg-[#1A1A2E] text-xs text-[#EAEAEA] px-2.5 py-1.5 rounded-lg border border-slate-800 text-sans focus:outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleAddAllergy}
                    className="p-1 px-3 bg-[#0D6E6E] rounded-lg text-white hover:bg-[#0D6E6E]/90 font-bold text-xs"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile.allergies.map((allergy, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-red-500/10 border border-red-500/25 rounded-md px-2 py-0.5 text-[#FF6B6B] font-bold">
                      {allergy} <button type="button" onClick={() => handleRemoveAllergy(idx)} className="hover:text-white shrink-0"><X className="w-3 h-3 stroke-[2.5]" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1.5 font-display">Chronic Conditions</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Add e.g. Asthma"
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    className="flex-1 bg-[#1A1A2E] text-xs text-[#EAEAEA] px-2.5 py-1.5 rounded-lg border border-slate-800 text-sans focus:outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleAddCondition}
                    className="p-1 px-3 bg-[#0D6E6E] rounded-lg text-white hover:bg-[#0D6E6E]/90 font-bold text-xs"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile.conditions.map((condition, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-slate-800 border border-slate-700 rounded-md px-2 py-0.5 text-[#EAEAEA] font-bold">
                      {condition} <button type="button" onClick={() => handleRemoveCondition(idx)} className="hover:text-white shrink-0"><X className="w-3 h-3 stroke-[2.5]" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
