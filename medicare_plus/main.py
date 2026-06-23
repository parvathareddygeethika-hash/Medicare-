# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import customtkinter as ctk
import os
import sys

# Include local folder in sys path for clean importing routines
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db_manager import DatabaseManager
from utils.demo_data import seed_demo_data
from utils.constants import PRIMARY, ACCENT, SUCCESS, WARNING, BG_DARK, BG_CARD, TEXT_MAIN, TEXT_SUB, FONT_HEADING
from controllers.medicine_controller import MedicineController
from controllers.appointment_controller import AppointmentController
from controllers.health_controller import HealthController
from controllers.reminder_controller import ReminderController
from services.scheduler_service import SchedulerService
from services.export_service import ExportService

# View Frames
from views.dashboard import DashboardView
from views.medicine_view import MedicineView
from views.reminder_view import ReminderView
from views.health_records_view import HealthRecordsView
from views.appointments_view import AppointmentsView
from views.settings_view import SettingsView

class MedicarePlusApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Set default appearance
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # Layout geometries
        self.title("MediCare+ : Medicine Reminder & Health Tracker Suite")
        self.geometry("1100x720")
        self.minsize(1000, 680)

        # 1. Initialize databases and seed mockup data on first load
        self.db_manager = DatabaseManager()
        seed_demo_data(self.db_manager)

        # 2. Instantiate MVC controllers
        self.med_ctrl = MedicineController(self.db_manager)
        self.app_ctrl = AppointmentController(self.db_manager)
        self.health_ctrl = HealthController(self.db_manager)
        self.rem_ctrl = ReminderController(self.db_manager)

        # 3. Dedicated operations services
        self.export_service = ExportService(self.db_manager)
        self.scheduler_service = SchedulerService(self.db_manager)
        self.scheduler_service.start()

        # Handle clean onClose routines
        self.protocol("WM_DELETE_WINDOW", self._on_close_cleanup)

        # Structure layout gird coordinates
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)

        self._build_sidebar()
        self._build_content_canvas()

        # Load home dashboard initially
        self.switch_viewport("dashboard")

    def _build_sidebar(self):
        # Navigation Sidebar Frame (Left Pane)
        self.sidebar = ctk.CTkFrame(self, width=220, fg_color=BG_CARD, corner_radius=0, border_width=1, border_color="#222238")
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_propagate(False)

        # App Identity Branding
        self.lbl_brand = ctk.CTkLabel(self.sidebar, text="🏥 MediCare+", font=("Segoe UI", 20, "bold"), text_color=SUCCESS)
        self.lbl_brand.pack(pady=(25, 2))
        
        self.lbl_subtitle = ctk.CTkLabel(self.sidebar, text="Patient Wellness Portal", font=("Segoe UI", 10, "bold"), text_color=TEXT_SUB)
        self.lbl_subtitle.pack(pady=(0, 25))

        # Nav menu links
        self.nav_buttons = {}
        nav_specs = [
            ("dashboard", "📊 General Dashboard"),
            ("medicines", "💊 Medication Planner"),
            ("records", "📋 Health Vault"),
            ("appointments", "📅 Consultations"),
            ("alerts", "⏰ Alert Reminders"),
            ("settings", "🔧 Control Panel Settings"),
        ]

        for tab_id, label in nav_specs:
            btn = ctk.CTkButton(
                self.sidebar, 
                text=label, 
                font=("Segoe UI", 12, "bold"),
                anchor="w",
                fg_color="transparent",
                text_color=TEXT_SUB,
                hover_color="#1E293B",
                height=38,
                command=lambda tid=tab_id: self.switch_viewport(tid)
            )
            btn.pack(fill="x", padx=15, pady=4)
            self.nav_buttons[tab_id] = btn

    def _build_content_canvas(self):
        # Interactive Content Canvas (Right Window Panel)
        self.content_canvas = ctk.CTkFrame(self, fg_color=BG_DARK, corner_radius=0)
        self.content_canvas.grid(row=0, column=1, sticky="nsew")
        self.content_canvas.grid_rowconfigure(0, weight=1)
        self.content_canvas.grid_columnconfigure(0, weight=1)

        # Prepare Views
        self.views_instances = {
            "dashboard": DashboardView(self.content_canvas, self.db_manager, self.med_ctrl, self.health_ctrl, self.app_ctrl, self.switch_viewport),
            "medicines": MedicineView(self.content_canvas, self.db_manager, self.med_ctrl),
            "records": HealthRecordsView(self.content_canvas, self.db_manager, self.health_ctrl),
            "appointments": AppointmentsView(self.content_canvas, self.db_manager, self.app_ctrl),
            "alerts": ReminderView(self.content_canvas, self.db_manager, self.rem_ctrl),
            "settings": SettingsView(self.content_canvas, self.db_manager, self.export_service),
        }

    def switch_viewport(self, tab_id):
        # Hide all view classes from grid placement
        for name, instance in self.views_instances.items():
            instance.grid_forget()

        # Update highlighted states of button triggers
        for name, btn in self.nav_buttons.items():
            if name == tab_id:
                btn.configure(fg_color=PRIMARY, text_color=TEXT_MAIN)
            else:
                btn.configure(fg_color="transparent", text_color=TEXT_SUB)

        # Place target frame and call its refresh routine
        target_f = self.views_instances.get(tab_id)
        if target_f:
            target_f.grid(row=0, column=0, sticky="nsew")
            target_f.refresh()

    def _on_close_cleanup(self):
        # Terminate thread
        self.scheduler_service.stop()
        self.destroy()
        print("[Launcher Cleanup] Database instances isolated. Scheduler killed safely.")

if __name__ == "__main__":
    app = MedicarePlusApp()
    app.mainloop()
