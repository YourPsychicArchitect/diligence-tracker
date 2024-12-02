from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sheets_api import SheetsAPI
import os

app = FastAPI()

# Use environment variable for CORS origin, default to frontend URL
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sheets_api = SheetsAPI()

class TimezoneRequest(BaseModel):
    email: EmailStr
    timezone: str

class EntryRequest(BaseModel):
    email: EmailStr
    task: str

class UpdateTaskRequest(BaseModel):
    email: EmailStr
    old_task: str
    new_task: str

@app.get("/api/tasks")
async def get_tasks(email: EmailStr = Query(...)):
    tasks = sheets_api.get_tasks(email)
    if not tasks:
        raise HTTPException(status_code=404, detail="No tasks found")
    return {"tasks": tasks}

@app.get("/api/entries")
async def get_entries(email: EmailStr = Query(...), task: str = Query(...)):
    entries = sheets_api.get_entries(email, task)
    if entries is None:
        raise HTTPException(status_code=500, detail="Failed to fetch entries")
    return {"entries": entries}

@app.post("/api/entry")
async def add_entry(entry_request: EntryRequest):
    success = sheets_api.add_entry(entry_request.email, entry_request.task)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add entry")
    return {"success": True}

@app.post("/api/login")
async def login(email: EmailStr):
    # For simplicity, we're just checking if the user exists in our master sheet
    # In a real application, you'd want to implement proper authentication here
    spreadsheet_id = sheets_api.get_or_create_spreadsheet(email)
    if not spreadsheet_id:
        raise HTTPException(status_code=500, detail="Failed to create or retrieve user spreadsheet")
    return {"email": email, "token": "dummy_token"}  # In a real app, generate a proper token

@app.get("/api/hourly_activity")
async def get_hourly_activity(email: EmailStr = Query(...), task: str = Query(...)):
    hourly_activity = sheets_api.get_hourly_activity(email, task)
    if hourly_activity is None:
        raise HTTPException(status_code=500, detail="Failed to fetch hourly activity")
    return {"hourly_activity": hourly_activity}

@app.get("/api/statistics")
async def get_statistics(email: EmailStr = Query(...), task: str = Query(...)):
    statistics = sheets_api.get_statistics(email, task)
    if statistics is None:
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")
    return statistics

@app.post("/api/set_timezone")
async def set_timezone(request: TimezoneRequest):
    success = sheets_api.set_user_timezone(request.email, request.timezone)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to set timezone")
    return {"success": True}

@app.get("/api/get_timezone")
async def get_timezone(email: EmailStr = Query(...)):
    timezone = sheets_api.get_user_timezone(email)
    if timezone is None:
        raise HTTPException(status_code=404, detail="Timezone not found")
    return {"timezone": timezone}

@app.post("/api/update_task")
async def update_task(request: UpdateTaskRequest):
    success = sheets_api.update_task(request.email, request.old_task, request.new_task)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update task")
    return {"success": True}

@app.get("/api/spreadsheet_url")
async def get_spreadsheet_url(email: EmailStr = Query(...)):
    url = sheets_api.get_spreadsheet_url(email)
    if url is None:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")
    return {"url": url}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)