import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Alert,
  Platform,
  Image,
  RefreshControl 
} from 'react-native';
import { 
  MapPin, Plus, Calendar, Clock, Route, Trash2, 
  Play, AlertCircle, Sun, Moon, Sunset, Plane, WifiOff, RefreshCw,

} from 'lucide-react-native';

import { getMyTrips, deleteTrip } from '../api/api';
import { useLanguage } from '../context/LanguageContext';


export default function DashboardPage({ user, onNewTrip, onStartTrip, onNavigateToProfile }) {
  const { t, language } = useLanguage();
  
  const getT = (key, defaultText) => {
    const text = t(key);
    return text === key ? defaultText : text;
  };

  const [trips, setTrips]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [error, setError]     = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [greeting, setGreeting] = useState({ text: 'Hello', icon: <Sun size={20} color="#facc15" /> });

  useEffect(() => { 
    fetchTrips(); 
    calculateGreeting();
  }, []);

  const calculateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ text: getT('dashboard.morning', 'Good Morning'), icon: <Sun size={22} color="#facc15" /> });
    } else if (hour < 18) {
      setGreeting({ text: getT('dashboard.afternoon', 'Good Afternoon'), icon: <Sunset size={22} color="#fb923c" /> });
    } else {
      setGreeting({ text: getT('dashboard.evening', 'Good Evening'), icon: <Moon size={22} color="#818cf8" /> });
    }
  };

  const fetchTrips = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await getMyTrips();
      setTrips(data.trips || []);
    } catch (err) {
      const errorMsg = err?.message?.toLowerCase() || '';
      
      if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
        setError(language === 'si' ? 'අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න.' : 'No internet connection.');
      } else {
        setError(language === 'si' ? 'දත්ත ලබාගැනීමට නොහැකි විය.' : 'Failed to load trips.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchTrips(true);
  };

  const handleDelete = (id) => {
    const confirmMsg = language === 'si' ? 'මෙම ගමන මකා දැමීමට අවශ්‍යද?' : 'Are you sure you want to delete this trip?';
    Alert.alert(
      getT('nav.appName', 'Lanka Trails'),
      confirmMsg,
      [
        { text: getT('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(id);
            try {
              await deleteTrip(id);
              setTrips(prev => prev.filter(t => t._id !== id));
            } catch {
              Alert.alert('Error', language === 'si' ? 'මකා දැමීම අසාර්ථකයි.' : 'Delete failed.');
            } finally {
              setDeleting(null);
            }
          } 
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    if (status === 'active') return '#0ea5e9'; 
    if (status === 'completed') return '#10b981'; 
    return '#64748b'; 
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const locale = language === 'si' ? 'si-LK' : 'en-US';
    try {
      return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
    } catch {
      return d.toDateString().substring(4, 10); 
    }
  };

  const isTripToday = (dateStr) => {
    const trip = new Date(dateStr);
    const today = new Date();
    return trip.toDateString() === today.toDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.navAppName}>{getT('nav.appName', 'Lanka Trails')}</Text>
        </View>

        <View style={styles.navRight}>
          {/* --- අලුත් Profile Avatar Button එක --- */}
          <TouchableOpacity 
             onPress={onNavigateToProfile} 
             style={styles.profileAvatarBtn}
             activeOpacity={0.8}
          >
            {user?.name ? (
              <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
            ) : (
              <User size={18} color="#0ea5e9" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#0ea5e9"
            colors={['#0ea5e9']} 
          />
        }
      >
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTopRow}>
            <View style={styles.greetingBadge}>
              {greeting.icon}
              <Text style={styles.greetingText}>{greeting.text}</Text>
            </View>

            <TouchableOpacity onPress={onNewTrip} style={styles.newTripBtn} activeOpacity={0.8}>
              <Plus size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.newTripBtnText}>{getT('dashboard.newTripBtn', 'Plan Trip')}</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.heroTitle}>
            {getT('dashboard.readyText', 'Ready for your next adventure?')}
          </Text>
        </View>

        {/* Loading State */}
        {loading && <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 50 }} />}

        {/* Error State */}
        {!loading && error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconCircle}>
               {error.includes('internet') || error.includes('අන්තර්ජාල') ? (
                 <WifiOff size={40} color="#fca5a5" />
               ) : (
                 <AlertCircle size={40} color="#fca5a5" />
               )}
            </View>
            <Text style={styles.errorTitle}>{language === 'si' ? 'අපොයි!' : 'Oops!'}</Text>
            <Text style={styles.errorMsgText}>{error}</Text>
            
            <TouchableOpacity onPress={() => fetchTrips()} style={styles.retryBtn} activeOpacity={0.8}>
              <RefreshCw size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.retryBtnText}>{language === 'si' ? 'නැවත උත්සාහ කරන්න' : 'Try Again'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && trips.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.illustrationCircle}>
              <Plane size={40} color="#0ea5e9" />
            </View>
            <Text style={styles.emptyTitle}>{getT('dashboard.noTrips', 'No Journeys Yet')}</Text>
            <Text style={styles.emptySub}>{getT('dashboard.noTripsSub', 'Your travel history is empty. Time to start planning!')}</Text>
            <TouchableOpacity onPress={onNewTrip} style={styles.emptyCreateBtn} activeOpacity={0.8}>
              <Plus size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.emptyCreateBtnText}>{getT('dashboard.createTripBtn', 'Create First Trip')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Trips Grid */}
        {!loading && !error && trips.length > 0 && (
          <View style={styles.tripsGrid}>
            {trips.map(trip => {
              const statusColor = getStatusColor(trip.status);
              const isToday = isTripToday(trip.tripDate);
              const route = trip.optimizedOrder || [];
              const startPoint = route.length > 0 ? route[0].split(',')[0] : 'Origin';
              const endPoint = route.length > 1 ? route[route.length - 1].split(',')[0] : 'Destination';

              return (
                <View key={trip._id} style={styles.ticketCard}>
                  
                  {/* Top Section */}
                  <View style={styles.ticketTop}>
                    <View style={styles.titleRow}>
                      <Text style={styles.tripTitle} numberOfLines={1}>{trip.title}</Text>
                      <TouchableOpacity onPress={() => handleDelete(trip._id)} disabled={deleting === trip._id} style={styles.deleteIconBtn}>
                        {deleting === trip._id ? (
                          <ActivityIndicator size="small" color="#f87171" />
                        ) : (
                          <Trash2 size={18} color="rgba(255,255,255,0.4)" />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Meta Info */}
                    <View style={styles.ticketMetaRow}>
                      <View style={styles.metaItem}>
                        <Calendar size={14} color="#94a3b8" />
                        <Text style={styles.metaLabel}>{formatDate(trip.tripDate)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Clock size={14} color="#94a3b8" />
                        <Text style={styles.metaLabel}>{trip.startTime}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MapPin size={14} color="#94a3b8" />
                        <Text style={styles.metaLabel}>{route.length} {getT('dashboard.places', 'Stops')}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Dashed Divider Line */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.notchLeft} />
                    <View style={styles.dashedLine} />
                    <View style={styles.notchRight} />
                  </View>

                  {/* Bottom Section */}
                  <View style={styles.ticketBottom}>
                    <View style={styles.routeAtoB}>
                      <View style={styles.routePoint}>
                        <Text style={styles.routeCity} numberOfLines={1}>{startPoint}</Text>
                        <Text style={styles.routeLabel}>START</Text>
                      </View>

                      <View style={styles.routeConnection}>
                        <View style={[styles.routeDot, { backgroundColor: statusColor }]} />
                        <View style={[styles.routeLine, { borderBottomColor: statusColor }]} />
                        <Plane size={16} color={statusColor} style={{ transform: [{ rotate: '45deg' }], marginHorizontal: 4 }} />
                        <View style={[styles.routeLine, { borderBottomColor: statusColor }]} />
                        <View style={[styles.routeDot, { backgroundColor: statusColor }]} />
                      </View>

                      <View style={[styles.routePoint, { alignItems: 'flex-end' }]}>
                        <Text style={styles.routeCity} numberOfLines={1}>{endPoint}</Text>
                        <Text style={styles.routeLabel}>END</Text>
                      </View>
                    </View>

                    {/* Action Button inside Ticket */}
                    <TouchableOpacity
                      onPress={() => onStartTrip(trip)}
                      style={[styles.ticketActionBtn, { backgroundColor: trip.status === 'active' || isToday ? '#0ea5e9' : 'rgba(255,255,255,0.05)' }]}
                    >
                      <Text style={[styles.ticketActionText, { color: trip.status === 'active' || isToday ? '#fff' : '#e2e8f0' }]}>
                        {trip.status === 'active' ? getT('dashboard.continueBtn', 'Resume Journey') : 
                         trip.status === 'completed' ? getT('dashboard.viewBtn', 'View Details') : 
                         getT('dashboard.startBtn', 'Start Journey')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050812', 
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 48,
    height: 48,
    marginRight: 10,
  },
  navAppName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  /* අලුත් Profile Avatar Button Styles */
  profileAvatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  avatarInitial: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: 'bold',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40, 
  },
  headerSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  greetingText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  newTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newTripBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 38,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 20,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    color: '#f87171',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMsgText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    backgroundColor: '#0f172a',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  illustrationCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyCreateBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tripsGrid: {
    gap: 20,
  },
  ticketCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    marginBottom: 20, 
    position: 'relative',
    overflow: 'hidden',
  },
  ticketTop: {
    padding: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginRight: 10,
  },
  deleteIconBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    position: 'relative',
    zIndex: 1,
  },
  notchLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#050812', 
    position: 'absolute',
    left: -10,
  },
  notchRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#050812', 
    position: 'absolute',
    right: -10,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },
  ticketBottom: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  routeAtoB: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  routePoint: {
    flex: 1,
  },
  routeCity: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  routeLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  routeConnection: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  routeLine: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ticketActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ticketActionText: {
    fontSize: 15,
    fontWeight: 'bold',
  }
});