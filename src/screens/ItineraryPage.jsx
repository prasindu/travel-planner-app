import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform
} from 'react-native';
import { 
  Bus, Train, Car, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, 
  MapPin, Clock, AlertCircle, CheckCircle, RefreshCw, Save, Map, ArrowLeft, Navigation, Route 
} from 'lucide-react-native';

import { getItinerary } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

export default function ItineraryPage({ optimizedPlaces, startTime, onBack, onSaveTrip }) {
  const { t } = useLanguage();

  // Translation fallback helper
  const getT = (key, defaultText) => {
    const text = t(key);
    return text === key || !text ? defaultText : text;
  };
  
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [activeTabs, setTabs]   = useState({});
  const [expanded, setExpanded] = useState({});


  useEffect(() => {
    const backAction = () => {
      onBack(); 
      return true; 
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [onBack]);
  // ------------------------------------------------

  const fetchItinerary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getItinerary(optimizedPlaces, startTime);
      setData(res);
      const tabs = {};
      res.stepByStep.forEach((_, i) => { tabs[i] = 'car'; });
      setTabs(tabs);
      
      setExpanded({ 0: true });
    } catch (e) {
      setError(getT('itinerary.error', 'Failed to load itinerary. Please check your connection.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchItinerary(); 
  }, []);

  const setTab = (idx, tab) => setTabs(prev => ({ ...prev, [idx]: tab }));
  const toggleExpand = (idx) => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <SafeAreaView style={styles.mainContainer}>
      
      {/* --- Top Navbar for Back Button --- */}
      <View style={styles.topNavbar}>
        <TouchableOpacity onPress={onBack} style={styles.topBackBtn}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>{getT('nav.steps.itinerary', 'Itinerary')}</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Header */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconBox}>
            <Map size={28} color="#10b981" />
          </View>
          <Text style={styles.heroTitle}>
            {getT('itinerary.title1', 'Your Complete')} <Text style={styles.heroTitleHighlight}>{getT('itinerary.title2', 'Journey')}</Text>
          </Text>
          <Text style={styles.heroSubtitle}>{getT('itinerary.subtitle', 'Step-by-step travel guide')}</Text>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.spinnerBox}>
              <ActivityIndicator size="large" color="#10b981" />
              <Navigation size={20} color="#34d399" style={styles.spinnerIcon} />
            </View>
            <Text style={styles.loadingTitle}>{getT('itinerary.loadingTitle', 'Building your itinerary...')}</Text>
            <Text style={styles.loadingSub}>{getT('itinerary.loadingSub', 'Finding the best transit options')}</Text>
            
            <View style={styles.loadingBadges}>
              <View style={styles.loadingBadge}><Bus size={14} color="#38bdf8" style={{marginRight: 6}}/><Text style={styles.loadingBadgeText}>Bus</Text></View>
              <View style={styles.loadingBadge}><Train size={14} color="#a855f7" style={{marginRight: 6}}/><Text style={styles.loadingBadgeText}>Train</Text></View>
              <View style={styles.loadingBadge}><Car size={14} color="#4ade80" style={{marginRight: 6}}/><Text style={styles.loadingBadgeText}>Drive</Text></View>
            </View>
          </View>
        ) : null}

        {/* Error State */}
        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={20} color="#f87171" style={{marginTop: 2}} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchItinerary} style={styles.retryBtn}>
                <RefreshCw size={14} color="#fff" style={{marginRight: 6}} />
                <Text style={styles.retryBtnText}>{getT('common.retry', 'Retry')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Data View */}
        {(data && !loading) ? (
          <View style={styles.dataContainer}>
            
            {/* Top Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MapPin size={16} color="#0ea5e9" style={{marginBottom: 6}}/>
                <Text style={styles.statValue}>{data.journey.totalStops}</Text>
                <Text style={styles.statLabel}>{getT('itinerary.totalStops', 'Stops')}</Text>
              </View>
              <View style={styles.statCard}>
                <Route size={16} color="#8b5cf6" style={{marginBottom: 6}}/>
                <Text style={styles.statValue}>{data.journey.totalSegments}</Text>
                <Text style={styles.statLabel}>{getT('itinerary.segments', 'Segments')}</Text>
              </View>
              <View style={styles.statCard}>
                <Clock size={16} color="#10b981" style={{marginBottom: 6}}/>
                <Text style={[styles.statValue, {color: '#10b981'}]}>{data.journey.startTime}</Text>
                <Text style={styles.statLabel}>{getT('itinerary.startTime', 'Departure')}</Text>
              </View>
            </View>

            {/* Timeline Segments */}
            <View style={styles.timelineContainer}>
              {data.stepByStep.map((seg, idx) => (
                <SegmentCard
                  key={idx}
                  seg={seg}
                  idx={idx}
                  total={data.stepByStep.length}
                  activeTab={activeTabs[idx] || 'car'}
                  setTab={(tab) => setTab(idx, tab)}
                  expanded={expanded[idx]}
                  toggleExpand={() => toggleExpand(idx)}
                  getT={getT}
                />
              ))}
            </View>

            {/* Done Block */}
            <View style={styles.doneBlock}>
              <View style={styles.doneIconCircle}>
                <CheckCircle size={32} color="#10b981" />
              </View>
              <Text style={styles.doneTitle}>{getT('itinerary.readyTitle', 'You are ready to go!')}</Text>
              
              <View style={styles.allStopsContainer}>
                {data.journey.allStops.map((s, i) => (
                  <View key={i} style={styles.stopBadgeRow}>
                    <View style={styles.stopDot} />
                    <Text style={styles.stopText} numberOfLines={1}>{s.split(',')[0]}</Text>
                    {i < data.journey.allStops.length - 1 ? (
                      <View style={styles.stopLine} />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* --- Sticky Bottom Action Bar --- */}
      {(data && !loading) ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={fetchItinerary} style={styles.bottomSecBtn}>
            <RefreshCw size={18} color="#e2e8f0" />
          </TouchableOpacity>

          {onSaveTrip ? (
            <TouchableOpacity onPress={onSaveTrip} style={styles.saveTripBtn}>
              <Text style={styles.saveTripBtnText}>{getT('itinerary.saveBtn', 'Save Trip')}</Text>
              <Save size={18} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ─── SegmentCard Component (Timeline Style) ──────────────────────────────────────
function SegmentCard({ seg, idx, total, activeTab, setTab, expanded, toggleExpand, getT }) {
  const tabs = [
    { key: 'car',   label: getT('itinerary.drive', 'Drive'), icon: Car,   color: '#10b981' }, 
    { key: 'train', label: getT('itinerary.train', 'Train'), icon: Train, color: '#a855f7' }, 
    { key: 'bus',   label: getT('itinerary.bus', 'Bus'),     icon: Bus,   color: '#0ea5e9' }, 
  ];
  
  const current = seg.options[activeTab];
  const isAvailable = current?.summary && current.summary !== 'Not available';
  const isLast = idx === total - 1;

  return (
    <View style={styles.segmentWrapper}>
      {/* Timeline Visuals */}
      <View style={styles.timelineLeft}>
        <View style={styles.timelineDot}>
          <Text style={styles.timelineDotText}>{idx + 1}</Text>
        </View>
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>

      <View style={styles.segmentCard}>
        {/* Header */}
        <TouchableOpacity onPress={toggleExpand} activeOpacity={0.8} style={styles.segHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.segStepText}>{getT('itinerary.segment', 'SEGMENT')} {seg.stepNo}</Text>
            <Text style={styles.segTitleText}>{seg.title}</Text>
          </View>
          <View style={styles.expandIconBox}>
            {expanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
          </View>
        </TouchableOpacity>

        {expanded ? (
          <View style={styles.segBody}>
            {/* Modern Segmented Tabs */}
            <View style={styles.segmentedControl}>
              {tabs.map(({ key, label, icon: Icon, color }) => {
                const avail = seg.options[key]?.summary !== 'Not available';
                const isActive = activeTab === key;
                return (
                  <TouchableOpacity 
                    key={key} 
                    onPress={() => setTab(key)}
                    style={[styles.segmentBtn, isActive ? { backgroundColor: color } : null]}
                  >
                    <Icon size={14} color={isActive ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                    <Text style={[styles.segmentBtnText, isActive ? { color: '#fff' } : { color: '#64748b' }]}>
                      {label}
                    </Text>
                    {(!avail && !isActive) ? <View style={styles.unavailDot} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Content Summary */}
            <View style={[styles.summaryBox, isAvailable ? styles.summaryAvailable : styles.summaryNotAvailable]}>
              {isAvailable ? (
                <CheckCircle size={16} color="#10b981" style={{ marginRight: 10, marginTop: 2 }} />
              ) : (
                <AlertCircle size={16} color="#ef4444" style={{ marginRight: 10, marginTop: 2 }} />
              )}
              <Text style={[styles.summaryText, isAvailable ? { color: '#e2e8f0' } : { color: '#fca5a5' }]}>
                {current?.summary || getT('itinerary.notAvailable', 'Not available for this route.')}
              </Text>
            </View>

            {/* Detailed Instructions */}
            {(isAvailable && current?.details?.length > 0) ? (
              <View style={styles.detailsContainer}>
                {activeTab === 'bus'   ? current.details.map((bus, i)  => <BusDetail   key={i} bus={bus} />) : null}
                {activeTab === 'train' ? current.details.map((step, i) => <TrainDetail key={i} step={step} getT={getT} />) : null}
                {activeTab === 'car'   ? current.details.map((step, i) => <CarDetail   key={i} step={step} />) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Detail Cards ────────────────────────────────────────────────────────────────
function BusDetail({ bus }) {
  const priceDisplay = bus.ticketPrice ? bus.ticketPrice.replace(/\$/g, 'RS') : '';

  return (
    <View style={styles.detailCard}>
      <View style={[styles.iconBoxDetail, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
        <Bus size={18} color="#0ea5e9" />
      </View>
      <View style={styles.detailInfo}>
        <View style={styles.detailTagsRow}>
          <View style={[styles.tagBadge, { backgroundColor: '#0ea5e9' }]}>
            <Text style={[styles.tagText, { color: '#fff' }]}>{bus.routeNo}</Text>
          </View>
          {bus.serviceType ? (
            <View style={[styles.tagBadge, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
              <Text style={[styles.tagText, { color: '#7dd3fc' }]}>{bus.serviceType}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.operatorText}>{bus.operator}</Text>
        
        {(bus.terminal || bus.arrivalStop) ? (
          <View style={styles.locationTagBox}>
            <MapPin size={12} color="#0ea5e9" style={{ marginRight: 6 }}/>
            <Text style={styles.locationTagText} numberOfLines={2}>
              {bus.terminal} {bus.arrivalStop ? ` ➔ ${bus.arrivalStop}` : ''}
            </Text>
          </View>
        ) : null}
        
        {bus.instruction ? (
          <Text style={styles.instructionText}>"{bus.instruction}"</Text>
        ) : null}
        
        <View style={styles.detailFooterRow}>
          {(bus.departureTime && bus.departureTime !== 'N/A') ? (
            <View style={styles.footerIconRow}>
              <Clock size={12} color="#94a3b8" style={{ marginRight: 4 }} />
              <Text style={styles.footerRowText}>{bus.departureTime}</Text>
            </View>
          ) : null}
          {priceDisplay !== '' ? (
            <Text style={styles.priceBadgeText}>{priceDisplay}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function TrainDetail({ step, getT }) {
  const priceDisplay = step.ticketPrice ? step.ticketPrice.replace(/\$/g, 'RS') : '';

  return (
    <View style={styles.detailCard}>
      <View style={[styles.iconBoxDetail, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
        <Train size={18} color="#a855f7" />
      </View>
      <View style={styles.detailInfo}>
        <View style={styles.detailTagsRow}>
          <View style={[styles.tagBadge, { backgroundColor: '#a855f7' }]}>
            <Text style={[styles.tagText, { color: '#fff' }]}>{step.trainName}</Text>
          </View>
          {step.trainNumber !== 'N/A' ? (
             <Text style={styles.trainNoText}>#{step.trainNumber}</Text>
          ) : null}
        </View>
        
        <View style={styles.trainRouteBox}>
          <Text style={styles.trainRouteText} numberOfLines={1}>{step.fromStation}</Text>
          <ChevronRight size={14} color="#64748b" style={{ marginHorizontal: 6 }} />
          <Text style={styles.trainRouteText} numberOfLines={1}>{step.toStation}</Text>
        </View>

        <View style={styles.detailFooterRow}>
          {step.departureTime ? (
            <View style={styles.footerIconRow}>
              <Clock size={12} color="#94a3b8" style={{ marginRight: 4 }}/>
              <Text style={styles.footerRowText}>{step.departureTime} ➔ {step.arrivalTime}</Text>
            </View>
          ) : null}
          {step.duration ? <Text style={styles.footerRowText}>{step.duration}</Text> : null}
          {priceDisplay !== '' ? <Text style={styles.priceBadgeText}>{priceDisplay}</Text> : null}
        </View>
      </View>
    </View>
  );
}

function CarDetail({ step }) {
  return (
    <View style={styles.detailCard}>
      <View style={[styles.iconBoxDetail, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
        <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '900' }}>{step.stepNo}</Text>
      </View>
      <View style={styles.detailInfo}>
        <Text style={styles.carInstructionText}>{step.instruction}</Text>
        
        <View style={styles.detailFooterRow}>
          <View style={styles.footerIconRow}>
            <Route size={12} color="#94a3b8" style={{ marginRight: 4 }}/>
            <Text style={styles.footerRowText}>{step.distance}</Text>
          </View>
          <View style={styles.footerIconRow}>
            <Clock size={12} color="#94a3b8" style={{ marginRight: 4 }}/>
            <Text style={styles.footerRowText}>{step.duration}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#050812',
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 10,
  },
  topBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topNavTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 120, 
  },
  
  /* Hero Section */
  heroSection: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  heroIconBox: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
  },
  heroTitleHighlight: {
    color: '#10b981',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },

  /* Loading & Error */
  loadingContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 10,
  },
  spinnerBox: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  spinnerIcon: { position: 'absolute' },
  loadingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingSub: { color: '#94a3b8', fontSize: 13, marginBottom: 24 },
  loadingBadges: { flexDirection: 'row', gap: 10 },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loadingBadgeText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  
  errorBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  errorTextContainer: { marginLeft: 12, flex: 1 },
  errorText: { color: '#fca5a5', fontSize: 14, marginBottom: 16 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  /* Data Container & Stats */
  dataContainer: { marginTop: 10 },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },

  /* Timeline Segments */
  timelineContainer: {
    paddingLeft: 4,
  },
  segmentWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 4,
    marginBottom: -16, 
  },
  segmentCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  segHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  segStepText: {
    color: '#0ea5e9',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  segTitleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBody: {
    padding: 16,
    paddingTop: 0,
  },
  
  /* Modern Segmented Control */
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#050812',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    position: 'relative',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  unavailDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ef4444',
  },

  /* Content inside Segment */
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryAvailable: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  summaryNotAvailable: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  detailsContainer: {
    gap: 12,
  },
  
  /* Detail Cards */
  detailCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12, 
  },
  iconBoxDetail: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailInfo: { flex: 1 },
  detailTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  tagText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  operatorText: { color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  locationTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050812',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  locationTagText: { color: '#94a3b8', fontSize: 12, flex: 1 },
  instructionText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  carInstructionText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 22,
  },
  trainNoText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  trainRouteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trainRouteText: { color: '#e2e8f0', fontSize: 14, fontWeight: '500', flexShrink: 1 },
  detailFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerIconRow: { flexDirection: 'row', alignItems: 'center' },
  footerRowText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  priceBadgeText: { color: '#10b981', fontSize: 13, fontWeight: 'bold' },

  /* Done Block */
  doneBlock: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginTop: 10,
    marginBottom: 20,
  },
  doneIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  allStopsContainer: {
    width: '100%',
    backgroundColor: '#050812',
    borderRadius: 16,
    padding: 16,
  },
  stopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 12,
  },
  stopText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    paddingVertical: 8,
  },
  stopLine: {
    position: 'absolute',
    left: 3,
    top: 20,
    bottom: -10,
    width: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },

  /* Sticky Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16, 
  },
  bottomSecBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  saveTripBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    marginLeft: 16,
    height: 50,
    borderRadius: 14,
  },
  saveTripBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 10,
  }
});