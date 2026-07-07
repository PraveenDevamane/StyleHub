import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Moon, Sun, Info, MessageSquare, MapPin, KeyRound, Globe, LogIn, LogOut } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const colors = Colors[theme];

  const { session, isAdmin, signOut, forceRefreshAdminStatus } = useAuthStore();

  // Re-check admin status when profile screen loads with a signed-in user.
  // This catches the case where the initial startup check failed due to
  // the Firebase auth token not being ready for Firestore.
  useEffect(() => {
    if (session && !isAdmin) {
      forceRefreshAdminStatus();
    }
  }, [session]);

  // Hidden admin gesture state: Tap logo 7 times
  const [logoTaps, setLogoTaps] = useState(0);

  const handleLogoTap = () => {
    setLogoTaps((prev) => {
      const next = prev + 1;
      if (next >= 7) {
        // Triggers the hidden login
        router.push('/admin/login');
        return 0;
      }
      return next;
    });
  };

  // Reset tap counter if user stops tapping for 2 seconds
  useEffect(() => {
    if (logoTaps > 0) {
      const timer = setTimeout(() => {
        setLogoTaps(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [logoTaps]);

  const handleLongPressVersion = () => {
    router.push('/admin/login');
  };

  const handleContactWhatsApp = () => {
    const whatsappNumber = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER || '1234567890';
    Linking.openURL(`https://wa.me/${whatsappNumber}?text=Hi%20StyleHub,%20I%20have%20an%20inquiry%20regarding%20the%20store.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>PROFILE</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Brand Logo Section with Secret Tap Trigger */}
        <View style={styles.logoSection}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleLogoTap} style={styles.logoWrapper}>
            <View style={[styles.logoOutline, { borderColor: colors.accent }]}>
              <Text style={[styles.logoLetter, { color: colors.text }]}>S</Text>
              <View style={[styles.logoDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.logoLetter, { color: colors.text }]}>H</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.logoText, { color: colors.text }]}>STYLEHUB</Text>
          <Text style={[styles.logoSubtext, { color: colors.textSecondary }]}>ELEVATE YOUR STYLE</Text>
        </View>

        {!session && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Sign in or create an account"
              style={[styles.itemRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              onPress={() => router.push('/(customer)/login')}
            >
              <View style={styles.itemLeft}>
                <LogIn size={18} color={colors.accent} style={{ marginRight: 12 }} />
                <View>
                  <Text style={[styles.itemText, { color: colors.text, fontWeight: '700' }]}>Sign in or create an account</Text>
                  <Text style={[styles.accountHint, { color: colors.textSecondary }]}>Access saved account features</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {session && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
            <View style={[styles.accountStatus, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Text style={[styles.accountEmail, { color: colors.text }]} numberOfLines={1}>
                {session.user.email || 'Signed in'}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                style={[styles.signOutButton, { borderTopColor: colors.border }]}
                onPress={() => void signOut()}
              >
                <LogOut size={18} color={colors.accent} style={{ marginRight: 12 }} />
                <Text style={[styles.itemText, { color: colors.accent, fontWeight: '700' }]}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Settings Groups */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
          
          <View style={[styles.itemRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.itemLeft}>
              {theme === 'dark' ? (
                <Moon size={18} color={colors.accent} style={{ marginRight: 12 }} />
              ) : (
                <Sun size={18} color={colors.accent} style={{ marginRight: 12 }} />
              )}
              <Text style={[styles.itemText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.accent }}
              thumbColor={theme === 'dark' ? '#FFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Store Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT STORE</Text>
          
          <View style={[styles.infoBlock, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Info size={16} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                StyleHub is a premium retail clothing and footwear catalog. We offer curated high-end garments, sneakers, and traditional wear.
              </Text>
            </View>

            <TouchableOpacity style={styles.infoRow} onPress={handleContactWhatsApp}>
              <MessageSquare size={16} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={[styles.infoLink, { color: colors.accent }]}>Contact Store via WhatsApp</Text>
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: colors.text }]}>Luxury Avenue 100, Beverly Hills, CA</Text>
            </View>

            <View style={styles.infoRow}>
              <Globe size={16} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: colors.text }]}>www.stylehub-retail.com</Text>
            </View>
          </View>
        </View>

        {/* Quick link to admin if already authenticated */}
        {isAdmin && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.itemRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              onPress={() => router.push('/admin/dashboard')}
            >
              <View style={styles.itemLeft}>
                <KeyRound size={18} color={colors.accent} style={{ marginRight: 12 }} />
                <Text style={[styles.itemText, { color: colors.text, fontWeight: '700' }]}>Go to Admin Dashboard</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* App Version with Secret Long Press Trigger */}
        <View style={styles.versionSection}>
          <Pressable onLongPress={handleLongPressVersion} delayLongPress={5000} style={styles.versionBtn}>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              Version 1.0.0 (Premium Release)
            </Text>
            <Text style={[styles.holdHintText, { color: colors.textSecondary }]}>
              © 2026 StyleHub Inc. All rights reserved.
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoWrapper: {
    marginBottom: 16,
  },
  logoOutline: {
    width: 76,
    height: 76,
    borderWidth: 2.5,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -2,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    marginTop: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 3,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountHint: {
    fontSize: 12,
    marginTop: 3,
  },
  accountStatus: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountEmail: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoBlock: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  infoLink: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  versionSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionBtn: {
    alignItems: 'center',
    padding: 10,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  holdHintText: {
    fontSize: 10,
  },
});
