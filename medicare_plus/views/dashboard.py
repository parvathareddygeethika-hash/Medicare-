# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import customtkinter as ctk
import datetime
import json
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from utils.constants import PRIMARY, ACCENT, SUCCESS, WARNING, BG_DARK, BG_CARD, TEXT_MAIN, TEXT_SUB, FONT_HEADING, FONT_SUBHEAD, FONT_BODY, FONT_SMALL, FONT_MONO
from services.chart_service import ChartService

class DashboardView(ctk.CTkFrame):
    def __init__(self, parent, db_manager, med_controller, health_controller, app_controller, nav_callback):
        super().__init__(parent, fg_color=BG_DARK)
        self.db = db_manager
        self.med_ctrl = med_controller
        self.health_ctrl = health_controller
        self.app_ctrl = app_controller
        self.navigate_to = nav_callback # Function to switch tabs namely: dashboard, medicines, records, appointments, reminders, settings

        self.grid_rowconfigure(2, weight=1)
        self.grid_columnconfigure(0, weight=3)
        self.grid_columnconfigure(1, weight=2)

        self._create_widgets()

    def _create_widgets(self):
        # 1. Title Banner Frame
        self.banner = ctk.CTkFrame(self, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.banner.grid(row=0, column=0, columnspan=2, sticky="nsew", padx=15, pady=10)
        self.banner.columnconfigure(0, weight=1)

        profile = self.health_ctrl.get_profile()
        welcome_txt = f"Welcome Back, {profile['name']}!"
        self.greeting = ctk.CTkLabel(self.banner, text=welcome_txt, font=FONT_HEADING, text_color=TEXT_MAIN, anchor="w")
        self.greeting.grid(row=0, column=0, sticky="w", padx=20, pady=(15,2))
        
        bio_txt = f"Age: {profile['age']} | Gender: {profile['gender']} | Blood: {profile['blood_type']} | Height: {profile['height']} cm | Weight: {profile['weight']} kg"
        self.subheading = ctk.CTkLabel(self.banner, text=bio_txt, font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        self.subheading.grid(row=1, column=0, sticky="w", padx=20, pady=(0,15))

        # 2. Stats Row Grid Cards Frame
        self.stats_row = ctk.CTkFrame(self, fg_color="transparent")
        self.stats_row.grid(row=1, column=0, columnspan=2, sticky="nsew", padx=15, pady=5)
        for i in range(4):
            self.stats_row.grid_columnconfigure(i, weight=1)

        # Card 1: compliance rate
        self.card1 = self._create_card(self.stats_row, 0, "Compliance", "78%", SUCCESS, "Medication Adherence")
        # Card 2: upcoming dose
        self.card2 = self._create_card(self.stats_row, 1, "Next Dose", "08:30", ACCENT, "Metformin 500mg")
        # Card 3: vitals check
        self.card3 = self._create_card(self.stats_row, 2, "Last Blood Pressure", "124/80", WARNING, "Healthy Normal")
        # Card 4: next appt
        self.card4 = self._create_card(self.stats_row, 3, "Clinics Visit", "Jun 24", PRIMARY, "Dr. Evelyn Thomas")

        # 3. Left Side Pane: Today's agenda checklists
        self.left_pane = ctk.CTkFrame(self, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.left_pane.grid(row=2, column=0, sticky="nsew", padx=(15,7), pady=10)
        self.left_pane.grid_rowconfigure(1, weight=1)
        self.left_pane.grid_columnconfigure(0, weight=1)

        agenda_hdr = ctk.CTkLabel(self.left_pane, text="Today's Reminders & Doses Agenda", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w")
        agenda_hdr.grid(row=0, column=0, sticky="w", padx=20, pady=15)

        self.agenda_scroll = ctk.CTkScrollableFrame(self.left_pane, fg_color="transparent")
        self.agenda_scroll.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0,15))

        # 4. Right Side Pane: Embedded matplotlib trends chart & Quick launcher commands
        self.right_pane = ctk.CTkFrame(self, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.right_pane.grid(row=2, column=1, sticky="nsew", padx=(7,15), pady=10)
        self.right_pane.grid_rowconfigure(1, weight=1)
        self.right_pane.grid_columnconfigure(0, weight=1)

        chart_hdr = ctk.CTkLabel(self.right_pane, text="Blood Pressure Biometric Trends", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w")
        chart_hdr.grid(row=0, column=0, sticky="w", padx=20, pady=15)

        self.chart_container = ctk.CTkFrame(self.right_pane, fg_color="transparent")
        self.chart_container.grid(row=1, column=0, sticky="nsew", padx=15, pady=(0,15))

        self.refresh()

    def _create_card(self, parent, col, title, val, color, desc):
        card = ctk.CTkFrame(parent, fg_color=BG_CARD, corner_radius=12, border_width=1, border_color="#2a2a45")
        card.grid(row=0, column=col, sticky="nsew", padx=5, pady=5)
        
        lbl_title = ctk.CTkLabel(card, text=title, font=FONT_SMALL, text_color=TEXT_SUB)
        lbl_title.pack(anchor="w", padx=12, pady=(10,0))
        
        lbl_val = ctk.CTkLabel(card, text=val, font=FONT_HEADING, text_color=color)
        lbl_val.pack(anchor="w", padx=12, pady=(2,2))
        
        lbl_desc = ctk.CTkLabel(card, text=desc, font=FONT_SMALL, text_color=TEXT_MAIN)
        lbl_desc.pack(anchor="w", padx=12, pady=(0,10))
        return card

    def refresh(self):
        # Hot-load data from SQLite files
        profile = self.health_ctrl.get_profile()
        self.greeting.configure(text=f"Welcome Back, {profile['name']}!")
        
        bio_txt = f"Age: {profile['age']} | Gender: {profile['gender']} | Blood: {profile['blood_type']} | Height: {profile['height']} cm | Weight: {profile['weight']} kg"
        self.subheading.configure(text=bio_txt)

        # 1. Update Agenda checks
        # Flush agenda scrollable frames
        for widget in self.agenda_scroll.winfo_children():
            widget.destroy()

        today_str = datetime.date.today().strftime("%Y-%m-%d")
        todays_reminders = self.db.fetch_all("""
            SELECT r.*, m.name, m.dosage, m.color, m.type, m.meal_relation
            FROM reminders r
            JOIN medicines m ON r.reference_id = m.id
            WHERE r.type = 'medicine' AND r.scheduled_time LIKE ?;
        """, (f"%{today_str}%",))

        # If zero generated reminders for today, print standard baseline
        if not todays_reminders:
            lbl = ctk.CTkLabel(self.agenda_scroll, text="Agenda Completed! No pending schedule doses for today.", font=FONT_BODY, text_color=TEXT_SUB, anchor="center")
            lbl.pack(pady=40, fill="both")
        else:
            for item in todays_reminders:
                agenda_row = ctk.CTkFrame(self.agenda_scroll, fg_color="#1E293B", corner_radius=8, border_width=1, border_color="#2b2b4d")
                agenda_row.pack(fill="x", padx=5, pady=3.5)
                
                # Check status
                is_taken = item["status"] == "sent" or item["status"] == "dismissed"
                
                check = ctk.CTkCheckBox(
                    agenda_row, 
                    text=f"{item['name']} {item['dosage']}  |  {item['scheduled_time'].split(' ')[1]}  ({item['meal_relation']})",
                    font=FONT_BODY,
                    text_color="#E2E8F0" if not is_taken else "#64748B",
                    fg_color=PRIMARY,
                    border_color=PRIMARY,
                    command=lambda i=item: self._toggle_adherence(i["id"], i["reference_id"], i["scheduled_time"])
                )
                check.pack(side="left", padx=15, py=12)
                if is_taken:
                    check.select()

        # 2. Re-embed Matplotlib Blood Pressure Graph
        for widget in self.chart_container.winfo_children():
            widget.destroy()

        recent_bp = self.health_ctrl.get_vitals_by_type("bp", limit=10)
        fig = ChartService.create_vitals_line_chart(recent_bp, vital_type="bp")
        
        canvas = FigureCanvasTkAgg(fig, master=self.chart_container)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True)

        # 3. Update top stats card dynamically
        # Let's count totals
        total_meds = len(self.med_ctrl.get_all_medicines(active_only=True))
        self._update_all_widgets_card_stats()

    def _update_all_widgets_card_stats(self):
        # Card 1: compliance Rate Calculation
        taken_cnt = self.db.fetch_one("SELECT COUNT(*) as cnt FROM medicine_logs WHERE date=? AND status='taken';", (datetime.date.today().strftime("%Y-%m-%d"),))["cnt"]
        total_cnt = self.db.fetch_one("SELECT COUNT(*) as cnt FROM reminders WHERE type='medicine' AND scheduled_time LIKE ?;", (f"%{datetime.date.today().strftime('%Y-%m-%d')}%",))["cnt"]
        
        comp_val = 100
        if total_cnt > 0:
            comp_val = int((taken_cnt / total_cnt) * 100)
        
        # We can dynamically access the inner label widgets by iterating them or recreating
        # To avoid widget lookup errors let's look them up in layout children
        for widget in self.stats_row.winfo_children():
            labels = [w for w in widget.winfo_children() if isinstance(w, ctk.CTkLabel)]
            if len(labels) >= 2:
                title = labels[0].cget("text")
                if title == "Compliance":
                    labels[1].configure(text=f"{comp_val}%")
                elif title == "Next Dose":
                    # Get next scheduled dose time
                    next_dose = self.db.fetch_one("""
                        SELECT r.*, m.name FROM reminders r 
                        JOIN medicines m ON r.reference_id = m.id 
                        WHERE r.type='medicine' AND r.status='pending' ORDER BY r.scheduled_time ASC LIMIT 1;
                    """)
                    if next_dose:
                        t_sz = next_dose["scheduled_time"].split(" ")[1]
                        labels[1].configure(text=t_sz)
                        labels[2].configure(text=next_dose["name"])
                    else:
                        labels[1].configure(text="--:--")
                        labels[2].configure(text="No Pending Doses")
                elif title == "Last Blood Pressure":
                    last_bp = self.db.fetch_one("SELECT value1, value2 FROM vitals WHERE type='bp' ORDER BY reading_time DESC LIMIT 1;")
                    if last_bp:
                        labels[1].configure(text=f"{int(last_bp['value1'])}/{int(last_bp['value2'])}")
                    else:
                        labels[1].configure(text="N/A")
                elif title == "Clinics Visit":
                    next_visit = self.db.fetch_one("SELECT doctor_name, date FROM appointments WHERE status='scheduled' ORDER BY date ASC LIMIT 1;")
                    if next_visit:
                        labels[1].configure(text=next_visit["date"][5:]) # MM-DD Shorthand
                        labels[2].configure(text=next_visit["doctor_name"])
                    else:
                        labels[1].configure(text="N/A")
                        labels[2].configure(text="No Clinics Planned")

    def _toggle_adherence(self, reminder_id, med_id, scheduled_time):
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        curr_state = self.db.fetch_one("SELECT status FROM reminders WHERE id=?;", (reminder_id,))
        
        if curr_state and curr_state["status"] == "pending":
            # Set completed/taken
            self.db.execute_query("UPDATE reminders SET status='sent' WHERE id=?;", (reminder_id,))
            self.med_ctrl.log_adherence(med_id, scheduled_time.split(" ")[1], "taken", today_str, "Logged via dashboard check")
        else:
            # Revert to pending
            self.db.execute_query("UPDATE reminders SET status='pending' WHERE id=?;", (reminder_id,))
            self.db.execute_query("DELETE FROM medicine_logs WHERE medicine_id=? AND date=? AND scheduled_time=?;", 
                                  (med_id, today_str, scheduled_time.split(" ")[1]))

        # Instant UI hot updates!
        self.refresh()
