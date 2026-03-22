import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import SceneBackground from '../../components/SceneBackground';
import GlassCard from '../../components/GlassCard';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your inbox', 'A confirmation link was sent to ' + newEmail.trim());
      setNewEmail('');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) return;
    if (newPassword.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Done', 'Your password has been updated.');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const GlassSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <GlassCard>{children}</GlassCard>
    </View>
  );

  const RowDivider = () => <View style={[styles.divider, { backgroundColor: theme.border }]} />;

  return (
    <SceneBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary, fontFamily: 'DMSerifDisplay_400Regular' }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>{user?.email}</Text>
          </View>

          {/* Appearance */}
          <GlassSection title="Appearance">
            <View style={styles.row}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary, fontFamily: 'Outfit_500Medium' }]}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: 'rgba(74,255,114,0.3)' }}
                thumbColor={isDark ? theme.primary : theme.textMuted}
              />
            </View>
          </GlassSection>

          {/* Change Email */}
          <GlassSection title="Change Email">
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: 'Outfit_500Medium' }]}>New email address</Text>
              <View style={[styles.inputRow, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }]}>
                <Ionicons name="mail-outline" size={16} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, fontFamily: 'Outfit_400Regular' }]}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder={user?.email ?? 'Current email'}
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <RowDivider />
            <TouchableOpacity
              style={[styles.actionBtn, { opacity: (!newEmail.trim() || emailLoading) ? 0.5 : 1 }]}
              onPress={handleChangeEmail}
              disabled={!newEmail.trim() || emailLoading}
              activeOpacity={0.7}
            >
              {emailLoading
                ? <ActivityIndicator size="small" color={theme.primary} />
                : <>
                    <Ionicons name="checkmark-outline" size={18} color={theme.primary} />
                    <Text style={[styles.actionBtnText, { color: theme.primary, fontFamily: 'Outfit_600SemiBold' }]}>Update Email</Text>
                  </>
              }
            </TouchableOpacity>
          </GlassSection>

          {/* Change Password */}
          <GlassSection title="Change Password">
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: 'Outfit_500Medium' }]}>New password</Text>
              <View style={[styles.inputRow, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }]}>
                <Ionicons name="lock-closed-outline" size={16} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, flex: 1, fontFamily: 'Outfit_400Regular' }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.fieldWrap, { paddingTop: 0 }]}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: 'Outfit_500Medium' }]}>Confirm new password</Text>
              <View style={[styles.inputRow, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }]}>
                <Ionicons name="lock-closed-outline" size={16} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, fontFamily: 'Outfit_400Regular' }]}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  placeholder="Repeat new password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showNewPassword}
                />
              </View>
            </View>
            <RowDivider />
            <TouchableOpacity
              style={[styles.actionBtn, { opacity: (!newPassword.trim() || passwordLoading) ? 0.5 : 1 }]}
              onPress={handleChangePassword}
              disabled={!newPassword.trim() || passwordLoading}
              activeOpacity={0.7}
            >
              {passwordLoading
                ? <ActivityIndicator size="small" color={theme.primary} />
                : <>
                    <Ionicons name="checkmark-outline" size={18} color={theme.primary} />
                    <Text style={[styles.actionBtnText, { color: theme.primary, fontFamily: 'Outfit_600SemiBold' }]}>Update Password</Text>
                  </>
              }
            </TouchableOpacity>
          </GlassSection>

          {/* About */}
          <GlassSection title="About">
            <View style={styles.row}>
              <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary, fontFamily: 'Outfit_500Medium' }]}>Version</Text>
              <Text style={[styles.rowValue, { color: theme.textMuted, fontFamily: 'Outfit_400Regular' }]}>1.0.0</Text>
            </View>
            <RowDivider />
            <View style={styles.row}>
              <Ionicons name="sparkles-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary, fontFamily: 'Outfit_500Medium' }]}>AI Engine</Text>
              <Text style={[styles.rowValue, { color: theme.textMuted, fontFamily: 'Outfit_400Regular' }]}>GPT-4 Vision</Text>
            </View>
            <RowDivider />
            <View style={styles.row}>
              <Ionicons name="server-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary, fontFamily: 'Outfit_500Medium' }]}>Backend</Text>
              <Text style={[styles.rowValue, { color: theme.textMuted, fontFamily: 'Outfit_400Regular' }]}>Supabase</Text>
            </View>
          </GlassSection>

          {/* Danger zone */}
          <GlassSection title="Account">
            <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={theme.error} />
              <Text style={[styles.rowLabel, { color: theme.error, fontFamily: 'Outfit_500Medium' }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.error} />
            </TouchableOpacity>
          </GlassSection>
        </ScrollView>
      </SafeAreaView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 32, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 10,
    paddingHorizontal: 4,
    color: 'rgba(74,255,114,0.4)',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 14 },
  divider: { height: 1, marginHorizontal: 16 },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  fieldLabel: { fontSize: 13 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 46,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, paddingHorizontal: 16,
  },
  actionBtnText: { fontSize: 15 },
});
