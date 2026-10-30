# Doctor Appointment Booking System

An interactive clinical appointment booking and outpatient queue management system designed for medical centers and outpatient clinics. Developed with **HTML5, CSS3, Bootstrap 5, JavaScript (ES6+), jQuery, and JSON Server** with full CRUD capabilities over RESTful endpoints and automatic LocalStorage fallback.

---

## 1. Key Differentiating Features

Unlike standard tabular CRUD systems, the Doctor Appointment Booking System features dedicated clinical operational workflows:
* **Interactive Time-Slot Chip Selector with Conflict Detection:** When a patient chooses a doctor and appointment date, available time-slots (`09:00 AM`, `10:00 AM`, `11:00 AM`, etc.) are rendered as interactive chips. If another patient has already booked a slot with that doctor on that date, the chip is automatically marked **"Booked"** and disabled to prevent double-booking.
* **Live OPD Patient Queue Board:** A multi-column consultation board (*Waiting Queue*, *In Consultation Room*, *Completed Consultations*) allowing staff to advance patient stages with 1-click status transitions.
* **Clinical Diagnosis & Prescription Notes:** Attending specialists can enter clinical diagnoses and medications, which are permanently attached to the appointment record via HTTP `PUT`.
* **Printable OPD Consultation Slip:** Generates an official token receipt with patient info, doctor room assignment, token number, and prescription details.

---

## 2. Technologies Used

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Semantic structure, multi-tab workspace, slot selection chips, modal dialogs, and printable slip cards |
| **CSS3** | Modern clinical MedTech styling (Plus Jakarta Sans, medical teal branding, status border highlights, interactive slot chips) |
| **Bootstrap 5.3** | 12-column responsive layout, modal dialogs, tab navigation, and toast notifications |
| **JavaScript (ES6+)** | Asynchronous HTTP requests, time-slot collision calculations, dynamic token generation, and state logic |
| **jQuery 3.7.1** | Declarative DOM event listeners, dynamic queue card rendering, slot chip toggling, and live search |
| **JSON Server** | Lightweight mock REST API server backed by `data/db.json` with automatic LocalStorage fallback |

---

## 3. Directory Structure

```text
.
├── assets/
│   ├── css/
│   │   └── style.css            # Custom clinical MedTech styles
│   └── js/
│       ├── api.js               # REST API service + LocalStorage fallback
│       └── app.js               # Main jQuery event handlers & queue manager
├── data/
│   └── db.json                  # Mock REST API database (Appointments & Doctors)
├── index.html                   # Clinical Dashboard & Live OPD Queue Board
├── doctors.html                 # Specialist Directory & Slot Booking Portal
├── appointments.html            # Master Register & Printable Slips
├── package.json                 # Project configuration & npm scripts
├── .gitignore                   # Ignored files for Git version control
└── README.md                    # Setup and execution guide
```

---

## 4. Quick Start & Execution

### Prerequisites
* [Node.js](https://nodejs.org/) (v16.0 or higher recommended)
* Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox)

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/doctor-appointment-booking-system.git
cd doctor-appointment-booking-system
```

### Step 2: Start the Mock REST API (JSON Server)
You can start the mock server using npm or directly with npx:

**Option A (Using npm):**
```bash
npm install
npm start
```

**Option B (Using npx directly):**
```bash
npx json-server --watch data/db.json --port 3000
```

> *Expected Terminal Output:*
> ```text
> Loading data/db.json
> Done
> 
> Resources
> http://localhost:3000/appointments
> http://localhost:3000/doctors
> 
> Home
> http://localhost:3000
> ```

### Step 3: Launch the Application
Open `index.html` in your web browser, or launch using VS Code Live Server / any local web server.

> **Note on Offline Mode:** If JSON Server is not running, the application automatically falls back to browser `localStorage` so that UI functionality remains operational during evaluations.

---

## 5. REST API Endpoints Specification

* `GET /appointments` – Retrieve all appointment records.
* `POST /appointments` – Create a new booking with token generation (`tokenNo`, `patientName`, `doctorName`, `timeSlot`, etc.).
* `PUT /appointments/:id` – Modify/reschedule, advance queue status, or add prescription notes.
* `DELETE /appointments/:id` – Cancel an appointment booking.
* `GET /doctors` – Retrieve the specialist directory.

---

## 6. Verification & Test Cases

| Test Case | Inputs / Action | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **TC-01: Book Appointment** | Select Dr. Priya, pick available 10:30 AM slot, submit | Token generated (e.g. OPD-104), status set to "Confirmed" | **Pass** |
| **TC-02: Slot Conflict Prevention** | Choose same doctor, date & booked slot | Slot chip is marked "Booked" and disabled | **Pass** |
| **TC-03: Queue Progression** | Click "Call In" on OPD Queue Board | Patient card moves from "Waiting" to "In Consultation" | **Pass** |
| **TC-04: Diagnosis & Notes** | Enter clinical diagnosis and submit | Record updated in db.json via PUT, visible on consultation slip | **Pass** |
| **TC-05: Print Consultation Slip** | Click "Print Slip" on patient row | Formatted printable token receipt modal renders with print trigger | **Pass** |

---

## 7. License
This project is open-source and available under the [MIT License](LICENSE).
