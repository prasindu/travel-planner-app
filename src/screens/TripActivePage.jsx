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
  AlertTriangle, RefreshCw, Map, List, Compass, ArrowRight, Wind, Droplets
} from 'lucide-react-native';

import { updateTripStatus, getWeather } from '../api/api'; 
import { useLanguage } from '../context/LanguageContext';

import { VITE_GOOGLE_MAPS_KEY } from '@env';

const MAPS_KEY = VITE_GOOGLE_MAPS_KEY;

// ── Weather helpers ───────────────────────────────────────────
const getWeatherIcon = (condition) => {
  const icons = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️' };
  return icons[condition] ? icons[condition] : '🌤️';
};

// ── Google Maps URL builder ───────────────────────────────────
const buildMapsUrl = (places, currentIdx) => {
  if (!places || places.length < 2) return null;
  const origin = encodeURIComponent(places[currentIdx] + ', Sri Lanka'); 
  const dest   = encodeURIComponent(places[places.length - 1] + ', Sri Lanka');
  const remainingPlaces = places.slice(currentIdx + 1, -1);
  const wps    = remainingPlaces.length > 0 ? remainingPlaces.map(p => encodeURIComponent(p + ', Sri Lanka')).join('|') : '';
  return `https://www.google.com/maps/embed/v1/directions?key=${MAPS_KEY}&origin=${origin}&destination=${dest}${wps ? `&waypoints=${wps}` : ''}&mode=driving`;
};

const buildNavUrl = (from, to) => {
  const f = encodeURIComponent(from + ', Sri Lanka');
  const t = encodeURIComponent(to  + ', Sri Lanka');
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

  const stops = trip.optimizedOrder ? trip.optimizedOrder : [];

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

  // --- Weather Fetch Logic ---
  useEffect(() => {
    fetchWeatherForStop(stops[currentIdx]);
    if (currentIdx < stops.length - 1) fetchWeatherForStop(stops[currentIdx + 1]);
  }, [currentIdx]);

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

        console.log("Full JSON from Backend for " + place + ":", JSON.stringify(wx, null, 2));

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

  const currentPlace  = stops[currentIdx];
  const nextPlace     = stops[currentIdx + 1];
  const currentWx     = weatherData[currentPlace];
  const isLastStop    = currentIdx === stops.length - 1;
  const progress      = stops.length > 1 ? (currentIdx / (stops.length - 1)) * 100 : 100;

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

          {nextPlace ? (
            <TouchableOpacity onPress={() => openNavigation(currentPlace, nextPlace)} style={styles.navigateBtn} activeOpacity={0.8}>
              <Navigation size={18} color="#fff" style={{ marginRight: 8, flexShrink: 0 }} />
              <Text style={[styles.navigateBtnText, { flexShrink: 1 }]} numberOfLines={1}>{getT('activeTrip.navigateBtn', 'Navigate')} ➔ {nextPlace.split(',')[0]}</Text>
            </TouchableOpacity>
          ) : null}

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

        {nextPlace ? (
          <View style={styles.nextStopCard}>
            <View style={styles.nextStopLeft}><Text style={styles.nextStopLabel}>{getT('activeTrip.nextStopTitle', 'UPCOMING STOP')}</Text><Text style={styles.nextPlaceName}>{nextPlace.split(',')[0]}</Text></View>
            <View style={styles.nextStopRight}><Text style={{ fontSize: 40 }}>{getWeatherIcon(weatherData[nextPlace]?.weather?.condition)}</Text></View>
          </View>
        ) : null}

 {view === 'map' ? (
  <View style={styles.mapCard}>
    <View style={styles.webViewContainer}>
      {MAPS_KEY ? (
        <WebView 
          
          source={{ 
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                  <style>
                    body { margin: 0; padding: 0; background-color: #0f172a; }
                    iframe { width: 100vw; height: 100vh; border: none; }
                  </style>
                </head>
                <body>
                  <iframe 
                    src="${buildMapsUrl(stops, currentIdx)}" 
                    allowfullscreen>
                  </iframe>
                </body>
              </html>
            ` 
          }} 
          style={{ flex: 1 }} 
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
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
  nextStopCard: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'space-between' },
  nextStopLeft: { flex: 1 },
  nextStopLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  nextPlaceName: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 12 },
  nextWxRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  nextTempBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  nextTempText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  nextCondText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  nextStopRight: { marginLeft: 16 },
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
