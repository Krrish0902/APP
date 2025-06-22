import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { PlatformPressable } from '@react-navigation/elements';
import { Stack } from 'expo-router';



export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';


  
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarButton: (props) => (
              //To remove the default ripple effect on android and opacity on ios
            <PlatformPressable
              {...props}
              pressColor="transparent" //For android
              pressOpacity={0.3} //For ios
            />
          ),
            tabBarStyle: {
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              shadowOffset: { width: 0, height: 0 },
              shadowColor: 'transparent',
              position: 'absolute',
              bottom: insets.bottom + 50,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              paddingHorizontal: 0,
              
            },
            tabBarActiveTintColor: isDarkMode ? '#000000' : '#FFFFFF',
            tabBarInactiveTintColor: isDarkMode ? '#999999' : '#666666',
            
          }}
        >
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              headerShown: false,
              tabBarIcon: ({ size, color }) => (
                <View style={[styles.tabIconWrapper, { backgroundColor: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  <Ionicons name="person" size={size} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              headerShown: false,
              tabBarIcon: ({ size, color }) => (
                <View style={styles.homeIconWrapper}>
                  <Ionicons name="home" size={size} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: 'Search',
              headerShown: false,
              tabBarIcon: ({ size, color }) => (
                <View style={[styles.tabIconWrapper, { backgroundColor: isDarkMode ? '#FFFFFF' :  '#000000'}]}>
                  <Ionicons name="search" size={size} color={color} />
                </View>
              ),
            }}
          />
        </Tabs>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent',
    elevation: 4,
  },
  homeIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});