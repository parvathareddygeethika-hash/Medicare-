# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import json
import datetime
from database.db_manager import DatabaseManager

def seed_demo_data(db: DatabaseManager):
    # Check if settings are already populated
    existing_profile = db.fetch_one("SELECT * FROM health_profile LIMIT 1;")
    if existing_profile:
        print("[Demo Data] Database already seeded. Skipping initial loading.")
        return

    print("[Demo Data] Seeding SQLite database with high-quality patient logs.")

    # 1. Seed Health Profile
    db.execute_query("""
    INSERT INTO health_profile (name, age, gender, blood_type, height, weight, allergies, conditions, emergency_contact, emergency_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        "Alex Mercer", 35, "Male", "O+", 180.0, 78.0,
        json.dumps(["Penicillin", "Peanuts"]),
        json.dumps(["Mild Hypertension"]),
        "Sarah Mercer", "+1 (555) 0199-382"
    ))

    # 2. Seed Medicines
    m1_id = db.execute_query("""
    INSERT INTO medicines (name, type, dosage, frequency, times, meal_relation, start_date, end_date, notes, color, refill_alert_days, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?);
    """, ("Lisinopril", "Tablet", "10mg", "Daily", json.dumps(["08:00"]), "Before Meal", "2026-06-15", "2026-09-15", "For blood pressure control. Do not skip.", "#0D6E6E", 7, "2026-06-15T08:00:00"))

    m2_id = db.execute_query("""
    INSERT INTO medicines (name, type, dosage, frequency, times, meal_relation, start_date, end_date, notes, color, refill_alert_days, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?);
    """, ("Metformin", "Capsule", "500mg", "Twice daily", json.dumps(["08:30", "20:30"]), "With Meal", "2026-06-15", "2026-12-15", "Take with breakfasts and dinners.", "#FF6B6B", 5, "2026-06-15T08:00:00"))

    m3_id = db.execute_query("""
    INSERT INTO medicines (name, type, dosage, frequency, times, meal_relation, start_date, end_date, notes, color, refill_alert_days, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?);
    """, ("Atorvastatin", "Tablet", "20mg", "Daily", json.dumps(["21:00"]), "After Meal", "2026-06-16", "2026-12-16", "Cholesterol management. Take at night.", "#F39C12", 10, "2026-06-15T08:00:00"))

    # 3. Seed Compliance Logs (Past 5 days: June 17 - June 21)
    dates = ["2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"]
    
    for dt in dates:
        # Lisinopril
        status_lis = "skipped" if dt == "2026-06-17" else "missed" if dt == "2026-06-20" else "taken"
        taken_lis = "08:12" if status_lis == "taken" else ""
        db.execute_query("""
        INSERT INTO medicine_logs (medicine_id, scheduled_time, taken_time, status, date, notes)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (m1_id, "08:00", taken_lis, status_lis, dt, "Doctor hold BP" if status_lis == "skipped" else ""))

        # Metformin morning
        status_met_m = "missed" if dt == "2026-06-18" else "taken"
        taken_met_m = "08:45" if status_met_m == "taken" else ""
        db.execute_query("""
        INSERT INTO medicine_logs (medicine_id, scheduled_time, taken_time, status, date, notes)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (m2_id, "08:30", taken_met_m, status_met_m, dt, ""))

        # Metformin evening
        status_met_e = "missed" if dt == "2026-06-21" else "taken"
        taken_met_e = "20:35" if status_met_e == "taken" else ""
        db.execute_query("""
        INSERT INTO medicine_logs (medicine_id, scheduled_time, taken_time, status, date, notes)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (m2_id, "20:30", taken_met_e, status_met_e, dt, ""))

        # Atorvastatin
        status_at = "missed" if dt == "2026-06-19" else "taken"
        taken_at = "21:10" if status_at == "taken" else ""
        db.execute_query("""
        INSERT INTO medicine_logs (medicine_id, scheduled_time, taken_time, status, date, notes)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (m3_id, "21:00", taken_at, status_at, dt, ""))

    # 4. Seed Vitals (10 logs for BP and 10 logs for Blood Glucose)
    vitals_bp_data = [
        (135.0, 85.0, "2026-06-13 08:00", "2026-06-13", "Routine checkup"),
        (132.0, 84.0, "2026-06-14 08:15", "2026-06-14", ""),
        (128.0, 80.0, "2026-06-15 08:30", "2026-06-15", "Routine BP"),
        (134.0, 82.0, "2026-06-16 08:05", "2026-06-16", ""),
        (130.0, 81.0, "2026-06-17 08:10", "2026-06-17", "Routine BP check"),
        (126.0, 79.0, "2026-06-18 08:20", "2026-06-18", ""),
        (125.0, 78.0, "2026-06-19 08:00", "2026-06-19", ""),
        (138.0, 86.0, "2026-06-20 09:00", "2026-06-20", "Poor sleep high"),
        (129.0, 82.0, "2026-06-21 08:45", "2026-06-21", ""),
        (124.0, 80.0, "2026-06-22 08:00", "2026-06-22", "After workout")
    ]
    for sys, dia, rtime, dt, notes in vitals_bp_data:
        db.execute_query("""
        INSERT INTO vitals (type, value1, value2, unit, reading_time, notes, date)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """, ("bp", sys, dia, "mmHg", rtime, notes, dt))

    vitals_sugar_data = [
        (98.0, "2026-06-13 07:30", "2026-06-13", "Fasting"),
        (115.0, "2026-06-14 10:30", "2026-06-14", "Post breakfast"),
        (92.0, "2026-06-15 07:30", "2026-06-15", "Fasting"),
        (104.0, "2026-06-16 07:45", "2026-06-16", "Fasting"),
        (95.0, "2026-06-17 07:30", "2026-06-17", "Fasting"),
        (142.0, "2026-06-18 13:30", "2026-06-18", "After heavy lunch"),
        (89.0, "2026-06-19 07:35", "2026-06-19", "Fasting"),
        (91.0, "2026-06-20 07:40", "2026-06-20", "Fasting"),
        (106.0, "2026-06-21 07:50", "2026-06-21", "Fasting"),
        (96.0, "2026-06-22 07:30", "2026-06-22", "Fasting")
    ]
    for glu, rtime, dt, notes in vitals_sugar_data:
        db.execute_query("""
        INSERT INTO vitals (type, value1, value2, unit, reading_time, notes, date)
        VALUES (?, ?, ?, NULL, ?, ?, ?);
        """, ("sugar", glu, "mg/dL", rtime, notes, dt))

    # 5. Seed Appointments (2 Upcoming)
    db.execute_query("""
    INSERT INTO appointments (doctor_name, specialization, hospital, date, time, type, status, reminder_before, notes, prescription_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, ("Dr. Evelyn Thomas", "Cardiologist", "Metro Health Cardiology", "2026-06-24", "14:30", "in_person", "scheduled", 60, "Six-month follow up on blood pressure routine. Bring Lisinopril log.", "", "2026-06-22T08:00:00"))

    db.execute_query("""
    INSERT INTO appointments (doctor_name, specialization, hospital, date, time, type, status, reminder_before, notes, prescription_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, ("Dr. Aaron Patel", "Endocrinologist", "Valley Medical Specialities", "2026-07-10", "11:00", "video", "scheduled", 120, "Review HbA1c glucose levels. Virtual call via health portal.", "", "2026-06-22T08:00:00"))

    # 6. Seed Lab Report
    db.execute_query("""
    INSERT INTO lab_reports (title, date, doctor, file_path, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
    """, ("Lipid & CBC Panel Lab", "2026-06-10", "Dr. Evelyn Thomas", "report_lipid_june.pdf", "Cholesterol levels slightly elevated. HDL is 45, LDL is 135.", "2026-06-10T11:00:00"))

    # 7. Seed 3 Journal Entries
    db.execute_query("""
    INSERT INTO health_notes (date, mood, symptoms, note, created_at)
    VALUES (?, ?, ?, ?, ?);
    """, ("2026-06-19", 4, json.dumps(["Energy Level Normal"]), "Woke up refreshed. BP is stable. Had a 20 minute walk in the evening.", "2026-06-19T21:00:00"))

    db.execute_query("""
    INSERT INTO health_notes (date, mood, symptoms, note, created_at)
    VALUES (?, ?, ?, ?, ?);
    """, ("2026-06-20", 2, json.dumps(["Headache", "Mild Tension"]), "Had a stressful day at work. Slight headache, BP went up to 138/86. Drank chamomile tea.", "2026-06-20T21:00:00"))

    db.execute_query("""
    INSERT INTO health_notes (date, mood, symptoms, note, created_at)
    VALUES (?, ?, ?, ?, ?);
    """, ("2026-06-21", 5, json.dumps(["Energetic", "Restful Sleep"]), "Felt incredible today. Did some stretching and cooking.", "2026-06-21T21:30:00"))

    # 8. Add Settings Rows
    settings_rows = [
        ("patient_name", "Alex Mercer"),
        ("theme", "dark"),
        ("weight_unit", "kg"),
        ("temp_unit", "C"),
        ("time_format", "12h"),
        ("sound_enabled", "1"),
        ("notifications_enabled", "1"),
        ("quiet_hours_enabled", "0"),
        ("quiet_hours_start", "22:00"),
        ("quiet_hours_end", "07:00")
    ]
    for key, val in settings_rows:
        db.execute_query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);", (key, val))

    print("[Demo Data] Seeding successfully completed.")
