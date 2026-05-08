import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Save, X, Calendar, MapPin, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react-native';
import { saveTrip } from '../api/api'; 
import { useLanguage } from '../context/LanguageContext';

export default function SaveTripModal({ 
  optimizedPlaces, 
  startLocation,
  startTime, 
  totalDistance,
  onSaved, 
  onClose 
}) {
  const { t } = useLanguage();

  const [title, setTitle]     = useState('');
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [saved, setSaved]     = useState(false);

  // --- Date Picker States ---
  const [tripDate, setDate]   = useState(''); 
  const [dateObj, setDateObj] = useState(new Date()); 
  const [showPicker, setShowPicker] = useState(false);

  // --- Date Picker Function ---
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false); 
    }
    
    if (selectedDate) {
      setDateObj(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDate(formattedDate);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return setError(t('saveModal.errName'));
    if (!tripDate)     return setError(t('saveModal.errDate'));

    setLoading(true);
    setError(null);
    try {
      const data = await saveTrip({
        title: title.trim(),
        tripDate,
        startLocation: startLocation || optimizedPlaces[0],
        selectedPlaces: optimizedPlaces,
        optimizedOrder: optimizedPlaces,
        startTime: startTime || '06:00',
        totalDistance: totalDistance || 'N/A',
        notes: notes.trim()
      });

      if (data.success) {
        setSaved(true);
        setTimeout(() => {
          if (onSaved) onSaved(data.trip);
        }, 1500);
      }
    } catch (e) {
      const msg = e?.response?.data?.error;
      setError(msg || t('saveModal.errSave'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent={true} visible={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Background Click = Close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Save size={20} color="#4ade80" />
              </View>
              <View>
                <Text style={styles.titleText}>{t('saveModal.title')}</Text>
                <Text style={styles.subtitleText}>{t('saveModal.subtitle')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {saved ? (
            /* Success State */
            <View style={styles.successState}>
              <View style={styles.successIconBox}>
                <CheckCircle size={48} color="#4ade80" />
              </View>
              <Text style={styles.successText}>{t('saveModal.success')}</Text>
            </View>
          ) : (
            /* Form State */
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              
              {/* Trip Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('saveModal.tripName')}</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('saveModal.tripNamePlaceholder')}
                  placeholderTextColor="#6b7280"
                />
              </View>

              {/* Trip Date with Native Picker */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Calendar size={14} color="#38bdf8" />
                  <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>
                    {t('saveModal.tripDate')}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.input} 
                  onPress={() => setShowPicker(true)}
                >
                  <Text style={{ color: tripDate ? '#fff' : '#6b7280' }}>
                    {tripDate || "Select a date"}
                  </Text>
                </TouchableOpacity>

                {showPicker && (
                  <DateTimePicker
                    value={dateObj}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={onChangeDate}
                  />
                )}
              </View>

              {/* Route Preview */}
              <View style={styles.routePreviewBox}>
                <View style={styles.routeHeader}>
                  <MapPin size={12} color="#0284c7" />
                  <Text style={styles.routeHeaderText}>{t('saveModal.route')}</Text>
                </View>
                
                <View style={styles.placesList}>
                  {optimizedPlaces.map((p, i) => (
                    <View key={i} style={styles.placeBadgeRow}>
                      <View style={styles.placeBadge}>
                        <Text style={styles.placeBadgeText}>{p.split(',')[0]}</Text>
                      </View>
                      {i < optimizedPlaces.length - 1 && (
                        <ChevronRight size={14} color="rgba(255,255,255,0.3)" style={{ marginHorizontal: 4 }} />
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.routeFooter}>
                  <View style={styles.footerItem}>
                    <Clock size={12} color="#38bdf8" />
                    <Text style={styles.footerItemText}>{t('saveModal.start')}: {startTime}</Text>
                  </View>
                  {totalDistance && totalDistance !== 'N/A' && (
                    <View style={styles.footerItem}>
                      <MapPin size={12} color="#4ade80" />
                      <Text style={styles.footerItemText}>{totalDistance}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('saveModal.notes')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('saveModal.notesPlaceholder')}
                  placeholderTextColor="#6b7280"
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color="#fca5a5" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>{t('saveModal.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSave} 
                  disabled={loading} 
                  style={styles.saveBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Save size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.saveBtnText}>{t('saveModal.saveBtn')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#0B0F19',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)', // forest-500/10
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  titleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    color: '#fff',
    padding: 14,
    fontSize: 14,
  },
  textArea: {
    height: 80,
  },
  routePreviewBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeHeaderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 6,
  },
  placesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  placeBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  placeBadgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  routeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  footerItemText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#10b981', // forest-500
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  }
});