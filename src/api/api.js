import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://travel-api-srilanka-e6azatbsh0cna2bg.southeastasia-01.azurewebsites.net/api',
  timeout: 15000
});

// ── Inject token into every request ──────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('lt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }
  return config;
});

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
export const register = async (name, email, password) => {
  const res = await api.post('/auth/register', { name, email, password });
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};


export const changePassword = async (currentPassword, newPassword) => {
 
  const res = await api.put('/auth/password', { currentPassword, newPassword });
  return res.data;
};

// ══════════════════════════════════════════════════════════════
// TRIPS
// ══════════════════════════════════════════════════════════════
export const saveTrip = async (tripData) => {
  const res = await api.post('/trips', tripData);
  return res.data;
};

export const getMyTrips = async () => {
  const res = await api.get('/trips');
  return res.data;
};

export const getTripById = async (id) => {
  const res = await api.get(`/trips/${id}`);
  return res.data;
};

export const updateTripStatus = async (id, status, currentStopIndex) => {
  const res = await api.patch(`/trips/${id}/status`, { status, currentStopIndex });
  return res.data;
};

export const deleteTrip = async (id) => {
  const res = await api.delete(`/trips/${id}`);
  return res.data;
};

// ══════════════════════════════════════════════════════════════
// EXISTING APIs
// ══════════════════════════════════════════════════════════════

export const getDirections = async (origin, destination) => {
  const res = await api.post('/directions', { origin, destination });
  return res.data;
};

export const optimizeRoute = async (places, endLocation = null) => {
  const res = await api.post('/optimize', { places, endLocation });
  return res.data;
};

export const getSuggestions = async (city, searchType = 'city') => {
  const res = await api.post('/suggestions', { city, searchType });
  return res.data;
};

export const getItinerary = async (optimizedPlaces, startTime = '06:00') => {
  const res = await api.post('/itinerary', { optimizedPlaces, startTime });
  return res.data;
};

export const getWeather = async ({ lat, lng, city, locationName, locationType }) => {
  const res = await api.post('/weather', { lat, lng, city, locationName, locationType });
  return res.data;
};

export const healthCheck = async () => {
  const res = await api.get('/health');
  return res.data;
};