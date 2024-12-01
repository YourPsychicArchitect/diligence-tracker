# Diligence Tracker

## Overview
The Diligence Tracker is a modern, simple React and Python-based application that allows users to track their tasks efficiently using Google Sheets as a backend storage system. The backend is built with FastAPI for high performance and easy API development[1].

## Server Setup
export GOOGLE_APPLICATION_CREDENTIALS="psychic-apps-443021-c8-65a950bfea27.json"
uvicorn app:app --host 0.0.0.0 --port 8003 --reload

## Installation

### Prerequisites
- Node.js and npm (for frontend)
- Python 3.7+
- FastAPI
- Uvicorn
- Google API Client Libraries

### Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup
1. Navigate to the `backend` folder.
2. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up the Google Cloud project and obtain the necessary credentials:
   - Go to the Google Cloud Console (https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Sheets API for your project
   - Create a service account and download the JSON key file
   - Rename the JSON key file to `credentials.json` and place it in the `backend` folder
4. Set up environment variables:
   - Create a `.env` file in the `backend` folder with the following content:
     ```
     GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
     ```
5. Run the server:
   ```bash
   uvicorn app:app --reload
   ```

### Environment Variables
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to the Google Cloud service account JSON key file (default: ./credentials.json)

## Usage
The app allows users to simply log in with their email and record task completion with a single button. User data is stored in Google Sheets linked to the user's email[1].

## API Documentation
FastAPI automatically generates interactive API documentation. Once the backend is running, you can access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Notes
- Further customization and UI improvements can be made by editing the React components and CSS.
- The Google Sheets integration requires appropriate API credentials and setup.
- Ensure that the service account email has the necessary permissions to create and modify Google Sheets.

## Security Considerations
- The current implementation uses a service account for Google Sheets access. In a production environment, consider implementing proper user authentication and authorization.
- Secure your API endpoints and implement rate limiting to prevent abuse.
- Keep your `credentials.json` file secure and never commit it to version control.

## License
This project is open for educational purposes.