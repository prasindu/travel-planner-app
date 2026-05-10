import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Linking,
  Platform,
  BackHandler,
  Animated,
  Easing
} from 'react-native';
import { WebView } from 'react-native-webview'; 
import { 
  MapPin, ChevronLeft, Navigation, Check, 
  AlertTriangle, RefreshCw, Map, List, ArrowRight, Wind, Droplets,
  Bus, Train, Car 
} from 'lucide-react-native';

import { updateTripStatus, getWeather, getItinerary } from '../api/api'; 
import { useLanguage } from '../context/LanguageContext';
import { VITE_GOOGLE_MAPS_KEY } from '@env';

const MAPS_KEY = VITE_GOOGLE_MAPS_KEY;

// ── Weather helpers ───────────────────────────────────────────
const getWeatherIcon = (condition) => {
  const icons = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️' };
  return icons[condition] ? icons[condition] : '🌤️';
};


const formatPlaceForMap = (place) => {
  if (!place) return '';
  const isCoords = /^[0-9.-]+,\s*[0-9.-]+$/.test(place.trim());
  return isCoords ? place.trim() : `${place.trim()}, Sri Lanka`;
};

const buildMapsUrl = (places, currentIdx) => {
  if (!places || places.length < 2) return '';
  
  const origin = encodeURIComponent(formatPlaceForMap(places[currentIdx])); 
  const dest   = encodeURIComponent(formatPlaceForMap(places[places.length - 1]));
  
  const remainingPlaces = places.slice(currentIdx + 1, -1);
  const wps = remainingPlaces.length > 0 
    ? remainingPlaces.map(p => encodeURIComponent(formatPlaceForMap(p))).join('|') 
    : '';
  
 
  return `https://www.google.com/maps/embed/v1/directions?key=${MAPS_KEY}&origin=${origin}&destination=${dest}${wps ? `&waypoints=${wps}` : ''}&mode=driving`;
};

