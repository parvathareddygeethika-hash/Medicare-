# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import datetime
from database.db_manager import DatabaseManager
from models.appointment import Appointment

class AppointmentController:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    def save_appointment(self, app: Appointment):
        if app.id is None:
            query = """
            INSERT INTO appointments (doctor_name, specialization, hospital, date, time,
                                      type, status, reminder_before, notes, prescription_path, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """
            params = (app.doctor_name, app.specialization, app.hospital, app.date, app.time,
                      app.type, app.status, app.reminder_before, app.notes, app.prescription_path,
                      datetime.datetime.now().isoformat())
            app.id = self.db.execute_query(query, params)
        else:
            query = """
            UPDATE appointments
            SET doctor_name=?, specialization=?, hospital=?, date=?, time=?,
                type=?, status=?, reminder_before=?, notes=?, prescription_path=?
            WHERE id=?;
            """
            params = (app.doctor_name, app.specialization, app.hospital, app.date, app.time,
                      app.type, app.status, app.reminder_before, app.notes, app.prescription_path, app.id)
            self.db.execute_query(query, params)
        return app

    def get_all_appointments(self, scheduled_only=False):
        if scheduled_only:
            query = "SELECT * FROM appointments WHERE status = 'scheduled' ORDER BY date ASC, time ASC;"
        else:
            query = "SELECT * FROM appointments ORDER BY date DESC, time DESC;"
        rows = self.db.fetch_all(query)
        return [Appointment.from_row(row) for row in rows]

    def update_status(self, app_id, status):
        query = "UPDATE appointments SET status=? WHERE id=?;"
        self.db.execute_query(query, (status, app_id))

    def delete_appointment(self, app_id):
        self.db.execute_query("DELETE FROM appointments WHERE id=?;", (app_id,))
