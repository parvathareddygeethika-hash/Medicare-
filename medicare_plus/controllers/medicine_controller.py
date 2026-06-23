# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import json
import datetime
from database.db_manager import DatabaseManager
from models.medicine import Medicine

class MedicineController:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    def save_medicine(self, med: Medicine):
        times_json = med.get_times_json()
        if med.id is None:
            # Insert
            query = """
            INSERT INTO medicines (name, type, dosage, frequency, times, meal_relation,
                                  start_date, end_date, notes, color, refill_alert_days, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """
            params = (med.name, med.type, med.dosage, med.frequency, times_json, med.meal_relation,
                      med.start_date, med.end_date, med.notes, med.color, med.refill_alert_days,
                      med.is_active, datetime.datetime.now().isoformat())
            med.id = self.db.execute_query(query, params)
        else:
            # Update
            query = """
            UPDATE medicines
            SET name=?, type=?, dosage=?, frequency=?, times=?, meal_relation=?,
                start_date=?, end_date=?, notes=?, color=?, refill_alert_days=?, is_active=?
            WHERE id=?;
            """
            params = (med.name, med.type, med.dosage, med.frequency, times_json, med.meal_relation,
                      med.start_date, med.end_date, med.notes, med.color, med.refill_alert_days,
                      med.is_active, med.id)
            self.db.execute_query(query, params)
        return med

    def get_all_medicines(self, active_only=False):
        if active_only:
            query = "SELECT * FROM medicines WHERE is_active = 1 ORDER BY name ASC;"
        else:
            query = "SELECT * FROM medicines ORDER BY name ASC;"
        rows = self.db.fetch_all(query)
        return [Medicine.from_row(row) for row in rows]

    def delete_medicine(self, medicine_id):
        # Purge logs and records
        self.db.execute_query("DELETE FROM medicine_logs WHERE medicine_id=?;", (medicine_id,))
        self.db.execute_query("DELETE FROM medicines WHERE id=?;", (medicine_id,))

    def log_adherence(self, medicine_id, scheduled_time, status, date_str, notes=""):
        # Log taken status
        taken_time = datetime.datetime.now().strftime("%H:%M") if status == "taken" else ""
        query = """
        INSERT INTO medicine_logs (medicine_id, scheduled_time, taken_time, status, date, notes)
        VALUES (?, ?, ?, ?, ?, ?);
        """
        self.db.execute_query(query, (medicine_id, scheduled_time, taken_time, status, date_str, notes))

    def get_adherence_logs_for_date(self, date_str):
        query = """
        SELECT l.*, m.name, m.dosage, m.color, m.type
        FROM medicine_logs l
        JOIN medicines m ON l.medicine_id = m.id
        WHERE l.date = ?;
        """
        return self.db.fetch_all(query, (date_str,))

    def get_compliance_rate(self, medicine_id):
        # Calculate percent taken
        query_total = "SELECT COUNT(*) as cnt FROM medicine_logs WHERE medicine_id = ?;"
        query_taken = "SELECT COUNT(*) as cnt FROM medicine_logs WHERE medicine_id = ? AND (status = 'taken' OR status='skipped');"
        
        tot = self.db.fetch_one(query_total, (medicine_id,))
        tak = self.db.fetch_one(query_taken, (medicine_id,))
        
        total = tot["cnt"] if tot else 0
        taken = tak["cnt"] if tak else 0
        
        if total == 0:
            return 100
        return int((taken / total) * 100)
