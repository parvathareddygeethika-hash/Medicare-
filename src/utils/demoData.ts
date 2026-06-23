/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medicine, MedicineLog, Appointment, Vital, HealthProfile, LabReport, HealthNote, Reminder } from '../types';

export function initializeDemoData() {
  if (localStorage.getItem('medicare_initialized')) {
    return; // Already initialized
  }

  // 1. Health Profile
  const defaultProfile: HealthProfile = {
    id: 1,
    name: 'Alex Mercer',
    age: 35,
    gender: 'Male',
    blood_type: 'O+',
    height: 180,
    weight: 78,
    allergies: ['Penicillin', 'Peanuts'],
    conditions: ['Mild Hypertension'],
    emergency_contact: 'Sarah Mercer',
    emergency_phone: '+1 (555) 0199-382'
  };
  localStorage.setItem('medicare_profile', JSON.stringify(defaultProfile));

  // 2. Medicines
  const defaultMedicines: Medicine[] = [
    {
      id: 1,
      name: 'Lisinopril',
      type: 'Tablet',
      dosage: '10mg',
      frequency: 'Daily',
      times: ['08:00'],
      meal_relation: 'Before Meal',
      start_date: '2026-06-15',
      end_date: '2026-09-15',
      notes: 'For blood pressure control. Do not skip.',
      color: '#0D6E6E', // Primary Teal
      refill_alert_days: 7,
      is_active: true,
      created_at: '2026-06-15T08:00:00Z'
    },
    {
      id: 2,
      name: 'Metformin',
      type: 'Capsule',
      dosage: '500mg',
      frequency: 'Twice daily',
      times: ['08:30', '20:30'],
      meal_relation: 'With Meal',
      start_date: '2026-06-15',
      end_date: '2026-12-15',
      notes: 'Take with breakfasts and dinners.',
      color: '#FF6B6B', // Accent Coral
      refill_alert_days: 5,
      is_active: true,
      created_at: '2026-06-15T08:00:00Z'
    },
    {
      id: 3,
      name: 'Atorvastatin',
      type: 'Tablet',
      dosage: '20mg',
      frequency: 'Daily',
      times: ['21:00'],
      meal_relation: 'After Meal',
      start_date: '2026-06-16',
      end_date: '2026-12-16',
      notes: 'Cholesterol management. Take at night.',
      color: '#F39C12', // Warning Orange
      refill_alert_days: 10,
      is_active: true,
      created_at: '2026-06-15T08:00:00Z'
    }
  ];
  localStorage.setItem('medicare_medicines', JSON.stringify(defaultMedicines));

  // 3. Medicine Logs (last 5 days)
  // Let's generate logs starting from 2026-06-17 to 2026-06-21. Today is 2026-06-22.
  const defaultLogs: MedicineLog[] = [];
  const dates = ['2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21'];
  let logId = 1;

  dates.forEach((date) => {
    // Lisinopril (daily 08:00)
    // 17: skipped, 18: taken, 19: taken, 20: missed, 21: taken
    let status_lis: 'taken' | 'skipped' | 'missed' = 'taken';
    if (date === '2026-06-17') status_lis = 'skipped';
    if (date === '2026-06-20') status_lis = 'missed';

    defaultLogs.push({
      id: logId++,
      medicine_id: 1,
      scheduled_time: '08:00',
      taken_time: status_lis === 'taken' ? '08:12' : '',
      status: status_lis,
      date,
      notes: status_lis === 'skipped' ? 'Doctor advised to hold since BP was low.' : ''
    });

    // Metformin (twice daily 08:30, 20:30)
    // morning dose status
    let status_met_m: 'taken' | 'missed' = 'taken';
    if (date === '2026-06-18') status_met_m = 'missed';

    defaultLogs.push({
      id: logId++,
      medicine_id: 2,
      scheduled_time: '08:30',
      taken_time: status_met_m === 'taken' ? '08:45' : '',
      status: status_met_m,
      date,
      notes: ''
    });

    // evening dose status
    let status_met_e: 'taken' | 'missed' = 'taken';
    if (date === '2026-06-21') status_met_e = 'missed';

    defaultLogs.push({
      id: logId++,
      medicine_id: 2,
      scheduled_time: '20:30',
      taken_time: status_met_e === 'taken' ? '20:35' : '',
      status: status_met_e,
      date,
      notes: ''
    });

    // Atorvastatin (daily 21:00)
    // 17: taken, 18: taken, 19: missed, 20: taken, 21: taken
    let status_at: 'taken' | 'missed' = 'taken';
    if (date === '2026-06-19') status_at = 'missed';

    defaultLogs.push({
      id: logId++,
      medicine_id: 3,
      scheduled_time: '21:00',
      taken_time: status_at === 'taken' ? '21:10' : '',
      status: status_at,
      date,
      notes: ''
    });
  });

  localStorage.setItem('medicare_logs', JSON.stringify(defaultLogs));

  // 4. Vitals (10 Blood Pressure and 10 Sugar readings)
  const defaultVitals: Vital[] = [];
  let vitalId = 1;

  // Let's generate measurements from June 13 to June 22
  const bpReadings = [
    { sys: 135, dia: 85, hr: 72, time: '2026-06-13T08:00:00' },
    { sys: 132, dia: 84, hr: 76, time: '2026-06-14T08:15:00' },
    { sys: 128, dia: 80, hr: 70, time: '2026-06-15T08:30:00' },
    { sys: 134, dia: 82, hr: 75, time: '2026-06-16T08:05:00' },
    { sys: 130, dia: 81, hr: 73, time: '2026-06-17T08:10:00' },
    { sys: 126, dia: 79, hr: 71, time: '2026-06-18T08:20:00' },
    { sys: 125, dia: 78, hr: 68, time: '2026-06-19T08:00:00' },
    { sys: 138, dia: 86, hr: 80, time: '2026-06-20T09:00:00' },  // warning high day
    { sys: 129, dia: 82, hr: 74, time: '2026-06-21T08:45:00' },
    { sys: 124, dia: 80, hr: 72, time: '2026-06-22T08:00:00' }
  ];

  bpReadings.forEach((bp) => {
    defaultVitals.push({
      id: vitalId++,
      type: 'bp',
      value1: bp.sys,
      value2: bp.dia,
      unit: 'mmHg',
      reading_time: bp.time,
      notes: bp.sys > 135 ? 'A bit high, did not sleep well.' : 'Routine BP check',
      date: bp.time.split('T')[0]
    });
  });

  const sugarReadings = [
    { value: 98, time: '2026-06-13T07:30:00', notes: 'Fasting' },
    { value: 115, time: '2026-06-14T10:30:00', notes: 'Post breakfast' },
    { value: 92, time: '2026-06-15T07:30:00', notes: 'Fasting' },
    { value: 104, time: '2026-06-16T07:45:00', notes: 'Fasting' },
    { value: 95, time: '2026-06-17T07:30:00', notes: 'Fasting' },
    { value: 142, time: '2026-06-18T13:30:00', notes: 'After heavy lunch' },
    { value: 89, time: '2026-06-19T07:35:00', notes: 'Fasting' },
    { value: 91, time: '2026-06-20T07:40:00', notes: 'Fasting' },
    { value: 106, time: '2026-06-21T07:50:00', notes: 'Fasting' },
    { value: 96, time: '2026-06-22T07:30:00', notes: 'Fasting' }
  ];

  sugarReadings.forEach((sugar) => {
    defaultVitals.push({
      id: vitalId++,
      type: 'sugar',
      value1: sugar.value,
      unit: 'mg/dL',
      reading_time: sugar.time,
      notes: sugar.notes,
      date: sugar.time.split('T')[0]
    });
  });

  localStorage.setItem('medicare_vitals', JSON.stringify(defaultVitals));

  // 5. Appointments
  const defaultAppointments: Appointment[] = [
    {
      id: 1,
      doctor_name: 'Dr. Evelyn Thomas',
      specialization: 'Cardiologist',
      hospital: 'Metro Health Cardiology',
      date: '2026-06-24', // Day after tomorrow (June 24, 2026)
      time: '14:30',
      type: 'un_person' as any, // fallback in-person
      status: 'scheduled',
      reminder_before: 60,
      notes: 'Six-month follow up on blood pressure routine. Bring Lisinopril log.',
      prescription_path: '',
      created_at: '2026-06-22T08:00:00Z'
    },
    {
      id: 2,
      doctor_name: 'Dr. Aaron Patel',
      specialization: 'Endocrinologist',
      hospital: 'Valley Medical Specialities',
      date: '2026-07-10',
      time: '11:00',
      type: 'video',
      status: 'scheduled',
      reminder_before: 120,
      notes: 'Review HbA1c glucose levels. Virtual call via health portal.',
      prescription_path: '',
      created_at: '2026-06-22T08:00:00Z'
    }
  ];
  // Map type correctly
  defaultAppointments[0].type = 'in_person';
  localStorage.setItem('medicare_appointments', JSON.stringify(defaultAppointments));

  // 6. Lab Report
  const defaultReports: LabReport[] = [
    {
      id: 1,
      title: 'Lipid & CBC Panel Lab',
      date: '2026-06-10',
      doctor: 'Dr. Evelyn Thomas',
      file_path: 'report_lipid_june.pdf',
      notes: 'Cholesterol levels slightly elevated. HDL is 45, LDL is 135.',
      created_at: '2026-06-10T11:00:00Z'
    }
  ];
  localStorage.setItem('medicare_reports', JSON.stringify(defaultReports));

  // 7. Journal Entries (3 entries)
  const defaultJournal: HealthNote[] = [
    {
      id: 1,
      date: '2026-06-19',
      mood: 4,
      symptoms: ['Energy Level Normal'],
      note: 'Woke up refreshed. BP is stable. Had a 20 minute walk in the evening.',
      created_at: '2026-06-19T21:00:00Z'
    },
    {
      id: 2,
      date: '2026-06-20',
      mood: 2, // low / sad mood
      symptoms: ['Headache', 'Mild Tension'],
      note: 'Had a stressful day at work. Slight headache, BP went up to 138/86. Drank chamomile tea.',
      created_at: '2026-06-20T21:00:00Z'
    },
    {
      id: 3,
      date: '2026-06-21',
      mood: 5, // great
      symptoms: ['Energetic', 'Restful Sleep'],
      note: 'Felt incredible today. Did some stretching and cooking. Metformin evening dose was missed but feeling great.',
      created_at: '2026-06-21T21:30:00Z'
    }
  ];
  localStorage.setItem('medicare_journal', JSON.stringify(defaultJournal));

  // 8. Reminders
  const defaultReminders: Reminder[] = [
    {
      id: 1,
      type: 'medicine',
      reference_id: 1,
      message: 'Time to take Lisinopril 10mg (Before Meal)',
      scheduled_time: '2026-06-22T08:00:00',
      status: 'dismissed',
      created_at: '2026-06-22T08:00:00Z'
    },
    {
      id: 2,
      type: 'medicine',
      reference_id: 2,
      message: 'Time to take Metformin 500mg (With Meal)',
      scheduled_time: '2026-06-22T08:30:00',
      status: 'pending',
      created_at: '2026-06-22T08:30:00Z'
    }
  ];
  localStorage.setItem('medicare_reminders', JSON.stringify(defaultReminders));

  // Write initialization tag
  localStorage.setItem('medicare_initialized', 'true');
  localStorage.setItem('medicare_settings', JSON.stringify({
    theme: 'dark',
    weight_unit: 'kg',
    temp_unit: '°C',
    time_format: '12h',
    sound_enabled: true,
    notifications_enabled: true,
    quiet_hours_enabled: false
  }));
}
