# Conference Management System

A web-based conference management system for participant check-in, donation tracking, and prize lottery drawings.

## Features

- **Participant Management** - Track attendees and their information
- **QR Code Check-in** - Fast participant registration via QR scanner or manual input
- **Donation Tracking** - Record and manage participant donations
- **Prize Lottery** - Animated lottery system for donors (500+ UAH)
- **Real-time Statistics** - Live dashboard with attendance and donation metrics
- **Excel Export** - Export participant lists and donor information
- **Role-based Access** - Separate views for hostess and admin users

## Tech Stack

**Frontend:**
- HTML, CSS, JavaScript
- QR Code Scanner (html5-qrcode)
- Excel Export (SheetJS)

**Backend:**
- Java Spring Boot
- Google Sheets API (as database)
- Maven

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher) - for running the frontend server
- **Java 17** or higher - for the backend
- **Maven** - for building the backend
- **Google Cloud Account** - for Google Sheets API access

## Setup Instructions

### 1. Google Sheets Setup

#### Create Your Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name the first sheet: `Participants`
4. Add the following headers in row 1:
   ```
   A1: QR Code
   B1: Name
   C1: Surname
   D1: Visited
   E1: Donation
   F1: Updated At
   ```
5. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
   ```

#### Get Google Sheets API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and create
5. Create and download the JSON key:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the file
6. Share your Google Sheet with the service account email:
   - Open the downloaded JSON file
   - Copy the `client_email` value (looks like `xxx@xxx.iam.gserviceaccount.com`)
   - Open your Google Sheet
   - Click "Share" and add this email as an Editor

### 2. Backend Setup

1. **Place the credentials file:**
   ```bash
   # Copy your downloaded JSON file to:
   conference-backend/src/main/resources/credentials.json
   ```

2. **Configure the application:**

   Edit `conference-backend/src/main/resources/application.properties`:
   ```properties
   # Replace with your spreadsheet ID
   google.sheets.spreadsheet-id=YOUR_SPREADSHEET_ID
   ```

3. **Build and run:**
   ```bash
   cd conference-backend
   mvn clean install
   mvn spring-boot:run
   ```

   The backend will start on `http://localhost:8080`

### 3. Frontend Setup

1. **Configure the API endpoint:**

   Edit `conference-frontend/config.js` if needed:
   ```javascript
   API_BASE_URL: 'http://localhost:8080/api'
   ```

2. **Start the frontend server:**
   ```bash
   cd conference-frontend
   npx http-server -p 3000
   ```

   The frontend will be available at `http://localhost:3000`

### 4. Testing with QR Codes

#### Option 1: Generate QR Codes Online

1. Go to a QR code generator like:
   - [QR Code Generator](https://www.qr-code-generator.com/)
   - [QRCode Monkey](https://www.qrcode-monkey.com/)

2. Create QR codes with text matching your participant QR codes from the spreadsheet
3. Save as images (PNG/JPG)
4. Print or display on screen for scanning

#### Option 2: Use Sample QR Code Images

Create test QR codes for development:
1. Add test participants to your Google Sheet with simple QR codes like: `TEST001`, `TEST002`, etc.
2. Generate QR images for these codes
3. Use the manual input field to enter codes directly for testing

#### Sample Test Data

Add these rows to your Google Sheet for testing:

| QR Code | Name    | Surname  | Visited | Donation | Updated At |
|---------|---------|----------|---------|----------|------------|
| TEST001 | John    | Smith    | FALSE   | 0        |            |
| TEST002 | Maria   | Garcia   | FALSE   | 0        |            |
| TEST003 | Alex    | Johnson  | FALSE   | 0        |            |

Then create QR codes containing the text: `TEST001`, `TEST002`, `TEST003`

## Usage

### Login Credentials

- **Hostess:**
  - Role: Hostess
  - Password: `1234`
  - Access: Check-in and Donations

- **Admin:**
  - Role: Administrator
  - Password: `admin123`
  - Access: All features including Lottery and Settings

### Main Features

#### Check-in
1. Click "Start Scanner" to use camera
2. Or manually enter QR code
3. System marks participant as present

#### Donations
1. Scan participant QR code
2. Enter donation amount
3. System adds to participant's total

#### Lottery (Admin only)
1. Navigate to "Lottery" tab
2. Enter number of winners
3. Click "Start Lottery"
4. Winners are selected from participants with 500+ UAH donations

#### Participant List (Admin only)
- View all participants and statistics
- Search by name or QR code
- Export to Excel

## Project Structure

```
conference-app/
├── conference-backend/
│   ├── src/main/java/com/conference/
│   │   ├── controller/    # REST API endpoints
│   │   ├── model/         # Data models
│   │   └── service/       # Business logic
│   └── src/main/resources/
│       ├── application.properties
│       └── credentials.json  # Your Google API credentials (DO NOT COMMIT)
├── conference-frontend/
│   ├── index.html         # Main application
│   ├── app.js            # Application logic
│   ├── lottery.js        # Lottery animations
│   ├── config.js         # Configuration
│   ├── api.js            # API client
│   ├── styles.css        # Main styles
│   └── lottery-styles.css # Lottery styles
└── README.md
```

## Security Notes

**Important:** Never commit sensitive files to Git!

Create a `.gitignore` file with:
```
# Credentials
conference-backend/src/main/resources/credentials.json

# Build files
conference-backend/target/
conference-backend/.mvn/
conference-backend/mvnw
conference-backend/mvnw.cmd

# IDE files
.idea/
*.iml
.vscode/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
```

## Troubleshooting

### Backend won't start
- Check that `credentials.json` is in the correct location
- Verify your spreadsheet ID in `application.properties`
- Ensure the service account has access to the spreadsheet

### Frontend can't connect to backend
- Verify backend is running on port 8080
- Check CORS settings in `application.properties`
- Check browser console for errors

### QR Scanner not working
- Ensure you're using HTTPS or localhost
- Grant camera permissions when prompted
- Use manual input as fallback
