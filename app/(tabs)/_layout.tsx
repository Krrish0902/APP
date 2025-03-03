import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/LOGO_1.png')}
          style={styles.logo}
        />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            // Customizing the container for tab items so that
            // profile is left, home is center, and search is right.
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
            tabBarActiveTintColor: '#fff',
            tabBarInactiveTintColor: '#000',
          }}
        >
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ size, color }) => (
                <View style={styles.tabIconWrapper}>
                  <Ionicons name="person" size={size} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ size, color }) => (
                // No extra margin is needed here since the container handles spacing.
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
              tabBarIcon: ({ size, color }) => (
                <View style={styles.tabIconWrapper}>
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
  logo: {
    position: 'absolute',
    top: 40,
    left: 175,
    width: 70,
    height: 70,
    zIndex: 1,
  },
  // For the tabs that need a circular white background (profile & search)
  tabIconWrapper: {
    backgroundColor: '#fff',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Home icon wrapper remains simple (no circular background)
  homeIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});