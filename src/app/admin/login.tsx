import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth } from '@/services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { ChevronLeft, Lock, Mail } from 'lucide-react-native';
import Button from '@/components/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function AdminLoginScreen() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const { session, isAdmin, isLoading } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const accessError = session && !isAdmin && !isLoading
    ? 'This account is signed in but is not authorized to manage the catalog.'
    : null;

  const onSubmit = async (data: LoginSchema) => {
    setLoading(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      // After successful sign-in, force a fresh admin status check.
      // The onAuthStateChanged listener may fire before Firestore has the
      // auth token, causing the automatic admin check to fail silently.
      // This explicit re-check ensures the token is fresh.
      const { forceRefreshAdminStatus } = useAuthStore.getState();
      await forceRefreshAdminStatus();

      // Check if user is now recognized as admin
      const { isAdmin: nowAdmin } = useAuthStore.getState();
      if (nowAdmin) {
        router.replace('/admin/dashboard');
      } else {
        setAuthError('This account is signed in but is not authorized to manage the catalog.');
      }
    } catch (e: any) {
      // Map common Firebase auth errors to reader-friendly messages
      let msg = e.message;
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      }
      setAuthError(msg || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.backgroundSelected }]}
          onPress={() => router.replace('/(customer)/profile')}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]}>ADMIN LOGIN</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            StyleHub Management Portal
          </Text>
        </View>

        {(authError || accessError) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{authError || accessError}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.backgroundSelected,
                    borderColor: errors.email ? '#FF3B30' : colors.border,
                  },
                ]}
              >
                <Mail size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="admin@stylehub.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>
            SECURE PASSWORD
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.backgroundSelected,
                    borderColor: errors.password ? '#FF3B30' : colors.border,
                  },
                ]}
              >
                <Lock size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

          <Button
            title="AUTHENTICATE"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            variant="accent"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {},
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  fieldError: {
    color: '#FF3B30',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 32,
    height: 52,
    borderRadius: 10,
  },
});
