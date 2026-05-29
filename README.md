# 🔮 Progress Circle

> **The Gamified Sci-Fi Personal Development & Life Command Center**
>
> Progress Circle is a premium, next-generation, high-performance personal ecosystem that transforms daily productivity, fitness regimens, nutritional pacing, and financial operations into a highly engaging futuristic tactical command console. Complete with an AI-powered tactical assistant, gamified squad battle arenas, and robust bank-grade field encryption, it is engineered to destroy procrastination and accelerate self-mastery.

---

## 🌌 Core Pillars & Features

Progress Circle is built upon five operational modules designed to synchronize your habits, fitness, mind, and finances.

### 1. ⚔️ Focus Arena & Gamified Farm
* **Focus Battle Arena**: Enter real-time focus sessions where your output directly impacts survival. Duel against time or launch squad-wide operational sprints.
* **Focus Farm**: A dynamic, retro-futuristic virtual farm where deep work translates directly into agricultural yields. Grow trees, custom crops, and build sustainable environments with your focus minutes.
* **Leveling & Milestones**: Earn experience points (XP), rise through operational ranks (from *Novice* to elite tiers), and unlock specialized titles, premium avatar skins, and glowing auras in the **Avatar Shop**.
* **Audio Telemetry (Music Deck)**: Integrated ambient soundtrack console with customized platforms (Spotify, Anghami, Apple Music) to maintain state-of-the-art brainwave synchronization during deep work.

### 2. 📊 Neural Planner & Task Matrices
* **Daily Planner & Calendar Blocks**: Align your day with high-precision time-blocking schedule systems.
* **Task Command**: Track projects and operational payloads with priority levels, deadlines, status states, and drag-and-drop sequencing.
* **Habit Streaks**: Lock in long-term behavioral changes with daily streaks, visual completion heatmaps, and defensive power-ups like **Streak Freezes** to safeguard your hard-won momentum.

### 3. 💳 Advanced Financial Operations
* **Bank-Grade Privacy**: Financial fields (balances, income, budgets, transactions, inventory) are encrypted at the database level using `mongoose-field-encryption` to guarantee complete transaction privacy.
* **Cashflow Telemetry**: Monitor accounts, log cash vs. credit balances, and automatically trace recurring subscriptions, monthly budgets, and upcoming bills.
* **Savings Vaults**: Set up dynamic savings goals and view target trajectories, complete with visual progress metrics.

### 4. 🏋️ Fitness & Nutrition Telemetry
* **Workout Logger**: Track specific exercises, sets, weights, and body metrics.
* **Nutrition Deck**: Log food inputs, water intake, calories, and macronutrient telemetry (proteins, carbs, fats) to monitor physical performance.
* **Progress Graphs**: Generate comprehensive weekly insights and metric trajectories to visual progress over time.

### 5. 🤖 Astra AI Assistant & Social Squads
* **Astra Assistant**: A customized, context-aware AI guide that taps into your session logs, task history, and habit streaks to compile deep tactical analysis, peak performance hour reports, and predictive burnout telemetry.
* **Social Alliances (Squads)**: Form alliances, share real-time activity timelines, issue focus challenges, and top the global or squad-only leaderboards.
* **Real-time Push Notifications**: Equipped with `web-push` payloads to notify you when focus rooms open, streaks are in danger, or squad members issue a challenge.

---

## 🛠️ Technology Stack

Progress Circle is built as a decoupled, high-performance monorepo utilizing modern libraries and frameworks:

### Frontend (`/my-project`)
* **Core Framework**: React 19 & Vite (for blazing fast Hot Module Replacement)
* **Styling**: Tailwind CSS v4 & custom dark-mode glassmorphism tokens
* **Animations**: Framer Motion & OGL (WebGL framework for advanced render effects)
* **Routing**: React Router DOM (v7)
* **User Support**: React Joyride (for interactive onboarding guided tours) & React Virtuoso (virtualized list rendering for zero-lag infinite scrolls)
* **Notifications**: Sonner (toast management engine)

### Backend (`/backend`)
* **Runtime & Framework**: Node.js & Express
* **Database**: MongoDB & Mongoose (with Field-Level Encryption)
* **Security & Defense**: Helmet (header protection), HPP (parameter pollution shield), Express Mongo Sanitize (NoSQL injection guard), Express Rate Limit (rate pacing)
* **Real-Time Messaging**: Web-Push (Service Worker push engine)
* **Scheduled Operations**: Node-Cron (handling automatic subscription expirations and daily resets)
* **Payment Gateways**: PayMob webhook integration
* **Document Engines**: PDFKit (automated PDF reports) & Json2csv (structured data exports)
* **Transactional Email**: Nodemailer & Brevo (send secure verification codes and updates)

---

## 📁 System Architecture

