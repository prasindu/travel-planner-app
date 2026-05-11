import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Platform,
  BackHandler // <-- අලුතින් එකතු කළා
} from 'react-native';
import { 
  ChevronLeft, Mail, Lock, Eye, EyeOff, Globe, LogOut, CheckCircle, Shield
} from 'lucide-react-native';

import { changePassword } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

export default function ProfilePage({ user, onBack, onLogout }) {
  const { t, language, toggleLanguage } = useLanguage();

  const getT = (key, defaultText) => {
    const text = t(key);
    return text === key || !text ? defaultText : text;
  };

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [showPw1, setShowPw1]     = useState(false);
  const [showPw2, setShowPw2]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState({ type: '', text: '' }); 

  // --- Hardware Back Button එක සඳහා (අලුත් කොටස) ---
  useEffect(() => {
    const backAction = () => {
      onBack(); // Dashboard එකට යන function එක කෝල් කරනවා
      return true; // මේකෙන් කියන්නේ "ඔව්, අපි back button එක හැන්ඩල් කරගත්තා, ඇප් එකෙන් එළියට යන්න එපා" කියලා
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    // Component එක අයින් වෙද්දි event listener එකත් අයින් කරනවා
    return () => backHandler.remove();
  }, [onBack]);
  // ------------------------------------------------

  const handlePasswordChange = async () => {
    if (!currentPw || !newPw) {
      return setMessage({ type: 'error', text: language === 'si' ? 'කරුණාකර මුරපද දෙකම ඇතුළත් කරන්න.' : 'Please enter both passwords.' });
    }
    if (newPw.length < 6) {
      return setMessage({ type: 'error', text: language === 'si' ? 'අලුත් මුරපදය අකුරු 6කට වඩා වැඩි විය යුතුය.' : 'New password must be at least 6 characters.' });
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await changePassword(currentPw, newPw);
      if (res.success) {
        setMessage({ type: 'success', text: language === 'si' ? 'මුරපදය සාර්ථකව වෙනස් කරන ලදී.' : 'Password updated successfully!' });
        setCurrentPw('');
        setNewPw('');
      }
    } catch (e) {
      const errorMsg = e?.response?.data?.error || (language === 'si' ? 'මුරපදය වෙනස් කිරීම අසාර්ථකයි.' : 'Failed to change password.');
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Top Navbar */}
      <View style={styles.topNavbar}>
        <TouchableOpacity onPress={onBack} style={styles.topBackBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getT('profile.title', 'Profile & Settings')}</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Profile Info Card --- */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Traveler'}</Text>
          
          <View style={styles.infoRow}>
            <Mail size={14} color="#94a3b8" style={{ marginRight: 8 }} />
            <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
          </View>
        </View>

        {/* --- Language Settings --- */}
        <Text style={styles.sectionTitle}>{getT('profile.langTitle', 'App Language')}</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Globe size={20} color="#0ea5e9" style={{ marginRight: 12 }} />
              <Text style={styles.settingLabel}>{getT('profile.selectLang', 'Select Language')}</Text>
            </View>
            
            <View style={styles.langToggleBox}>
              <TouchableOpacity 
                onPress={() => { if(language !== 'en') toggleLanguage(); }}
                style={[styles.langBtn, language === 'en' ? styles.langBtnActive : null]}
              >
                <Text style={[styles.langBtnText, language === 'en' ? styles.langBtnTextActive : null]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => { if(language !== 'si') toggleLanguage(); }}
                style={[styles.langBtn, language === 'si' ? styles.langBtnActive : null]}
              >
                <Text style={[styles.langBtnText, language === 'si' ? styles.langBtnTextActive : null]}>සිංහල</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- Security / Password Change --- */}
        <Text style={styles.sectionTitle}>{getT('profile.securityTitle', 'Security')}</Text>
        <View style={styles.settingsCard}>
          
          <View style={styles.securityHeader}>
            <Shield size={18} color="#10b981" style={{ marginRight: 8 }} />
            <Text style={styles.securityTitleText}>{getT('profile.changePw', 'Change Password')}</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={18} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { paddingRight: 45 }]} 
              value={currentPw} 
              onChangeText={setCurrentPw} 
              placeholder={language === 'si' ? 'දැනට ඇති මුරපදය' : 'Current Password'} 
              placeholderTextColor="rgba(255,255,255,0.3)" 
              secureTextEntry={!showPw1} 
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPw1(!showPw1)}>
              {showPw1 ? <EyeOff size={18} color="rgba(255,255,255,0.3)" /> : <Eye size={18} color="rgba(255,255,255,0.3)" />}
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={18} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { paddingRight: 45 }]} 
              value={newPw} 
              onChangeText={setNewPw} 
              placeholder={language === 'si' ? 'නව මුරපදය' : 'New Password'} 
              placeholderTextColor="rgba(255,255,255,0.3)" 
              secureTextEntry={!showPw2} 
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPw2(!showPw2)}>
              {showPw2 ? <EyeOff size={18} color="rgba(255,255,255,0.3)" /> : <Eye size={18} color="rgba(255,255,255,0.3)" />}
            </TouchableOpacity>
          </View>

          {/* Status Message */}
          {message.text ? (
            <View style={[styles.messageBox, message.type === 'success' ? styles.msgSuccess : styles.msgError]}>
              {message.type === 'success' ? <CheckCircle size={16} color="#10b981" /> : <Shield size={16} color="#ef4444" />}
              <Text style={[styles.messageText, message.type === 'success' ? {color: '#10b981'} : {color: '#ef4444'}]}>
                {message.text}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity 
            onPress={handlePasswordChange} 
            disabled={loading} 
            style={[styles.updateBtn, loading && { opacity: 0.7 }]}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.updateBtnText}>{getT('profile.updatePwBtn', 'Update Password')}</Text>}
          </TouchableOpacity>
        </View>

        {/* --- Logout Section --- */}
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} activeOpacity={0.8}>
          <LogOut size={20} color="#ef4444" style={{ marginRight: 10 }} />
          <Text style={styles.logoutBtnText}>{getT('nav.logout', 'Log Out')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#050812' },
  topNavbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 16 : 0, paddingBottom: 16, backgroundColor: 'rgba(5, 8, 18, 0.95)', zIndex: 10 },
  topBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  
  profileCard: { alignItems: 'center', backgroundColor: '#0f172a', padding: 30, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 30 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  userEmail: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },

  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  settingsCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 30 },
  
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingLabel: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  langToggleBox: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 4 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  langBtnActive: { backgroundColor: '#0ea5e9' },
  langBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold' },
  langBtnTextActive: { color: '#fff' },

  securityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  securityTitleText: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, marginBottom: 16, paddingHorizontal: 16, height: 55, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  eyeIcon: { position: 'absolute', right: 16, padding: 4 },
  
  messageBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1 },
  msgSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  msgError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  messageText: { marginLeft: 8, fontSize: 13, fontWeight: '600' },

  updateBtn: { backgroundColor: '#0ea5e9', height: 55, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  updateBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', height: 60, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  logoutBtnText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' }
});