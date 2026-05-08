import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView, Image } from 'react-native';
import { LayoutDashboard, LogOut, Globe, Check } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ currentStep, user, onDashboard, onLogout }) {
  const { t, toggleLanguage } = useLanguage();
  
  const steps = [
    t('nav.steps.search'), 
    t('nav.steps.plan'), 
    t('nav.steps.optimize'), 
    t('nav.steps.itinerary')
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbarContainer}>
        
        {/* --- Top Row: Logo & Actions --- */}
        <View style={styles.topRow}>
          
          {/* Left: Custom Logo Image & App Name */}
          <View style={styles.logoContainer}>
            {/* OYAGE LOGO IMAGE EKE PATH EKA METHANATA DANNA */}
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>{t('nav.appName') || 'Lanka Trails'}</Text>
          </View>

          {/* Right: Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              onPress={toggleLanguage} 
              style={styles.langBtn}
              activeOpacity={0.7}
            >
              <Globe size={16} color="#38bdf8" />
              <Text style={styles.langText}>EN</Text>
            </TouchableOpacity>

            {user && (
              <>
                <TouchableOpacity onPress={onDashboard} style={styles.iconBtn} activeOpacity={0.7}>
                  <LayoutDashboard size={18} color="#cbd5e1" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={onLogout} style={[styles.iconBtn, styles.logoutBtn]} activeOpacity={0.7}>
                  <LogOut size={16} color="#ef4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* --- Bottom Row: Modern Stepper --- */}
        {currentStep && (
          <View style={styles.stepperRow}>
            {steps.map((step, idx) => {
              const isActive = idx + 1 === currentStep;
              const isPast = idx + 1 < currentStep;
              const isLast = idx === steps.length - 1;

              return (
                <View key={step} style={styles.stepContainer}>
                  {/* Step Item */}
                  <View style={styles.stepItem}>
                    {isPast ? (
                      <View style={[styles.circle, styles.pastCircle]}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </View>
                    ) : isActive ? (
                      <View style={styles.activePill}>
                        <View style={styles.activeCircle}>
                          <Text style={styles.activeNumberText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.activeStepText} numberOfLines={1}>{step}</Text>
                      </View>
                    ) : (
                      <View style={styles.futureCircle}>
                        <Text style={styles.futureNumberText}>{idx + 1}</Text>
                      </View>
                    )}
                  </View>

                  {/* Connecting Line (Don't show after the last step) */}
                  {!isLast && (
                    <View style={[
                      styles.connectingLine,
                      isPast ? styles.lineActive : styles.lineInactive
                    ]} />
                  )}
                </View>
              );
            })}
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#070b14', 
  },
  navbarContainer: {
    backgroundColor: '#0B0F19',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  
  /* --- Top Row Styles --- */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16, 
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 48,  // Logo eke size eka meken wenas karanna
    height: 48,
    marginRight: 10,
  },
  appName: {
    color: '#f8fafc',
    fontSize: 20, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  langText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginLeft: 8,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },

  /* --- Bottom Row (Stepper) Styles --- */
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastCircle: {
    backgroundColor: '#10b981', 
  },
  futureCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureNumberText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.4)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingRight: 12,
    paddingLeft: 4,
  },
  activeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeStepText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  
  /* --- Connecting Lines --- */
  connectingLine: {
    height: 2,
    width: 15, 
    marginHorizontal: 4,
    borderRadius: 1,
  },
  lineActive: {
    backgroundColor: '#10b981', 
  },
  lineInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)', 
  }
});