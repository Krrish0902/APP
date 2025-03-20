import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmail } from '../../src/lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const titleStyle = StyleSheet.create({
    title: {
      fontSize: 32,
      fontWeight: '600',
      color: '#000000',
      marginBottom: 8,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    }
  }).title;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await signInWithEmail(email, password);
      
      if (error && typeof error === 'object' && 'message' in error) {
        Alert.alert('Error', error.message as string || 'Failed to sign in');
        return;
      }

      if (data) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Will implement Google Sign In later
    console.log('Google Sign In pressed');
  };

  return (
    <>
      <StatusBar 
        barStyle={'dark-content'}
        backgroundColor={'#FFFFFF'}
        translucent
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { 
          backgroundColor:  '#FFFFFF',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }]}
      >
        <View style={[styles.content, {
          backgroundColor:  '#FFFFFF',
        }]}>
          <View style={styles.header}>
            <Image 
              source={require('../../assets/images/login-art.png')} 
              style={styles.illustration}
              resizeMode="contain"
            />
            <Text style={titleStyle} numberOfLines={1} adjustsFontSizeToFit>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: '#666666' }]} numberOfLines={2}>
              Please sign in to continue.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputContainer, { 
              backgroundColor:  '#F5F5F5'
            }]}>
              <Ionicons name="mail-outline" size={20} color={'#666666'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: '#000000' }]}
                placeholder="Email"
                placeholderTextColor={'#999999'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, { 
              backgroundColor:  '#F5F5F5'
            }]}>
              <Ionicons name="lock-closed-outline" size={20} color={'#666666'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color:  '#000000' }]}
                placeholder="Password"
                placeholderTextColor={'#999999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={'#666666'} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText} numberOfLines={1}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color:  '#666666' }]} numberOfLines={1}>
                Don't have an account?{' '}
              </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink} numberOfLines={1}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  illustration: {
    width: '100%',
    height: 200,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#0066ff',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    color: '#0066ff',
    fontSize: 14,
    fontWeight: '600',
  },
});