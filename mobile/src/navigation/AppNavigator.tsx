/**
 * App Navigator
 * Bottom tab navigation for main app screens with auth flow
 */

import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../theme/ThemeContext';

import MarketsScreen from '../screens/MarketsScreen.tsx';
import CustomBottomTabBar from '../components/CustomBottomTabBar';
import PortfolioScreen from '../screens/PortfolioScreen.tsx';
import ProfileScreen from '../screens/ProfileScreen.tsx';
import LoginScreen from '../screens/LoginScreen.tsx';
import BetScreen from '../screens/BetScreen.tsx';
import SearchScreen from '../screens/SearchScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { mode, colors } = useThemeContext();
  const navTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  if (!isAuthenticated) {
    return (
      <NavigationContainer theme={navTheme}>
        <LoginScreen onLogin={() => setIsAuthenticated(true)} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        tabBar={(props) => <CustomBottomTabBar {...props} />}
        screenOptions={({ route }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.headerBackground,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.headerBorder,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        })}
      >
        <Tab.Screen 
          name="Markets" 
          component={MarketsScreen}
          options={{
            headerTitle: 'Prediction Markets',
          }}
        />
        <Tab.Screen 
          name="Search" 
          component={SearchScreen as any}
          options={{
            headerTitle: 'Search',
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' },
          }}
          listeners={{
            tabPress: (e) => e.preventDefault(),
          }}
        />
        <Tab.Screen 
          name="Portfolio" 
          component={PortfolioScreen}
          options={{
            headerTitle: 'My Portfolio',
          }}
        />
        <Tab.Screen 
          name="Profile"
          options={{
            headerTitle: 'Profile',
          }}
        >
          {(props) => <ProfileScreen {...props} onLogout={() => setIsAuthenticated(false)} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Bet" 
          component={BetScreen as any}
          options={{
            headerTitle: '',
            headerStyle: {
              backgroundColor: colors.headerBackground,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
              height: 40,
            },
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' },
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
