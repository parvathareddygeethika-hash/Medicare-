# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import customtkinter as ctk
import os
from utils.constants import PRIMARY, ACCENT, SUCCESS, WARNING, BG_DARK, BG_CARD, TEXT_MAIN, TEXT_SUB, FONT_HEADING, FONT_SUBHEAD, FONT_BODY, FONT_SMALL, FONT_MONO
from services.export_service import ExportService

class SettingsView(ctk.CTkFrame):
    def __init__(self, parent, db_manager, export_service):
        super().__init__(parent, fg_color=BG_DARK)
        self.db = db_manager
        self.exp_srv = export_service

        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self._create_widgets()

    def _create_widgets(self):
        # 1. Title Area Header
        self.hdr = ctk.CTkFrame(self, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.hdr.grid(row=0, column=0, sticky="ew", padx=15, pady=10)
        self.hdr.grid_columnconfigure(0, weight=1)

        lbl_t = ctk.CTkLabel(self.hdr, text="MediCare+ Control Panel Console", font=FONT_HEADING, text_color=TEXT_MAIN, anchor="w")
        lbl_t.pack(anchor="w", padx=20, pady=(15, 2))

        lbl_s = ctk.CTkLabel(self.hdr, text="Choose units, manage localized database chimes, output patient logs, and audit clinical reports.", font=FONT_BODY, text_color=TEXT_SUB, anchor="w")
        lbl_s.pack(anchor="w", padx=20, pady=(0, 15))

        # 2. Main content area scroll
        self.scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll.grid(row=1, column=0, sticky="nsew", padx=15, pady=(0, 15))
        self.scroll.grid_columnconfigure(0, weight=1)
        self.scroll.grid_columnconfigure(1, weight=1)

        # Pane Left: Unit & layout config
        self.left_box = ctk.CTkFrame(self.scroll, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.left_box.grid(row=0, column=0, sticky="nsew", padx=(0,7), pady=5)
        self.left_box.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(self.left_box, text="System Preferences", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w").grid(row=0, column=0, sticky="w", padx=20, pady=15)

        # Theme Switcher ctk
        ctk.CTkLabel(self.left_box, text="Visual Aesthetic Mode Theme:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=1, column=0, sticky="w", padx=20, pady=(5,0))
        self.opt_theme = ctk.CTkOptionMenu(
            self.left_box, 
            values=["System Defaults", "Dark Slate Space", "Clinical light Mode"], 
            fg_color=BG_DARK, 
            button_color=PRIMARY,
            command=self._adjust_aesthetic_theme
        )
        self.opt_theme.grid(row=2, column=0, sticky="ew", padx=20, pady=5)
        self.opt_theme.set("Dark Slate Space")

        # Weight Scale Switcher
        ctk.CTkLabel(self.left_box, text="Body Mass Representation unit:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=3, column=0, sticky="w", padx=20, pady=(10,0))
        self.opt_weight = ctk.CTkOptionMenu(self.left_box, values=["kg (Metric Standards)", "lbs (Imperial Scale)"], fg_color=BG_DARK, button_color=PRIMARY, command=lambda v: self._update_settings_key("weight_unit", "kg" if "kg" in v else "lbs"))
        self.opt_weight.grid(row=4, column=0, sticky="ew", padx=20, pady=5)

        # Thermal Unit Switcher
        ctk.CTkLabel(self.left_box, text="Fever thermal level parameters:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=5, column=0, sticky="w", padx=20, pady=(10,0))
        self.opt_temp = ctk.CTkOptionMenu(self.left_box, values=["Celsius (C)", "Fahrenheit (F)"], fg_color=BG_DARK, button_color=PRIMARY, command=lambda v: self._update_settings_key("temp_unit", "C" if "C" in v else "F"))
        self.opt_temp.grid(row=6, column=0, sticky="ew", padx=20, pady=5)

        # Hour System Switcher
        ctk.CTkLabel(self.left_box, text="Time formatting selection:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=7, column=0, sticky="w", padx=20, pady=(10,0))
        self.opt_tf = ctk.CTkOptionMenu(self.left_box, values=["12h shorthand clock (AM/PM)", "Military 24h standard clock"], fg_color=BG_DARK, button_color=PRIMARY, command=lambda v: self._update_settings_key("time_format", "12h" if "12h" in v else "24h"))
        self.opt_tf.grid(row=8, column=0, sticky="ew", padx=20, pady=(5, 20))

        # Pane Right: Sharing, Exports & Maintenance
        self.right_box = ctk.CTkFrame(self.scroll, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.right_box.grid(row=0, column=1, sticky="nsew", padx=(7,0), pady=5)
        self.right_box.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(self.right_box, text="Data Portability & Maintenance", font=FONT_SUBHEAD, text_color=TEXT_MAIN, anchor="w").grid(row=0, column=0, sticky="w", padx=20, pady=15)

        # Export Buttons
        ctk.CTkLabel(self.right_box, text="Spreadsheet CSV Exports:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=1, column=0, sticky="w", padx=20, pady=(2,0))
        
        btn_box = ctk.CTkFrame(self.right_box, fg_color="transparent")
        btn_box.grid(row=2, column=0, sticky="ew", padx=20, pady=5)
        btn_box.grid_columnconfigure(0, weight=1)
        btn_box.grid_columnconfigure(1, weight=1)

        ctk.CTkButton(btn_box, text="Export Meds CSV", fg_color="#34495E", font=FONT_SMALL, command=lambda: self._trigger_csv_output("medicines")).grid(row=0, column=0, padx=(0,5), pady=2, sticky="ew")
        ctk.CTkButton(btn_box, text="Export Vitals CSV", fg_color="#34495E", font=FONT_SMALL, command=lambda: self._trigger_csv_output("vitals")).grid(row=0, column=1, padx=(5,0), pady=2, sticky="ew")
        ctk.CTkButton(btn_box, text="Export Alarms CSV", fg_color="#34495E", font=FONT_SMALL, command=lambda: self._trigger_csv_output("reminders")).grid(row=1, column=0, padx=(0,5), pady=2, sticky="ew")
        ctk.CTkButton(btn_box, text="Export Logs CSV", fg_color="#34495E", font=FONT_SMALL, command=lambda: self._trigger_csv_output("medicine_logs")).grid(row=1, column=1, padx=(5,0), pady=2, sticky="ew")

        # ReportLab PDF Export Command
        ctk.CTkLabel(self.right_box, text="Comprehensive Medical Document compiles:", font=FONT_BODY, text_color=TEXT_SUB).grid(row=3, column=0, sticky="w", padx=20, pady=(10,0))
        self.btn_pdf = ctk.CTkButton(self.right_box, text="Print Full PDF Wellness Dossier", fg_color=PRIMARY, hover_color="#0b5e5e", font=FONT_BODY, height=35, command=self._trigger_pdf_output)
        self.btn_pdf.grid(row=4, column=0, sticky="ew", padx=20, pady=5)

        # Danger zone Reset Box
        ctk.CTkLabel(self.right_box, text="System actions (Database Reset):", font=FONT_BODY, text_color=TEXT_SUB).grid(row=5, column=0, sticky="w", padx=20, pady=(15,0))
        self.btn_reset = ctk.CTkButton(self.right_box, text="Wipe Database & Seed Defaults", fg_color=ACCENT, hover_color="#c0392b", font=FONT_BODY, height=35, command=self._trigger_factory_wipe)
        self.btn_reset.grid(row=6, column=0, sticky="ew", padx=20, pady=(5, 20))

        # Row 2 (Span 2 Cols): Pyinstaller compilation specifications About Box
        self.about = ctk.CTkFrame(self.scroll, fg_color=BG_CARD, corner_radius=15, border_width=1, border_color="#2b2b4d")
        self.about.grid(row=1, column=0, columnspan=2, sticky="nsew", padx=0, pady=15)
        self.about.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(self.about, text="ℹ️ PyInstaller Packaging Guidelines (Compiler Instructions)", font=FONT_SUBHEAD, text_color=WARNING, anchor="w").pack(anchor="w", padx=20, pady=(15,5))

        package_text = (
            "This application uses localized SQLite3 tables, embedded Matplotlib graphics, and system Plyer buzzers.\n"
            "To package this source folder into a zero-dependency absolute executable, run the following PyInstaller terminal action:\n\n"
            "   pyinstaller --noconfirm --onedir --windowed --add-data \"database/medicare.db;database\" --add-data \"utils;utils\" main.py\n\n"
            "Medicare Systems Development Corporation © 2026. General Stable Release Build v1.4.0 (Apache-2.0 Platform License)."
        )
        lbl_msg = ctk.CTkLabel(self.about, text=package_text, font=FONT_BODY, text_color=TEXT_MAIN, justify="left", wraplength=550, anchor="w")
        lbl_msg.pack(anchor="w", padx=20, pady=(5, 15))

        self.refresh()

    def refresh(self):
        # Read from settings table to configure dropdown values
        try:
            wt_row = self.db.fetch_one("SELECT value FROM settings WHERE key='weight_unit';")
            tp_row = self.db.fetch_one("SELECT value FROM settings WHERE key='temp_unit';")
            tf_row = self.db.fetch_one("SELECT value FROM settings WHERE key='time_format';")

            if wt_row and wt_row["value"] == "lbs":
                self.opt_weight.set("lbs (Imperial Scale)")
            else:
                self.opt_weight.set("kg (Metric Standards)")

            if tp_row and tp_row["value"] == "F":
                self.opt_temp.set("Fahrenheit (F)")
            else:
                self.opt_temp.set("Celsius (C)")

            if tf_row and tf_row["value"] == "24h":
                self.opt_tf.set("Military 24h standard clock")
            else:
                self.opt_tf.set("12h shorthand clock (AM/PM)")
        except Exception:
            pass

    def _adjust_aesthetic_theme(self, selection):
        if "Dark" in selection:
            ctk.set_appearance_mode("dark")
            self._update_settings_key("theme", "dark")
        elif "Light" in selection:
            ctk.set_appearance_mode("light")
            self._update_settings_key("theme", "light")
        else:
            ctk.set_appearance_mode("system")
            self._update_settings_key("theme", "system")

    def _update_settings_key(self, key, value):
        self.db.execute_query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);", (key, value))

    def _trigger_csv_output(self, table_name):
        home_dir = os.path.expanduser("~")
        output_f = os.path.join(home_dir, f"medicare_export_{table_name}.csv")
        success = self.exp_srv.export_table_to_csv(table_name, output_f)
        if success:
            print(f"[Controls Settings] Successful CSV write located at: {output_f}")
            # Visual feedback helper box trigger

    def _trigger_pdf_output(self):
        home_dir = os.path.expanduser("~")
        output_f = os.path.join(home_dir, "medicare_patient_wellness_dossier.pdf")
        success = self.exp_srv.export_full_health_pdf(output_f)
        if success:
            print(f"[Controls Settings] Successful Wellness Dossier compiled at: {output_f}")

    def _trigger_factory_wipe(self):
        # Fully clears database and triggers re-seed
        self.db.execute_query("DROP TABLE IF EXISTS medicines;")
        self.db.execute_query("DROP TABLE IF EXISTS medicine_logs;")
        self.db.execute_query("DROP TABLE IF EXISTS appointments;")
        self.db.execute_query("DROP TABLE IF EXISTS vitals;")
        self.db.execute_query("DROP TABLE IF EXISTS health_profile;")
        self.db.execute_query("DROP TABLE IF EXISTS lab_reports;")
        self.db.execute_query("DROP TABLE IF EXISTS health_notes;")
        self.db.execute_query("DROP TABLE IF EXISTS reminders;")
        self.db.execute_query("DROP TABLE IF EXISTS settings;")
        # Redraw
        self.db._initialize_database()
        from utils.demo_data import seed_demo_data
        seed_demo_data(self.db)
        self.refresh()
