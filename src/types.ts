/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Medicine {
  id: number;
  name: string;
  type: string;
  dosage: string;
  frequency: string;
  times: string[]; // parsed from JSON
  meal_relation: string;
  start_date: string;
  end_date: string;
  notes: string;
  color: string;
  refill_alert_days: number;
  is_active: boolean; // 1 or 0
  created_at: string;
}

export interface MedicineLog {
  id: number;
  medicine_id: number;
  scheduled_time: string;
  taken_time: string;
  status: 'taken' | 'missed' | 'snoozed' | 'skipped' | 'pending';
  date: string;
  notes: string;
}

export interface Appointment {
  id: number;
  doctor_name: string;
  specialization: string;
  hospital: string;
  date: string;
  time: string;
  type: 'in_person' | 'video';
  status: 'scheduled' | 'completed' | 'cancelled';
  reminder_before: number; // minutes
  notes: string;
  prescription_path: string;
  created_at: string;
}

export interface Vital {
  id: number;
  type: 'bp' | 'sugar' | 'heart_rate' | 'weight' | 'temp' | 'spo2';
  value1: number;
  value2?: number; // e.g. diastolic for BP
  unit: string;
  reading_time: string;
  notes: string;
  date: string;
}

export interface HealthProfile {
  id: number;
  name: string;
  age: number;
  gender: string;
  blood_type: string;
  height: number; // cm
  weight: number; // kg
  allergies: string[]; // parsed JSON
  conditions: string[]; // parsed JSON
  emergency_contact: string;
  emergency_phone: string;
  photo_url?: string;
}

export interface LabReport {
  id: number;
  title: string;
  date: string;
  doctor: string;
  file_path: string;
  notes: string;
  created_at: string;
}

export interface HealthNote {
  id: number;
  date: string;
  mood: number; // 1-5
  symptoms: string[]; // parsed JSON
  note: string;
  created_at: string;
}

export interface Reminder {
  id: number;
  type: 'medicine' | 'appointment' | 'refill' | 'checkup';
  reference_id: number;
  message: string;
  scheduled_time: string;
  status: 'pending' | 'sent' | 'snoozed' | 'dismissed';
  snooze_until?: string;
  created_at: string;
}
