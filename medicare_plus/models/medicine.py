# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import json

class Medicine:
    def __init__(self, id=None, name="", type="Tablet", dosage="", frequency="Daily",
                 times=None, meal_relation="With Meal", start_date="", end_date="",
                 notes="", color="#0D6E6E", refill_alert_days=7, is_active=1, created_at=None):
        self.id = id
        self.name = name
        self.type = type
        self.dosage = dosage
        self.frequency = frequency
        self.times = times if times else ["08:00"] # Python list of strings
        self.meal_relation = meal_relation
        self.start_date = start_date
        self.end_date = end_date
        self.notes = notes
        self.color = color
        self.refill_alert_days = refill_alert_days
        self.is_active = is_active
        self.created_at = created_at

    def get_times_json(self):
        return json.dumps(self.times)

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row.get("id"),
            name=row.get("name"),
            type=row.get("type"),
            dosage=row.get("dosage"),
            frequency=row.get("frequency"),
            times=json.loads(row.get("times")) if row.get("times") else ["08:00"],
            meal_relation=row.get("meal_relation"),
            start_date=row.get("start_date"),
            end_date=row.get("end_date"),
            notes=row.get("notes"),
            color=row.get("color"),
            refill_alert_days=row.get("refill_alert_days"),
            is_active=row.get("is_active"),
            created_at=row.get("created_at")
        )
