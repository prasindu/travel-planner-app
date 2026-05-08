import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components & Screens imports (raw imports)
import NavbarRaw from './src/components/Navbar';
import SaveTripModalRaw from './src/components/SaveTripModal';
import SearchPageRaw from './src/screens/SearchPage';
import PlanPageRaw from './src/screens/PlanPage';
import OptimizePageRaw from './src/screens/OptimizePage';
import ItineraryPageRaw from './src/screens/ItineraryPage';
import LoginPageRaw from './src/screens/LoginPage';
import DashboardPageRaw from './src/screens/DashboardPage';
import TripActivePageRaw from './src/screens/TripActivePage';
import { LanguageProvider } from './src/context/LanguageContext';

// ── .jsx components as any cast (prop type conflicts fix) ─────
const Navbar         = NavbarRaw as any;
const SaveTripModal  = SaveTripModalRaw as any;
const SearchPage     = SearchPageRaw as any;
const PlanPage       = PlanPageRaw as any;
const OptimizePage   = OptimizePageRaw as any;
const ItineraryPage  = ItineraryPageRaw as any;
const LoginPage      = LoginPageRaw as any;
const DashboardPage  = DashboardPageRaw as any;
const TripActivePage = TripActivePageRaw as any;

// ── Types Definition ──────────────────────────────────────────
interface UserData {
  name: string;
  email: string;
}

interface Trip {
  _id: string;
  title: string;
  tripDate: string;
  startLocation: string;
  optimizedOrder: string[];
  startTime: string;
  status: 'planned' | 'active' | 'completed';
  currentStopIndex?: number;
}

export default function App() {
  // ── App Init State ────────────────────────────────────────
  const [isReady, setIsReady] = useState(false);

  // ── Auth State ────────────────────────────────────────────
  const [user, setUser] = useState<UserData | null>(null);

  // ── App View ──────────────────────────────────────────────
  type AppView = 'login' | 'dashboard' | 'planner' | 'active-trip';
  const [view, setView] = useState<AppView>('login');

  // ── Active Trip ───────────────────────────────────────────
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  // ── Planner State ─────────────────────────────────────────
  const [step, setStep]                 = useState(1);
  const [startLocation, setStartLoc]    = useState('');
  const [selectedPlaces, setSelected]   = useState<string[]>([]);
  const [startTime, setStartTime]       = useState('06:00');
  const [optimizedPlaces, setOptimized] = useState<string[]>([]);
  const [optimizeResult, setOptResult]  = useState<any>(null);

  // ── Save Trip Modal ───────────────────────────────────────
  const [showSave, setShowSave] = useState(false);

  // ── Check Login Status on Mount ───────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token    = await AsyncStorage.getItem('lt_token');
        const userData = await AsyncStorage.getItem('lt_user');

        if (token && userData) {
          setUser(JSON.parse(userData));
          setView('dashboard');
        } else {
          setView('login');
        }
      } catch (e) {
        setView('login');
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, []);

  // ── Auth Handlers ─────────────────────────────────────────
  const handleAuthSuccess = (userData: UserData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('lt_token');
    await AsyncStorage.removeItem('lt_user');
    setUser(null);
    setView('login');
  };

  // ── Planner Handlers ──────────────────────────────────────
  const handleNewTrip = () => {
    setStep(1);
    setStartLoc('');
    setSelected([]);
    setStartTime('06:00');
    setOptimized([]);
    setOptResult(null);
    setView('planner');
  };

  const handleStartTrip = (trip: Trip) => {
    setActiveTrip(trip);
    setView('active-trip');
  };

  const handleTripComplete = () => {
    setActiveTrip(null);
    setView('dashboard');
  };

  // ── Loading Screen ────────────────────────────────────────
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  // ── View Rendering Logic ──────────────────────────────────
  let currentView;

  if (view === 'login') {
    currentView = (
      <LoginPage onAuthSuccess={handleAuthSuccess} />
    );
  }
  else if (view === 'active-trip' && activeTrip) {
    currentView = (
      <TripActivePage
        trip={activeTrip}
        onBack={() => setView('dashboard')}
        onComplete={handleTripComplete}
      />
    );
  }
  else if (view === 'dashboard') {
    currentView = (
      <DashboardPage
        user={user}
        onNewTrip={handleNewTrip}
        onStartTrip={handleStartTrip}
        onLogout={handleLogout}
      />
    );
  }
  else {
    currentView = (
      <View style={styles.plannerContainer}>
        <Navbar
          currentStep={step}
          user={user}
          onDashboard={() => setView('dashboard')}
          onLogout={handleLogout}
        />

        <View style={styles.plannerContent}>
          {step === 1 && (
            <SearchPage
              startLocation={startLocation}
              setStartLocation={setStartLoc}
              selectedPlaces={selectedPlaces}
              setSelectedPlaces={setSelected}
              onNext={() => setStep(2)}
              // METHANATA THAMA onBack EKA ADD KALE
              onBack={() => setView('dashboard')} 
            />
          )}
          {step === 2 && (
            <PlanPage
              selectedPlaces={selectedPlaces}
              setSelectedPlaces={setSelected}
              startTime={startTime}
              setStartTime={setStartTime}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <OptimizePage
              startLocation={startLocation}
              selectedPlaces={selectedPlaces}
              setOptimizedPlaces={(places: string[]) => setOptimized(places)}
              setOptimizeResult={(result: any) => setOptResult(result)}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <ItineraryPage
              optimizedPlaces={optimizedPlaces}
              startTime={startTime}
              onBack={() => setStep(3)}
              onSaveTrip={() => setShowSave(true)}
            />
          )}
        </View>

        {showSave && (
          <SaveTripModal
            optimizedPlaces={optimizedPlaces}
            startLocation={startLocation}
            startTime={startTime}
            totalDistance={optimizeResult?.totalDistance}
            onSaved={() => {
              setShowSave(false);
              setView('dashboard');
            }}
            onClose={() => setShowSave(false)}
          />
        )}
      </View>
    );
  }

  return (
    <LanguageProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        {currentView}
      </SafeAreaView>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plannerContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  plannerContent: {
    flex: 1,
  },
});