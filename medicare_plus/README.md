# MediCare+ : Medicine Reminder & Health Tracker Desktop Application

A modern, highly-polished cross-platform desktop application designed in **Python 3.11+** utilizing **CustomTkinter** for modern widget aesthetics, embedded **SQLite3** databases, robust background **scheduling/threading daemon** routines, **plyer** system notification feeds, and **reportlab** PDF report compile services.

## Visual Themes
- **Appearance Mode**: Dark & Light support (Default: eye-safe Deep Slate space dark theme)
- **Palette**:
  - `PRIMARY`: Deep Emerald Teal (`#0D6E6E`)
  - `ACCENT`: Vibrant Coral Accent (`#FF6B6B`)
  - `SUCCESS`: Soft Compliance Green (`#2ECC71`)
  - `WARNING`: High Priority Amber (`#F39C12`)

---

## Installation & Setup

1. **Clone or Extract** this medicare_plus directories.
2. **Setup Dependencies**: Ensure Python 3.11+ is installed. Execute package restoration:
   ```bash
   pip install -r requirements.txt
   ```
3. **Launch Desktop client**:
   ```bash
   python main.py
   ```

---

## Complete Project Directories Layout

- `main.py`: Bootstrapper loading main frame view, notification listeners and threads.
- `database/`: Hold `db_manager.py` SQLite engine creating medicine, appointments, lab scans, and compliance journal tables.
- `models/`: Domain record classes (`medicine.py`, `appointment.py`, `reminder.py`, `health_record.py`).
- `views/`: Layout frames (`dashboard.py`, `medicine_view.py`, `appointments_view.py`, `health_records_view.py`, `reminder_view.py`, `settings_view.py`).
- `controllers/`: MVC coordinators linking logic to SQLite transactions.
- `services/`: Operations layer (`scheduler_service.py`, `notification_service.py`, `export_service.py` for CSV/PDFs, `chart_service.py` for matplotlib plots).
- `utils/`: Constants, demo-seeding feeds, and helper utility coordinates.
