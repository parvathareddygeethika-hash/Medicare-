# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
class Reminder:
    def __init__(self, id=None, type="medicine", reference_id=None, message="",
                 scheduled_time="", status="pending", snooze_until=None, created_at=None):
        self.id = id
        self.type = type # medicine / appointment / refill / checkup
        self.reference_id = reference_id
        self.message = message
        self.scheduled_time = scheduled_time
        self.status = status # pending / sent / snoozed / dismissed
        self.snooze_until = snooze_until
        self.created_at = created_at
