# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import json
import datetime
from database.db_manager import DatabaseManager
from models.health_record import Vital, LabReport, HealthNote

class HealthController:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    # --- Profile Helpers ---
    def get_profile(self):
        query = "SELECT * FROM health_profile LIMIT 1;"
        row = self.db.fetch_one(query)
        if not row:
            # Seed default fallback profile
            self.db.execute_query("""
            INSERT INTO health_profile (name, age, gender, blood_type, height, weight, allergies, conditions, emergency_contact, emergency_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, ("Alex Mercer", 35, "Male", "O+", 180.0, 78.0, '["Penicillin", "Peanuts"]', '["Mild Hypertension"]', "Sarah Mercer", "+1 (555) 0199-382"))
            row = self.db.fetch_one(query)
        return dict(row)

    def save_profile(self, name, age, gender, blood_type, height, weight, allergies, conditions, contact, phone):
        # Update existing single record
        profile = self.get_profile()
        query = """
        UPDATE health_profile
        SET name=?, age=?, gender=?, blood_type=?, height=?, weight=?, allergies=?, conditions=?,
            emergency_contact=?, emergency_phone=?
        WHERE id=?;
        """
        self.db.execute_query(query, (name, int(age), gender, blood_type, float(height), float(weight),
                                     json.dumps(allergies), json.dumps(conditions), contact, phone, profile["id"]))

    # --- Bio Vitals Helpers ---
    def log_vital(self, vital_type, value1, value2, unit, notes=""):
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        query = """
        INSERT INTO vitals (type, value1, value2, unit, reading_time, notes, date)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """
        self.db.execute_query(query, (vital_type, float(value1), float(value2) if value2 else None, unit, now_str, notes, today_str))

    def get_vitals_by_type(self, vital_type, limit=30):
        query = "SELECT * FROM vitals WHERE type=? ORDER BY reading_time DESC LIMIT ?;"
        return self.db.fetch_all(query, (vital_type, limit))

    def delete_vital(self, vital_id):
        self.db.execute_query("DELETE FROM vitals WHERE id=?;", (vital_id,))

    # --- Lab Reports ---
    def upload_lab_report(self, title, date, doctor, file_path, notes=""):
        query = """
        INSERT INTO lab_reports (title, date, doctor, file_path, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
        """
        self.db.execute_query(query, (title, date, doctor, file_path, notes, datetime.datetime.now().isoformat()))

    def get_all_reports(self):
        query = "SELECT * FROM lab_reports ORDER BY date DESC;"
        return self.db.fetch_all(query)

    # --- Wellness Timeline Journal Notes ---
    def save_journal_note(self, mood, symptoms, note_text):
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        query = """
        INSERT INTO health_notes (date, mood, symptoms, note, created_at)
        VALUES (?, ?, ?, ?, ?);
        """
        self.db.execute_query(query, (today_str, int(mood), json.dumps(symptoms), note_text, datetime.datetime.now().isoformat()))

    def get_journal_history(self):
        query = "SELECT * FROM health_notes ORDER BY date DESC;"
        return self.db.fetch_all(query)
    
    def delete_journal_note(self, note_id):
        self.db.execute_query("DELETE FROM health_notes WHERE id=?;", (note_id,))
Class = HealthController
