import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  BackHandler // <-- Aluthin add kala
} from 'react-native';
import { 
  ArrowRight, CheckCircle, Shuffle, MapPin, 
  ChevronDown, ChevronRight, ChevronLeft, AlertCircle, Route 
} from 'lucide-react-native';

import { optimizeRoute } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

export default function OptimizePage({ startLocation, selectedPlaces, setOptimizedPlaces, setOptimizeResult, onNext, onBack }) {
  const { t } = useLanguage();

  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  
  const [endLocation, setEndLocation] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- Phone eke Back Button eka handle kirima ---
  useEffect(() => {
    const backAction = () => {
      onBack(); // Step 2 ekata (Plan Page) yanna onBack function eka call karanawa
      return true; // App eken eliyata yana eka nawathwanawa
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [onBack]);
  // ------------------------------------------------

  const handleOptimize = async () => {
    const fullRoute = [startLocation, ...selectedPlaces];

    if (fullRoute.length < 3) {
      setOptimizedPlaces(fullRoute);
      setResult({
        originalOrder:  fullRoute,
        optimizedOrder: fullRoute,
        totalDistance:  'N/A',
        skipped: true
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await optimizeRoute(fullRoute, endLocation);
      setResult(data);
      setOptimizedPlaces(data.optimizedOrder);
      if (setOptimizeResult) setOptimizeResult(data);
    } catch (e) {
      setError(t('optimize.error') || 'Optimization failed.');
    } finally {
      setLoading(false);
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => { 
    handleOptimize(); 
  }, []);

  const isReordered = result && !result.skipped &&
    JSON.stringify(result.originalOrder) !== JSON.stringify(result.optimizedOrder);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {t('optimize.title1')} <Text style={styles.titleHighlight}>{t('optimize.title2')}</Text>
          </Text>
          <Text style={styles.subtitle}>{t('optimize.subtitle')}</Text>
        </View>

        {/* 🟢 End Location Selection Section */}
        <View style={styles.endLocationCard}>
          <Text style={styles.endLocationLabel}>
            {t('optimize.endLocationLabel')}
          </Text>
          
          <View style={styles.controlsContainer}>
            {/* Dropdown Button */}
            <TouchableOpacity
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              style={styles.dropdownBtn}
              activeOpacity={0.8}
            >
              <Text style={endLocation ? styles.dropdownBtnTextSelected : styles.dropdownBtnText}>
                {endLocation ? endLocation.split(',')[0] : t('optimize.anywhere')}
              </Text>
              <ChevronDown 
                size={18} 
                color={isDropdownOpen ? '#38bdf8' : 'rgba(255,255,255,0.4)'} 
                style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }} 
              />
            </TouchableOpacity>

            {/* Dropdown List (Accordion style for mobile) */}
            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  onPress={() => { setEndLocation(''); setIsDropdownOpen(false); }}
                  style={styles.dropdownItem}
                >
                  <Text style={styles.dropdownItemText}>{t('optimize.anywhere')}</Text>
                </TouchableOpacity>
                
                {selectedPlaces.map(place => (
                  <TouchableOpacity
                    key={place}
                    onPress={() => { setEndLocation(place); setIsDropdownOpen(false); }}
                    style={[
                      styles.dropdownItem,
                      endLocation === place && styles.dropdownItemSelected
                    ]}
                  >
                    <Text style={[
                      styles.dropdownItemTextPlace,
                      endLocation === place && styles.dropdownItemTextSelected
                    ]}>
                      {place.split(',')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Re-optimize Button */}
            <TouchableOpacity 
              onPress={handleOptimize} 
              disabled={loading}
              style={[styles.reoptimizeBtn, loading && { opacity: 0.5 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Shuffle size={16} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.reoptimizeBtnText}>{t('optimize.reoptimizeBtn')}</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.hintText}>
            * {t('optimize.hint')}
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingCard}>
            <View style={styles.spinnerBox}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <MapPin size={20} color="#38bdf8" style={{ position: 'absolute' }} />
            </View>
            <Text style={styles.loadingText}>{t('optimize.loading')}</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorBox}>
            <AlertCircle color="#f87171" size={20} style={{ marginTop: 2 }} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleOptimize} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Result Section */}
        {result && !loading && (
          <View style={styles.resultContainer}>
            
            {/* Status Card */}
            <View style={[styles.statusCard, isReordered ? styles.statusReordered : styles.statusOptimal]}>
              <View style={[styles.statusIconBox, isReordered ? styles.statusIconBoxReordered : styles.statusIconBoxOptimal]}>
                {isReordered ? <Shuffle size={20} color="#38bdf8" /> : <CheckCircle size={20} color="#4ade80" />}
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>
                  {result.skipped
                    ? t('optimize.skipped')
                    : isReordered
                    ? t('optimize.reordered')
                    : t('optimize.alreadyOptimal')}
                </Text>
                {result.totalDistance && result.totalDistance !== 'N/A' && (
                  <Text style={styles.statusSub}>
                    {t('optimize.totalDistance')}: <Text style={{ color: '#fff' }}>{result.totalDistance}</Text>
                  </Text>
                )}
              </View>
            </View>

            {/* Route Map Card */}
            <View style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <View style={styles.routeHeaderLeft}>
                  <Route size={14} color="rgba(255,255,255,0.3)" style={{ marginRight: 6 }} />
                  <Text style={styles.routeHeaderText}>{t('optimize.finalRoute')}</Text>
                </View>
                {endLocation ? (
                  <View style={styles.endBadge}>
                    <Text style={styles.endBadgeText}>
                      {t('optimize.endingAt')}: {endLocation.split(',')[0]}
                    </Text>
                  </View>
                ) : null}
              </View>
              
              <View style={styles.routePillsContainer}>
                {result.optimizedOrder.map((place, idx) => {
                  const isStart = idx === 0;
                  const isEnd = endLocation && idx === result.optimizedOrder.length - 1;
                  
                  return (
                    <View key={idx + place} style={styles.routePillWrapper}>
                      <View style={[
                        styles.routePill,
                        isStart ? styles.pillStart : isEnd ? styles.pillEnd : styles.pillNormal
                      ]}>
                        {(isStart || isEnd) && <MapPin size={14} color={isStart ? "#38bdf8" : "#7dd3fc"} style={{ marginRight: 6 }} />}
                        <Text style={[
                          styles.routePillText,
                          isStart ? { color: '#38bdf8' } : isEnd ? { color: '#7dd3fc' } : { color: 'rgba(255,255,255,0.9)' }
                        ]}>
                          {place.split(',')[0]}
                        </Text>
                      </View>
                      
                      {idx < result.optimizedOrder.length - 1 && (
                        <ArrowRight size={16} color="rgba(255,255,255,0.2)" style={styles.arrowIcon} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
            
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 4 }} />
            <Text style={styles.backBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onNext}
            disabled={!result}
            style={[styles.nextBtn, !result && { opacity: 0.4 }]}
          >
            <Text style={styles.nextBtnText}>{t('optimize.nextBtn')}</Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleHighlight: {
    color: '#38bdf8',
    fontStyle: 'italic',
    fontWeight: '300',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  endLocationCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9', 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  endLocationLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  controlsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  dropdownBtnTextSelected: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: 'rgba(11, 15, 25, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: -8, 
    marginBottom: 8,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderLeftWidth: 2,
    borderLeftColor: '#0ea5e9',
  },
  dropdownItemText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  dropdownItemTextPlace: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  dropdownItemTextSelected: {
    color: '#7dd3fc', 
    fontWeight: 'bold',
  },
  reoptimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9', 
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  reoptimizeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hintText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 16,
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  spinnerBox: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#0284c7', 
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 10,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 20,
  },
  statusReordered: {
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
    borderLeftColor: '#0284c7', 
  },
  statusOptimal: {
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
    borderLeftColor: '#4ade80', 
  },
  statusIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  statusIconBoxReordered: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
  },
  statusIconBoxOptimal: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  statusTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  routeCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  routeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeHeaderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  endBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  endBadgeText: {
    color: '#7dd3fc', 
    fontSize: 10,
    fontWeight: 'bold',
  },
  routePillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  routePillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillStart: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderColor: 'rgba(2, 132, 199, 0.4)',
  },
  pillEnd: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  pillNormal: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  routePillText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7', 
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  }
});