// ── Google Maps HTML Wrapper (FIXED) ──────────────────────────
const getMapHtml = (url) => {
  if (!url) return '';
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #0f172a; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <iframe src="${url}" allowfullscreen></iframe>
      </body>
    </html>
  `;
};


const buildNavUrl = (from, to) => {
  if (!from || !to) return null;

  
  const isFromCoords = /^[0-9.-]+,\s*[0-9.-]+$/.test(from.trim());
  const cleanFrom = isFromCoords ? from.trim() : `${from}, Sri Lanka`;

  const isToCoords = /^[0-9.-]+,\s*[0-9.-]+$/.test(to.trim());
  const cleanTo = isToCoords ? to.trim() : `${to}, Sri Lanka`;

  const f = encodeURIComponent(cleanFrom);
  const t = encodeURIComponent(cleanTo);
  
  // නිවැරදි Universal Google Maps Directions URL එක
  return `https://www.google.com/maps/dir/?api=1&origin=${f}&destination=${t}&travelmode=driving`;
};
export default function TripActivePage({ trip, onBack, onComplete }) {
  const { t } = useLanguage();
  
  const getT = (key, defaultText) => {
    const text = t(key);
    return text === key || !text ? defaultText : text;
  };

  const [currentIdx, setCurrentIdx]     = useState(trip.currentStopIndex ? trip.currentStopIndex : 0);
  const [view, setView]                 = useState('map');  
  const [weatherData, setWeatherData]   = useState({});     
  const [loadingWx, setLoadingWx]       = useState({});
  const [showAlerts, setShowAlerts]     = useState({});
  const [saving, setSaving]             = useState(false);

  // --- Transit Options State ---
  const [transitOptions, setTransitOptions] = useState(null);
  const [loadingTransit, setLoadingTransit] = useState(false);
  const [activeTransitTab, setActiveTransitTab] = useState('car'); 

  const stops = trip.optimizedOrder ? trip.optimizedOrder : [];
  const currentPlace  = stops[currentIdx];
  const nextPlace     = stops[currentIdx + 1];

  // --- Animation Setup ---
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  // --- Back Handler ---
  useEffect(() => {
    const backAction = () => { onBack(); return true; };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  // --- Data Fetching Logic ---
  useEffect(() => {
    fetchWeatherForStop(currentPlace);
    if (nextPlace) {
      fetchWeatherForStop(nextPlace);
      fetchTransitOptions(currentPlace, nextPlace); 
    }
  }, [currentIdx, currentPlace, nextPlace]);

  // Fetch Weather
  const fetchWeatherForStop = useCallback(async (place) => {
    if (!place || weatherData[place]) return;
    setLoadingWx(prev => ({ ...prev, [place]: true }));
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place + ', Sri Lanka')}&key=${MAPS_KEY}`;
      const geoRes = await fetch(geocodeUrl);
      const geoData = await geoRes.json();

      if (geoData.status === 'OK' && geoData.results[0]) {
        const { lat, lng } = geoData.results[0].geometry.location;
        const wx = await getWeather({ lat, lng, city: place.split(',')[0], locationName: place, locationType: 'tourist_attraction' });

        if (wx && wx.success) {
          setWeatherData(prev => ({ ...prev, [place]: wx }));
          if (wx.rerouteSuggested) setShowAlerts(prev => ({ ...prev, [place]: true }));
        }
      }
    } catch (e) {
      console.log('Weather fetch failed', e);
    } finally {
      setLoadingWx(prev => ({ ...prev, [place]: false }));
    }
  }, [weatherData]);

  // Fetch Transit Options
  const fetchTransitOptions = async (from, to) => {
    setLoadingTransit(true);
    try {
      const res = await getItinerary([from, to], "08:00"); 
      if (res && res.stepByStep && res.stepByStep.length > 0) {
        setTransitOptions(res.stepByStep[0].options); 
      }
    } catch (error) {
      console.log('Transit fetch failed', error);
      setTransitOptions(null);
    } finally {
      setLoadingTransit(false);
    }
  };

  const handleNextStop = async () => {
    if (currentIdx >= stops.length - 1) return;
    const newIdx = currentIdx + 1;
    setCurrentIdx(newIdx);
    try { await updateTripStatus(trip._id, 'active', newIdx); } catch {}
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateTripStatus(trip._id, 'completed', stops.length - 1);
      if (onComplete) onComplete();
    } catch {}
    setSaving(false);
  };

  const openNavigation = (from, to) => {
    const url = buildNavUrl(from, to);
    Linking.openURL(url).catch(() => console.log('Failed to open maps'));
  };

  const currentWx     = weatherData[currentPlace];
  const isLastStop    = currentIdx === stops.length - 1;
  const progress      = stops.length > 1 ? (currentIdx / (stops.length - 1)) * 100 : 100;

  // Transit Tabs
  const transitTabs = [
    { key: 'car',   label: getT('itinerary.drive', 'Drive'), icon: Car,   color: '#10b981' }, 
    { key: 'train', label: getT('itinerary.train', 'Train'), icon: Train, color: '#a855f7' }, 
    { key: 'bus',   label: getT('itinerary.bus', 'Bus'),     icon: Bus,   color: '#0ea5e9' }, 
  ];

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.topNavbar}>
        <TouchableOpacity onPress={onBack} style={styles.topBackBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>{trip.title ? trip.title : 'Trip'}</Text>
          <Text style={styles.headerSubtitle}>{getT('activeTrip.stops', 'Stops')} {currentIdx + 1} / {stops.length}</Text>
        </View>
        <View style={styles.viewToggle}>
          <TouchableOpacity onPress={() => setView('map')} style={[styles.toggleBtn, view === 'map' ? styles.toggleBtnActive : null]}>
            <Map size={16} color={view === 'map' ? '#fff' : '#64748b'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView('list')} style={[styles.toggleBtn, view === 'list' ? styles.toggleBtnActive : null]}>
            <List size={16} color={view === 'list' ? '#fff' : '#64748b'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressWrapper}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Current Stop Details --- */}
        <View style={styles.currentStopCard}>
          <View style={styles.cardGlow} />
          <View style={styles.currentStopHeader}>
            <View style={styles.liveIndicator}>
              <Animated.View style={[styles.liveDotAnim, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{getT('activeTrip.currentStop', 'CURRENT STOP')}</Text>
            </View>
          </View>

          <Text style={styles.currentPlaceTitle}>{currentPlace ? currentPlace.split(',')[0] : ''}</Text>
          {currentPlace && currentPlace.includes(',') ? (
            <Text style={styles.currentPlaceSub} numberOfLines={1}>{currentPlace.split(',').slice(1).join(',').trim()}</Text>
          ) : null}

          {/* Navigation Button */}
          {nextPlace ? (
            <TouchableOpacity onPress={() => openNavigation(currentPlace, nextPlace)} style={styles.navigateBtn} activeOpacity={0.8}>
              <Navigation size={18} color="#fff" style={{ marginRight: 8, flexShrink: 0 }} />
              <Text style={[styles.navigateBtnText, { flexShrink: 1 }]} numberOfLines={1}>{getT('activeTrip.navigateBtn', 'Navigate')} ➔ {nextPlace.split(',')[0]}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Current Weather */}
          {loadingWx[currentPlace] ? (
            <View style={styles.loadingWxBox}><ActivityIndicator size="small" color="#0ea5e9" style={{ marginRight: 8 }} /><Text style={styles.loadingWxText}>{getT('activeTrip.weatherLoading', 'Checking weather...')}</Text></View>
          ) : currentWx ? (
            <View style={styles.weatherGlassBox}>
              <View style={styles.weatherDetailsLeft}>
                <Text style={{ fontSize: 36, marginRight: 12 }}>{getWeatherIcon(currentWx.weather.condition)}</Text>
                <View><Text style={styles.tempText}>{Math.round(currentWx.weather.temperature)}°C</Text><Text style={styles.conditionText}>{currentWx.weather.condition}</Text></View>
              </View>
              <View style={styles.weatherDetailsRight}>
                <View style={styles.wxMetaRow}><Droplets size={12} color="#94a3b8" /><Text style={styles.wxMetaText}>{currentWx.weather.humidity}%</Text></View>
                <View style={styles.wxMetaRow}><Wind size={12} color="#94a3b8" /><Text style={styles.wxMetaText}>{currentWx.weather.windSpeed}m/s</Text></View>
              </View>
            </View>
          ) : null}

          {/* Weather Alert */}
          {(currentWx && currentWx.rerouteSuggested && showAlerts[currentPlace]) ? (
            <View style={styles.alertBox}>
              <View style={styles.alertHeader}><AlertTriangle size={18} color="#facc15" style={{ marginRight: 8 }} /><Text style={styles.alertTitle}>{getT('activeTrip.weatherAlert', 'WEATHER ALERT')}</Text></View>
              <Text style={styles.alertMessage}>{currentWx.message ? currentWx.message : ''}</Text>
              {(currentWx.alternatives && currentWx.alternatives.length > 0) ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.indoorLabel}>{getT('activeTrip.indoorSuggestions', 'INDOOR ALTERNATIVES:')}</Text>
                  {currentWx.alternatives.map((alt, i) => (
                    <View key={i} style={styles.altCard}>
                      <Text style={{ color: '#facc15', marginRight: 8 }}>›</Text>
                      <View style={{ flex: 1 }}><Text style={styles.altName}>{alt.name ? alt.name : ''}</Text><Text style={styles.altAddress} numberOfLines={1}>{alt.address ? alt.address : ''}</Text></View>
                    </View>
                  ))}
                </View>
              ) : null}
              <TouchableOpacity onPress={() => setShowAlerts(prev => ({ ...prev, [currentPlace]: false }))}><Text style={styles.dismissBtn}>{getT('activeTrip.dismiss', 'DISMISS')} ✕</Text></TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* --- Next Stop & Transit Options --- */}
        {nextPlace ? (
          <View style={styles.nextStopCardWrapper}>
            <View style={styles.nextStopHeader}>
              <View style={styles.nextStopLeft}>
                <Text style={styles.nextStopLabel}>{getT('activeTrip.nextStopTitle', 'UPCOMING STOP')}</Text>
                <Text style={styles.nextPlaceName}>{nextPlace.split(',')[0]}</Text>
              </View>
              <View style={styles.nextStopRight}>
                <Text style={{ fontSize: 40 }}>{getWeatherIcon(weatherData[nextPlace]?.weather?.condition)}</Text>
              </View>
            </View>

            {/* Transit Options Section */}
            {loadingTransit ? (
               <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator size="small" color="#10b981" /></View>
            ) : transitOptions ? (
              <View style={styles.transitSection}>
                <Text style={styles.transitTitle}>How to get there:</Text>
                
                {/* Tabs */}
                <View style={styles.segmentedControl}>
                  {transitTabs.map(({ key, label, icon: Icon, color }) => {
                    const isAvailable = transitOptions[key]?.summary !== 'Not available';
                    const isActive = activeTransitTab === key;
                    return (
                      <TouchableOpacity 
                        key={key} 
                        onPress={() => setActiveTransitTab(key)}
                        style={[styles.segmentBtn, isActive ? { backgroundColor: color } : null]}
                      >
                        <Icon size={14} color={isActive ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                        <Text style={[styles.segmentBtnText, isActive ? { color: '#fff' } : { color: '#64748b' }]}>
                          {label}
                        </Text>
                        {!isAvailable && !isActive ? <View style={styles.unavailDot} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Selected Tab Content */}
                <View style={styles.transitContentBox}>
                  {transitOptions[activeTransitTab]?.summary !== 'Not available' ? (
                     <Text style={styles.transitSummaryText}>
                       {transitOptions[activeTransitTab]?.summary}
                     </Text>
                  ) : (
                     <Text style={[styles.transitSummaryText, {color: '#fca5a5'}]}>
                       {getT('itinerary.notAvailable', 'Not available for this route.')}
                     </Text>
                  )}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* --- Maps View (FIXED API ENDPOINT) --- */}
        {view === 'map' ? (
          <View style={styles.mapCard}>
            <View style={styles.webViewContainer}>
              {MAPS_KEY ? (
                <WebView 
                  originWhitelist={['*']}
                  source={{ html: getMapHtml(buildMapsUrl(stops, currentIdx)) }} 
                  style={{ flex: 1 }} 
                  scrollEnabled={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
              ) : (
                <View style={styles.noMapBox}>
                  <Map size={48} color="rgba(255,255,255,0.1)" />
                  <Text style={styles.noMapText}>Map Unavailable</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* --- List View --- */}
        {view === 'list' ? (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineHeader}>JOURNEY TIMELINE</Text>
            <View style={styles.timelineList}>
              {stops.map((place, idx) => {
                const wx = weatherData[place];
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const isLastItem = idx === stops.length - 1;
                return (
                  <View key={idx} style={styles.timelineItem}>
                    <View style={styles.timelineVisual}>
                      <View style={[styles.timelineDot, isPast ? styles.dotPast : isCurrent ? styles.dotCurrent : styles.dotFuture]}>{isPast ? <Check size={12} color="#10b981" /> : isCurrent ? <MapPin size={12} color="#0ea5e9" /> : null}</View>
                      {!isLastItem ? <View style={[styles.timelineLine, isPast ? {backgroundColor: '#10b981'} : {backgroundColor: 'rgba(255,255,255,0.1)'}]} /> : null}
                    </View>
                    <View style={[styles.timelineContentBox, isCurrent ? styles.contentBoxCurrent : styles.contentBoxPast]}>
                      <View style={{ flex: 1 }}><Text style={[styles.tlPlaceName, idx > currentIdx && {color: 'rgba(255,255,255,0.5)'}]}>{place ? place.split(',')[0] : ''}</Text>{isCurrent ? <Text style={styles.tlHereText}>YOU ARE HERE</Text> : null}</View>
                      {wx && wx.weather ? <View style={styles.tlWxBadge}><Text style={{ fontSize: 14 }}>{getWeatherIcon(wx.weather.condition)}</Text><Text style={styles.tlWxTemp}>{Math.round(wx.weather.temperature)}°</Text></View> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* --- Footer --- */}
      <View style={styles.floatingBottomNav}>
        <TouchableOpacity onPress={() => { setWeatherData(prev => { const n = {...prev}; delete n[currentPlace]; return n; }); fetchWeatherForStop(currentPlace); }} style={styles.refreshBtn}><RefreshCw size={22} color="#cbd5e1" /></TouchableOpacity>
        <TouchableOpacity onPress={isLastStop ? handleComplete : handleNextStop} disabled={saving} style={[styles.mainActionBtn, isLastStop ? styles.btnComplete : styles.btnNext, saving && {opacity: 0.7}]}>
          {saving ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : <Check size={22} color="#fff" style={{ marginRight: 8 }} />}
          <Text style={styles.mainActionText}>{isLastStop ? getT('activeTrip.tripComplete', 'Finish Journey') : getT('activeTrip.nextStopBtn', 'Next Stop')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#030712' },
  topNavbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 16 : 0, paddingBottom: 16, backgroundColor: 'rgba(3, 7, 18, 0.9)', zIndex: 10 },
  topBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitleBox: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '900' },
  headerSubtitle: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  viewToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  toggleBtn: { padding: 10, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: 'rgba(14, 165, 233, 0.3)' },
  progressWrapper: { marginHorizontal: 20, height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressBar: { height: '100%', backgroundColor: '#0ea5e9', borderRadius: 4 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  currentStopCard: { backgroundColor: '#0f172a', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.4)', marginBottom: 20, overflow: 'hidden', position: 'relative', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  cardGlow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(14, 165, 233, 0.15)' },
  currentStopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, zIndex: 1 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, position: 'relative' },
  liveDotAnim: { position: 'absolute', left: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(239, 68, 68, 0.5)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 8 },
  liveText: { color: '#fca5a5', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  currentPlaceTitle: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 4, lineHeight: 42, zIndex: 1 },
  currentPlaceSub: { color: '#94a3b8', fontSize: 15, marginBottom: 24, zIndex: 1 },
  navigateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0ea5e9', paddingVertical: 16, borderRadius: 16, marginBottom: 24, paddingHorizontal: 20, zIndex: 1, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  navigateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  weatherGlassBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', zIndex: 1 },
  weatherDetailsLeft: { flexDirection: 'row', alignItems: 'center' },
  tempText: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 2 },
  conditionText: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  weatherDetailsRight: { alignItems: 'flex-start', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', paddingLeft: 16 },
  wxMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  wxMetaText: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  alertBox: { backgroundColor: 'rgba(234, 179, 8, 0.1)', borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.3)', borderRadius: 20, padding: 20, marginTop: 20, zIndex: 1 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  alertTitle: { color: '#facc15', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  alertMessage: { color: 'rgba(253, 224, 71, 0.9)', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  indoorLabel: { color: '#fef08a', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  altCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12, marginBottom: 8 },
  altName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  altAddress: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
  altRating: { color: '#facc15', fontSize: 11, fontWeight: 'bold', marginTop: 6 },
  dismissBtn: { color: '#facc15', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: 16, textAlign: 'center', padding: 8, backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: 8 },
  
  /* Next Stop Card & Transit Section */
  nextStopCardWrapper: { backgroundColor: '#0f172a', borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  nextStopHeader: { flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  nextStopLeft: { flex: 1 },
  nextStopLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  nextPlaceName: { color: '#fff', fontSize: 22, fontWeight: '900' },
  nextStopRight: { marginLeft: 16 },
  
  transitSection: { padding: 16 },
  transitTitle: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase' },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#050812', borderRadius: 10, padding: 4, marginBottom: 12 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, position: 'relative' },
  segmentBtnText: { fontSize: 12, fontWeight: 'bold' },
  unavailDot: { position: 'absolute', top: 6, right: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444' },
  transitContentBox: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  transitSummaryText: { color: '#e2e8f0', fontSize: 13, lineHeight: 20 },

  mapCard: { backgroundColor: '#0f172a', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  webViewContainer: { height: 350, backgroundColor: 'rgba(0,0,0,0.2)' },
  noMapBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  noMapText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 'bold', marginBottom: 16 },
  timelineCard: { backgroundColor: '#0f172a', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  timelineHeader: { color: '#64748b', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 24 },
  timelineList: { paddingLeft: 10 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineVisual: { width: 30, alignItems: 'center', marginRight: 20 },
  timelineDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', zIndex: 2, borderWidth: 2, borderColor: '#0f172a' },
  dotPast: { backgroundColor: '#10b981' },
  dotCurrent: { backgroundColor: '#0ea5e9' },
  dotFuture: { backgroundColor: '#334155' },
  timelineLine: { width: 2, flex: 1, marginTop: 4, marginBottom: -24 },
  timelineContentBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1 },
  contentBoxPast: { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.02)' },
  contentBoxCurrent: { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderColor: 'rgba(14, 165, 233, 0.3)' },
  tlPlaceName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  tlHereText: { color: '#38bdf8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 6 },
  tlWxBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  tlWxTemp: { color: '#cbd5e1', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  floatingBottomNav: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 20, right: 20, flexDirection: 'row', backgroundColor: 'rgba(3, 7, 18, 0.95)', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  refreshBtn: { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  mainActionBtn: { flex: 1, flexDirection: 'row', height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  btnNext: { backgroundColor: '#0ea5e9' },
  btnComplete: { backgroundColor: '#10b981' },
  mainActionText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }
});