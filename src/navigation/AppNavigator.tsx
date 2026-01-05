import React, { useMemo, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

import { RegisterScreen } from '../screens/RegisterScreen';
import { OTPScreen } from '../screens/OTPScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LiveMatchingScreen } from '../screens/LiveMatchingScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { SituationIntroScreen } from '../screens/SituationIntroScreen';
import { SituationSelectionScreen } from '../screens/SituationSelectionScreen';
import { SituationAnswerScreen } from '../screens/SituationAnswerScreen';
import { PhotoUploadScreen } from '../screens/PhotoUploadScreen';
import { DateScreen } from '../screens/DateScreen';
import { LoadingScreen } from '../components/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const iconName = focused ? name : `${name}-outline`;
  const iconColor = focused ? '#8E8E93' : '#C7C7CC';
  return <Ionicons name={iconName as any} size={24} color={iconColor} />;
};

const MainTabs = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#8E8E93',
        tabBarInactiveTintColor: '#C7C7CC',
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundCard,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="LiveMatching"
        component={LiveMatchingScreen}
        options={{
          title: 'Live',
          tabBarIcon: ({ focused }) => <TabBarIcon name="heart" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Date"
        component={DateScreen}
        options={{
          title: 'Date',
          tabBarIcon: ({ focused }) => <TabBarIcon name="rose" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name="person" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Helper function to determine the initial route (called only once)
const getInitialRoute = (isAuthenticated: boolean, user: any): string => {
  if (!isAuthenticated) return "Register";
  if (!user?.photo) return "Onboarding";
  if (!user?.additionalPhotos || user.additionalPhotos.length < 3) return "PhotoUpload";
  if (!user?.situationResponses || user.situationResponses.length < 5) return "SituationIntro";
  return "Main";
};

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const theme = useTheme();

  // Store the initial route in a ref so it NEVER changes after first calculation
  // This is the key fix - we only calculate once on mount
  const initialRouteRef = useRef<string | null>(null);

  if (!isLoading && initialRouteRef.current === null) {
    initialRouteRef.current = getInitialRoute(isAuthenticated, user);
  }

  // Use a ref for the navigation container to dispatch actions
  const navigationRef = React.useRef<any>(null);

  // Handle Auth State Changes (Login/Logout)
  // We ONLY watch isAuthenticated to avoid jitter from user data updates during onboarding
  React.useEffect(() => {
    if (isLoading || !navigationRef.current) return;

    if (!isAuthenticated) {
      // Logout: Reset to Register
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Register' }],
      });
    } else {
      // Login: Determine where to go based on user state
      const targetRoute = getInitialRoute(true, user);

      // Only reset if we are on an auth screen (optimization)
      // or if we want to ensure we land on the right spot after login
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: targetRoute }],
      });
    }
  }, [isAuthenticated, isLoading]); // Deliberately exclude 'user' to prevent jitter

  if (isLoading) {
    return <LoadingScreen />;
  }

  const initialRouteName = initialRouteRef.current || "Register";

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: theme.colors.background,
          },
          gestureEnabled: false,
          // Use simple fade for smooth transitions
          ...TransitionPresets.FadeFromBottomAndroid,
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />

        {/* Onboarding Flow */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
        <Stack.Screen name="SituationIntro" component={SituationIntroScreen} />
        <Stack.Screen name="SituationSelection" component={SituationSelectionScreen} />
        <Stack.Screen name="SituationAnswer" component={SituationAnswerScreen} />

        {/* Main App */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Auxiliary Screens */}
        <Stack.Screen
          name="EditProfile"
          component={OnboardingScreen}
          options={{
            headerShown: true,
            title: 'Edit Profile',
            headerTransparent: true,
            headerBackTitleVisible: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
