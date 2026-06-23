/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Pill, Search, Edit2, Trash2, Calendar, Clock, AlertTriangle, 
  Check, X, Plus, Filter, Loader2, RefreshCw, BarChart2
} from 'lucide-react';
import { Medicine, MedicineLog } from '../types';

interface MedicineViewProps {
  medicines: Medicine[];
  logs: MedicineLog[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  setLogs: React.Dispatch<React.SetStateAction<MedicineLog[]>>;
  openFormWithDefault: boolean;
  setOpenFormWithDefault: (val: boolean) => void;
}

export default function MedicineView({ 
  medicines, logs, setMedicines, setLogs, openFormWithDefault, setOpenFormWithDefault 
}: MedicineViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterActive, setFilterActive] = useState('All'); // All | Active | Paused
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Edit / Add Form Modal State
  const [modalOpen, setModalOpen] = useState(openFormWithDefault);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Tablet');
  const [formDosage, setFormDosage] = useState('');
  const [formFrequency, setFormFrequency] = useState('Daily');
  const [formTimes, setFormTimes] = useState('08:00'); // Comma-separated for multiple
  const [formMealRelation, setFormMealRelation] = useState('With Meal');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState('2026-12-31');
  const [formNotes, setFormNotes] = useState('');
  const [formColor, setFormColor] = useState('#0D6E6E');
  const [formRefillDays, setFormRefillDays] = useState(7);

