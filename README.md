# Rahil's Football Draft FC ⚽

A modern, web-based football management and match-simulation prototype built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 🌟 Features Included in Version 1

1. **Dashboard (Screen 1)**
   - Manager greeting: *Welcome back, Rahil*
   - Club KPIs: Current Team (**Rahil FC**), Team Overall (**91 OVR**), Budget (**€100M**), League Position (**#1**), Matches Played (**0/38**), Points (**0 PTS**)
   - **NEXT MATCH** hero card (*Rahil FC vs Aashish FC*) with a direct **[SIMULATE MATCH]** button
   - Recent Match Results preview
   - Live League Table preview
   - Upcoming Auction preview with quick-bid access

2. **Player Database (Screen 2)**
   - Instant real-time player search by name or country (e.g. *Mbappé, Messi, Bellingham, Rodri*)
   - Position filtering pills: **All**, **Attackers (ATT)**, **Midfielders (MID)**, **Defenders (DEF)**, **Goalkeepers (GK)**
   - Sorting options: Highest Overall (OVR), Highest Form, Highest Pace, Highest Market Value
   - Complete player cards showing:
     - Name & Country
     - Position badge & Shirt Number
     - Overall rating (OVR)
     - PAC, SHO, PAS, DRI, DEF, PHY attributes (or GKP for Goalkeepers)
     - Match Form & Fitness ratings
     - Full interactive profile modal with season statistics

3. **My Team Management (Screen 3)**
   - Team Overview: Team Overall, Budget (€100M), Squad Size
   - **Authentic 7-A-Side Football Pitch**:
     - Visual grass turf with center circle, penalty boxes, and goal areas
     - Displays 7 starting players on the pitch:
       - **GK**: Thibaut Courtois
       - **DEF**: William Saliba, Alessandro Bastoni
       - **MID**: Federico Valverde, Lamine Yamal
       - **ATT**: Lionel Messi, Kylian Mbappé
   - **Bench Substitutes**: Gregor Kobel, Joško Gvardiol, Jamal Musiala
   - **EDIT LINEUP**: Interactive modal to swap starting 7 and bench players
   - **VIEW PLAYER**: Detailed tactical inspector modal
   - **BENCH**: One-click substitution control

4. **Match Setup (Screen 4)**
   - Pre-match tactical clash between **Rahil FC** and **Aashish FC** (or Shubh FC)
   - Starting 7 rosters, formations, and team overall comparison
   - Unit-by-unit tactical rating breakdown:
     - Attack Strength (ATT)
     - Midfield Control (MID)
     - Defensive Resilience (DEF)
     - Goalkeeper Quality (GK)
   - **[SIMULATE MATCH]** button to launch the game

5. **Match Simulation & Live Timeline (Screen 5)**
   - Realistic mathematical match simulation engine:
     - Calculates possession based on midfield battle
     - Generates chances based on unit ratings, form, and controlled variance
     - Generates authentic goal scorers, assisters, goalkeeper saves, and yellow cards
   - Live chronological event timeline with animated clock (00:00 → 90:00):
     - e.g. `12' ⚽ Mbappé — Goal`
     - `31' 🟨 Van Dijk — Yellow Card`
     - `48' 🧤 Courtois — Save`
     - `63' ⚽ Dembélé — Goal`
     - `77' ⚽ Messi — Goal`
     - `90' FULL TIME`
   - Simulation playback speed toggles: **1x**, **2x**, **4x**, or **Instant Skip**
   - Detailed technical match statistics:
     - Possession %
     - Total Shots & Shots on Target
     - Pass Accuracy %
     - Corners & Fouls
     - Goalkeeper Saves
   - Full player match ratings (5.5 – 9.9)
   - **PLAYER OF THE MATCH** award banner with performance rationale
   - Confetti celebration upon victory
   - Quick navigation to view updated League Table

6. **League Standings (Screen 6)**
   - Official table featuring **RAHIL FC**, **AASHISH FC**, and **SHUBH FC**
   - Table columns: `POS`, `TEAM`, `P`, `W`, `D`, `L`, `GF`, `GA`, `GD`, `PTS`, `FORM`
   - Real-time automatic updates after every simulated match:
     - Win = 3 points
     - Draw = 1 point
     - Loss = 0 points
   - Recent League Results log

7. **Auction Market & Scouting**
   - Live bidding on world-class draft targets (e.g. *Erling Haaland, Vinícius Júnior, Kevin De Bruyne, Florian Wirtz*)
   - Real budget deduction and highest bidder tracking

8. **Statistics & Settings**
   - League Golden Boot (top scorers), Top Playmakers (assists), and Average Rating leaders
   - Club profile customization (Club Name, Manager Name) and Season Reset

---

## 🛠️ Project Structure

```text
football-draft-manager/
├── src/
│   ├── types/
│   │   └── index.ts            # TypeScript definitions (Player, Team, Match, League)
│   ├── data/
│   │   └── initialData.ts      # Prototype rosters, starting 7, and initial standings
│   ├── utils/
│   │   └── formatters.ts       # Currency (€100M), rating colors, and position badges
│   ├── simulation/
│   │   └── engine.ts           # Tactical match simulation engine (pure logic, separated from UI)
│   ├── services/
│   │   └── gameStorage.ts      # Local persistence service (localStorage + state manager)
│   ├── components/
│   │   ├── Header.tsx          # Brand, team badges, budget tracker, mobile toggle
│   │   ├── Navigation.tsx      # Desktop top navigation, mobile drawer & bottom bar
│   │   ├── PitchView.tsx       # 7-player pitch with tactical formation and tokens
│   │   ├── PlayerCard.tsx      # Sports player card with OVR, form, attributes, and actions
│   │   ├── PlayerDetailModal.tsx # Tactical inspector modal with season statistics
│   │   ├── LineupEditorModal.tsx # Starters & bench substitution modal
│   │   └── StatBar.tsx         # Color-coded animated attribute meter
│   ├── pages/
│   │   ├── Dashboard.tsx       # Screen 1: Dashboard
│   │   ├── PlayersPage.tsx     # Screen 2: Player Database & Filters
│   │   ├── MyTeamPage.tsx      # Screen 3: Squad & Pitch Management
│   │   ├── MatchSetupPage.tsx  # Screen 4: Match Setup & Rival Selection
│   │   ├── MatchSimulationPage.tsx # Screen 5: Live Simulated Clock & Events
│   │   ├── LeaguePage.tsx      # Screen 6: League Standings Table
│   │   ├── AuctionPage.tsx     # Auction Market & Bidding
│   │   ├── StatisticsPage.tsx  # League Leaders (Goals, Assists, Ratings)
│   │   └── SettingsPage.tsx    # Settings & Season Reset
│   ├── App.tsx                 # Main application state orchestrator
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind CSS & custom tactical turf styles
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 How to Run Locally

1. Open your terminal in this directory:
   ```bash
   cd "d:\football ai app"
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser at:
   ```text
   http://localhost:3000/
   ```
