from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import datetime
import pytz
from loguru import logger
import os
from cachetools import TTLCache
from threading import Lock

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

        # TTL Cache for 24 hours, max 300 users
        self.cache = TTLCache(maxsize=300, ttl=86400)  # 86400 seconds = 24 hours
        self.cache_lock = Lock()

    def _get_cache_key(self, email, task=None):
        return f"{email}:{task}" if task else email

    def _cache_get(self, email, task=None):
        with self.cache_lock:
            return self.cache.get(self._get_cache_key(email, task))

    def _cache_set(self, email, data, task=None):
        with self.cache_lock:
            self.cache[self._get_cache_key(email, task)] = data

    def _ensure_headers(self, spreadsheet_id, task):
        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id, range=f"{task}!A1:B1"
            ).execute()
            values = result.get('values', [])
            
            if not values:
                # Add headers if they don't exist
                headers = [['Timestamp (UTC)', 'Timezone']]
                self.sheets_service.spreadsheets().values().update(
                    spreadsheetId=spreadsheet_id,
                    range=f"{task}!A1:B1",
                    valueInputOption="USER_ENTERED",
                    body={"values": headers}
                ).execute()
        except HttpError as error:
            logger.exception(f"Error ensuring headers: {error}")

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
        # Check cache first
        cached_entries = self._cache_get(email, task)
        if cached_entries is not None:
            return cached_entries

        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            return []

        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id, range=f"{task}!A:A"
            ).execute()
            values = result.get('values', [])
            entries = [entry[0] for entry in values[1:] if entry]  # Skip header row
            
            # Cache the results
            self._cache_set(email, entries, task)
            
            return entries
        except HttpError as error:
            logger.exception(error)
            return []

    def add_entry(self, email, task):
        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            return False

        try:
            # Ensure the task sheet exists
            try:
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
                # Ensure headers exist for new sheet
                self._ensure_headers(spreadsheet_id, task)
            except HttpError:
                # Sheet already exists, ensure headers
                self._ensure_headers(spreadsheet_id, task)

            # Get user's timezone
            user_timezone = self.get_user_timezone(email) or 'UTC'
            local_tz = pytz.timezone(user_timezone)
            
            # Convert local time to UTC before storing
            local_now = datetime.datetime.now(local_tz)
            utc_now = local_now.astimezone(pytz.UTC)
            
            # Store UTC time with explicit timezone marker
            timestamp = utc_now.strftime('%Y-%m-%d %H:%M:%S UTC')
            
            self.sheets_service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range=f"{task}!A:B",
                valueInputOption="USER_ENTERED",
                body={"values": [[timestamp, user_timezone]]}
            ).execute()

            # Invalidate cache for this task
            with self.cache_lock:
                cache_key = self._get_cache_key(email, task)
                if cache_key in self.cache:
                    del self.cache[cache_key]

            return True
            
        except HttpError as error:
            logger.exception(f"An error occurred: {error}")
            return False

    def get_hourly_activity(self, email, task):
        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            return None

        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id, range=f"{task}!A:B"
            ).execute()
            values = result.get('values', [])
            
            # Get user's current timezone
            user_timezone = self.get_user_timezone(email) or 'UTC'
            local_tz = pytz.timezone(user_timezone)
            
            hourly_activity = [0] * 24
            
            def parse_stored_datetime(date_str, stored_timezone=None):
                if 'UTC' in date_str:
                    # Parse UTC time
                    dt = datetime.datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S UTC')
                    dt = pytz.UTC.localize(dt)
                else:
                    # Handle legacy data (stored in unknown timezone)
                    try:
                        dt = datetime.datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                        if stored_timezone:
                            # Use stored timezone if available
                            original_tz = pytz.timezone(stored_timezone)
                            dt = original_tz.localize(dt)
                        else:
                            # Assume UTC for legacy data
                            dt = pytz.UTC.localize(dt)
                    except ValueError:
                        dt = datetime.datetime.strptime(date_str, '%Y-%m-%d %-H:%M:%S')
                        dt = pytz.UTC.localize(dt)
                
                # Convert to user's current timezone
                return dt.astimezone(local_tz)
            
            today = datetime.datetime.now(local_tz).date()
            
            for entry in values[1:]:  # Skip header row
                if entry:
                    try:
                        stored_timezone = entry[1] if len(entry) > 1 else None
                        dt = parse_stored_datetime(entry[0], stored_timezone)
                        
                        # Only count entries from today in user's timezone
                        if dt.date() == today:
                            hourly_activity[dt.hour] += 1
                    except (ValueError, IndexError) as e:
                        logger.warning(f"Could not parse datetime '{entry[0]}': {e}")
                        continue
            
            return hourly_activity

        except HttpError as error:
            logger.exception(f"An error occurred: {error}")
            return None

    def get_statistics(self, email, task):
        spreadsheet_id = self.get_or_create_spreadsheet(email)
        if not spreadsheet_id:
            return None

        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id, range=f"{task}!A:B"
            ).execute()
            values = result.get('values', [])
            
            # Get user's current timezone
            user_timezone = self.get_user_timezone(email) or 'UTC'
            local_tz = pytz.timezone(user_timezone)
            
            def parse_stored_datetime(date_str, stored_timezone=None):
                if 'UTC' in date_str:
                    # Parse UTC time
                    dt = datetime.datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S UTC')
                    dt = pytz.UTC.localize(dt)
                else:
                    # Handle legacy data
                    try:
                        dt = datetime.datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                        if stored_timezone:
                            # Use stored timezone if available
                            original_tz = pytz.timezone(stored_timezone)
                            dt = original_tz.localize(dt)
                        else:
                            # Assume UTC for legacy data
                            dt = pytz.UTC.localize(dt)
                    except ValueError:
                        dt = datetime.datetime.strptime(date_str, '%Y-%m-%d %-H:%M:%S')
                        dt = pytz.UTC.localize(dt)
                
                # Convert to user's current timezone
                return dt.astimezone(local_tz)
            
            entries = []
            for entry in values[1:]:  # Skip header row
                if entry:
                    try:
                        stored_timezone = entry[1] if len(entry) > 1 else None
                        dt = parse_stored_datetime(entry[0], stored_timezone)
                        entries.append(dt)
                    except (ValueError, IndexError) as e:
                        logger.warning(f"Could not parse datetime '{entry[0]}': {e}")
                        continue
            
            now = datetime.datetime.now(local_tz)
            today = now.date()
            week_start = today - datetime.timedelta(days=today.weekday())
            month_start = today.replace(day=1)
            
            today_total = sum(1 for entry in entries if entry.date() == today)
            week_total = sum(1 for entry in entries if week_start <= entry.date() <= today)
            month_total = sum(1 for entry in entries if month_start <= entry.date() <= today)
            all_time_total = len(entries)
            
            week_data = [
                {
                    "day": (week_start + datetime.timedelta(days=i)).strftime("%A"),
                    "count": sum(1 for entry in entries if entry.date() == week_start + datetime.timedelta(days=i))
                }
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
            logger.exception(f"An error occurred: {error}")
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

            # Check if this is a new task or renaming an existing one
            old_sheet_id = self.get_sheet_id(spreadsheet_id, old_task)
            
            if old_sheet_id is None:
                # This is a new task - create new sheet
                try:
                    response = self.sheets_service.spreadsheets().batchUpdate(
                        spreadsheetId=spreadsheet_id,
                        body={
                            "requests": [{
                                "addSheet": {
                                    "properties": {"title": new_task}
                                }
                            }]
                        }
                    ).execute()
                    
                    # Ensure headers exist for new sheet
                    self._ensure_headers(spreadsheet_id, new_task)
                    
                    # Share the spreadsheet with the user and admin
                    self.share_spreadsheet(spreadsheet_id, email)
                    self.share_spreadsheet(spreadsheet_id, self.admin_email)
                    
                    return True
                    
                except HttpError as error:
                    if 'already exists' in str(error):
                        logger.error(f"Sheet {new_task} already exists")
                        return False
                    logger.exception(error)
                    return False
            else:
                # This is renaming an existing sheet
                body = {
                    'requests': [{
                        'updateSheetProperties': {
                            'properties': {'sheetId': old_sheet_id, 'title': new_task},
                            'fields': 'title'
                        }
                    }]
                }
                self.sheets_service.spreadsheets().batchUpdate(
                    spreadsheetId=spreadsheet_id, 
                    body=body
                ).execute()

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
