# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import os
import csv
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from database.db_manager import DatabaseManager

class ExportService:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    def export_table_to_csv(self, table_name, output_filepath):
        """Standard built-in CSV export handler."""
        rows = self.db.fetch_all(f"SELECT * FROM {table_name};")
        if not rows:
            print(f"[Export Warn] Cannot export {table_name} - table empty.")
            return False

        headers = list(rows[0].keys())
        try:
            with open(output_filepath, mode='w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file, quoting=csv.QUOTE_MINIMAL)
                writer.writerow(headers)
                for row in rows:
                    writer.writerow([row[head] for head in headers])
            return True
        except Exception as e:
            print(f"[CSV Export Error] {str(e)}")
            return False

    def export_full_health_pdf(self, output_pdf_path):
        """Assembles a polished Reportlab clinic wellness portfolio."""
        try:
            # 1. Gather all database records
            profile = self.db.fetch_one("SELECT * FROM health_profile LIMIT 1;")
            medicines = self.db.fetch_all("SELECT * FROM medicines ORDER BY name ASC;")
            vitals = self.db.fetch_all("SELECT * FROM vitals ORDER BY reading_time DESC LIMIT 20;")
            appointments = self.db.fetch_all("SELECT * FROM appointments ORDER BY date DESC;")

            if not profile:
                profile = {"name": "Alex Mercer", "age": 35, "gender": "Male", "blood_type": "O+", "height": 180, "weight": 78, "allergies": "[]", "conditions": "[]", "emergency_contact": "Sarah Mercer", "emergency_phone": "+1"}

            # Setup document
            doc = SimpleDocTemplate(output_pdf_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
            story = []

            # Setup styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#0D6E6E'),
                spaceAfter=12,
                alignment=1 # Center
            )
            sub_style = ParagraphStyle(
                'SubStyle',
                parent=styles['Normal'],
                fontSize=12,
                textColor=colors.HexColor('#FF6B6B'),
                spaceAfter=20,
                alignment=1
            )
            sec_style = ParagraphStyle(
                'SecStyle',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#0D6E6E'),
                spaceBefore=12,
                spaceAfter=6
            )
            body_style = styles['Normal']

            # Page 1: COVER HEADER
            story.append(Paragraph("<b>MEDICARE+ HEALTH DOSSIER</b>", title_style))
            story.append(Paragraph("Comprehensive Patient Wellness Profile and Clinical Analytics Log", sub_style))
            story.append(Spacer(1, 15))

            # Table of Patient details
            p_data = [
                ["Patient Demographics", "Biometric Details", "Emergency Contacts"],
                [f"Name: {profile['name']}\nAge: {profile['age']}\nGender: {profile['gender']}",
                 f"Blood Group: {profile['blood_type']}\nHeight: {profile['height']} cm\nWeight: {profile['weight']} kg",
                 f"Contact: {profile['emergency_contact']}\nPhone: {profile['emergency_phone']}"]
            ]
            
            p_table = Table(p_data, colWidths=[180, 180, 180])
            p_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0D6E6E')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('TEXTCOLOR', (0,1), (-1,-1), colors.black),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#A0A0B0')),
            ]))
            story.append(p_table)
            story.append(Spacer(1, 20))

            # Page 1 section 2: ACTIVE MEDICATIONS TABLE
            story.append(Paragraph("<b>Active Medications Schedule</b>", sec_style))
            m_rows = [["Medicine Name", "Category", "Dosage", "Schedule times", "Relation"]]
            for m in medicines:
                times_list = json.loads(m["times"]) if m["times"] else []
                m_rows.append([m["name"], m["type"], m["dosage"], ", ".join(times_list), m["meal_relation"]])

            m_table = Table(m_rows, colWidths=[120, 90, 80, 130, 110])
            m_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#16213E')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#A0A0B0')),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('TOPPADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(m_table)
            story.append(PageBreak()) # Push records to page 2

            # Page 2: VITALS LOG & CLINIC APPOINTMENTS DB
            story.append(Paragraph("<b>Bio-Medical Vitals Register (Recent 20 Logs)</b>", sec_style))
            v_rows = [["Vital Type", "Value Entry", "Unit", "Logged Time", "Observations / Notes"]]
            for v in vitals:
                val_str = f"{v['value1']}" + (f" / {v['value2']}" if v['value2'] else '')
                v_rows.append([v["type"].upper(), val_str, v["unit"], v["reading_time"], v["notes"]])

            v_table = Table(v_rows, colWidths=[85, 90, 60, 115, 180])
            v_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#16213E')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#A0A0B0')),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('TOPPADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(v_table)
            story.append(Spacer(1, 20))

            story.append(Paragraph("<b>Physician Consultations Register</b>", sec_style))
            a_rows = [["Doctor", "Specialization", "Hospital / Lab Centre", "Date & Hour", "Status"]]
            for a in appointments:
                a_rows.append([a["doctor_name"], a["specialization"], a["hospital"], f"{a['date']} {a['time']}", a["status"].upper()])

            a_table = Table(a_rows, colWidths=[120, 100, 140, 100, 70])
            a_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0D6E6E')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#A0A0B0')),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('TOPPADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(a_table)

            # Build PDF Document
            doc.build(story)
            print(f"[Scheduler Report] PDF compilation created at output: {output_pdf_path}")
            return True
        except Exception as e:
            print(f"[PDF Compilation Error] {str(e)}")
            return False
