import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';

import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

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
      <LinearGradient colors={[theme.backgroundGradientStart, theme.backgroundGradientEnd]} style={styles.gradient}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.successTitle, { color: theme.textPrimary }]}>You're in!</Text>
          <Text style={[styles.successDesc, { color: theme.textSecondary }]}>
            We sent a confirmation link to {email}. Click it to activate your account.
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]}>
              <Text style={styles.btnText}>Back to Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.backgroundGradientStart, theme.backgroundGradientEnd]} style={styles.gradient}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <View style={[styles.logoCircle, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
              <Ionicons name="checkmark-circle" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.appName, { color: theme.textPrimary }]}>Accountability Buddy</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>Create your account</Text>
          </View>

          <View style={[styles.card, { borderColor: theme.borderStrong }]}>
            <View style={[styles.cardInner, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Get started</Text>

              {/* Email */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
                <View style={[styles.inputRow, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Ionicons name="mail-outline" size={17} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
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
                <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                <View style={[styles.inputRow, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Ionicons name="lock-closed-outline" size={17} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, flex: 1 }]}
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
                <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm Password</Text>
                <View style={[styles.inputRow, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Ionicons name="lock-closed-outline" size={17} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat password"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.primary }, loading && styles.btnDisabled]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.btnText}>Create Account</Text>
                }
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.footerLink, { color: theme.primary }]}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1,
  },
  appName: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  tagline: { fontSize: 14, marginTop: 6 },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  cardInner: { padding: 24 },
  cardTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  btn: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '600' },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 12 },
  successDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 36 },
});