  // Open Add modal resetting fields
  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setFormName('');
    setFormType('Tablet');
    setFormDosage('');
    setFormFrequency('Daily');
    setFormTimes('08:00');
    setFormMealRelation('With Meal');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('2026-12-31');
    setFormNotes('');
    setFormColor('#0D6E6E');
    setFormRefillDays(7);
    setModalOpen(true);
    setOpenFormWithDefault(false);
  };

  // Open Edit modal filling fields
  const handleOpenEditModal = (med: Medicine, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMedicine(med);
    setFormName(med.name);
    setFormType(med.type);
    setFormDosage(med.dosage);
    setFormFrequency(med.frequency);
    setFormTimes(med.times.join(','));
    setFormMealRelation(med.meal_relation);
    setFormStartDate(med.start_date);
    setFormEndDate(med.end_date);
    setFormNotes(med.notes);
    setFormColor(med.color);
    setFormRefillDays(med.refill_alert_days);
    setModalOpen(true);
  };

  React.useEffect(() => {
    if (openFormWithDefault) {
      handleOpenAddModal();
    }
  }, [openFormWithDefault]);

  // Close Modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMedicine(null);
  };

  // Save Medicine
  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDosage) return;

    const timesArray = formTimes
      .split(',')
      .map(t => t.trim())
      .filter(t => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t)); // Basic HH:MM validation

    if (timesArray.length === 0) timesArray.push('08:00');

    if (editingMedicine) {
      // Edit
      const updated = medicines.map(m => {
        if (m.id === editingMedicine.id) {
          return {
            ...m,
            name: formName,
            type: formType,
            dosage: formDosage,
            frequency: formFrequency,
            times: timesArray,
            meal_relation: formMealRelation,
            start_date: formStartDate,
            end_date: formEndDate,
            notes: formNotes,
            color: formColor,
            refill_alert_days: Number(formRefillDays)
          };
        }
        return m;
      });
      setMedicines(updated);
      localStorage.setItem('medicare_medicines', JSON.stringify(updated));
    } else {
      // Add
      const newMed: Medicine = {
        id: Math.max(...medicines.map(m => m.id), 0) + 1,
        name: formName,
        type: formType,
        dosage: formDosage,
        frequency: formFrequency,
        times: timesArray,
        meal_relation: formMealRelation,
        start_date: formStartDate,
        end_date: formEndDate,
        notes: formNotes,
        color: formColor,
        refill_alert_days: Number(formRefillDays),
        is_active: true,
        created_at: new Date().toISOString()
      };
      const updated = [...medicines, newMed];
      setMedicines(updated);
      localStorage.setItem('medicare_medicines', JSON.stringify(updated));
    }
    handleCloseModal();
  };

  // Toggle Active/Inactive status
  const handleToggleActive = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = medicines.map(m => {
      if (m.id === id) {
        return { ...m, is_active: !m.is_active };
      }
      return m;
    });
    setMedicines(updated);
    localStorage.setItem('medicare_medicines', JSON.stringify(updated));
  };

  // Delete Medicine
  const handleDeleteMedicine = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to remove this medicine? This will delete its configurations.');
    if (!confirmed) return;

    const updated = medicines.filter(m => m.id !== id);
    setMedicines(updated);
    localStorage.setItem('medicare_medicines', JSON.stringify(updated));

    // Also purge logs corresponding to it to free up DB
    const updatedLogs = logs.filter(l => l.medicine_id !== id);
    setLogs(updatedLogs);
    localStorage.setItem('medicare_logs', JSON.stringify(updatedLogs));
  };

  // 7 Days Grid Calculation (Past 7 days)
  const getWeeklyDoseGrid = (medId: number) => {
    const grid = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = weekdays[d.getDay()];

      // Find logs for this day
      const dayLogs = logs.filter(l => l.medicine_id === medId && l.date === dStr);
      
      let status: 'taken' | 'missed' | 'skipped' | 'none' = 'none';
      if (dayLogs.length > 0) {
        if (dayLogs.some(l => l.status === 'taken')) status = 'taken';
        else if (dayLogs.some(l => l.status === 'missed')) status = 'missed';
        else if (dayLogs.some(l => l.status === 'skipped')) status = 'skipped';
      }

      grid.push({
        date: dStr,
        dayName,
        status
      });
    }
    return grid;
  };

  // Calculate Adherence rate
  const getAdherenceRate = (medId: number) => {
    const medLogs = logs.filter(l => l.medicine_id === medId);
    if (medLogs.length === 0) return 100; // Perfect by default if no sessions logged yet
    const taken = medLogs.filter(l => l.status === 'taken' || l.status === 'skipped').length;
    return Math.round((taken / medLogs.length) * 100);
  };

  // Filter & Search Logic
  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || med.type === filterType;
    let matchesActive = true;
    if (filterActive === 'Active') matchesActive = med.is_active;
    if (filterActive === 'Paused') matchesActive = !med.is_active;

    return matchesSearch && matchesType && matchesActive;
  });

  return (
    <div className="space-y-6" id="medicines-view">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#EAEAEA]">Medicine Schedule Planner</h1>
          <p className="text-sm text-[#A0A0B0]">Manage and track active prescription medicines, adherence values, and schedules</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm self-start shadow-md"
        >
          <Plus className="w-5 h-5" /> Add Medicine
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#16213E] p-4 rounded-xl border border-teal-primary/10 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#A0A0B0]" />
          <input 
            type="text" 
            placeholder="Search active compounds, brands, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1A2E] placeholder-[#A0A0B0] text-[#EAEAEA] pl-10 pr-4 py-2.5 rounded-lg border border-teal-primary/20 focus:outline-none focus:border-[#0D6E6E] text-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {/* Active status filter */}
          <div className="flex items-center gap-1.5 bg-[#1A1A2E] px-3 py-1.5 rounded-lg border border-teal-primary/20">
            <Filter className="w-4 h-4 text-[#A0A0B0]" />
            <select 
              value={filterActive} 
              onChange={(e) => setFilterActive(e.target.value)}
              className="bg-transparent text-[#EAEAEA] text-xs focus:outline-none font-bold"
            >
              <option value="All" className="bg-[#1A1A2E]">All Status</option>
              <option value="Active" className="bg-[#1A1A2E]">Active</option>
              <option value="Paused" className="bg-[#1A1A2E]">Paused</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 bg-[#1A1A2E] px-3 py-1.5 rounded-lg border border-teal-primary/20">
            <Pill className="w-4 h-4 text-[#A0A0B0]" />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-[#EAEAEA] text-xs focus:outline-none font-bold"
            >
              <option value="All" className="bg-[#1A1A2E]">All Meds</option>
              <option value="Tablet" className="bg-[#1A1A2E]">Tablets</option>
              <option value="Capsule" className="bg-[#1A1A2E]">Capsules</option>
              <option value="Syrup" className="bg-[#1A1A2E]">Syrups</option>
              <option value="Injection" className="bg-[#1A1A2E]">Injections</option>
              <option value="Drop" className="bg-[#1A1A2E]">Drops</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicines list cards */}
      <div className="space-y-4">
        {filteredMedicines.length === 0 ? (
          <div className="text-center py-16 bg-[#16213E] rounded-xl border border-dashed border-slate-800">
            <Pill className="w-16 h-16 text-[#A0A0B0]/30 mx-auto mb-4" />
            <p className="text-[#A0A0B0] text-sm">No medicine records matched your filters.</p>
            <button onClick={handleOpenAddModal} className="mt-2 text-emerald-400 text-xs font-bold hover:underline">
              Create a medicine +
            </button>
          </div>
        ) : (
          filteredMedicines.map((med) => {
            const isExpanded = expandedId === med.id;
            const adherence = getAdherenceRate(med.id);
            const weeklyGrid = getWeeklyDoseGrid(med.id);

            return (
              <div 
                key={med.id}
                onClick={() => setExpandedId(isExpanded ? null : med.id)}
                className={`bg-[#16213E] rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                  isExpanded ? 'border-[#0D6E6E]/60 shadow-xl ring-1 ring-[#0D6E6E]/10' : 'border-teal-primary/10 hover:border-teal-primary/30'
                }`}
              >
                {/* Collapsed top row */}
                <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    {/* Active Color indicator dot */}
                    <div className="w-4 h-4 rounded-full shrink-0 relative flex items-center justify-center">
                      <span className="absolute animate-ping w-2.5 h-2.5 rounded-full" style={{ backgroundColor: med.color, opacity: med.is_active ? 0.3 : 0 }}></span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: med.color, filter: med.is_active ? 'none' : 'grayscale(1)' }}></span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-base leading-tight ${med.is_active ? 'text-[#EAEAEA]' : 'text-[#A0A0B0] line-through'}`}>
                          {med.name}
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-[#1A1A2E] text-emerald-400 px-2 py-0.5 rounded-md border border-teal-primary/20">
                          {med.type}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#A0A0B0] mt-1.5 font-sans">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Doses: <strong>{med.times.join(', ')}</strong>
                        </span>
                        <span>•</span>
                        <span>Dose size: <strong>{med.dosage}</strong></span>
                        <span>•</span>
                        <span>{med.meal_relation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* Adherence Mini circular pill */}
                    <div className="text-right">
                      <div className="text-[10px] text-[#A0A0B0] uppercase font-bold tracking-wider">Adherence</div>
                      <div className={`text-sm font-bold font-mono ${adherence >= 80 ? 'text-emerald-400' : adherence >= 50 ? 'text-[#F39C12]' : 'text-[#FF6B6B]'}`}>
                        {adherence}%
                      </div>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-800"></div>

                    {/* Active Toggle Switch */}
                    <button 
                      onClick={(e) => handleToggleActive(med.id, e)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                        med.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-800 text-[#A0A0B0] border-slate-700'
                      }`}
                    >
                      {med.is_active ? 'Active' : 'Paused'}
                    </button>

                    {/* Action buttons */}
                    <button 
                      onClick={(e) => handleOpenEditModal(med, e)}
                      className="p-1.5 rounded-lg hover:bg-slate-700 text-[#A0A0B0] hover:text-[#EAEAEA] transition"
                      title="Edit Medication"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteMedicine(med.id, e)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#A0A0B0] hover:text-[#FF6B6B] transition"
                      title="Delete Medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 bg-[#1A1A2E]/50 border-t border-slate-800/60 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: General Meta Details */}
                      <div className="space-y-2">
                        <div className="text-xs text-[#A0A0B0] uppercase tracking-wider font-bold">Directions & Notes</div>
                        <p className="text-sm bg-[#16213E] p-3 rounded-xl border border-teal-primary/10 text-[#EAEAEA] leading-relaxed">
                          {med.notes || 'No notes loaded for this preparation.'}
                        </p>
                        <div className="flex justify-between items-center text-xs text-[#A0A0B0] pt-1 px-1">
                          <span>Refill Threshold Alert: <strong className="text-[#EAEAEA]">{med.refill_alert_days} days before</strong></span>
                          <span>Timeline: <strong className="text-[#EAEAEA]">{med.start_date} to {med.end_date}</strong></span>
                        </div>
                      </div>

                      {/* Right: Adherence Metrics with grid */}
                      <div className="bg-[#16213E]/80 border border-teal-primary/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="text-xs text-[#A0A0B0] uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
                            <BarChart2 className="w-4 h-4 text-emerald-400" /> Weekly Compliance (Last 7 Days)
                          </div>
                          <div className="flex justify-between items-center gap-1 text-center font-mono py-1">
                            {weeklyGrid.map((day, idx) => (
                              <div key={idx} className="flex-1">
                                <div className="text-[10px] text-[#A0A0B0] mb-1.5">{day.dayName}</div>
                                <div className="flex justify-center">
                                  {day.status === 'taken' ? (
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center" title="Taken On Time">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  ) : day.status === 'missed' ? (
                                    <div className="w-6 h-6 rounded-full bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/40 flex items-center justify-center" title="Dose Missed">
                                      <X className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  ) : day.status === 'skipped' ? (
                                    <div className="w-6 h-6 rounded-full bg-slate-800 text-[#A0A0B0] border border-slate-700 flex items-center justify-center" title="Skipped / Hold">
                                      <Clock className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] text-slate-700">
                                      -
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-[11px] text-[#A0A0B0]">Overall Adherence Rate: </span>
                          <strong className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                            adherence >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                          }`}>{adherence}% Accurate</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Prescription Modal Toplevel */}
      {modalOpen && (
        <div id="medicine-form-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#16213E] rounded-2xl max-w-lg w-full border border-teal-primary/30 shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold font-display text-[#EAEAEA] flex items-center gap-2">
                <Pill className="text-emerald-400" /> {editingMedicine ? 'Edit Compound Formula' : 'Add New Prescription'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-[#A0A0B0] hover:text-[#EAEAEA] transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveMedicine} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm text-[#EAEAEA]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Medicine Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lisinopril, Metformin"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none focus:border-[#0D6E6E]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Pill Type</label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none focus:border-[#0D6E6E]"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Drop">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Dosage strength *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 10mg, 500mg, 1 puff"
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none focus:border-[#0D6E6E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Frequency Setting</label>
                  <select 
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Twice daily">Twice Daily</option>
                    <option value="Three times daily">Three Times Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="As Needed (PRN)">As Needed (PRN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Time Slots (HH:MM CSV) *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 08:00, 20:30"
                    value={formTimes}
                    onChange={(e) => setFormTimes(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Relation to Food</label>
                  <select 
                    value={formMealRelation}
                    onChange={(e) => setFormMealRelation(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20"
                  >
                    <option value="Before Meal">Before Meal</option>
                    <option value="With Meal">With Meal</option>
                    <option value="After Meal">After Meal</option>
                    <option value="None">Independent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Refill Alert Trigger (Days)</label>
                  <input 
                    type="number"
                    min="1"
                    value={formRefillDays}
                    onChange={(e) => setFormRefillDays(Number(e.target.value))}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Start Date</label>
                  <input 
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">End Date</label>
                  <input 
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-1">Personal Notes / Instruction</label>
                <textarea 
                  rows={2}
                  placeholder="Describe food timing, special reactions, or storage specs..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#1A1A2E] text-[#EAEAEA] px-3 py-2 rounded-lg border border-teal-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A0A0B0] font-bold mb-2">Pill Color Marker Accent</label>
                <div className="flex gap-2">
                  {['#0D6E6E', '#FF6B6B', '#2ECC71', '#F39C12', '#9B59B6', '#3498DB'].map((color) => (
                    <button 
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-8 h-8 rounded-full cursor-pointer transition flex items-center justify-center border-2 ${
                        formColor === color ? 'border-[#EAEAEA] scale-110' : 'border-transparent scale-100'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formColor === color && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#A0A0B0] font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#0D6E6E] hover:bg-[#0D6E6E]/90 text-white font-semibold rounded-xl transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
