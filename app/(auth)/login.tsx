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
    <LinearGradient
      colors={[theme.backgroundGradientStart, theme.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={[styles.logoCircle, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
              <Ionicons name="checkmark-circle" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.appName, { color: theme.textPrimary }]}>Accountability Buddy</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>Get things done. For real.</Text>
          </View>

          {/* Glass card */}
          <View style={[styles.card, { borderColor: theme.borderStrong }]}>
            <View style={[styles.cardInner, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Welcome back</Text>

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
                    autoComplete="email"
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
                style={[styles.btn, { backgroundColor: theme.primary }, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.btnText}>Sign In</Text>
                }
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>Don't have an account? </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.footerLink, { color: theme.primary }]}>Sign Up</Text>
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
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, borderWidth: 1,
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
  btn: {
    height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '600' },
});
