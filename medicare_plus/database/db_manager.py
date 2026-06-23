# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import os
import sqlite3
import json

class DatabaseManager:
    def __init__(self, db_path=None):
        if db_path is None:
            # Locate db relative to db_manager file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(current_dir, "medicare.db")
        
        self.db_path = db_path
        self._initialize_database()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Returns dict-structured rows
        return conn

    def _initialize_database(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        # 1. Medicines table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT,
            dosage TEXT,
            frequency TEXT,
            times TEXT,                -- JSON list e.g. '["08:00","21:00"]'
            meal_relation TEXT,
            start_date TEXT,
            end_date TEXT,
            notes TEXT,
            color TEXT,
            refill_alert_days INTEGER,
            is_active INTEGER DEFAULT 1,
            created_at TEXT
        );
        """)

        # 2. Medicine Logs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS medicine_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_id INTEGER,
            scheduled_time TEXT,
            taken_time TEXT,
            status TEXT,               -- taken/missed/snoozed/skipped
            date TEXT,
            notes TEXT,
            FOREIGN KEY (medicine_id) REFERENCES medicines(id)
        );
        """)

        # 3. Appointments
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_name TEXT,
            specialization TEXT,
            hospital TEXT,
            date TEXT,
            time TEXT,
            type TEXT,                 -- in_person/video
            status TEXT,               -- scheduled/completed/cancelled
            reminder_before INTEGER,
            notes TEXT,
            prescription_path TEXT,
            created_at TEXT
        );
        """)

        # 4. Vitals
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS vitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,                 -- bp/sugar/heart_rate/weight/temp/spo2
            value1 REAL,
            value2 REAL,
            unit TEXT,
            reading_time TEXT,
            notes TEXT,
            date TEXT
        );
        """)

        # 5. Health Profile
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS health_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            age INTEGER,
            gender TEXT,
            blood_type TEXT,
            height REAL,
            weight REAL,
            allergies TEXT,            -- JSON list
            conditions TEXT,           -- JSON list
            emergency_contact TEXT,
            emergency_phone TEXT
        );
        """)

        # 6. Lab Reports
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS lab_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            date TEXT,
            doctor TEXT,
            file_path TEXT,
            notes TEXT,
            created_at TEXT
        );
        """)

        # 7. Health Notes
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS health_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            mood INTEGER,
            symptoms TEXT,             -- JSON list of tags
            note TEXT,
            created_at TEXT
        );
        """)

        # 8. Reminders
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,                 -- medicine/appointment/refill/checkup
            reference_id INTEGER,
            message TEXT,
            scheduled_time TEXT,
            status TEXT,               -- pending/sent/snoozed/dismissed
            snooze_until TEXT,
            created_at TEXT
        );
        """)

        # 9. Settings
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        """)

        conn.commit()
        conn.close()

    def execute_query(self, query, params=()):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            conn.commit()
            last_id = cursor.lastrowid
            return last_id
        finally:
            conn.close()

    def fetch_all(self, query, params=()):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    def fetch_one(self, query, params=()):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
