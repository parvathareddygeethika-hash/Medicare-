# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
class Appointment:
    def __init__(self, id=None, doctor_name="", specialization="", hospital="",
                 date="", time="", type="in_person", status="scheduled",
                 reminder_before=60, notes="", prescription_path="", created_at=None):
        self.id = id
        self.doctor_name = doctor_name
        self.specialization = specialization
        self.hospital = hospital
        self.date = date
        self.time = time
        self.type = type # in_person / video
        self.status = status # scheduled / completed / cancelled
        self.reminder_before = reminder_before
        self.notes = notes
        self.prescription_path = prescription_path
        self.created_at = created_at

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row.get("id"),
            doctor_name=row.get("doctor_name"),
            specialization=row.get("specialization"),
            hospital=row.get("hospital"),
            date=row.get("date"),
            time=row.get("time"),
            type=row.get("type"),
            status=row.get("status"),
            reminder_before=row.get("reminder_before"),
            notes=row.get("notes"),
            prescription_path=row.get("prescription_path"),
            created_at=row.get("created_at")
        )
