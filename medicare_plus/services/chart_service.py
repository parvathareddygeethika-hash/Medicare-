# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import matplotlib
matplotlib.use("TkAgg") # Set backend matching tkinter environment
from matplotlib.figure import Figure
import numpy as np

class ChartService:
    @staticmethod
    def create_vitals_line_chart(readings_list, vital_type="bp"):
        """Vitals line chart with normal/warning background bands."""
        fig = Figure(figsize=(5.5, 3.2), dpi=100)
        ax = fig.add_subplot(111)
        
        # Set dark visual chart theme matching BG_CARD (#16213E)
        fig.patch.set_facecolor("#16213E")
        ax.set_facecolor("#1A1A2E")
        ax.tick_params(colors="#A0A0B0", labelsize=8)
        ax.tick_params(axis='x', rotation=25)
        ax.grid(True, color="#2b2b4d", linestyle="--")
        
        if not readings_list:
            ax.text(0.5, 0.5, "No Measurements Data Registered\nEnter readings to plot chart.", 
                    color="#A0A0B0", ha="center", va="center", transform=ax.transAxes)
            return fig

        # Extract values
        times = [r["reading_time"].split(" ")[0] for r in readings_list][::-1] # reverse to chronological
        vals1 = [float(r["value1"]) for r in readings_list][::-1]

        if vital_type == "bp":
            vals2 = [float(r["value2"]) for r in readings_list if r["value2"]][::-1]
            ax.plot(times, vals1, label="Systolic", color="#FF6B6B", marker="o", linewidth=2)
            if len(vals2) == len(vals1):
                ax.plot(times, vals2, label="Diastolic", color="#3498DB", marker="s", linewidth=2)
            
            # Fill Normal Range Zone (diastolic 60-80, systolic 90-120)
            ax.axhspan(60, 120, color="#2ECC71", alpha=0.08, label="Normal Band")
            ax.set_ylabel("Blood Pressure (mmHg)", color="#A0A0B0", fontsize=9)
        elif vital_type == "sugar":
            ax.plot(times, vals1, label="Glucose", color="#0D6E6E", marker="o", linewidth=2)
            # Normal fasting (70-100)
            ax.axhspan(70, 100, color="#2ECC71", alpha=0.08, label="Healthy fasting")
            ax.set_ylabel("Blood Glucose (mg/dL)", color="#A0A0B0", fontsize=9)
        else:
            ax.plot(times, vals1, label=vital_type.upper(), color="#F39C12", marker="^", linewidth=2)
            ax.set_ylabel(vital_type.upper(), color="#A0A0B0", fontsize=9)

        ax.legend(facecolor="#16213E", edgecolor="#2b2b4d", labelcolor="#EAEAEA", fontsize=7)
        fig.tight_layout()
        return fig

    @staticmethod
    def create_weekly_adherence_bar(week_logs):
        """Compliance levels per day bar chart."""
        fig = Figure(figsize=(5.5, 2.8), dpi=100)
        ax = fig.add_subplot(111)
        
        fig.patch.set_facecolor("#16213E")
        ax.set_facecolor("#1A1A2E")
        ax.tick_params(colors="#A0A0B0", labelsize=8)
        
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        taken_counts = [0] * 7
        missed_counts = [0] * 7

        # Accumulate stats from logs
        for log in week_logs:
            try:
                # Convert date text to weekdays
                date_obj = np.datetime64(log["date"]).astype(object)
                day_idx = date_obj.weekday()
                if log["status"] == "taken" or log["status"] == "skipped":
                    taken_counts[day_idx] += 1
                else:
                    missed_counts[day_idx] += 1
            except Exception:
                pass

        x = np.arange(len(days))
        width = 0.35

        ax.bar(x - width/2, taken_counts, width, label='Taken/Hold', color='#2ECC71')
        ax.bar(x + width/2, missed_counts, width, label='Missed', color='#FF6B6B')
        
        ax.set_xticks(x)
        ax.set_xticklabels(days)
        ax.set_ylabel("Reminders Counts", color="#A0A0B0", fontsize=9)
        ax.legend(facecolor="#16213E", edgecolor="#2b2b4d", labelcolor="#EAEAEA", fontsize=7)
        ax.grid(True, color="#2b2b4d", linestyle=":", axis="y")
        fig.tight_layout()
        return fig

    @staticmethod
    def create_pie_compliance(summary_dict):
        """Pie chart indicating taken vs missed vs skipped."""
        fig = Figure(figsize=(3.5, 2.5), dpi=100)
        ax = fig.add_subplot(111)
        
        fig.patch.set_facecolor("#16213E")
        ax.set_facecolor("#1A1A2E")
        
        labels = ['Taken', 'Missed', 'Skipped']
        sizes = [summary_dict.get('taken', 0), summary_dict.get('missed', 0), summary_dict.get('skipped', 0)]
        colors_list = ['#2ECC71', '#FF6B6B', '#F39C12']

        # Filter out 0 value elements to prevent matplotlib warnings
        non_zero = [(l, s, c) for l, s, c in zip(labels, sizes, colors_list) if s > 0]
        if not non_zero:
            ax.text(0.5, 0.5, "No Adherence Logs Found", color="#A0A0B0", ha="center", va="center", transform=ax.transAxes)
            return fig

        labels, sizes, colors_list = zip(*non_zero)
        
        wedges, texts, autotexts = ax.pie(sizes, labels=labels, colors=colors_list, autopct='%1.1f%%',
                                          startangle=140, textprops=dict(color="#EAEAEA", fontsize=8))
        
        # Set colors of labels
        for t in texts:
            t.set_color("#A0A0B0")
        
        ax.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
        fig.tight_layout()
        return fig
