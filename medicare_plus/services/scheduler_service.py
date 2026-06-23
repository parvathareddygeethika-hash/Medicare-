# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import time
import datetime
import threading
import json
from database.db_manager import DatabaseManager
from services.notification_service import NotificationService

class SchedulerService:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self._running = False
        self._thread = None

    def start(self):
        if not self._running:
            self._running = True
            self._thread = threading.Thread(target=self._run_scheduler, daemon=True)
            self._thread.start()
            print("[Scheduler] Background daemon scheduler thread initialized successfully.")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=1)

    def _run_scheduler(self):
        # Initial check delay
        time.sleep(2)
        while self._running:
            try:
                now = datetime.datetime.now()
                self._check_medicines_due(now)
                self._check_appointments_due(now)
                self._send_daily_summary_check(now)
            except Exception as e:
                print(f"[Scheduler Error] Exception caught in background scheduler loop: {str(e)}")
            
            # Sleep 60 seconds as mandated
            time.sleep(60)

    def _is_quiet_hours(self, now):
        try:
            # Query active setting
            en_row = self.db.fetch_one("SELECT value FROM settings WHERE key='quiet_hours_enabled';")
            if not en_row or en_row["value"] != "1":
                return False
                
            start_row = self.db.fetch_one("SELECT value FROM settings WHERE key='quiet_hours_start';")
            end_row = self.db.fetch_one("SELECT value FROM settings WHERE key='quiet_hours_end';")
            
            start_str = start_row["value"] if start_row else "22:00"
            end_str = end_row["value"] if end_row else "07:00"
            
            start_time = datetime.datetime.strptime(start_str, "%H:%M").time()
            end_time = datetime.datetime.strptime(end_str, "%H:%M").time()
            curr_time = now.time()
            
            if start_time <= end_time:
                return start_time <= curr_time <= end_time
            else: # quiet hours wrap past midnight
                return curr_time >= start_time or curr_time <= end_time
        except Exception:
            return False

    def _check_medicines_due(self, now):
        if self._is_quiet_hours(now):
            return

        formatted_time = now.strftime("%H:%M")
        today_date = now.strftime("%Y-%m-%d")

        # Fetch active medicines
        meds = self.db.fetch_all("SELECT * FROM medicines WHERE is_active = 1;")
        for med in meds:
            # Parse times
            times = json.loads(med["times"]) if med["times"] else []
            for t_slot in times:
                if t_slot == formatted_time:
                    # Check if already notified for this exact medicine, slot, and date
                    existing = self.db.fetch_one(
                        "SELECT id FROM reminders WHERE type='medicine' AND reference_id=? AND scheduled_time LIKE ?;",
                        (med["id"], f"%{today_date} {t_slot}%")
                    )
                    if not existing:
                        msg = f"Time to take your {med['name']} formula {med['dosage']} ({med['meal_relation']})!"
                        # Log Reminder DB Entry
                        self.db.execute_query(
                            "INSERT INTO reminders (type, reference_id, message, scheduled_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?);",
                            ("medicine", med["id"], msg, f"{today_date} {t_slot}", "pending", now.isoformat())
                        )
                        # Trigger Native Notification
                        NotificationService.show_alert("Pill Reminder Alert!", msg)

    def _check_appointments_due(self, now):
        # Run daily check at exactly 09:00 AM for tomorrow's appointment schedule
        if now.hour == 9 and now.minute == 0:
            tomorrow = (now + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
            tomorrow_visits = self.db.fetch_all(
                "SELECT * FROM appointments WHERE date=? AND status='scheduled';", (tomorrow,)
            )

            for visit in tomorrow_visits:
                msg = f"Reminder: Tomorrow you have an appointment with {visit['doctor_name']} ({visit['specialization']}) at {visit['time']}."
                # Log Reminder DB Entry
                self.db.execute_query(
                    "INSERT INTO reminders (type, reference_id, message, scheduled_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?);",
                    ("appointment", visit["id"], msg, f"{tomorrow} {visit['time']}", "pending", now.isoformat())
                )
                NotificationService.show_alert("Clinical Visit Checklist!", msg)

    def _send_daily_summary_check(self, now):
        # Run daily digest alert summary at exactly 09:00 PM (21:00)
        if now.hour == 21 and now.minute == 0:
            today_str = now.strftime("%Y-%m-%d")
            
            # Calculate daily taken compliance
            total_sch_rate = self.db.fetch_one("""
                SELECT COUNT(*) as cnt FROM reminders 
                WHERE type='medicine' AND scheduled_time LIKE ?;
            """, (f"%{today_str}%",))
            
            total_taken_rate = self.db.fetch_one("""
                SELECT COUNT(*) as cnt FROM medicine_logs 
                WHERE date=? AND status='taken';
            """, (today_str,))
            
            sch = total_sch_rate["cnt"] if total_sch_rate else 0
            tak = total_taken_rate["cnt"] if total_taken_rate else 0
            
            msg = f"Wellness Summary: You successfully took {tak}/{sch} medicines of today's schedule. Keep it up!"
            NotificationService.show_alert("Daily Wellness Digest Completed!", msg)
            self.db.execute_query(
                "INSERT INTO reminders (type, reference_id, message, scheduled_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?);",
                ("checkup", 0, msg, f"{today_str} 21:00", "sent", now.isoformat())
            )
            print(f"[Scheduler Digest] Logged daily summary text: '{msg}'")
