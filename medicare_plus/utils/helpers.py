# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import datetime
import calendar
import math
import sys

def calculate_bmi(height_cm, weight_kg):
    if not height_cm or not weight_kg:
        return 0, "N/A"
    
    height_m = height_cm / 100.0
    bmi = weight_kg / (height_m * height_m)
    bmi_rounded = round(bmi, 1)
    
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25.0:
        category = "Normal"
    elif bmi < 30.0:
        category = "Overweight"
    else:
        category = "Obese"
        
    return bmi_rounded, category

def get_current_date_str():
    return datetime.date.today().strftime("%Y-%m-%d")

def format_time_str(time_str, use_24h=True):
    try:
        t = datetime.datetime.strptime(time_str, "%H:%M")
        if use_24h:
            return t.strftime("%H:%M")
        return t.strftime("%I:%M %p")
    except ValueError:
        return time_str

def trigger_beeps():
    """Generates a pleasant warning tone through platform specific buzzers."""
    try:
        if sys.platform == "win32":
            import winsound
            winsound.Beep(880, 250)
            winsound.Beep(1100, 200)
        else:
            # Unix-like, fall back to print bell or synthesize with pygame if mixer active
            print("\a", end="")
    except Exception:
        pass
