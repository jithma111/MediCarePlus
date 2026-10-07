# MediCare Plus – Medical Appointment System

Three-tier project: **frontend** (HTML/CSS/JS) → **backend** (Spring Boot REST API) → **database** (MySQL).

```
MediCarePlus/
├── pom.xml                         Maven aggregator (open this in IntelliJ)
├── frontend/                       Static website (no build step)
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── config.js               API address (http://localhost:8080/api)
│       ├── api.js                  fetch wrapper + login token handling
│       └── app.js                  pages, routing and UI logic
├── backend/                        Spring Boot 3 / Java 17
│   ├── pom.xml
│   ├── api-tests.http              Ready-made requests for IntelliJ's HTTP client
│   └── src/main/
│       ├── java/com/medicareplus/
│       │   ├── MediCarePlusApplication.java
│       │   ├── config/             AppConfig (CORS, BCrypt), DataSeeder (demo data)
│       │   ├── controller/         REST endpoints
│       │   ├── service/            business rules (booking, status changes, reminders)
│       │   ├── repository/         Spring Data JPA repositories
│       │   ├── model/              JPA entities + enums
│       │   ├── dto/                request/response records
│       │   ├── security/           AuthContext (bearer-token sessions, role checks)
│       │   ├── exception/          ApiException + JSON error handler
│       │   └── util/
│       └── resources/
│           ├── application.properties       MySQL settings
│           └── application-h2.properties    in-memory DB profile (no MySQL needed)
└── database/
    ├── schema.sql                  MySQL tables (optional – the backend creates them itself)
    └── useful-queries.sql
```

## Run it in IntelliJ IDEA

**Requirements:** JDK 17 or newer, and MySQL 8 (or use the H2 profile below).

1. **File → Open…** → select the `MediCarePlus` folder (the one with the root `pom.xml`). Let Maven import finish.
2. **Database:** start MySQL. The backend creates the `medicare_plus` database and tables automatically.
   Default login is user `root` with an empty password. If your password differs, edit the run configuration
   (step 3) and add environment variables: `DB_USER=root;DB_PASSWORD=yourpassword`.
   *No MySQL?* In the run configuration set **Active profiles** to `h2` and skip this step.
3. **Backend:** open `backend/src/main/java/com/medicareplus/MediCarePlusApplication.java` and click the green ▶ next to `main`.
   It starts on http://localhost:8080 and inserts the demo doctors and accounts on first start.
4. **Frontend:** open `frontend/index.html` and click a browser icon in the top-right of the editor
   (IntelliJ serves it on port 63342). Any static server works too, e.g. `npx serve frontend`.
5. Optional: **Database tool window** → `+` → Data Source → MySQL → `medicare_plus` to browse the tables.

## Demo accounts

| Role    | Email              | Password |
|---------|--------------------|----------|
| Patient | patient@demo.com   | demo123  |
| Doctor  | doctor@demo.com    | demo123  |
| Admin   | admin@demo.com     | admin123 |

Passwords are stored as BCrypt hashes. Public registration only creates patients; the admin adds doctors.

## REST API

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/login`, `/register`, `/logout` · `GET /api/auth/me` | public / logged in | sessions (bearer token) |
| `GET /api/doctors`, `/api/doctors/{id}`, `/api/doctors/{id}/booked` | public | browse doctors, taken slots |
| `POST /api/doctors` · `DELETE /api/doctors/{id}` | admin | add / remove doctor (+ login) |
| `GET /api/appointments` | logged in | own appointments (admin: all) |
| `POST /api/appointments` | patient | book |
| `PUT /api/appointments/{id}/reschedule` | patient (owner) | new date/time, status back to Pending |
| `PATCH /api/appointments/{id}/status` | patient / doctor / admin | cancel · confirm · complete (rules enforced server-side) |
| `GET /api/notifications` · `POST /api/notifications/read` | logged in | bell panel (48-hour reminders are created on read) |
| `GET /api/admin/stats` | admin | patient count |
| `POST /api/contact` | public | contact form |

## Notes

- Login tokens are kept in memory, so restarting the backend logs everyone out.
- Double-booking is rejected by the server (HTTP 409). Taken slots shown on the doctor page come from the database
  (the original demo also greyed out some slots at random; that simulation was removed).
- Removing a doctor is a soft delete: their open appointments are cancelled and patients notified, history is kept.
- To deploy, change `apiBase` in `frontend/js/config.js` and `app.cors.allowed-origins` in `application.properties`.