```
Progress-Circle/
├── backend/                  # RESTful API Service (Express + MongoDB)
│   ├── config/               # DB connection and DNS resolver configurations
│   ├── controllers/          # Business logic layers (Auth, Finance, AI, Gamification...)
│   ├── jobs/                 # Cron tasks (Subscription expiry runs)
│   ├── middleware/           # Security, auth guards, maintenance toggles
│   ├── models/               # Encrypted Mongoose schemas (User, Session, Account...)
│   ├── routes/               # API endpoints
│   ├── scripts/              # Setup keys generation
│   └── utils/                # Transmitting services (Email, webhook utilities)
│
├── my-project/               # Frontend Client (Vite + React)
│   ├── public/               # Static assets & Service Worker scripts
│   └── src/
│       ├── api/              # Axios interceptors & backend API connections
│       ├── avatar/           # Avatar customization and shop modules
│       ├── components/       # Reusable glassmorphic UI components (Focus clocks, charts)
│       ├── context/          # Global state contexts (Theme, Auth, Gamification, Data)
│       ├── hooks/            # Custom utility hooks
│       ├── pages/            # View pages (Dashboard, Fitness, Squad Arena, Focus Farm)
│       └── utils/            # Helper functions
│
└── LICENSE                   # Project Licensing
```

---

## 🚀 Installation & Local Development Setup

To initialize the command console in your local environment, follow these steps:

### Prerequisites
* Node.js (version `>= 18.0.0`)
* MongoDB (Local instance or Atlas cloud connection)
* NPM

---

### Step 1: Clone and Root Configuration
1. Clone this repository to your local directory:
   ```bash
   git clone https://github.com/your-username/Progress-Circle.git
   cd Progress-Circle
   ```

---

### Step 2: Backend Setup
1. Navigate into the `backend` directory and install the dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend` directory:
   ```env
   # Operational Port
   PORT=5000
   NODE_ENV=development

   # Database Connection
   MONGO_URI=mongodb://localhost:27017/progress-circle

   # Bank-Grade Encryption & Authentication
   JWT_SECRET=your-super-secret-jwt-key
   DATABASE_ENCRYPTION_KEY=your-32-character-encryption-key-here-must-be-long

   # Email Service (Brevo / SMTP)
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password

   # Web-Push Protocol Keys
   VAPID_PUBLIC_KEY=your-vapid-public-key
   VAPID_PRIVATE_KEY=your-vapid-private-key
   VAPID_EMAIL=mailto:admin@progresscircle.com

   # Payments Gateway (PayMob)
   PAYMOB_API_KEY=your-paymob-api-key
   PAYMOB_INTEGRATION_ID=your-paymob-integration-id
   PAYMOB_HMAC_SECRET=your-paymob-hmac-secret

   # System URLs
   FRONTEND_URL=http://localhost:5173
   ```

   > [!TIP]
   > You can generate VAPID keys easily using the pre-configured script in the backend directory by running `node scripts/generateVapid.js`.

3. Initialize the admin console credentials (optional):
   ```bash
   node seedAdmin.js
   ```

4. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   *The server will spin up on port `5000`. If port `5000` is currently occupied, the built-in resolver will automatically attempt port `5001`, `5002`, etc.*

   > [!NOTE]
   > **Windows DNS Resolution Fix:** If you run into DNS errors like `querySrv ECONNREFUSED` connecting to Atlas MongoDB, the backend comes with a built-in fallback set to Google Public DNS (`8.8.8.8`) at startup to ensure stable database handshakes on Windows architectures.

---

### Step 3: Frontend Setup
1. Open a new terminal instance, navigate to the `my-project` directory, and install the modules:
   ```bash
   cd my-project
   npm install
   ```

2. Configure your client-side environment file. Create a `.env` file in `/my-project`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *Your client interface will open at [http://localhost:5173](http://localhost:5173).*

---

## 🔒 Security Infrastructure & Data Privacy

Progress Circle prioritizes data protection using an advanced multi-layered defense architecture:
* **Field-Level Encryption**: Sensitive user data columns are dynamically encrypted/decrypted transparently on the database layer. Even if database access is compromised, financial registers and inventory contents remain completely indecipherable without the unique server key.
* **Helmet Defense**: Custom-configured HTTP response headers protect against Clickjacking, Cross-Site Scripting (XSS), and MIME sniffing.
* **Rate Limiting**: Strictly configured API throttling mitigates brute-force attacks and DDoS vectors on auth gateways.
* **NoSQL Injection Shield**: Dynamic queries are sanitized via express middleware to isolate and strip structural operators.

---

## 🛡️ License

Distributed under the MIT License. See [LICENSE](file:///f:/Github/Progress-Circle/LICENSE) for more details.

---

<p align="center">
  <sub>Developed with 💜 by Antigravity AI for Progress Circle Commanders.</sub>
</p>