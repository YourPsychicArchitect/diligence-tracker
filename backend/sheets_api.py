from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import datetime
import os
from loguru import logger

# Update scopes to include Drive API access
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]
SERVICE_ACCOUNT_FILE = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', 'credentials.json')

class SheetsAPI:
    def __init__(self):
        self.creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        self.sheets_service = build('sheets', 'v4', credentials=self.creds)
        self.drive_service = build('drive', 'v3', credentials=self.creds)
        self.admin_email = "joshua@yourpsychicarchitect.com"
        self.master_sheet_id = self.get_or_create_master_sheet()

    def share_spreadsheet(self, spreadsheet_id, email):
        try:
            self.drive_service.permissions().create(
                fileId=spreadsheet_id,
                body={
                    'type': 'user',
                    'role': 'writer',
                    'emailAddress': email
                },
                sendNotificationEmail=False
            ).execute()
            return True
        except HttpError as error:
            logger.exception("error sharing spreadsheet")
            return False

    def get_or_create_master_sheet(self):
        try:
            # Try to find an existing master sheet by name
            results = self.drive_service.files().list(
                q="name='Diligence Tracker Master Sheet' and mimeType='application/vnd.google-apps.spreadsheet'",
                spaces='drive'
            ).execute()
            
            files = results.get('files', [])
            
            if files:
                # Use existing master sheet
                sheet_id = files[0]['id']
            else:
                # Create new master sheet
                spreadsheet = self.sheets_service.spreadsheets().create(body={
                    'properties': {'title': 'Diligence Tracker Master Sheet'}
                }).execute()
                sheet_id = spreadsheet['spreadsheetId']
                
                # Initialize the master sheet with headers
                self.sheets_service.spreadsheets().values().update(
                    spreadsheetId=sheet_id,
                    range='A1:C1',
                    valueInputOption='RAW',
                    body={'values': [['Email', 'Spreadsheet ID', 'Timezone']]}
                ).execute()

            # Share the master sheet with admin
            self.share_spreadsheet(sheet_id, self.admin_email)
            return sheet_id

        except HttpError as error:
            print(f"An error occurred creating master sheet: {error}")
            return None

    def get_or_create_spreadsheet(self, email):
        try:
            # First check if user already has a spreadsheet
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=self.master_sheet_id,
                range='A:B'
            ).execute()
            
            values = result.get('values', [])
            
            # Skip header row
            for row in values[1:]:
                if row and row[0] == email:
                    return row[1]
            
            # If no existing spreadsheet, create new one
            new_spreadsheet = self.sheets_service.spreadsheets().create(body={
                'properties': {'title': f"Diligence Tracker - {email}"}
            }).execute()
            
            new_id = new_spreadsheet['spreadsheetId']
            
            # Add to master sheet
            self.sheets_service.spreadsheets().values().append(
                spreadsheetId=self.master_sheet_id,
                range='A:B',
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body={'values': [[email, new_id]]}
            ).execute()
            
            # Share with user and admin
            self.share_spreadsheet(new_id, email)
            self.share_spreadsheet(new_id, self.admin_email)
            
            return new_id

        except HttpError as error:
            logger.exception(error)
            return None

    def get_tasks(self, email):
        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            return []

        try:
            sheet_metadata = self.sheets_service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
            sheets = sheet_metadata.get('sheets', '')
            return [sheet['properties']['title'] for sheet in sheets]
        except HttpError as error:
            logger.exception(error)
            return []

    def get_entries(self, email, task):
        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            return []

        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id, range=f"{task}!A:A"
            ).execute()
            values = result.get('values', [])
            return [entry[0] for entry in values if entry]
        except HttpError as error:
            logger.exception(error)
            return []

    def add_entry(self, email, task):
        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            logger.error(f"Failed to add entry for {email}")
            return False

        try:
            # Ensure the task sheet exists
            self.sheets_service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={
                    "requests": [{
                        "addSheet": {
                            "properties": {"title": task}
                        }
                    }]
                }
            ).execute()
        except HttpError:
            # Sheet already exists, continue
            pass

        try:
            now = datetime.datetime.now().isoformat()
            self.sheets_service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range=f"{task}!A:A",
                valueInputOption="USER_ENTERED",
                body={"values": [[now]]}
            ).execute()
            return True
        except HttpError as error:
            logger.exception(error)
            return False

    def get_hourly_activity(self, email, task):
        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            logger.error(f"Failed to get spreadsheet for {email}")
            return None

        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id, range=f"{task}!A:A"
            ).execute()
            values = result.get('values', [])
            
            hourly_activity = [0] * 24
            for entry in values[1:]:  # Skip header row
                if entry:
                    hour = datetime.datetime.fromisoformat(entry[0]).hour
                    hourly_activity[hour] += 1
            
            return hourly_activity
        except HttpError as error:
            logger.exception(error)
            return None

    def get_statistics(self, email, task):
        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            logger.error(f"Failed to get spreadsheet for {email}")
            return None

        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id, range=f"{task}!A:A"
            ).execute()
            values = result.get('values', [])
            
            entries = [datetime.datetime.fromisoformat(entry[0]) for entry in values[1:] if entry]
            
            now = datetime.datetime.now()
            today = now.date()
            week_start = today - datetime.timedelta(days=today.weekday())
            month_start = today.replace(day=1)
            
            today_total = sum(1 for entry in entries if entry.date() == today)
            week_total = sum(1 for entry in entries if week_start <= entry.date() <= today)
            month_total = sum(1 for entry in entries if month_start <= entry.date() <= today)
            all_time_total = len(entries)
            
            week_data = [
                {"day": (week_start + datetime.timedelta(days=i)).strftime("%A"),
                 "count": sum(1 for entry in entries if entry.date() == week_start + datetime.timedelta(days=i))}
                for i in range(7)
            ]
            
            return {
                "today_total": today_total,
                "week_total": week_total,
                "month_total": month_total,
                "all_time_total": all_time_total,
                "week_data": week_data
            }
        except HttpError as error:
            logger.exception(error)
            return None

    def set_user_timezone(self, email, timezone):
        try:
            user_row = self.find_user_row(email)
            if user_row:
                self.sheets_service.spreadsheets().values().update(
                    spreadsheetId=self.master_sheet_id,
                    range=f'A{user_row}:C{user_row}',
                    valueInputOption='RAW',
                    body={'values': [[email, self.get_or_create_spreadsheet(email), timezone]]}
                ).execute()
            else:
                self.sheets_service.spreadsheets().values().append(
                    spreadsheetId=self.master_sheet_id,
                    range='A:C',
                    valueInputOption='RAW',
                    body={'values': [[email, self.get_or_create_spreadsheet(email), timezone]]}
                ).execute()
            return True
        except HttpError as error:
            logger.exception(error)
            return False

    def get_user_timezone(self, email):
        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=self.master_sheet_id,
                range='A:C'
            ).execute()
            values = result.get('values', [])
            for row in values:
                if row[0] == email:
                    return row[2] if len(row) > 2 else None
            logger.error(f"Timezone not found for {email}")
            return None
        except HttpError as error:
            logger.exception(error)
            return None

    def find_user_row(self, email):
        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=self.master_sheet_id,
                range='A:A'
            ).execute()
            values = result.get('values', [])
            for i, row in enumerate(values):
                if row[0] == email:
                    return i + 1
            logger.error(f"User not found: {email}")
            return None
        except HttpError as error:
            logger.exception(error)
            return None

    def update_task(self, email, old_task, new_task):
        try:
            spreadsheet_id = self.get_or_create_spreadsheet(email)
            if not spreadsheet_id:
                logger.error(f"Failed to get spreadsheet for {email}")
                return False

            # Rename the sheet
            sheet_id = self.get_sheet_id(spreadsheet_id, old_task)
            if sheet_id is None:
                logger.error(f"Failed to get sheet ID for {old_task}")
                return False

            body = {
                'requests': [{
                    'updateSheetProperties': {
                        'properties': {'sheetId': sheet_id, 'title': new_task},
                        'fields': 'title'
                    }
                }]
            }
            self.sheets_service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()

            # Share the spreadsheet with the user and admin
            self.share_spreadsheet(spreadsheet_id, email)
            self.share_spreadsheet(spreadsheet_id, self.admin_email)

            return True
        except HttpError as error:
            logger.exception(error)
            return False

    def get_spreadsheet_url(self, email):
        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            logger.error(f"Failed to get spreadsheet for {email}")
            return None
        return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"

    def get_sheet_id(self, spreadsheet_id, sheet_name):
        try:
            sheet_metadata = self.sheets_service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
            sheets = sheet_metadata.get('sheets', '')
            for sheet in sheets:
                if sheet['properties']['title'] == sheet_name:
                    return sheet['properties']['sheetId']
            logger.error(f"Sheet not found: {sheet_name}")
            return None
        except HttpError as error:
            logger.exception(error)
            return None
