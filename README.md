# 📋 QR Attendance Management System

A full-stack **QR-based Attendance Management System** built with the MERN stack (MongoDB, Express, React, Node.js). Enables organizations to create meetings, generate QR codes, and track attendance in real-time with geofencing support and anti-fraud measures.

![Tech Stack](https://img.shields.io/badge/React-19-blue?logo=react) ![Tech Stack](https://img.shields.io/badge/Express-5-black?logo=express) ![Tech Stack](https://img.shields.io/badge/MongoDB-Mongoose%209-green?logo=mongodb) ![Tech Stack](https://img.shields.io/badge/Node.js-ES%20Modules-339933?logo=node.js) ![Tech Stack](https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss)

---

## ✨ Features

### Core

- **QR Code Generation** — Auto-generated unique 6-digit QR codes for each meeting
- **3 Attendance Methods** — Live camera scan, image upload, or manual code entry
- **Real-time Tracking** — Live attendee count with auto-polling (3-5s intervals)
- **Geofencing** — Optional GPS-based proximity enforcement using Haversine formula
- **Export Reports** — Download attendance as CSV or styled Excel (.xlsx)

### Security & Anti-Fraud

- **Single-Device Session** — Only one active login per user at a time
- **Duplicate IP Detection** — Prevents multiple attendances from the same device
- **Duplicate Member Check** — One attendance per member per meeting
- **Time-Window Validation** — Attendance only accepted during meeting hours
- **JWT Authentication** — Secure token-based auth with role-based access control

### Roles

| Role       | Capabilities                                                                         |
| ---------- | ------------------------------------------------------------------------------------ |
| **Admin**  | Full access — manage meetings, members, view reports, export data, toggle geofencing |
| **PR**     | View active meetings, display QR codes, monitor live attendance                      |
| **Member** | Scan QR / enter code to mark attendance, view own history                            |

### UI/UX

- Modern dark-themed auth pages with glassmorphism
- Responsive sidebar layout with role-based navigation
- Mobile-friendly with adaptive tables → card views
- Fullscreen QR display mode for projectors/screens
- Toast notifications for real-time feedback

---

## 🏗️ Tech Stack

### Frontend

- **React 19** with React Router v7
- **Vite 7** — fast dev server & build
- **Tailwind CSS v4** — utility-first styling
- **Axios** — HTTP client with interceptors
- **html5-qrcode** — QR scanning (camera + image)
- **Lucide React** — icons
- **React Hot Toast** — notifications

### Backend

- **Express 5** (ES Modules)
- **Mongoose 9** — MongoDB ODM
- **JWT (jsonwebtoken)** — authentication
- **bcryptjs** — password hashing
- **qrcode** — QR image generation
- **exceljs** — Excel report generation
- **json2csv** — CSV export

---

## 📁 Project Structure

```
qr_attendance/
├── backend/
│   ├── src/
│   │   ├── server.js            # Express app entry point
│   │   ├── db.js                # MongoDB connection
│   │   ├── middleware/
│   │   │   └── authMiddleware.js # JWT verify + role authorization
│   │   ├── models/
│   │   │   ├── Attendance.js    # Attendance schema (unique constraints)
│   │   │   ├── Meeting.js       # Meeting schema (geofence fields)
│   │   │   └── Member.js        # Member schema (session tracking)
│   │   ├── routes/
│   │   │   ├── auth.js          # Register, login, logout, me
│   │   │   ├── meeting.js       # CRUD + toggle, geofence, stats
│   │   │   ├── attendance.js    # Mark, history, stats, export
│   │   │   ├── qr.js            # QR image generation
│   │   │   └── member.js        # Admin member management
│   │   └── utils/
│   │       └── geolocation.js   # IP lookup, Haversine distance
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── vercel.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Routes & role-based routing
│   │   ├── main.jsx             # React entry point
│   │   ├── index.css            # Global styles
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Sidebar layout (role-based nav)
│   │   │   └── ProtectedRoute.jsx # Auth & role guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state + cross-tab sync
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Register.jsx     # Registration page
│   │   │   ├── Attendance.jsx   # QR attendance landing
│   │   │   ├── MeetingDetail.jsx # Full meeting view + attendees
│   │   │   ├── PRPanel.jsx      # PR dashboard
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx # Admin overview stats
│   │   │   │   ├── Meetings.jsx  # Meeting management
│   │   │   │   ├── Members.jsx   # Member management
│   │   │   │   └── Reports.jsx   # Attendance reports + export
│   │   │   └── member/
│   │   │       └── MemberDashboard.jsx # Scan QR + history
│   │   └── services/
│   │       └── api.js           # Axios instance + interceptors
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/qr_attendance.git
cd qr_attendance
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The server runs at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## 📡 API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint    | Description          | Access        |
| ------ | ----------- | -------------------- | ------------- |
| POST   | `/register` | Register new member  | Public        |
| POST   | `/login`    | Login & get JWT      | Public        |
| POST   | `/logout`   | Clear active session | Authenticated |
| GET    | `/me`       | Get current user     | Authenticated |

### Meetings (`/api/meetings`)

| Method | Endpoint            | Description                       | Access        |
| ------ | ------------------- | --------------------------------- | ------------- |
| POST   | `/`                 | Create meeting                    | Admin         |
| GET    | `/`                 | List all meetings                 | Authenticated |
| GET    | `/:id`              | Get meeting + QR + attendee count | Authenticated |
| PUT    | `/:id`              | Update meeting                    | Admin         |
| DELETE | `/:id`              | Delete meeting + records          | Admin         |
| PATCH  | `/:id/toggle`       | Toggle active status              | Admin         |
| PATCH  | `/:id/set-location` | Set venue GPS for geofence        | Admin, PR     |
| GET    | `/admin/stats`      | Dashboard statistics              | Admin         |

### Attendance (`/api/attendance`)

| Method | Endpoint                   | Description          | Access        |
| ------ | -------------------------- | -------------------- | ------------- |
| POST   | `/`                        | Mark attendance      | Authenticated |
| GET    | `/stats`                   | Aggregate stats      | Admin         |
| GET    | `/meeting/:meetingId`      | Meeting attendees    | Admin, PR     |
| GET    | `/my`                      | Member's own history | Authenticated |
| GET    | `/export/:meetingId`       | Export as CSV        | Admin         |
| GET    | `/export-excel/:meetingId` | Export as Excel      | Admin         |
| GET    | `/count/:meetingId`        | Live attendee count  | Authenticated |

### QR (`/api/qr`)

| Method | Endpoint  | Description            | Access |
| ------ | --------- | ---------------------- | ------ |
| GET    | `/:token` | Generate QR code image | Public |

### Members (`/api/members`)

| Method | Endpoint       | Description          | Access |
| ------ | -------------- | -------------------- | ------ |
| GET    | `/`            | List all members     | Admin  |
| GET    | `/:id`         | Get single member    | Admin  |
| POST   | `/`            | Create member        | Admin  |
| PUT    | `/:id`         | Update member        | Admin  |
| DELETE | `/:id`         | Delete member        | Admin  |
| GET    | `/admin/stats` | Member count by role | Admin  |

---

## 🌐 Deployment (Vercel)

Both frontend and backend include `vercel.json` for deployment.

### Backend

1. Push your backend to a GitHub repo
2. Import into [Vercel](https://vercel.com)
3. Set root directory to `backend`
4. Add environment variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT`)
5. Deploy

