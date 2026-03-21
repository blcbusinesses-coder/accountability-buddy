import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
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
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          <Text style={styles.successTitle}>Check your email!</Text>
          <Text style={styles.successText}>
            We sent a confirmation link to {email}. Click it to verify your account and sign in.
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.btn}>
              <Text style={styles.btnText}>Back to Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="checkmark-circle" size={52} color={Colors.primaryLight} />
          </View>
          <Text style={styles.appName}>Accountability Buddy</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Get started</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  appName: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
  form: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: Colors.border,
  },
  formTitle: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 48, color: Colors.textPrimary, fontSize: 15 },
  eyeBtn: { padding: 4 },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  footerLink: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600' },
  successCard: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 12 },
  successText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
