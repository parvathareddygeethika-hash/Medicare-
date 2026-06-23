# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
import json

class Vital:
    def __init__(self, id=None, type="bp", value1=0.0, value2=None, unit="", reading_time="", notes="", date=""):
        self.id = id
        self.type = type # bp/sugar/heart_rate/weight/temp/spo2
        self.value1 = value1
        self.value2 = value2
        self.unit = unit
        self.reading_time = reading_time
        self.notes = notes
        self.date = date

class LabReport:
    def __init__(self, id=None, title="", date="", doctor="", file_path="", notes="", created_at=None):
        self.id = id
        self.title = title
        self.date = date
        self.doctor = doctor
        self.file_path = file_path
        self.notes = notes
        self.created_at = created_at

class HealthNote:
    def __init__(self, id=None, date="", mood=3, symptoms=None, note="", created_at=None):
        self.id = id
        self.date = date
        self.mood = mood # 1-5 scalar
        self.symptoms = symptoms if symptoms else []
        self.note = note
        self.created_at = created_at

    def get_symptoms_json(self):
        return json.dumps(self.symptoms)
