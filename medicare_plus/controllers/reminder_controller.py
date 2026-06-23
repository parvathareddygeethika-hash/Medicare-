# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import datetime
from database.db_manager import DatabaseManager
from models.reminder import Reminder

class ReminderController:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    def log_reminder(self, r_type, reference_id, message, scheduled_time, status="pending"):
        query = """
        INSERT INTO reminders (type, reference_id, message, scheduled_time, status, snooze_until, created_at)
        VALUES (?, ?, ?, ?, ?, NULL, ?);
        """
        self.db.execute_query(query, (r_type, reference_id, message, scheduled_time, status, datetime.datetime.now().isoformat()))

    def get_upcoming_reminders(self):
        # Fetch pending or active alarms
        query = "SELECT * FROM reminders WHERE status = 'pending' OR status = 'snoozed' ORDER BY scheduled_time ASC;"
        return self.db.fetch_all(query)

    def get_reminders_history(self, limit=50):
        # Fetch past logged alert histories (dismissed, sent)
        query = "SELECT * FROM reminders WHERE status = 'dismissed' OR status = 'sent' ORDER BY scheduled_time DESC LIMIT ?;"
        return self.db.fetch_all(query, (limit,))

    def dismiss_reminder(self, reminder_id):
        # Change status
        query = "UPDATE reminders SET status = 'dismissed' WHERE id = ?;"
        self.db.execute_query(query, (reminder_id,))

    def snooze_reminder(self, reminder_id, duration_minutes):
        now = datetime.datetime.now()
        snooze_until = (now + datetime.timedelta(minutes=duration_minutes)).strftime("%Y-%m-%d %H:%M")
        query = "UPDATE reminders SET status = 'snoozed', snooze_until = ? WHERE id = ?;"
        self.db.execute_query(query, (snooze_until, reminder_id))
