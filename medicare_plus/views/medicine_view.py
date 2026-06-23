# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import customtkinter as ctk
import datetime
import json
from utils.constants import PRIMARY, ACCENT, SUCCESS, WARNING, BG_DARK, BG_CARD, TEXT_MAIN, TEXT_SUB, FONT_HEADING, FONT_SUBHEAD, FONT_BODY, FONT_SMALL, FONT_MONO
from models.medicine import Medicine

class MedicineView(ctk.CTkFrame):
    def __init__(self, parent, db_manager, med_controller):
        super().__init__(parent, fg_color=BG_DARK)
        self.db = db_manager
        self.med_ctrl = med_controller

        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self._create_widgets()

    def _create_widgets(self):
        # 1. Search / Filtering Controls Header
        self.ctrl_frame = ctk.CTkFrame(self, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.ctrl_frame.grid(row=0, column=0, sticky="ew", padx=15, pady=10)
        self.ctrl_frame.grid_columnconfigure(0, weight=1)

        self.search_entry = ctk.CTkEntry(self.ctrl_frame, placeholder_text="Search drug name...", font=FONT_BODY, fg_color=BG_DARK, border_color="#2b2b4d", height=40)
        self.search_entry.grid(row=0, column=0, sticky="ew", padx=(15, 5), pady=12)
        self.search_entry.bind("<KeyRelease>", lambda e: self.refresh())

        self.type_filter = ctk.CTkOptionMenu(
            self.ctrl_frame, 
            values=["All Forms", "Tablet", "Capsule", "Drops", "Inhaler", "Injection", "Syrup"],
            font=FONT_BODY,
            fg_color="#1E293B",
            button_color=PRIMARY,
            button_hover_color="#0b5e5e",
            dropdown_fg_color=BG_DARK,
            command=lambda v: self.refresh(),
            height=40
        )
        self.type_filter.grid(row=0, column=1, sticky="w", padx=5, pady=12)

        self.btn_add = ctk.CTkButton(
            self.ctrl_frame, 
            text="+ Add Medication", 
            font=FONT_BODY, 
            fg_color=PRIMARY, 
            hover_color="#0b5e5e",
            command=self._open_add_modal,
            height=40
        )
        self.btn_add.grid(row=0, column=2, sticky="e", padx=15, pady=12)

        # 2. Main Content Split View
        self.content_split = ctk.CTkFrame(self, fg_color="transparent")
        self.content_split.grid(row=1, column=0, sticky="nsew", padx=15, pady=(0,15))
        self.content_split.grid_rowconfigure(0, weight=1)
        self.content_split.grid_columnconfigure(0, weight=3) # Lists (3/5)
        self.content_split.grid_columnconfigure(1, weight=2) # Details / Logs (2/5)

        # Left lists scrollable list
        self.scroll_list = ctk.CTkScrollableFrame(self.content_split, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.scroll_list.grid(row=0, column=0, sticky="nsew", padx=(0,7), pady=0)

        # Right side detailed logs panel
        self.right_panel = ctk.CTkFrame(self.content_split, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.right_panel.grid(row=0, column=1, sticky="nsew", padx=(7,0), pady=0)
        self.right_panel.grid_rowconfigure(1, weight=1)
        self.right_panel.grid_columnconfigure(0, weight=1)

        self.details_hdr = ctk.CTkLabel(self.right_panel, text="Medication Adherence History", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w")
        self.details_hdr.grid(row=0, column=0, sticky="w", padx=15, pady=15)

        self.logs_scroll = ctk.CTkScrollableFrame(self.right_panel, fg_color="transparent")
        self.logs_scroll.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0,15))

        self.selected_med_id = None
        self.refresh()

    def refresh(self):
        # Clear main listings
        for widget in self.scroll_list.winfo_children():
            widget.destroy()

        search_query = self.search_entry.get().lower()
        active_filter = self.type_filter.get()

        all_meds = self.med_ctrl.get_all_medicines()
        filtered_meds = []
        for m in all_meds:
            if search_query and search_query not in m.name.lower():
                continue
            if active_filter != "All Forms" and m.type != active_filter:
                continue
            filtered_meds.append(m)

        if not filtered_meds:
            lbl = ctk.CTkLabel(self.scroll_list, text="No medications matched search queries.\nClick '+ Add Medication' to register compounds.", font=FONT_BODY, text_color=TEXT_SUB, anchor="center")
            lbl.pack(pady=80)
        else:
            for med in filtered_meds:
                card = ctk.CTkFrame(self.scroll_list, fg_color="#1E293B" if self.selected_med_id != med.id else "#0f2e2e", corner_radius=10, border_width=1, border_color="#2c2c4d")
                card.pack(fill="x", padx=10, pady=5)

                # Color circle visual indicators
                color_dot = ctk.CTkLabel(card, text="●", font=("Segoe UI", 18), text_color=med.color)
                color_dot.pack(side="left", padx=(15, 5))

                txt_frame = ctk.CTkFrame(card, fg_color="transparent")
                txt_frame.pack(side="left", fill="both", expand=True, padx=10, pady=10)

                lbl_name = ctk.CTkLabel(txt_frame, text=f"{med.name} {med.dosage}", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w")
                lbl_name.pack(fill="x", anchor="w")

                lbl_sched = ctk.CTkLabel(txt_frame, text=f"Type: {med.type}  |  Freq: {med.frequency}  |  Relation: {med.meal_relation}", font=FONT_SMALL, text_color=TEXT_SUB, anchor="w")
                lbl_sched.pack(fill="x", anchor="w")

                lbl_times = ctk.CTkLabel(txt_frame, text=f"Scheduled Alert Hours: {', '.join(med.times)}", font=FONT_SMALL, text_color=PRIMARY, anchor="w")
                lbl_times.pack(fill="x", anchor="w")

                # Action Button Rows
                actions = ctk.CTkFrame(card, fg_color="transparent")
                actions.pack(side="right", padx=15, pady=10)

                btn_select = ctk.CTkButton(actions, text="Compliance", width=80, fg_color="#34495E", hover_color="#2c3e50", font=FONT_SMALL, command=lambda m=med: self._show_med_logs(m.id, m.name))
                btn_select.pack(pady=2)

                btn_edit = ctk.CTkButton(actions, text="Edit", width=80, fg_color="#16A085", hover_color="#138d75", font=FONT_SMALL, command=lambda m=med: self._open_edit_modal(m))
                btn_edit.pack(pady=2)

                btn_delete = ctk.CTkButton(actions, text="Delete", width=80, fg_color=ACCENT, hover_color="#c0392b", font=FONT_SMALL, command=lambda m=med: self._delete_med(m.id))
                btn_delete.pack(pady=2)

    def _show_med_logs(self, med_id, med_name):
        self.selected_med_id = med_id
        self.refresh() # hot-swap selections states bg colors

        self.details_hdr.configure(text=f"Compliance Log: {med_name}")
        for w in self.logs_scroll.winfo_children():
            w.destroy()

        logs = self.db.fetch_all(
            "SELECT * FROM medicine_logs WHERE medicine_id=? ORDER BY date DESC, scheduled_time DESC LIMIT 30;", (med_id,)
        )

        if not logs:
            lbl = ctk.CTkLabel(self.logs_scroll, text="No compliance history logs entered yet\nfor this medicine.", font=FONT_BODY, text_color=TEXT_SUB, anchor="center")
            lbl.pack(pady=40)
        else:
            # Display adherence compliance percentage score
            percentage = self.med_ctrl.get_compliance_rate(med_id)
            score_bar = ctk.CTkFrame(self.logs_scroll, fg_color="#111827", corner_radius=8, border_width=1, border_color="#2a2a40")
            score_bar.pack(fill="x", padx=5, pady=5)
            
            lbl_score = ctk.CTkLabel(score_bar, text=f"Adherence Compliance Score:  {percentage}%", font=FONT_BODY, text_color=SUCCESS if percentage >= 80 else WARNING)
            lbl_score.pack(pady=8)

            for log in logs:
                row = ctk.CTkFrame(self.logs_scroll, fg_color="#1A202C", corner_radius=6, border_width=1, border_color="#2c2c3e")
                row.pack(fill="x", padx=5, pady=3)

                st = log["status"]
                lbl_d = ctk.CTkLabel(row, text=f"{log['date']}  |  Scheduled: {log['scheduled_time']}", font=FONT_SMALL, text_color=TEXT_MAIN, anchor="w")
                lbl_d.pack(side="left", padx=10, pady=8)

                badge_color = SUCCESS if st == "taken" else WARNING if st == "skipped" else ACCENT
                lbl_badge = ctk.CTkLabel(row, text=st.upper(), font=FONT_SMALL, text_color=badge_color, width=70)
                lbl_badge.pack(side="right", padx=10, pady=8)

    def _delete_med(self, med_id):
        # Quick safety confirm
        confirm = True # CustomTkinter lacks native simple dialog popups without external frameworks, we carry standard deletes safely
        self.med_ctrl.delete_medicine(med_id)
        if self.selected_med_id == med_id:
            self.selected_med_id = None
        self.refresh()

    def _open_add_modal(self):
        self._show_form_popup()

    def _open_edit_modal(self, med: Medicine):
        self._show_form_popup(med)

    def _show_form_popup(self, med_obj: Medicine = None):
        popup = ctk.CTkToplevel(self)
        popup.title("Medication Configuration Form")
        popup.geometry("450x640")
        popup.configure(fg_color=BG_CARD)
        popup.wait_visibility() # Critical focus routines for Tkinter widgets
        popup.grab_set()

        # Title
        hdr_txt = "Configure Medication" if med_obj else "Register Medication"
        lbl_hdr = ctk.CTkLabel(popup, text=hdr_txt, font=FONT_HEADING, text_color=TEXT_MAIN)
        lbl_hdr.pack(pady=15)

        # Form scroll layout
        f_scroll = ctk.CTkScrollableFrame(popup, fg_color="transparent")
        f_scroll.pack(fill="both", expand=True, padx=15, pady=(0,15))

        # Fields
        lbl_n = ctk.CTkLabel(f_scroll, text="Medicine Name:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_n.pack(fill="x", pady=(5,0))
        entry_name = ctk.CTkEntry(f_scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_name.pack(fill="x", pady=2)
        if med_obj: entry_name.insert(0, med_obj.name)

        lbl_t = ctk.CTkLabel(f_scroll, text="Medicine Type Form:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_t.pack(fill="x", pady=(5,0))
        opt_type = ctk.CTkOptionMenu(f_scroll, values=["Tablet", "Capsule", "Drops", "Inhaler", "Injection", "Syrup"], fg_color=BG_DARK, button_color=PRIMARY)
        opt_type.pack(fill="x", pady=2)
        if med_obj: opt_type.set(med_obj.type)

        lbl_d = ctk.CTkLabel(f_scroll, text="Dosage Quantity (e.g. 500mg, 1 Pill, 2 Drops):", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_d.pack(fill="x", pady=(5,0))
        entry_dose = ctk.CTkEntry(f_scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_dose.pack(fill="x", pady=2)
        if med_obj: entry_dose.insert(0, med_obj.dosage)

        lbl_f = ctk.CTkLabel(f_scroll, text="Frequency Intake Interval:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_f.pack(fill="x", pady=(5,0))
        opt_freq = ctk.CTkOptionMenu(f_scroll, values=["Daily", "Twice daily", "Thrice daily", "Weekly", "As Needed"], fg_color=BG_DARK, button_color=PRIMARY)
        opt_freq.pack(fill="x", pady=2)
        if med_obj: opt_freq.set(med_obj.frequency)

        lbl_h = ctk.CTkLabel(f_scroll, text="Scheduled Alert Hours (Comma separated List e.g. 08:30, 20:30):", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_h.pack(fill="x", pady=(5,0))
        entry_hours = ctk.CTkEntry(f_scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_hours.pack(fill="x", pady=2)
        if med_obj: entry_hours.insert(0, ", ".join(med_obj.times))
        else: entry_hours.insert(0, "08:00")

        lbl_r = ctk.CTkLabel(f_scroll, text="Meal Relation:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_r.pack(fill="x", pady=(5,0))
        opt_meal = ctk.CTkOptionMenu(f_scroll, values=["Before Meal", "With Meal", "After Meal", "No food restrictions"], fg_color=BG_DARK, button_color=PRIMARY)
        opt_meal.pack(fill="x", pady=2)
        if med_obj: opt_meal.set(med_obj.meal_relation)

        lbl_start = ctk.CTkLabel(f_scroll, text="Start Date (YYYY-MM-DD):", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_start.pack(fill="x", pady=(5,0))
        entry_start = ctk.CTkEntry(f_scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_start.pack(fill="x", pady=2)
        if med_obj: entry_start.insert(0, med_obj.start_date)
        else: entry_start.insert(0, datetime.date.today().strftime("%Y-%m-%d"))

        lbl_end = ctk.CTkLabel(f_scroll, text="End Date (YYYY-MM-DD):", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_end.pack(fill="x", pady=(5,0))
        entry_end = ctk.CTkEntry(f_scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_end.pack(fill="x", pady=2)
        if med_obj: entry_end.insert(0, med_obj.end_date)
        else: entry_end.insert(0, "2026-12-31")

        lbl_c = ctk.CTkLabel(f_scroll, text="Visual Pill Marker Hex Color Code:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_c.pack(fill="x", pady=(5,0))
        entry_color = ctk.CTkEntry(f_scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_color.pack(fill="x", pady=2)
        if med_obj: entry_color.insert(0, med_obj.color)
        else: entry_color.insert(0, "#2ECC71")

        lbl_ref = ctk.CTkLabel(f_scroll, text="Refill Level Alert Days (Buffer trigger):", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_ref.pack(fill="x", pady=(5,0))
        entry_refill = ctk.CTkEntry(f_scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_refill.pack(fill="x", pady=2)
        if med_obj: entry_refill.insert(0, str(med_obj.refill_alert_days))
        else: entry_refill.insert(0, "7")

        lbl_note = ctk.CTkLabel(f_scroll, text="Specific Doctor Instructions Notes:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_note.pack(fill="x", pady=(5,0))
        entry_notes = ctk.CTkEntry(f_scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_notes.pack(fill="x", pady=2)
        if med_obj: entry_notes.insert(0, med_obj.notes)

        # Action Buttons Bottom
        btn_box = ctk.CTkFrame(f_scroll, fg_color="transparent")
        btn_box.pack(fill="x", pady=15)

        btn_cancel = ctk.CTkButton(btn_box, text="Cancel", fg_color="#34495E", hover_color="#2c3e50", font=FONT_BODY, command=popup.destroy)
        btn_cancel.pack(side="left", fill="x", expand=True, padx=(0,5))

        def save_action():
            name = entry_name.get()
            if not name: return
            
            hours_list = [h.strip() for h in entry_hours.get().split(",") if h.strip()]
            if not hours_list: hours_list = ["08:00"]

            m_val = med_obj if med_obj else Medicine()
            m_val.name = name
            m_val.type = opt_type.get()
            m_val.dosage = entry_dose.get()
            m_val.frequency = opt_freq.get()
            m_val.times = hours_list
            m_val.meal_relation = opt_meal.get()
            m_val.start_date = entry_start.get()
            m_val.end_date = entry_end.get()
            m_val.color = entry_color.get()
            m_val.refill_alert_days = int(entry_refill.get())
            m_val.notes = entry_notes.get()

            self.med_ctrl.save_medicine(m_val)
            popup.destroy()
            self.refresh()

        btn_save = ctk.CTkButton(btn_box, text="Commit Save", fg_color=PRIMARY, hover_color="#0b5e5e", font=FONT_BODY, command=save_action)
        btn_save.pack(side="right", fill="x", expand=True, padx=(5,0))
