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

class HealthRecordsView(ctk.CTkFrame):
    def __init__(self, parent, db_manager, health_controller):
        super().__init__(parent, fg_color=BG_DARK)
        self.db = db_manager
        self.health_ctrl = health_controller

        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self.active_subtab = "vitals"
        self._create_widgets()

    def _create_widgets(self):
        # 1. Sub-Tab bar
        self.tab_bar = ctk.CTkFrame(self, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.tab_bar.grid(row=0, column=0, sticky="ew", padx=15, pady=10)

        # 4 button tabs selectors
        self.btn_vitals = ctk.CTkButton(self.tab_bar, text="Vitals tracking", fg_color=PRIMARY, font=FONT_SUBHEAD, height=40, command=lambda: self._set_subtab("vitals"))
        self.btn_vitals.pack(side="left", padx=10, pady=10, fill="x", expand=True)

        self.btn_mood = ctk.CTkButton(self.tab_bar, text="Daily Mood Diary", fg_color="transparent", text_color=TEXT_SUB, font=FONT_SUBHEAD, height=40, command=lambda: self._set_subtab("mood"))
        self.btn_mood.pack(side="left", padx=10, pady=10, fill="x", expand=True)

        self.btn_labs = ctk.CTkButton(self.tab_bar, text="Lab Scan Reports", fg_color="transparent", text_color=TEXT_SUB, font=FONT_SUBHEAD, height=40, command=lambda: self._set_subtab("labs"))
        self.btn_labs.pack(side="left", padx=10, pady=10, fill="x", expand=True)

        self.btn_profile = ctk.CTkButton(self.tab_bar, text="User Demographics", fg_color="transparent", text_color=TEXT_SUB, font=FONT_SUBHEAD, height=40, command=lambda: self._set_subtab("profile"))
        self.btn_profile.pack(side="left", padx=10, pady=10, fill="x", expand=True)

        # 2. Main Subtab content frame
        self.content_container = ctk.CTkFrame(self, fg_color="transparent")
        self.content_container.grid(row=1, column=0, sticky="nsew", padx=15, pady=(0,15))
        self.content_container.grid_rowconfigure(0, weight=1)
        self.content_container.grid_columnconfigure(0, weight=1)

        self.refresh()

    def _set_subtab(self, name):
        self.active_subtab = name
        
        # Reset buttons styles
        for btn, tab_name in [(self.btn_vitals, "vitals"), (self.btn_mood, "mood"), (self.btn_labs, "labs"), (self.btn_profile, "profile")]:
            if tab_name == name:
                btn.configure(fg_color=PRIMARY, text_color=TEXT_MAIN)
            else:
                btn.configure(fg_color="transparent", text_color=TEXT_SUB)
        self.refresh()

    def refresh(self):
        # Clear child elements
        for w in self.content_container.winfo_children():
            w.destroy()

        if self.active_subtab == "vitals":
            self._render_vitals()
        elif self.active_subtab == "mood":
            self._render_mood_diary()
        elif self.active_subtab == "labs":
            self._render_lab_reports()
        elif self.active_subtab == "profile":
            self._render_user_profile()

    # ========================== VITALS TRACKING SCREEN ==========================
    def _render_vitals(self):
        vitals_frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        vitals_frame.pack(fill="both", expand=True)
        vitals_frame.grid_rowconfigure(0, weight=1)
        vitals_frame.grid_columnconfigure(0, weight=2) # Form (2/5)
        vitals_frame.grid_columnconfigure(1, weight=3) # Chart/List (3/5)

        # Form side
        form_box = ctk.CTkFrame(vitals_frame, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        form_box.grid(row=0, column=0, sticky="nsew", padx=(0,7), pady=0)
        form_box.grid_rowconfigure(10, weight=1)

        ctk.CTkLabel(form_box, text="Log Vitals Measurement", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w").grid(row=0, column=0, sticky="w", padx=15, pady=12)

        ctk.CTkLabel(form_box, text="Select Vital Metric Category:", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=1, column=0, sticky="w", padx=15, pady=(5,0))
        opt_vtype = ctk.CTkOptionMenu(form_box, values=["Blood Pressure", "Diabetes Glucose", "Heart Pulse", "SPO2 Oxygen", "Body Temperature"], fg_color=BG_DARK, button_color=PRIMARY)
        opt_vtype.grid(row=2, column=0, sticky="ew", padx=15, pady=3)

        lbl_val1 = ctk.CTkLabel(form_box, text="Measurement reading value (e.g. Systolic / Glucose / Temperature):", font=FONT_SMALL, text_color=TEXT_SUB)
        lbl_val1.grid(row=3, column=0, sticky="w", padx=15, pady=(5,0))
        entry_val1 = ctk.CTkEntry(form_box, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_val1.grid(row=4, column=0, sticky="ew", padx=15, pady=3)

        lbl_val2 = ctk.CTkLabel(form_box, text="Secondary value (For Blood Pressure Diastolic only):", font=FONT_SMALL, text_color=TEXT_SUB)
        lbl_val2.grid(row=5, column=0, sticky="w", padx=15, pady=(5,0))
        entry_val2 = ctk.CTkEntry(form_box, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_val2.grid(row=6, column=0, sticky="ew", padx=15, pady=3)

        ctk.CTkLabel(form_box, text="Reading Observations / Notes:", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=7, column=0, sticky="w", padx=15, pady=(5,0))
        entry_notes = ctk.CTkEntry(form_box, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_notes.grid(row=8, column=0, sticky="ew", padx=15, pady=3)

        def save_vital_action():
            vtype_raw = opt_vtype.get()
            # translate categories
            type_map = {"Blood Pressure": "bp", "Diabetes Glucose": "sugar", "Heart Pulse": "heart_rate", "SPO2 Oxygen": "spo2", "Body Temperature": "temp"}
            unit_map = {"bp": "mmHg", "sugar": "mg/dL", "heart_rate": "bpm", "spo2": "%", "temp": "C"}
            
            vt = type_map.get(vtype_raw, "bp")
            v1 = entry_val1.get()
            v2 = entry_val2.get()
            
            if not v1: return
            
            self.health_ctrl.log_vital(vt, float(v1), float(v2) if v2 else None, unit_map[vt], entry_notes.get())
            self.refresh()

        btn_save = ctk.CTkButton(form_box, text="Commit Vitals Entry", fg_color=PRIMARY, hover_color="#0b5e5e", font=FONT_BODY, command=save_vital_action)
        btn_save.grid(row=9, column=0, sticky="ew", padx=15, pady=15)

        # Right side: Chart trends panel & past logs
        right_sub = ctk.CTkFrame(vitals_frame, fg_color="transparent")
        right_sub.grid(row=0, column=1, sticky="nsew", padx=(7,0), pady=0)
        right_sub.grid_rowconfigure(0, weight=1)
        right_sub.grid_rowconfigure(1, weight=1)
        right_sub.grid_columnconfigure(0, weight=1)

        # Tabulation chart selector
        chart_box = ctk.CTkFrame(right_sub, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        chart_box.grid(row=0, column=0, sticky="nsew", padx=0, pady=(0,7))
        
        # Load line stats
        recent_bp = self.health_ctrl.get_vitals_by_type("bp", limit=10)
        fig = ChartService.create_vitals_line_chart(recent_bp, vital_type="bp")
        canvas = FigureCanvasTkAgg(fig, master=chart_box)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True, padx=10, pady=10)

        # Past logs scroll list
        list_box = ctk.CTkFrame(right_sub, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        list_box.grid(row=1, column=0, sticky="nsew", padx=0, pady=(7,0))
        list_box.grid_rowconfigure(1, weight=1)
        list_box.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(list_box, text="Historical Log Entries Register", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w").grid(row=0, column=0, sticky="w", padx=15, pady=10)
        scroll_hist = ctk.CTkScrollableFrame(list_box, fg_color="transparent")
        scroll_hist.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0,10))

        v_logs = self.db.fetch_all("SELECT * FROM vitals ORDER BY reading_time DESC LIMIT 40;")
        for vl in v_logs:
            card = ctk.CTkFrame(scroll_hist, fg_color="#1E293B", corner_radius=8, border_width=1, border_color="#2b2b4d")
            card.pack(fill="x", padx=5, pady=3)

            vt = vl["type"].upper()
            val_txt = f"{vl['value1']}" + (f" / {vl['value2']}" if vl['value2'] else '')
            lbl_cap = ctk.CTkLabel(card, text=f"{vt}:  {val_txt} {vl['unit']}   |   {vl['reading_time']}", font=FONT_BODY, text_color=TEXT_MAIN, anchor="w")
            lbl_cap.pack(side="left", padx=15, pady=8)

            btn_del = ctk.CTkButton(card, text="Delete", width=60, fg_color=ACCENT, hover_color="#c0392b", font=FONT_SMALL, command=lambda i=vl["id"]: [self.health_ctrl.delete_vital(i), self.refresh()])
            btn_del.pack(side="right", padx=15, pady=8)

    # ========================== MOOD JOURNAL SCREEN ==========================
    def _render_mood_diary(self):
        mood_frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        mood_frame.pack(fill="both", expand=True)

        mood_frame.grid_rowconfigure(0, weight=1)
        mood_frame.grid_columnconfigure(0, weight=2) # Left journal editor (2/5)
        mood_frame.grid_columnconfigure(1, weight=3) # Right historical logs (3/5)

        # Editor Frame
        frm_edit = ctk.CTkFrame(mood_frame, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        frm_edit.grid(row=0, column=0, sticky="nsew", padx=(0,7), pady=0)
        frm_edit.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(frm_edit, text="How are you feeling today?", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w").grid(row=0, column=0, sticky="w", padx=15, pady=12)

        # Mood Level Picker Slices
        ctk.CTkLabel(frm_edit, text="Mood Indicator Slider (1 = Awful, 5 = Incredible):", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=1, column=0, sticky="w", padx=15, pady=(5,0))
        
        slider = ctk.CTkSlider(frm_edit, from_=1, to=5, number_of_steps=4, fg_color=BG_DARK, progress_color=PRIMARY, button_color=PRIMARY)
        slider.grid(row=2, column=0, sticky="ew", padx=15, pady=5)
        slider.set(3)

        # Symptoms checks boxes
        ctk.CTkLabel(frm_edit, text="Check Active Symptoms:", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=3, column=0, sticky="w", padx=15, pady=(10,0))
        
        box_checks = ctk.CTkFrame(frm_edit, fg_color="transparent")
        box_checks.grid(row=4, column=0, sticky="ew", padx=15, pady=5)
        box_checks.grid_columnconfigure(0, weight=1)
        box_checks.grid_columnconfigure(1, weight=1)

        symp_list = ["Headache", "Feverish", "Fatigue", "Cold / Cough", "Nausea", "Sleepy", "Joint Pain", "Normal Energy"]
        check_widgets = []
        for idx, sym in enumerate(symp_list):
            c_row = idx % 4
            c_col = idx // 4
            cb = ctk.CTkCheckBox(box_checks, text=sym, font=FONT_SMALL, fg_color=PRIMARY, text_color=TEXT_MAIN)
            cb.grid(row=c_row, column=c_col, sticky="w", padx=5, pady=4)
            check_widgets.append(cb)

        # Journal Text Area
        ctk.CTkLabel(frm_edit, text="Write Personal Daily Log Note:", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=5, column=0, sticky="w", padx=15, pady=(10,0))
        entry_note = ctk.CTkEntry(frm_edit, fg_color=BG_DARK, border_color="#2b2b4d", height=70, placeholder_text="Share notes, workout specs, or meal logs...")
        entry_note.grid(row=6, column=0, sticky="ew", padx=15, pady=5)

        def save_mood_entry():
            m_val = int(slider.get())
            selected_s = []
            for cb in check_widgets:
                if cb.get():
                    selected_s.append(cb.cget("text"))
            
            self.health_ctrl.save_journal_note(m_val, selected_s, entry_note.get())
            self.refresh()

        btn_commit = ctk.CTkButton(frm_edit, text="Commit Diary Entry", fg_color=PRIMARY, hover_color="#0b5e5e", font=FONT_BODY, command=save_mood_entry)
        btn_commit.grid(row=7, column=0, sticky="ew", padx=15, pady=15)

        # Historical lists Frame
        frm_list = ctk.CTkFrame(mood_frame, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        frm_list.grid(row=0, column=1, sticky="nsew", padx=(7,0), pady=0)
        frm_list.grid_rowconfigure(1, weight=1)
        frm_list.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(frm_list, text="Personal Timeline Registers Log", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w").grid(row=0, column=0, sticky="w", padx=15, pady=12)

        scr_journal = ctk.CTkScrollableFrame(frm_list, fg_color="transparent")
        scr_journal.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0,15))

        j_logs = self.health_ctrl.get_journal_history()
        for j in j_logs:
            card = ctk.CTkFrame(scr_journal, fg_color="#1E293B", corner_radius=10, border_width=1, border_color="#2b2b4d")
            card.pack(fill="x", padx=5, pady=5)

            # Mood score icon string representation
            emojis = ["😢", "😞", "😐", "🙂", "😎"]
            sc = int(j["mood"])
            sc_repr = emojis[sc - 1] if 1 <= sc <= 5 else "😐"

            lbl_mood = ctk.CTkLabel(card, text=f"{j['date']}  |  {sc_repr} Mood Score", font=FONT_BODY, text_color=SUCCESS, anchor="w")
            lbl_mood.pack(fill="x", padx=12, pady=(10, 2))

            s_list = json.loads(j["symptoms"]) if j["symptoms"] else []
            lbl_symp = ctk.CTkLabel(card, text=f"Symptoms: {', '.join(s_list) if s_list else 'All clear'}", font=FONT_SMALL, text_color=TEXT_SUB, anchor="w")
            lbl_symp.pack(fill="x", padx=12, pady=2)

            lbl_note = ctk.CTkLabel(card, text=f'"{j["note"]}"', font=FONT_SMALL, text_color=TEXT_MAIN, anchor="w", italic=True)
            lbl_note.pack(fill="x", padx=12, pady=(2, 10))

            btn_del = ctk.CTkButton(card, text="Remove Note Entries", width=120, fg_color=ACCENT, hover_color="#c0392b", font=FONT_SMALL, command=lambda nid=j["id"]: [self.health_ctrl.delete_journal_note(nid), self.refresh()])
            btn_del.pack(anchor="e", padx=12, pady=(0, 10))


    # ========================== LAB REPORTS SCREEN ==========================
    def _render_lab_reports(self):
        labs_frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        labs_frame.pack(fill="both", expand=True)

        labs_frame.grid_rowconfigure(0, weight=1)
        labs_frame.grid_columnconfigure(0, weight=2) # Sim upload (2/5)
        labs_frame.grid_columnconfigure(1, weight=3) # Report library index (3/5)

        # Left Upload Box
        frm_up = ctk.CTkFrame(labs_frame, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        frm_up.grid(row=0, column=0, sticky="nsew", padx=(0,7), pady=0)
        frm_up.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(frm_up, text="Register Clinical Diagnostic Lab scans", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w").grid(row=0, column=0, sticky="w", padx=15, pady=12)

        ctk.CTkLabel(frm_up, text="Diagnostic Report Title *", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=1, column=0, sticky="w", padx=15, pady=(5,0))
        entry_title = ctk.CTkEntry(frm_up, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_title.grid(row=2, column=0, sticky="ew", padx=15, pady=3)

        ctk.CTkLabel(frm_up, text="Authorized Medical Physician doctor:", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=3, column=0, sticky="w", padx=15, pady=(5,0))
        entry_doc = ctk.CTkEntry(frm_up, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_doc.grid(row=4, column=0, sticky="ew", padx=15, pady=3)

        ctk.CTkLabel(frm_up, text="Report Date (YYYY-MM-DD):", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=5, column=0, sticky="w", padx=15, pady=(5,0))
        entry_date = ctk.CTkEntry(frm_up, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_date.grid(row=6, column=0, sticky="ew", padx=15, pady=3)
        entry_date.insert(0, datetime.date.today().strftime("%Y-%m-%d"))

        ctk.CTkLabel(frm_up, text="Observations / Specific Diagnostics Notes:", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=7, column=0, sticky="w", padx=15, pady=(5,0))
        entry_notes = ctk.CTkEntry(frm_up, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_notes.grid(row=8, column=0, sticky="ew", padx=15, pady=3)

        # File path selector simulated text
        ctk.CTkLabel(frm_up, text="Select simulated Report File Path:", font=FONT_SMALL, text_color=TEXT_SUB).grid(row=9, column=0, sticky="w", padx=15, pady=(5,0))
        entry_path = ctk.CTkEntry(frm_up, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_path.grid(row=10, column=0, sticky="ew", padx=15, pady=3)
        entry_path.insert(0, "report_cbc_glucos_2026.pdf")

        def commit_lab_report():
            title = entry_title.get()
            if not title: return
            
            self.health_ctrl.upload_lab_report(title, entry_date.get(), entry_doc.get(), entry_path.get(), entry_notes.get())
            self.refresh()

        btn_commit = ctk.CTkButton(frm_up, text="Register Diagnostic Document", fg_color=PRIMARY, hover_color="#0b5e5e", font=FONT_BODY, command=commit_lab_report)
        btn_commit.grid(row=11, column=0, sticky="ew", padx=15, pady=18)

        # Right Listings Frame
        frm_indices = ctk.CTkFrame(labs_frame, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        frm_indices.grid(row=0, column=1, sticky="nsew", padx=(7,0), pady=0)
        frm_indices.grid_rowconfigure(1, weight=1)
        frm_indices.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(frm_indices, text="Document Library Vault", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w").grid(row=0, column=0, sticky="w", padx=15, pady=12)

        scr_labs = ctk.CTkScrollableFrame(frm_indices, fg_color="transparent")
        scr_labs.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 15))

        r_logs = self.health_ctrl.get_all_reports()
        for report in r_logs:
            card = ctk.CTkFrame(scr_labs, fg_color="#1E293B", corner_radius=10, border_width=1, border_color="#2b2b4d")
            card.pack(fill="x", padx=5, pady=5)

            lbl_t = ctk.CTkLabel(card, text=report["title"], font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w")
            lbl_t.pack(fill="x", padx=12, pady=(10, 2))

            lbl_sub = ctk.CTkLabel(card, text=f"Doctor: {report['doctor']}  |  Date check: {report['date']}", font=FONT_SMALL, text_color=TEXT_SUB, anchor="w")
            lbl_sub.pack(fill="x", padx=12, pady=2)

            lbl_p = ctk.CTkLabel(card, text=f"File register path: {report['file_path']}", font=FONT_SMALL, text_color=PRIMARY, anchor="w")
            lbl_p.pack(fill="x", padx=12, pady=2)

            lbl_n = ctk.CTkLabel(card, text=f'"{report["notes"] or "No notes submitted."}"', font=FONT_SMALL, text_color=TEXT_MAIN, anchor="w", italic=True)
            lbl_n.pack(fill="x", padx=12, pady=(2, 10))


    # ========================== USER PROFILE SCREEN ==========================
    def _render_user_profile(self):
        frm_prof = ctk.CTkFrame(self.content_container, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        frm_prof.pack(fill="both", expand=True)
        frm_prof.columnconfigure(0, weight=1)
        frm_prof.columnconfigure(1, weight=1)

        ctk.CTkLabel(frm_prof, text="Patient Demographic Configuration", font=FONT_HEADING, text_color=TEXT_MAIN, anchor="center").grid(row=0, column=0, columnspan=2, pady=15)

        profile = self.health_ctrl.get_profile()

        # Build Fields (Left col)
        ctk.CTkLabel(frm_prof, text="Patient First / Last Name:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=1, column=0, sticky="w", padx=25, pady=(5,0))
        entry_name = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_name.grid(row=2, column=0, sticky="ew", padx=25, pady=2)
        entry_name.insert(0, profile["name"])

        ctk.CTkLabel(frm_prof, text="Age (Years old):", font=FONT_BODY, text_color=TEXT_SUB).grid(row=3, column=0, sticky="w", padx=25, pady=(5,0))
        entry_age = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_age.grid(row=4, column=0, sticky="ew", padx=25, pady=2)
        entry_age.insert(0, str(profile["age"]))

        ctk.CTkLabel(frm_prof, text="Gender demographics:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=5, column=0, sticky="w", padx=25, pady=(5,0))
        entry_gender = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_gender.grid(row=6, column=0, sticky="ew", padx=25, pady=2)
        entry_gender.insert(0, profile["gender"])

        ctk.CTkLabel(frm_prof, text="Blood type scale (e.g. O+, A-):", font=FONT_BODY, text_color=TEXT_SUB).grid(row=7, column=0, sticky="w", padx=25, pady=(5,0))
        entry_blood = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_blood.grid(row=8, column=0, sticky="ew", padx=25, pady=2)
        entry_blood.insert(0, profile["blood_type"])

        # Build Fields (Right col)
        ctk.CTkLabel(frm_prof, text="Height parameters (cm):", font=FONT_BODY, text_color=TEXT_SUB).grid(row=1, column=1, sticky="w", padx=25, pady=(5,0))
        entry_height = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_height.grid(row=2, column=1, sticky="ew", padx=25, pady=2)
        entry_height.insert(0, str(profile["height"]))

        ctk.CTkLabel(frm_prof, text="Weight parameters (kg):", font=FONT_BODY, text_color=TEXT_SUB).grid(row=3, column=1, sticky="w", padx=25, pady=(5,0))
        entry_weight = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_weight.grid(row=4, column=1, sticky="ew", padx=25, pady=2)
        entry_weight.insert(0, str(profile["weight"]))

        ctk.CTkLabel(frm_prof, text="Emergency Contact Parent Name:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=5, column=1, sticky="w", padx=25, pady=(5,0))
        entry_contact = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_contact.grid(row=6, column=1, sticky="ew", padx=25, pady=2)
        entry_contact.insert(0, profile["emergency_contact"])

        ctk.CTkLabel(frm_prof, text="Emergency Contact Mobile Phone:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=7, column=1, sticky="w", padx=25, pady=(5,0))
        entry_phone = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_phone.grid(row=8, column=1, sticky="ew", padx=25, pady=2)
        entry_phone.insert(0, profile["emergency_phone"])

        # Combined JSON Lists
        aller = json.loads(profile["allergies"]) if profile["allergies"] else []
        condi = json.loads(profile["conditions"]) if profile["conditions"] else []

        ctk.CTkLabel(frm_prof, text="Allergenic medical warnings (Comma list):", font=FONT_BODY, text_color=TEXT_SUB).grid(row=9, column=0, sticky="w", padx=25, pady=(5,0))
        entry_aller = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_aller.grid(row=10, column=0, sticky="ew", padx=25, pady=2)
        entry_aller.insert(0, ", ".join(aller))

        ctk.CTkLabel(frm_prof, text="Chronic Medical Conditions (Comma list):", font=FONT_BODY, text_color=TEXT_SUB).grid(row=9, column=1, sticky="w", padx=25, pady=(5,0))
        entry_condi = ctk.CTkEntry(frm_prof, fg_color=BG_DARK, border_color="#2b2b4d")
        entry_condi.grid(row=10, column=1, sticky="ew", padx=25, pady=2)
        entry_condi.insert(0, ", ".join(condi))

        # Save details commands
        def save_prof_action():
            al_list = [a.strip() for a in entry_aller.get().split(",") if a.strip()]
            co_list = [c.strip() for c in entry_condi.get().split(",") if c.strip()]
            
            self.health_ctrl.save_profile(
                entry_name.get(),
                entry_age.get(),
                entry_gender.get(),
                entry_blood.get(),
                entry_height.get(),
                entry_weight.get(),
                al_list,
                co_list,
                entry_contact.get(),
                entry_phone.get()
            )
            self._set_subtab("vitals")

        btn_save = ctk.CTkButton(frm_prof, text="Update Profile Parameters", fg_color=PRIMARY, font=FONT_SUBHEAD, height=45, command=save_prof_action)
        btn_save.grid(row=11, column=0, columnspan=2, pady=25, padx=25, sticky="ew")
