# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import customtkinter as ctk
import datetime
from utils.constants import PRIMARY, ACCENT, SUCCESS, WARNING, BG_DARK, BG_CARD, TEXT_MAIN, TEXT_SUB, FONT_HEADING, FONT_SUBHEAD, FONT_BODY, FONT_SMALL, FONT_MONO

class ReminderView(ctk.CTkFrame):
    def __init__(self, parent, db_manager, reminder_controller):
        super().__init__(parent, fg_color=BG_DARK)
        self.db = db_manager
        self.rem_ctrl = reminder_controller

        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self._create_widgets()

    def _create_widgets(self):
        # 1. Title Pane Header
        self.title_frame = ctk.CTkFrame(self, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.title_frame.grid(row=0, column=0, sticky="ew", padx=15, pady=10)
        self.title_frame.grid_columnconfigure(0, weight=1)

        lbl_title = ctk.CTkLabel(self.title_frame, text="MediCare+ Alarm Alert Center", font=FONT_HEADING, text_color=TEXT_MAIN, anchor="w")
        lbl_title.pack(anchor="w", padx=20, pady=(15, 2))

        lbl_sub = ctk.CTkLabel(self.title_frame, text="Active real-time pending chimes, medication snooze loops, and warning notifications logs.", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_sub.pack(anchor="w", padx=20, pady=(0, 15))

        # 2. Main Content Split Panel
        self.split_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.split_frame.grid(row=1, column=0, sticky="nsew", padx=15, pady=(0,15))
        self.split_frame.grid_rowconfigure(0, weight=1)
        self.split_frame.grid_columnconfigure(0, weight=1) # Active (1/2)
        self.split_frame.grid_columnconfigure(1, weight=1) # History (1/2)

        # Left Active Box
        self.active_box = ctk.CTkFrame(self.split_frame, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.active_box.grid(row=0, column=0, sticky="nsew", padx=(0,7), pady=0)
        self.active_box.grid_rowconfigure(1, weight=1)
        self.active_box.grid_columnconfigure(0, weight=1)

        lbl_act = ctk.CTkLabel(self.active_box, text="Current Pending & Snoozed Alarms", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w")
        lbl_act.grid(row=0, column=0, sticky="w", padx=15, pady=15)

        self.active_scroll = ctk.CTkScrollableFrame(self.active_box, fg_color="transparent")
        self.active_scroll.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 15))

        # Right History Box
        self.history_box = ctk.CTkFrame(self.split_frame, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.history_box.grid(row=0, column=1, sticky="nsew", padx=(7,0), pady=0)
        self.history_box.grid_rowconfigure(1, weight=1)
        self.history_box.grid_columnconfigure(0, weight=1)

        lbl_hist = ctk.CTkLabel(self.history_box, text="Notifications Triggers History Feed", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w")
        lbl_hist.grid(row=0, column=0, sticky="w", padx=15, pady=15)

        self.history_scroll = ctk.CTkScrollableFrame(self.history_box, fg_color="transparent")
        self.history_scroll.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 15))

        self.refresh()

    def refresh(self):
        # 1. Render Pending Alarms
        for w in self.active_scroll.winfo_children():
            w.destroy()

        active_reminders = self.rem_ctrl.get_upcoming_reminders()
        if not active_reminders:
            lbl = ctk.CTkLabel(self.active_scroll, text="No alarm triggers pending presently.", font=FONT_BODY, text_color=TEXT_SUB)
            lbl.pack(pady=50)
        else:
            for rem in active_reminders:
                card = ctk.CTkFrame(self.active_scroll, fg_color="#1E293B", corner_radius=10, border_width=1, border_color="#2a2a40")
                card.pack(fill="x", padx=10, pady=5)

                lbl_msg = ctk.CTkLabel(card, text=rem["message"], font=FONT_BODY, text_color=TEXT_MAIN, anchor="w", justify="left")
                lbl_msg.pack(fill="x", padx=12, pady=(10, 2))

                sch_str = f"Time: {rem['scheduled_time']}"
                if rem["status"] == "snoozed" and rem["snooze_until"]:
                    sch_str += f" | Snoozing until: {rem['snooze_until'].split(' ')[1]}"
                
                lbl_time = ctk.CTkLabel(card, text=sch_str, font=FONT_SMALL, text_color=WARNING if rem["status"] == "snoozed" else PRIMARY, anchor="w")
                lbl_time.pack(fill="x", padx=12, pady=(2, 10))

                actions = ctk.CTkFrame(card, fg_color="transparent")
                actions.pack(fill="x", padx=10, pady=(2, 10))

                btn_dismiss = ctk.CTkButton(actions, text="Dismiss", fg_color=SUCCESS, hover_color="#27ae60", width=80, font=FONT_SMALL, command=lambda r=rem: self._dismiss(r["id"]))
                btn_dismiss.pack(side="left", padx=5)

                btn_snooze = ctk.CTkButton(actions, text="Snooze 10m", fg_color="#F39C12", hover_color="#d68910", width=80, font=FONT_SMALL, command=lambda r=rem: self._snooze(r["id"]))
                btn_snooze.pack(side="left", padx=5)

        # 2. Render Notifications Logs History Feed
        for w in self.history_scroll.winfo_children():
            w.destroy()

        history_reminders = self.rem_ctrl.get_reminders_history()
        if not history_reminders:
            lbl = ctk.CTkLabel(self.history_scroll, text="Notification history log registers are empty.", font=FONT_BODY, text_color=TEXT_SUB)
            lbl.pack(pady=50)
        else:
            for rem in history_reminders:
                row = ctk.CTkFrame(self.history_scroll, fg_color="#1A202C", corner_radius=8, border_width=1, border_color="#2a2a3e")
                row.pack(fill="x", padx=5, pady=4)

                txt_frame = ctk.CTkFrame(row, fg_color="transparent")
                txt_frame.pack(side="left", fill="both", expand=True, padx=12, pady=10)

                lbl_m = ctk.CTkLabel(txt_frame, text=rem["message"], font=FONT_SMALL, text_color=TEXT_MAIN, anchor="w", justify="left")
                lbl_m.pack(fill="x")

                lbl_d = ctk.CTkLabel(txt_frame, text=f"Scheduled hour check: {rem['scheduled_time']}", font=FONT_SMALL, text_color=TEXT_SUB, anchor="w")
                lbl_d.pack(fill="x")

                st = rem["status"]
                lbl_badge = ctk.CTkLabel(row, text=st.upper(), font=FONT_SMALL, text_color=SUCCESS if st == "dismissed" else TEXT_SUB, width=80)
                lbl_badge.pack(side="right", padx=10, pady=10)

    def _dismiss(self, rem_id):
        self.rem_ctrl.dismiss_reminder(rem_id)
        # Check type and update corresponding medicine log so compliance is accurate
        rem = self.db.fetch_one("SELECT * FROM reminders WHERE id=?;", (rem_id,))
        if rem and rem["type"] == "medicine":
            med_id = rem["reference_id"]
            sch_time = rem["scheduled_time"].split(" ")[1]
            today_str = datetime.date.today().strftime("%Y-%m-%d")
            
            # Check if there is an existing log to avoid duplicate INSERTs
            logged = self.db.fetch_one("SELECT id FROM medicine_logs WHERE medicine_id=? AND date=? AND scheduled_time=?;", (med_id, today_str, sch_time))
            if not logged:
                # auto-log compliance missed / taken depending on user interaction but they chose dismiss which confirms it was skipped or resolved!
                # We can write complete action
                self.db.execute_query("""
                INSERT INTO medicine_logs (medicine_id, scheduled_time, taken_time, status, date, notes)
                VALUES (?, ?, ?, ?, ?, ?);
                """, (med_id, sch_time, datetime.datetime.now().strftime("%H:%M"), "taken", today_str, "Dismissed alert dialog check"))
        
        self.refresh()

    def _snooze(self, rem_id):
        self.rem_ctrl.snooze_reminder(rem_id, 10) # 10 Minutes snooze
        self.refresh()
