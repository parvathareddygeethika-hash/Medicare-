# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import customtkinter as ctk
import datetime
from utils.constants import PRIMARY, ACCENT, SUCCESS, WARNING, BG_DARK, BG_CARD, TEXT_MAIN, TEXT_SUB, FONT_HEADING, FONT_SUBHEAD, FONT_BODY, FONT_SMALL, FONT_MONO
from models.appointment import Appointment

class AppointmentsView(ctk.CTkFrame):
    def __init__(self, parent, db_manager, appointment_controller):
        super().__init__(parent, fg_color=BG_DARK)
        self.db = db_manager
        self.app_ctrl = appointment_controller

        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self._create_widgets()

    def _create_widgets(self):
        # 1. Header Area with "+ Register Clinic" action
        self.hdr_box = ctk.CTkFrame(self, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.hdr_box.grid(row=0, column=0, sticky="ew", padx=15, pady=10)
        self.hdr_box.grid_columnconfigure(0, weight=1)

        lbl_hdr = ctk.CTkLabel(self.hdr_box, text="Specialists Clinical Consultations Calendar", font=FONT_HEADING, text_color=TEXT_MAIN, anchor="w")
        lbl_hdr.pack(anchor="w", padx=20, pady=(15,2))

        lbl_desc = ctk.CTkLabel(self.hdr_box, text="Plan routine blood scans, consults, surgery coordinates buffer, and specialist checklist logs.", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_desc.pack(anchor="w", padx=20, pady=(0,15))

        # 2. Dual Split Grid pane
        self.split_pane = ctk.CTkFrame(self, fg_color="transparent")
        self.split_pane.grid(row=1, column=0, sticky="nsew", padx=15, pady=(0,15))
        self.split_pane.grid_rowconfigure(0, weight=1)
        self.split_pane.grid_columnconfigure(0, weight=3) # Listings (3/5)
        self.split_pane.grid_columnconfigure(1, weight=2) # Form Panel / Calendars (2/5)

        # Left Listings Scrollable Column
        self.list_box = ctk.CTkFrame(self.split_pane, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.list_box.grid(row=0, column=0, sticky="nsew", padx=(0,7), pady=0)
        self.list_box.grid_rowconfigure(1, weight=1)
        self.list_box.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(self.list_box, text="Upcoming Scheduled Consultations", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w").grid(row=0, column=0, sticky="w", padx=15, pady=12)

        self.list_scroll = ctk.CTkScrollableFrame(self.list_box, fg_color="transparent")
        self.list_scroll.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 15))

        # Right Action Calendar pane
        self.right_col = ctk.CTkFrame(self.split_pane, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.right_col.grid(row=0, column=1, sticky="nsew", padx=(7,0), pady=0)
        self.right_col.grid_columnconfigure(0, weight=1)

        self.btn_book = ctk.CTkButton(self.right_col, text="+ Book specialist Clinic", fg_color=PRIMARY, hover_color="#0b5e5e", font=FONT_SUBHEAD, height=45, command=self._open_add_modal)
        self.btn_book.pack(pady=20, padx=20, fill="x")

        # Static informational tips area helper
        self.tip_frame = ctk.CTkFrame(self.right_col, fg_color="#1E293B", corner_radius=10, border_width=1, border_color="#2a2a40")
        self.tip_frame.pack(fill="both", expand=True, padx=20, pady=(0,20))

        lbl_tips_hdr = ctk.CTkLabel(self.tip_frame, text="💡 Patient Consult Checklist", font=FONT_SUBHEAD, text_color=WARNING, anchor="w")
        lbl_tips_hdr.pack(padx=15, pady=12)

        tips_text = (
            "1. Remember to compile and carrying your recent bio vitals levels logs.\n\n"
            "2. Always check whether fasting is mandatory prior to blood labs checkups.\n\n"
            "3. Carry current physical medication inventories to review refills with your clinician."
        )
        lbl_tips = ctk.CTkLabel(self.tip_frame, text=tips_text, font=FONT_BODY, text_color=TEXT_MAIN, justify="left", wraplength=200, anchor="w")
        lbl_tips.pack(padx=15, pady=5)

        self.refresh()

    def refresh(self):
        for w in self.list_scroll.winfo_children():
            w.destroy()

        visits = self.app_ctrl.get_all_appointments(scheduled_only=True)
        if not visits:
            lbl = ctk.CTkLabel(self.list_scroll, text="No scheduled medical clinics.", font=FONT_BODY, text_color=TEXT_SUB)
            lbl.pack(pady=80)
        else:
            for vis in visits:
                card = ctk.CTkFrame(self.list_scroll, fg_color="#1E293B", corner_radius=10, border_width=1, border_color="#2c2c4d")
                card.pack(fill="x", padx=10, pady=5)

                txt_frame = ctk.CTkFrame(card, fg_color="transparent")
                txt_frame.pack(side="left", fill="both", expand=True, padx=15, pady=12)

                lbl_name = ctk.CTkLabel(txt_frame, text=f"{vis.doctor_name}  ({vis.specialization})", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w")
                lbl_name.pack(fill="x")

                lbl_hosp = ctk.CTkLabel(txt_frame, text=f"Venue: {vis.hospital}   |   Type: {vis.type.upper()}", font=FONT_SMALL, text_color=TEXT_SUB, anchor="w")
                lbl_hosp.pack(fill="x")

                lbl_dt = ctk.CTkLabel(txt_frame, text=f"Scheduled Date: {vis.date} @ {vis.time}", font=FONT_SMALL, text_color=SUCCESS, anchor="w")
                lbl_dt.pack(fill="x")

                lbl_notes = ctk.CTkLabel(txt_frame, text=f'Notes: "{vis.notes or "No notes submitted."}"', font=FONT_SMALL, text_color=TEXT_MAIN, anchor="w")
                lbl_notes.pack(fill="x")

                # Action Toggles
                actions_f = ctk.CTkFrame(card, fg_color="transparent")
                actions_f.pack(side="right", padx=15, pady=12)

                btn_comp = ctk.CTkButton(actions_f, text="Mark Compl.", fg_color=SUCCESS, hover_color="#27ae60", font=FONT_SMALL, width=95, command=lambda app_id=vis.id: self._change_status_refresh(app_id, "completed"))
                btn_comp.pack(pady=2)

                btn_canc = ctk.CTkButton(actions_f, text="Cancel visit", fg_color=ACCENT, hover_color="#c0392b", font=FONT_SMALL, width=95, command=lambda app_id=vis.id: self._change_status_refresh(app_id, "cancelled"))
                btn_canc.pack(pady=2)

                btn_del = ctk.CTkButton(actions_f, text="Delete", fg_color="#34495E", hover_color="#2c3e50", font=FONT_SMALL, width=95, command=lambda app_id=vis.id: [self.app_ctrl.delete_appointment(app_id), self.refresh()])
                btn_del.pack(pady=2)

    def _change_status_refresh(self, app_id, status_new):
        self.app_ctrl.update_status(app_id, status_new)
        self.refresh()

    def _open_add_modal(self):
        popup = ctk.CTkToplevel(self)
        popup.title("Clinical Consultation Appointment Form")
        popup.geometry("450x580")
        popup.configure(fg_color=BG_CARD)
        popup.wait_visibility()
        popup.grab_set()

        lbl_hdr = ctk.CTkLabel(popup, text="Plan specialist clinic", font=FONT_HEADING, text_color=TEXT_MAIN)
        lbl_hdr.pack(pady=15)

        scroll = ctk.CTkScrollableFrame(popup, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=15, pady=(0,15))

        lbl_doc = ctk.CTkLabel(scroll, text="Physician Full Name *:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_doc.pack(fill="x", pady=(5,0))
        entry_doc = ctk.CTkEntry(scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_doc.pack(fill="x", pady=2)

        lbl_spec = ctk.CTkLabel(scroll, text="Medical Specialization (e.g. Cardiologist):", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_spec.pack(fill="x", pady=(5,0))
        entry_spec = ctk.CTkEntry(scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_spec.pack(fill="x", pady=2)

        lbl_hosp = ctk.CTkLabel(scroll, text="Hospital Venue Clinic Center *:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_hosp.pack(fill="x", pady=(5,0))
        entry_hosp = ctk.CTkEntry(scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_hosp.pack(fill="x", pady=2)

        lbl_dt = ctk.CTkLabel(scroll, text="Appointment Date (YYYY-MM-DD):", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_dt.pack(fill="x", pady=(5,0))
        entry_dt = ctk.CTkEntry(scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_dt.pack(fill="x", pady=2)
        entry_dt.insert(0, (datetime.date.today() + datetime.timedelta(days=2)).strftime("%Y-%m-%d"))

        lbl_tm = ctk.CTkLabel(scroll, text="Scheduled hour (e.g. 14:30):", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_tm.pack(fill="x", pady=(5,0))
        entry_tm = ctk.CTkEntry(scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_tm.pack(fill="x", pady=2)
        entry_tm.insert(0, "11:00")

        lbl_type = ctk.CTkLabel(scroll, text="Consultation channel type:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_type.pack(fill="x", pady=(5,0))
        opt_type = ctk.CTkOptionMenu(scroll, values=["in_person", "video"], fg_color=BG_DARK, button_color=PRIMARY)
        opt_type.pack(fill="x", pady=2)

        lbl_rem = ctk.CTkLabel(scroll, text="Buffer Notification Reminder (Minutes before):", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_rem.pack(fill="x", pady=(5,0))
        entry_rem = ctk.CTkEntry(scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_rem.pack(fill="x", pady=2)
        entry_rem.insert(0, "60")

        lbl_notes = ctk.CTkLabel(scroll, text="Specific clinic requirements notes:", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_notes.pack(fill="x", pady=(5,0))
        entry_notes = ctk.CTkEntry(scroll, fg_color=BG_DARK, border_color="#2c2c3c")
        entry_notes.pack(fill="x", pady=2)

        # Buttons
        btn_f = ctk.CTkFrame(scroll, fg_color="transparent")
        btn_f.pack(fill="x", pady=20)

        ctk.CTkButton(btn_f, text="Cancel", fg_color="#34495E", hover_color="#2c3e50", font=FONT_BODY, command=popup.destroy).pack(side="left", fill="x", expand=True, padx=(0,5))

        def commit_new_appt():
            doc = entry_doc.get()
            hosp = entry_hosp.get()
            if not doc or not hosp: return
            
            ap = Appointment()
            ap.doctor_name = doc
            ap.specialization = entry_spec.get()
            ap.hospital = hosp
            ap.date = entry_dt.get()
            ap.time = entry_tm.get()
            ap.type = opt_type.get()
            ap.reminder_before = int(entry_rem.get())
            ap.notes = entry_notes.get()
            ap.status = "scheduled"

            self.app_ctrl.save_appointment(ap)
            popup.destroy()
            self.refresh()

        ctk.CTkButton(btn_f, text="Schedule Booking", fg_color=PRIMARY, hover_color="#0b5e5e", font=FONT_BODY, command=commit_new_appt).pack(side="right", fill="x", expand=True, padx=(5,0))
