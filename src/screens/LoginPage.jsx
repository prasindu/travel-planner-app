import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Animated,
  Easing,
  Image,
  ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Globe } from 'lucide-react-native';
import { login, register } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage({ onAuthSuccess }) {
  const { t, toggleLanguage, language } = useLanguage();

  const [mode, setMode]         = useState('login'); 
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleGoogleLogin = () => {
    // මෙතනට පසුව Google SDK එක සම්බන්ධ කරන්න පුළුවන්
    console.log("Google Login Clicked");
  };

  const handleSubmit = async () => {
    // 1. Frontend Validations
    if (!email || !password) {
      return setError(language === 'si' ? 'කරුණාකර ඊමේල් ලිපිනය සහ මුරපදය ඇතුළත් කරන්න.' : 'Please enter your email and password.');
    }
    if (mode === 'register' && !name) {
      return setError(language === 'si' ? 'කරුණාකර ඔබගේ නම ඇතුළත් කරන්න.' : 'Please enter your name.');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let data = mode === 'login' ? await login(email, password) : await register(name, email, password);
      
      if (data.success) {
        await AsyncStorage.setItem('lt_token', data.token);
        await AsyncStorage.setItem('lt_user', JSON.stringify(data.user));
        if (onAuthSuccess) onAuthSuccess(data.user);
      }
    } catch (e) {
     
      let backendError = e?.response?.data?.error || e?.message || '';
      let displayMsg = '';

      
      if (backendError.includes('Invalid email or password')) {
        displayMsg = language === 'si' ? 'ඊමේල් ලිපිනය හෝ මුරපදය වැරදියි.' : 'Invalid email or password.';
      } 
      else if (backendError.includes('Email already exists')) {
        displayMsg = language === 'si' ? 'මෙම ඊමේල් ලිපිනයෙන් දැනටමත් ගිණුමක් ඇත.' : 'An account with this email already exists.';
      } 
      else if (backendError.includes('All fields are required')) {
        displayMsg = language === 'si' ? 'කරුණාකර සියලුම විස්තර ඇතුළත් කරන්න.' : 'All fields are required.';
      } 
      else {
        
        displayMsg = language === 'si' ? 'ක්‍රියාවලිය අසාර්ථකයි. කරුණාකර නැවත උත්සාහ කරන්න.' : 'Authentication failed. Please try again.';
      }

      setError(displayMsg); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.langToggleBtn} onPress={toggleLanguage}>
          <Globe size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.langToggleText}>{t('nav.langToggle')}</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40 }}>
          <View style={styles.brandingContainer}>
            <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
               <Image 
                  source={require('../assets/images/logo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
               />
            </Animated.View>
            <Text style={styles.appName}>{t('nav.appName')}</Text>
            <View style={styles.descBadge}>
              <Text style={styles.appDesc}>{t('nav.appDesc')}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.modeToggleContainer}>
              {['login', 'register'].map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setMode(m); setError(null); }}
                  style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                >
                  <Text style={[styles.modeBtnText, mode === m ? styles.modeBtnTextActive : styles.modeBtnTextInactive]}>
                    {m === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formFields}>
              {mode === 'register' && (
                <View style={styles.inputWrapper}>
                  <User size={18} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
                  <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('auth.fullName')} placeholderTextColor="rgba(255,255,255,0.3)" />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Mail size={18} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder={t('auth.email')} placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
                <TextInput style={[styles.input, { paddingRight: 45 }]} value={password} onChangeText={setPassword} placeholder={t('auth.password')} placeholderTextColor="rgba(255,255,255,0.3)" secureTextEntry={!showPw} />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={18} color="rgba(255,255,255,0.3)" /> : <Eye size={18} color="rgba(255,255,255,0.3)" />}
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <AlertCircle size={18} color="#fca5a5" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[styles.submitBtn, loading && { opacity: 0.7 }]}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>{mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}</Text>}
              </TouchableOpacity>

              {/* --- Social Login Section --- */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{language === 'si' ? 'නැතහොත්' : 'OR'}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.8}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                  style={styles.googleIcon} 
                />
                <Text style={styles.googleBtnText}>
                   {mode === 'login' ? (language === 'si' ? 'Google හරහා ඇතුල් වන්න' : 'Continue with Google') : (language === 'si' ? 'Google හරහා ලියාපදිංචි වන්න' : 'Sign up with Google')}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
          <Text style={styles.footerText}>{t('auth.footer')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050810' },
  keyboardView: { flex: 1, paddingHorizontal: 25 },
  langToggleBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 10,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 50,
  },
  langToggleText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 5 },
  brandingContainer: { alignItems: 'center', marginBottom: 30 },
  logoWrapper: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  logoImage: { width: '100%', height: '100%' },
  appName: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  descBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  appDesc: { color: '#0ea5e9', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 35, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modeToggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 28, marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#0284c7' },
  modeBtnText: { fontSize: 14, fontWeight: 'bold' },
  modeBtnTextActive: { color: '#fff' },
  modeBtnTextInactive: { color: 'rgba(255,255,255,0.3)' },
  formFields: { paddingHorizontal: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 18, marginBottom: 15, paddingHorizontal: 18, height: 58, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  eyeIcon: { position: 'absolute', right: 18 },
  errorBox: { flexDirection: 'row', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 15, padding: 12, marginBottom: 15, alignItems: 'center' },
  errorText: { color: '#fca5a5', fontSize: 12, marginLeft: 8, flex: 1 },
  submitBtn: { backgroundColor: '#0284c7', height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Divider Styles
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', marginHorizontal: 15, fontSize: 12, fontWeight: 'bold' },
  
  // Google Button Styles
  googleBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  googleBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  footerText: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 'bold', marginTop: 30, letterSpacing: 1 }
});