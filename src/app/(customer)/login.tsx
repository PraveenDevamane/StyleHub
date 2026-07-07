import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth } from '@/services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Lock, Mail, User, Eye, EyeOff } from 'lucide-react-native';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginSchema = z.infer<typeof loginSchema>;
type RegisterSchema = z.infer<typeof registerSchema>;

type Mode = 'login' | 'register';

export default function CustomerLoginScreen() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const [mode, setMode] = useState<Mode>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const mapFirebaseError = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const onLogin = async (data: LoginSchema) => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.replace('/(customer)/profile');
    } catch (e: any) {
      setAuthError(mapFirebaseError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterSchema) => {
    setLoading(true);
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      router.replace('/(customer)/profile');
    } catch (e: any) {
      setAuthError(mapFirebaseError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    const email = loginForm.getValues('email');
    if (!email) {
      setAuthError('Enter your email address above, then tap Forgot Password.');
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthSuccess('Password reset email sent! Check your inbox.');
    } catch (e: any) {
      setAuthError(mapFirebaseError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setAuthError(null);
    setAuthSuccess(null);
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.backgroundSelected }]}
            onPress={() => router.back()}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Brand Mark */}
          <View style={styles.brandSection}>
            <View style={[styles.logoOutline, { borderColor: colors.accent }]}>
              <Text style={[styles.logoLetter, { color: colors.text }]}>S</Text>
              <View style={[styles.logoDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.logoLetter, { color: colors.text }]}>H</Text>
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>STYLEHUB</Text>
          </View>

          {/* Tab Toggle */}
          <View style={[styles.tabRow, { backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && { backgroundColor: colors.accent }]}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.tabText, { color: mode === 'login' ? '#FFF' : colors.textSecondary }]}>
                SIGN IN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'register' && { backgroundColor: colors.accent }]}
              onPress={() => switchMode('register')}
            >
              <Text style={[styles.tabText, { color: mode === 'register' ? '#FFF' : colors.textSecondary }]}>
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status banners */}
          {authError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}
          {authSuccess && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{authSuccess}</Text>
            </View>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
              <Controller
                control={loginForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputRow, { backgroundColor: colors.backgroundSelected, borderColor: loginForm.formState.errors.email ? '#FF3B30' : colors.border }]}>
                    <Mail size={16} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {loginForm.formState.errors.email && (
                <Text style={styles.fieldError}>{loginForm.formState.errors.email.message}</Text>
              )}

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 18 }]}>PASSWORD</Text>
              <Controller
                control={loginForm.control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputRow, { backgroundColor: colors.backgroundSelected, borderColor: loginForm.formState.errors.password ? '#FF3B30' : colors.border }]}>
                    <Lock size={16} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                      {showPassword ? (
                        <EyeOff size={16} color={colors.textSecondary} />
                      ) : (
                        <Eye size={16} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {loginForm.formState.errors.password && (
                <Text style={styles.fieldError}>{loginForm.formState.errors.password.message}</Text>
              )}

              <TouchableOpacity style={styles.forgotBtn} onPress={onForgotPassword}>
                <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.accent }, loading && styles.submitBtnDisabled]}
                onPress={loginForm.handleSubmit(onLogin)}
                disabled={loading}
              >
                <Text style={styles.submitBtnText}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
              <Controller
                control={registerForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputRow, { backgroundColor: colors.backgroundSelected, borderColor: registerForm.formState.errors.email ? '#FF3B30' : colors.border }]}>
                    <Mail size={16} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {registerForm.formState.errors.email && (
                <Text style={styles.fieldError}>{registerForm.formState.errors.email.message}</Text>
              )}

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 18 }]}>PASSWORD</Text>
              <Controller
                control={registerForm.control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputRow, { backgroundColor: colors.backgroundSelected, borderColor: registerForm.formState.errors.password ? '#FF3B30' : colors.border }]}>
                    <Lock size={16} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                      {showPassword ? (
                        <EyeOff size={16} color={colors.textSecondary} />
                      ) : (
                        <Eye size={16} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {registerForm.formState.errors.password && (
                <Text style={styles.fieldError}>{registerForm.formState.errors.password.message}</Text>
              )}

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 18 }]}>CONFIRM PASSWORD</Text>
              <Controller
                control={registerForm.control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputRow, { backgroundColor: colors.backgroundSelected, borderColor: registerForm.formState.errors.confirmPassword ? '#FF3B30' : colors.border }]}>
                    <Lock size={16} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Re-enter password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeBtn}>
                      {showConfirmPassword ? (
                        <EyeOff size={16} color={colors.textSecondary} />
                      ) : (
                        <Eye size={16} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {registerForm.formState.errors.confirmPassword && (
                <Text style={styles.fieldError}>{registerForm.formState.errors.confirmPassword.message}</Text>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.accent }, loading && styles.submitBtnDisabled]}
                onPress={registerForm.handleSubmit(onRegister)}
                disabled={loading}
              >
                <Text style={styles.submitBtnText}>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</Text>
              </TouchableOpacity>

              <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                By creating an account you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoOutline: {
    width: 72,
    height: 72,
    borderWidth: 2.5,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  logoLetter: {
    fontSize: 30,
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
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 5,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { color: '#FFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  successBanner: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: { color: '#FFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  form: {},
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  eyeBtn: { padding: 4 },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  fieldError: {
    color: '#FF3B30',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
