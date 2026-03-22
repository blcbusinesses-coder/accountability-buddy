import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';

import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SceneBackground from '../../components/SceneBackground';
import GlassCard from '../../components/GlassCard';

export default function SignupScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert('Sign up failed', error.message);
    else setDone(true);
  };

  if (done) {
    return (
      <SceneBackground>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.successTitle, { color: theme.textPrimary, fontFamily: 'DMSerifDisplay_400Regular' }]}>You're in!</Text>
          <Text style={[styles.successDesc, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
            We sent a confirmation link to {email}. Click it to activate your account.
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={[styles.btn, {
              backgroundColor: theme.primary,
              shadowColor: '#4AFF72',
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 20,
              shadowOpacity: 0.45,
            }]}>
              <Text style={[styles.btnText, { fontFamily: 'Outfit_700Bold' }]}>Back to Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SceneBackground>
    );
  }

  return (
    <SceneBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <View style={[styles.logoCircle, {
              backgroundColor: theme.primaryMuted,
              borderColor: theme.border,
              shadowColor: '#4AFF72',
              shadowRadius: 16,
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 0 },
            }]}>
              <Ionicons name="checkmark-circle" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.appName, { color: theme.textPrimary, fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28 }]}>Accountability Buddy</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>Create your account</Text>
          </View>

          <GlassCard>
            <View style={styles.cardInner}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: 'Outfit_600SemiBold' }]}>Get started</Text>

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
                    placeholder="Min. 6 characters"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm password */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Outfit_500Medium' }]}>Confirm Password</Text>
                <View style={[styles.inputRow, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.border }]}>
                  <Ionicons name="lock-closed-outline" size={17} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, fontFamily: 'Outfit_400Regular' }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat password"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, {
                  backgroundColor: theme.primary,
                  shadowColor: '#4AFF72',
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 20,
                  shadowOpacity: 0.45,
                }, loading && styles.btnDisabled]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={[styles.btnText, { fontFamily: 'Outfit_700Bold' }]}>Create Account</Text>
                }
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.footerLink, { color: theme.primary, fontFamily: 'Outfit_600SemiBold' }]}>Sign In</Text>
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
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1,
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
  btn: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 28, letterSpacing: -0.5, marginBottom: 12 },
  successDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 36 },
});
