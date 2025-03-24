import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { colors, typography, spacing } from '../../config/theme';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';

type ForgotPasswordScreenProps = StackScreenProps<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { requestPasswordReset, loading, error, clearError } = useAuth();

  const validateInputs = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setEmailError('');
    clearError();
    
    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateInputs()) return;
    
    const result = await requestPasswordReset(email);
    
    if (result.success) {
      setIsSubmitted(true);
    } else {
      // Error is handled by useAuth hook
      console.error('Password reset request failed:', result.error);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password
            </Text>
          </View>

          <View style={styles.formContainer}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            {isSubmitted ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  Password reset instructions have been sent to your email.
                </Text>
                <Text style={styles.successSubtext}>
                  Please check your inbox and follow the instructions to reset your password.
                </Text>
                <Button
                  title="Back to Login"
                  onPress={navigateToLogin}
                  fullWidth
                  style={styles.backButton}
                />
              </View>
            ) : (
              <>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  error={emailError}
                />
                
                <Button
                  title="Reset Password"
                  onPress={handleResetPassword}
                  isLoading={loading}
                  fullWidth
                  style={styles.resetButton}
                />
                
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Remember your password? </Text>
                  <TouchableOpacity onPress={navigateToLogin}>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.h1,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  loginButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.primary,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  successText: {
    fontSize: typography.fontSize.h3,
    fontWeight: '500',
    color: colors.success,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    marginTop: spacing.lg,
  },
});

export default ForgotPasswordScreen; 