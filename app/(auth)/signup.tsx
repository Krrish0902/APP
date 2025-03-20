import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signUpWithEmail } from '../../src/lib/auth';
import * as ImagePicker from 'expo-image-picker';
import { useFonts } from 'expo-font';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const headerTitleStyle = StyleSheet.create({
    title: {
      fontSize: 24,
      fontFamily: 'Meddon',
      color: '#000000',
      textShadowColor:  'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      marginVertical: 16,
    }
  }).title;

  const [fontsLoaded] = useFonts({
    'Meddon': require('../../assets/fonts/Meddon-Regular.ttf'),
  });

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to add a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setProfilePicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await signUpWithEmail(email, password, name, phoneNumber, profilePicture);
      
      if (error) {
        Alert.alert('Error', (error as { message?: string }).message || 'Failed to sign up');
        return;
      }
      
      if (data) {
        Alert.alert(
          'Success', 
          'Account created successfully! Please sign in.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar 
        barStyle={'dark-content'}
        backgroundColor={ '#FFFFFF'}
        translucent
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { 
          backgroundColor: '#FFFFFF',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }]}
      >
        <View style={[styles.content, {
          backgroundColor:  '#FFFFFF',
        }]}>
          <View style={styles.header}>
            <Image 
              source={require('../../assets/images/signup-art.png')} 
              style={styles.illustration}
              resizeMode="contain"
            />
            <Text style={headerTitleStyle}>BEHANCE</Text> 
            
            <Text style={[styles.subtitle, {
              color: '#666666'
            }]} numberOfLines={2}>
              Create your account to showcase your talent.
            </Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity 
              style={[styles.profilePictureContainer, {
                backgroundColor: '#F5F5F5',
                borderColor: '#E0E0E0',
              }]} 
              onPress={handlePickImage}
            >
              {profilePicture ? (
                <Image 
                  source={{ uri: profilePicture }} 
                  style={styles.profilePicture} 
                />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <Ionicons 
                    name="camera" 
                    size={32} 
                    color={ '#666666'} 
                  />
                </View>
              )}
            </TouchableOpacity>

            <View style={[styles.inputContainer, {
              backgroundColor:'#F5F5F5'
            }]}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={'#666666'} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, {
                  color:'#000000'
                }]}
                placeholder="Full Name"
                placeholderTextColor={ '#999999'}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={[styles.inputContainer, {
              backgroundColor:  '#F5F5F5'
            }]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={'#666666'} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, {
                  color: '#000000'
                }]}
                placeholder="Email"
                placeholderTextColor={ '#999999'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, {
              backgroundColor:'#F5F5F5'
            }]}>
              <Ionicons 
                name="call-outline" 
                size={20} 
                color={'#666666'} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, {
                  color: '#000000'
                }]}
                placeholder="Mobile Number (Optional)"
                placeholderTextColor={ '#999999'}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputContainer, {
              backgroundColor: '#F5F5F5'
            }]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={'#666666'} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, {
                  color: '#000000'
                }]}
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
                  color={ '#666666'} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.signUpButton} 
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpButtonText} numberOfLines={1}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <View style={styles.footerContent}>
                <Text style={[styles.footerText, {
                  color: '#666666'
                }]}>
                  Already have an account?
                </Text>
                <Link href="/login" asChild>
                  <TouchableOpacity style={styles.footerLinkContainer}>
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
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
    marginBottom: 10,
  },
  illustration: {
    width: '100%',
    height: 200,
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Meddon',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  form: {
    width: '100%',
  },
  profilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  profilePicturePlaceholder: {
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  showPasswordButton: {
    padding: 5,
  },
  signUpButton: {
    backgroundColor: '#0057FF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  footerText: {
    fontSize: 14,
  },
  footerLinkContainer: {
    marginLeft: 4,
  },
  footerLink: {
    color: '#0057FF',
    fontSize: 14,
    fontWeight: '600',
  },
});