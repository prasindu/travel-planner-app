import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Platform,
  BackHandler // <-- BackHandler import kala
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  MapPin, ArrowRight, Trash2, ChevronRight, ChevronLeft, Clock, Route, ChevronUp, ChevronDown 
} from 'lucide-react-native';

import { useLanguage } from '../context/LanguageContext';

export default function PlanPage({ selectedPlaces, setSelectedPlaces, startTime, setStartTime, onNext, onBack }) {
  const { t } = useLanguage();

  // --- Time Picker Logic ---
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const getInitialTime = () => {
    if (!startTime) return new Date();
    const d = new Date();
    const [hours, minutes] = startTime.split(':');
    d.setHours(parseInt(hours, 10));
    d.setMinutes(parseInt(minutes, 10));
    return d;
  };
  const [timeObj, setTimeObj] = useState(getInitialTime());

  const onChangeTime = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTimeObj(selectedTime);
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  };

  // --- Phone eke Back Button eka handle kirima ---
  useEffect(() => {
    const backAction = () => {
      onBack(); // Step 1 ekata (Search Page) yanna onBack function eka call karanawa
      return true; // App eken eliyata yana eka nawathwanawa
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [onBack]);
  // ------------------------------------------------

  // --- Array reordering logic ---
  const moveUp = (idx) => {
    if (idx === 0) return;
    const arr = [...selectedPlaces];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setSelectedPlaces(arr);
  };

  const moveDown = (idx) => {
    if (idx === selectedPlaces.length - 1) return;
    const arr = [...selectedPlaces];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    setSelectedPlaces(arr);
  };

  const remove = (idx) => {
    setSelectedPlaces(prev => prev.filter((_, i) => i !== idx));
  };

  const badgeColors = [
    '#0284c7', 
    '#0ea5e9', 
    '#10b981', 
    '#a855f7', 
    '#eab308', 
    '#ec4899'  
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {t('plan.title1')} <Text style={styles.titleHighlight}>{t('plan.title2')}</Text>
          </Text>
          <Text style={styles.subtitle}>{t('plan.subtitle')}</Text>
        </View>

        {/* Start Time Section */}
        <View style={styles.timeCard}>
          <View style={styles.labelRow}>
            <Clock size={16} color="#38bdf8" style={{ marginRight: 8 }} />
            <Text style={styles.labelText}>{t('plan.startTime')}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.timeInputBtn}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.timeInputText}>{startTime}</Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={timeObj}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
            />
          )}
        </View>

        {/* Places List Section */}
        <View style={styles.placesCard}>
          <View style={styles.labelRow}>
            <MapPin size={16} color="#0ea5e9" style={{ marginRight: 8 }} />
            <Text style={styles.labelText}>{t('plan.placesList')} ({selectedPlaces.length})</Text>
          </View>

          {selectedPlaces.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={36} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyStateText}>{t('plan.noPlaces')}</Text>
            </View>
          ) : (
            <View style={styles.placesList}>
              {selectedPlaces.map((place, idx) => (
                <View key={place + idx} style={styles.placeItem}>
                  
                  {/* Index Badge */}
                  <View style={[styles.indexBadge, { backgroundColor: badgeColors[idx % badgeColors.length] }]}>
                    <Text style={styles.indexBadgeText}>{idx + 1}</Text>
                  </View>

                  {/* Place Info */}
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeNameText} numberOfLines={1}>
                      {place.split(',')[0]}
                    </Text>
                    <View style={styles.tagsRow}>
                      {idx === 0 && (
                        <View style={[styles.tag, styles.startTag]}>
                          <Text style={styles.startTagText}>{t('plan.startBadge')}</Text>
                        </View>
                      )}
                      {idx === selectedPlaces.length - 1 && selectedPlaces.length > 1 && (
                        <View style={[styles.tag, styles.endTag]}>
                          <Text style={styles.endTagText}>{t('plan.endBadge')}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Controls */}
                  <View style={styles.controlsCol}>
                    <View style={styles.arrowsBox}>
                      <TouchableOpacity 
                        onPress={() => moveUp(idx)} 
                        disabled={idx === 0}
                        style={[styles.arrowBtn, idx === 0 && { opacity: 0.2 }]}
                      >
                        <ChevronUp size={16} color="#cbd5e1" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => moveDown(idx)} 
                        disabled={idx === selectedPlaces.length - 1}
                        style={[styles.arrowBtn, idx === selectedPlaces.length - 1 && { opacity: 0.2 }]}
                      >
                        <ChevronDown size={16} color="#cbd5e1" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <TouchableOpacity onPress={() => remove(idx)} style={styles.deleteBtn}>
                      <Trash2 size={16} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                  
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Route Preview Section */}
        {selectedPlaces.length >= 2 && (
          <View style={styles.previewCard}>
            <View style={styles.labelRow}>
              <Route size={14} color="rgba(255,255,255,0.3)" style={{ marginRight: 8 }} />
              <Text style={styles.previewLabelText}>{t('plan.routePreview')}</Text>
            </View>
            
            <View style={styles.previewFlow}>
              {selectedPlaces.map((place, idx) => (
                <View key={place + "preview"} style={styles.previewFlowItem}>
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>{place.split(',')[0]}</Text>
                  </View>
                  {idx < selectedPlaces.length - 1 && (
                    <ChevronRight size={14} color="#0ea5e9" style={{ marginHorizontal: 6 }} />
                  )}
                </View>
              ))}
            </View>
            
            <View style={styles.previewFooter}>
              <Text style={styles.previewFooterText}>{selectedPlaces.length - 1} {t('plan.segments')}</Text>
              <View style={styles.previewFooterTime}>
                <Clock size={12} color="#38bdf8" style={{ marginRight: 4 }} />
                <Text style={styles.previewFooterText}>Start: {startTime}</Text>
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
            disabled={selectedPlaces.length < 2}
            style={[styles.nextBtn, selectedPlaces.length < 2 && { opacity: 0.4 }]}
          >
            <Text style={styles.nextBtnText}>{t('plan.nextBtn')}</Text>
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
  timeCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7', 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeInputBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  timeInputText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  placesCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
  placesList: {
    marginBottom: 4, // Alternative to gap for RN compatibility
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  indexBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  placeInfo: {
    flex: 1,
  },
  placeNameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  startTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  startTagText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  endTag: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  endTagText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  controlsCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowsBox: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 8,
  },
  arrowBtn: {
    padding: 4,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  previewLabelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  previewFlowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  previewFooterText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 16,
  },
  previewFooterTime: {
    flexDirection: 'row',
    alignItems: 'center',
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