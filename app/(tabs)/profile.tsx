import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const email = user?.email ?? 'Unknown';
  const initials = email.charAt(0).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar + User info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>

        {/* About section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primaryLight} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>AI-Powered Verification</Text>
                <Text style={styles.cardDesc}>
                  Submit photos, text, or audio as proof. GPT-4 Vision verifies your task completion.
                </Text>
              </View>
            </View>
            <View style={[styles.cardRow, styles.cardRowBorder]}>
              <Ionicons name="time-outline" size={20} color={Colors.primaryLight} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Due Date Enforcement</Text>
                <Text style={styles.cardDesc}>
                  Tasks automatically fail when the deadline passes without an approved submission.
                </Text>
              </View>
            </View>
            <View style={[styles.cardRow, styles.cardRowBorder]}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primaryLight} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Calendar View</Text>
                <Text style={styles.cardDesc}>
                  See all your tasks organized by due date on the calendar.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuRow} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={[styles.menuText, { color: Colors.error }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Accountability Buddy v1.0</Text>
          <Text style={styles.footerSub}>Powered by GPT-4 Vision & Supabase</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  profileCard: {
    alignItems: 'center', margin: 20, paddingVertical: 28,
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary, marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.primaryLight },
  email: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  memberSince: { fontSize: 13, color: Colors.textSecondary },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  cardRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500' },
  footer: { alignItems: 'center', paddingBottom: 32, paddingTop: 8 },
  footerText: { fontSize: 13, color: Colors.textMuted },
  footerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});
