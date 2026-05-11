# Lanka Trails 🌴🇱🇰

Lanka Trails is a comprehensive travel planning application built with React Native. It helps users discover, plan, and optimize their journeys across the beautiful island of Sri Lanka. With real-time weather integration, intelligent routing, and an interactive journey timeline, Lanka Trails is your ultimate travel companion.

---

## ✨ Key Features

- **Interactive Trip Planning:** Create custom itineraries with multiple stops across Sri Lanka.
- **Smart Navigation:** Built-in Google Maps integration for seamless navigation between destinations.
- **Live Weather Updates:** Real-time weather forecasts for every stop on your journey, powered by an external weather API.
- **Intelligent Rerouting (Weather Alerts):** If bad weather (rain, thunderstorm, etc.) is detected at a planned stop, the app automatically alerts the user and suggests nearby indoor alternatives.
- **Journey Timeline:** A visually appealing list view to track your past, current, and upcoming destinations.
- **Dual View Mode:** Easily switch between the Map View (for geographical context) and the List View (for timeline tracking).
- **🔔 Push Notifications & Reminders:** Get timely reminders 30 minutes before your trip starts and receive instant push notifications for severe weather alerts using @notifee/react-native.
---

## 🚀 Technologies Used

| Technology | Purpose |
|---|---|
| React Native (CLI/Bare Workflow) | Frontend framework |
| `lucide-react-native` | Icons |
| `react-native-webview` | Maps via Google Maps Embed API |
| `react-native-dotenv` | Environment variable management |
| React Native Animated API | Animations |

---

## 🛠️ Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- [Java Development Kit (JDK)](https://www.oracle.com/java/technologies/downloads/) installed
- [Android Studio](https://developer.android.com/studio) and Android SDK set up
- A physical Android device or an Emulator

### Installation Steps

**1. Clone the repository:**

```bash
git clone https://github.com/prasindu/TravelPlannerApp.git
cd TravelPlannerApp
```

**2. Install dependencies:**

```bash
npm install
```

**3. Set up Environment Variables:**

Create a `.env` file in the root directory and add your Google Maps API key:

```env
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

> **Note:** The API key is securely bundled during the build process using `react-native-dotenv`.

**4. Run the application (Android):**

```bash
npx react-native run-android
```

If you face any caching issues, start the Metro server with a reset cache flag:

```bash
npx react-native start --reset-cache
```

---

## 📦 Building the APK (Release Version)

To generate a standalone APK that can be installed on any Android device:

**1. Navigate to the `android` directory:**

```bash
cd android
```

**2. Clean the build cache (recommended):**

```bash
gradlew clean
```

**3. Build the release APK:**

```bash
gradlew assembleRelease
```

**4. The generated APK will be located at:**

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 💡 Usage

Lanka Trails guides you through your journey in a smart, step-by-step flow:

### Step 1 — Discover Nearby Destinations
Enter your current location or drop a pin on the map. The app will instantly surface the **10 closest travel destinations** in Sri Lanka around you, ranked by proximity.

### Step 2 — Build Your Itinerary
Browse the suggested destinations and select the stops you want to visit. Add as many as you like to your personal trip itinerary.

### Step 3 — Get the Optimal Route
Once your stops are selected, the app calculates the **shortest possible route** across all chosen destinations using an optimized path algorithm. You'll see:
- The recommended **order to visit** each stop
- The **total distance** for the full trip
- Individual distances between each consecutive stop

### Step 4 — View Transit Connections
For each leg of the journey, the app provides **public transport options** including:
- 🚌 **Bus routes** — relevant bus numbers and boarding points
- 🚂 **Train connections** — station names and transfer points along the way

### Step 5 — Start the Trip & Navigate
Hit **"Start Journey"** to begin. As you travel, each upcoming destination is highlighted live on the **interactive map view** so you always know exactly where you're headed.

### Step 6 — Smart Weather Rerouting & Alerts
The app monitors weather conditions. If severe weather is detected, you receive an Instant Push Notification and indoor alternatives are suggested.
- You'll receive an **instant alert**
- The app suggests **alternative nearby destinations** that are suitable for the current conditions
- You can accept a suggested alternative or dismiss the alert and continue your original plan

### Step 7 — Stay Notified
Never miss a trip with automated push notifications reminding you 30 minutes before your journey begins!


---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/YourUsername/TravelPlannerApp/issues).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

*Built with ❤️ in Sri Lanka.*