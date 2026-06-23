# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
"""
from plyer import notification
import sys
import os

class NotificationService:
    @staticmethod
    def show_alert(title, message, app_name="MediCare+"):
        """Displays native desktop tray chimes using plyer."""
        try:
            # Locate logo file if present
            current_dir = os.path.dirname(os.path.abspath(__file__))
            logo_path = os.path.join(os.path.dirname(current_dir), "assets", "logo.png")
            if not os.path.exists(logo_path):
                logo_path = None
            
            notification.notify(
                title=title,
                message=message,
                app_name=app_name,
                app_icon=logo_path if sys.platform == "win32" else None, # plyer icon is win32 specific
                timeout=10 # seconds
            )
        except Exception as e:
            # Fallback output to standard stdout diagnostics logging
            print(f"[Fallback Notification Alert] TITLE: {title} | MSG: {message} | Error: {str(e)}")
