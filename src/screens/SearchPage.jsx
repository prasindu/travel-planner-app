import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView,
  Image,
  Keyboard,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  BackHandler // <-- Aluthin add kala
} from 'react-native';
import { 
  Search, MapPin, Star, Plus, ChevronRight, Navigation, 
  Target, LocateFixed, Check, Map, Compass, Trash2, ArrowLeft
} from 'lucide-react-native';
import Geolocation from '@react-native-community/geolocation';

import { getSuggestions } from '../api/api'; 
import { useLanguage } from '../context/LanguageContext';

export default function SearchPage({ 
  startLocation = '', 
  setStartLocation = () => {}, 
  selectedPlaces = [], 
  setSelectedPlaces = () => {}, 
  onNext = () => {},
  onBack = () => {} 
}) {
  const { t, language } = useLanguage();

  const getT = (key, defaultText) => {
    const text = t(key);
    return text === key ? defaultText : text;
  };

  const [city, setCity]           = useState('');
  const [searchType, setSearchType] = useState('city');
  const [suggestions, setSuggs]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [searched, setSearched]   = useState(false);
  const [locating, setLocating]   = useState(false); 

  const popularCities = ['Colombo', 'Kandy', 'Galle', 'Nuwara Eliya', 'Ella', 'Sigiriya'];

  // --- Phone eke Back Button eka handle kirima ---
  useEffect(() => {
    const backAction = () => {
      onBack(); // Prop eken apu back function eka call karanawa
      return true; // App eken eliyata yana eka nawathwanawa
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove(); // Screen eken weddi event listener eka ain karanawa
  }, [onBack]);
  // ------------------------------------------------

  const handleSearch = async (searchQuery = city, type = searchType) => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss(); 
    setLoading(true);
    setError(null);
    setSuggs([]);
    try {
      const data = await getSuggestions(searchQuery, type);
      setSuggs(data.suggestions || []);
      setSearched(true);
    } catch (e) {
      setError(getT('search.errorServer', 'Backend server connect error.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = async () => {
    setLocating(true);
    setError(null);

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: getT('search.locPermTitle', 'Location Permission'),
            message: getT('search.locPermMsg', 'Lanka Trails needs to access your location to set your starting point.'),
            buttonNeutral: getT('common.later', 'Ask Me Later'),
            buttonNegative: getT('common.cancel', 'Cancel'),
            buttonPositive: getT('common.ok', 'OK'),
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError(getT('search.locDenied', 'Location permission denied.'));
          setLocating(false);
          return;
        }
      } catch (err) {
        console.warn(err);
        setLocating(false);
        return;
      }
    } else {
      Geolocation.requestAuthorization();
    }

   // 2. Fetch Location
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
          const data = await response.json();
          if (data && data.address) {
            const placeName = data.address.city || data.address.town || data.address.village || data.address.suburb;
            if (placeName) {
              setStartLocation(`${placeName}, Sri Lanka`); 
            } else {
              setStartLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          } else {
            setStartLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (err) {
          setStartLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.log("Location Error: ", err); // Error eka console eketa print karanna
        setLocating(false);
        setError(getT('search.locFailed', 'Failed to get location. Please try searching manually.'));
      },
      // MEKA THAMA WENAS KALE ⬇️
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 } 
    );
  };

  const addPlace = (name) => {
    if (!selectedPlaces.includes(name)) setSelectedPlaces(prev => [...prev, name]);
  };
  const removePlace = (name) => {
    setSelectedPlaces(prev => prev.filter(p => p !== name));
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      
      {/* --- Top Navbar for Back Button --- */}
      <View style={styles.topNavbar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Hero Header --- */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconBox}>
            <Compass size={28} color="#0ea5e9" />
          </View>
          <Text style={styles.heroTitle}>
            {getT('search.heroTitle1', 'Plan Your')} <Text style={styles.heroTitleHighlight}>{getT('search.heroTitle2', 'Journey')}</Text>
          </Text>
          <Text style={styles.heroSubtitle}>{getT('search.heroSub', 'Where would you like to start and explore?')}</Text>
        </View>

        {/* --- Step 1: Start Location --- */}
        <View style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepTitle}>{getT('search.startPointTitle', 'Starting Point')}</Text>
          </View>
          
          <View style={[styles.inputWrapper, startLocation ? styles.inputWrapperFilled : null]}>
            <Navigation size={18} color={startLocation ? "#0ea5e9" : "#64748b"} style={styles.inputIconLeft} />
            <TextInput
              style={[styles.input, { paddingRight: 50 }]}
              value={startLocation}
              onChangeText={setStartLocation}
              placeholder={getT('search.startPlaceholder', 'E.g. Colombo, or use current location')}
              placeholderTextColor="#64748b"
            />
            <TouchableOpacity 
              onPress={handleCurrentLocation}
              disabled={locating}
              style={styles.locationBtn}
            >
              {locating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LocateFixed size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Step 2: Add Destinations --- */}
        <View style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepTitle}>{getT('search.searchPlacesTitle', 'Add Destinations')}</Text>
          </View>

          {/* Segmented Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              onPress={() => setSearchType('city')}
              style={[styles.toggleBtn, searchType === 'city' && styles.toggleBtnActive]}
            >
              <Map size={16} color={searchType === 'city' ? "#fff" : "#94a3b8"} style={{marginRight: 6}} />
              <Text style={[styles.toggleBtnText, searchType === 'city' && styles.toggleBtnTextActive]}>
                {getT('search.searchCityBtn', 'Find Cities')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSearchType('specific')}
              style={[styles.toggleBtn, searchType === 'specific' && styles.toggleBtnActive]}
            >
              <Target size={16} color={searchType === 'specific' ? "#fff" : "#94a3b8"} style={{marginRight: 6}} />
              <Text style={[styles.toggleBtnText, searchType === 'specific' && styles.toggleBtnTextActive]}>
                {getT('search.searchSpecificBtn', 'Specific Places')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.inputWrapper}>
            <Search size={18} color="#64748b" style={styles.inputIconLeft} />
            <TextInput
              style={[styles.input, { paddingRight: 90 }]} 
              value={city}
              onChangeText={setCity}
              onSubmitEditing={() => handleSearch()}
              placeholder={searchType === 'city' ? getT('search.searchCityPlaceholder', 'Search a city (e.g. Kandy)') : getT('search.searchSpecificPlaceholder', 'Search a place (e.g. Temple of Tooth)')}
              placeholderTextColor="#64748b"
            />
            <TouchableOpacity
              onPress={() => handleSearch()}
              disabled={loading || !city.trim()}
              style={[styles.searchBtn, (!city.trim()) && { opacity: 0.5 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchBtnText}>{getT('search.searchBtn', 'Search')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Popular Cities */}
          {searchType === 'city' && suggestions.length === 0 && (
            <View style={styles.popularSection}>
              <Text style={styles.popularTitle}>{getT('search.popularDest', 'Popular Destinations')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {popularCities.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { setCity(c); setSearchType('city'); handleSearch(c, 'city'); }}
                    style={styles.cityPill}
                  >
                    <MapPin size={14} color="#0ea5e9" style={{marginRight: 4}} />
                    <Text style={styles.cityPillText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* --- Route Visualizer (Selected Places) --- */}
        {selectedPlaces.length > 0 && (
          <View style={styles.routeCard}>
            <Text style={styles.routeHeaderTitle}>Your Route So Far ({selectedPlaces.length} stops)</Text>
            
            <View style={styles.routeList}>
              <View style={styles.routeItem}>
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, { backgroundColor: '#0ea5e9' }]} />
                <View style={styles.routeContent}>
                  <Text style={styles.routeRoleText}>Start</Text>
                  <Text style={styles.routePlaceName}>{startLocation || 'Not set yet'}</Text>
                </View>
              </View>

              {selectedPlaces.map((p, idx) => (
                <View key={p} style={styles.routeItem}>
                  {idx !== selectedPlaces.length - 1 && <View style={styles.routeLine} />}
                  <View style={[styles.routeDot, { backgroundColor: '#10b981' }]} />
                  <View style={styles.routeContentRow}>
                    <View>
                      <Text style={styles.routeRoleText}>Stop {idx + 1}</Text>
                      <Text style={styles.routePlaceName}>{p}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removePlace(p)} style={styles.removePlaceBtn}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* --- Search Results Grid --- */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>
              {searchType === 'city' ? `${city} ${getT('search.nearbyPlaces', 'Attractions')}` : `"${city}" ${getT('search.searchResults', 'Results')}`}
            </Text>
            <View style={styles.suggestionsGrid}>
              {suggestions.map((place, idx) => (
                <PlaceCard
                  key={place.place_id || idx}
                  place={place}
                  isSelected={selectedPlaces.includes(place.name)}
                  onAdd={() => addPlace(place.name)}
                  onRemove={() => removePlace(place.name)}
                  t={t}
                  getT={getT}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* --- Sticky Bottom Action Bar --- */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarText}>
            {selectedPlaces.length} {getT('search.placesSelected', 'Places Selected')}
          </Text>
          {startLocation === '' && selectedPlaces.length > 0 && (
            <Text style={styles.warningText}>* Set start location</Text>
          )}
        </View>

        <TouchableOpacity 
          onPress={onNext} 
          disabled={selectedPlaces.length === 0 || startLocation.trim() === ''}
          style={[styles.nextBtn, (selectedPlaces.length === 0 || startLocation.trim() === '') && styles.nextBtnDisabled]}
        >
          <Text style={styles.nextBtnText}>{getT('search.nextBtn', 'Continue to Plan')}</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Sub-component for Place Cards ---
function PlaceCard({ place, isSelected, onAdd, onRemove, t, getT }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <View style={[styles.placeCard, isSelected && styles.placeCardSelected]}>
      <View style={styles.placeImageContainer}>
        {place.photoUrl && !imgErr ? (
          <Image source={{ uri: place.photoUrl }} style={styles.placeImage} onError={() => setImgErr(true)} />
        ) : (
          <View style={styles.placeImagePlaceholder}>
            <MapPin size={32} color="rgba(255,255,255,0.1)" />
          </View>
        )}
        
        {place.isOpenNow !== 'N/A' && (
          <View style={[styles.statusBadge, place.isOpenNow ? styles.statusOpen : styles.statusClosed]}>
            <Text style={styles.statusBadgeText}>
              {place.isOpenNow ? getT('search.open', 'Open') : getT('search.closed', 'Closed')}
            </Text>
          </View>
        )}

        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.selectedCheckMark}>
              <Check size={24} color="#fff" />
            </View>
          </View>
        )}
      </View>

      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.placeAddress} numberOfLines={1}>{place.address}</Text>

        <View style={styles.placeFooter}>
          <View style={styles.ratingBadge}>
            <Star size={12} color="#facc15" fill="#facc15" />
            <Text style={styles.ratingText}>{place.rating}</Text>
            <Text style={styles.reviewsText}>({place.userRatingsTotal})</Text>
          </View>
          
          <TouchableOpacity
            onPress={isSelected ? onRemove : onAdd}
            style={[styles.addRemoveBtn, isSelected ? styles.btnRemove : styles.btnAdd]}
          >
            {isSelected ? (
              <Text style={styles.btnRemoveText}>{getT('search.remove', 'Remove')}</Text>
            ) : (
              <>
                <Plus size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.btnAddText}>{getT('search.add', 'Add')}</Text>
              </>
            )}
          </TouchableOpacity>
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
  
  /* Top Navbar */
  topNavbar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100, 
  },
  
  /* Hero Section */
  heroSection: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  heroIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  heroTitleHighlight: {
    color: '#0ea5e9', 
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
  },

  /* Cards */
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Inputs */
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050812',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  inputWrapperFilled: {
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  inputIconLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 16,
    paddingLeft: 46, 
    fontSize: 15,
  },
  locationBtn: {
    position: 'absolute',
    right: 8,
    padding: 10,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
  },

  /* Segmented Toggle */
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#050812',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#1e293b',
  },
  toggleBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  toggleBtnTextActive: {
    color: '#fff',
  },

  /* Search Button inside input */
  searchBtn: {
    position: 'absolute',
    right: 8,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  /* Popular Cities */
  popularSection: {
    marginTop: 20,
  },
  popularTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  cityPillText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
  },

  /* Error Box */
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
  },

  /* --- Route Visualizer --- */
  routeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  routeHeaderTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  routeList: {
    paddingLeft: 8,
  },
  routeItem: {
    position: 'relative',
    paddingLeft: 24,
    paddingBottom: 24,
  },
  routeLine: {
    position: 'absolute',
    left: 5,
    top: 20,
    bottom: -10,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  routeDot: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0f172a', 
  },
  routeContent: {
    justifyContent: 'center',
  },
  routeContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeRoleText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  routePlaceName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  removePlaceBtn: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },

  /* Suggestions */
  suggestionsSection: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  suggestionsGrid: {
    gap: 16,
  },
  
  /* Place Card */
  placeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  placeCardSelected: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  placeImageContainer: {
    height: 160,
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  placeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  statusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  placeInfo: {
    padding: 16,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  placeAddress: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
  },
  placeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050812',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    marginRight: 4,
  },
  reviewsText: {
    color: '#64748b',
    fontSize: 10,
  },
  addRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnAdd: {
    backgroundColor: '#0ea5e9',
  },
  btnRemove: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  btnAddText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnRemoveText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 'bold',
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
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  warningText: {
    color: '#facc15',
    fontSize: 11,
    marginTop: 2,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  }
});