### Frontend

1. Push your frontend to a GitHub repo
2. Import into [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL` = your deployed backend URL + `/api`
5. Deploy

---

## 🔐 Environment Variables

### Backend (`.env`)

| Variable     | Description                | Example                 |
| ------------ | -------------------------- | ----------------------- |
| `PORT`       | Server port                | `5000`                  |
| `MONGO_URI`  | MongoDB connection string  | `mongodb+srv://...`     |
| `JWT_SECRET` | Secret key for JWT signing | `mysupersecretkey`      |
| `CLIENT_URL` | Frontend URL (for CORS)    | `http://localhost:5173` |

### Frontend (`.env`)

| Variable       | Description          | Example                     |
| -------------- | -------------------- | --------------------------- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## 📱 How It Works

1. **Admin creates a meeting** with title, type (online/offline), time window, and optional geofence radius
2. **A unique 6-digit QR code** is auto-generated for the meeting
3. **QR is displayed/projected** during the meeting (PR panel has fullscreen mode)
4. **Members scan the QR** using their phone camera, upload a QR image, or enter the code manually
5. **System validates**: active meeting, time window, GPS proximity (if geofenced), duplicate checks
6. **Attendance is recorded** with timestamp, GPS coordinates, IP, and location
7. **Admin exports reports** as CSV or styled Excel files

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
