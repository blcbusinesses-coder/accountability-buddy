import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Link } from 'expo-router';

import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SceneBackground from '../../components/SceneBackground';
import GlassCard from '../../components/GlassCard';

export default function LoginScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  };

  return (
    <SceneBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/icon-transparent.png')}
              style={styles.logoImg}
            />
            <Text style={[styles.appName, { color: theme.textPrimary, fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28 }]}>Accountability Buddy</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>Get things done. For real.</Text>
          </View>

          {/* Glass card */}
          <GlassCard>
            <View style={styles.cardInner}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: 'Outfit_600SemiBold' }]}>Welcome back</Text>

              {/* Email */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Outfit_500Medium' }]}>Email</Text>
                <View style={[styles.inputRow, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.border }]}>
                  <Ionicons name="mail-outline" size={17} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, fontFamily: 'Outfit_400Regular' }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Outfit_500Medium' }]}>Password</Text>
                <View style={[styles.inputRow, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.border }]}>
                  <Ionicons name="lock-closed-outline" size={17} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, flex: 1, fontFamily: 'Outfit_400Regular' }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign in button */}
              <TouchableOpacity
                style={[styles.btn, {
                  backgroundColor: theme.primary,
                  shadowColor: '#4AFF72',
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 20,
                  shadowOpacity: 0.45,
                }, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={[styles.btnText, { fontFamily: 'Outfit_700Bold' }]}>Sign In</Text>
                }
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>Don't have an account? </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.footerLink, { color: theme.primary, fontFamily: 'Outfit_600SemiBold' }]}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoImg: {
    width: 88, height: 88, borderRadius: 22,
    marginBottom: 14,
    shadowColor: '#4AFF72',
    shadowRadius: 20,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 0 },
  },
  appName: { letterSpacing: -0.5 },
  tagline: { fontSize: 14, marginTop: 6 },
  cardInner: { padding: 24 },
  cardTitle: { fontSize: 22, letterSpacing: -0.5, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  btn: {
    height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
