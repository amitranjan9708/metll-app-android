import React, { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const theme = useTheme();

  // Calculate initial route only once on mount (or when auth state fundamentally changes)
  const initialRouteName = useMemo(() => {
    if (!isAuthenticated) return "Register";

    // Determine which onboarding step is needed
    if (!user?.photo) return "Onboarding";
    if (!user?.additionalPhotos || user.additionalPhotos.length < 3) return "PhotoUpload";
    if (!user?.situationResponses || user.situationResponses.length < 5) return "SituationIntro";

    return "Main";
  }, [isAuthenticated, user?.photo, user?.additionalPhotos?.length, user?.situationResponses?.length]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // KEY FIX: All screens are registered unconditionally.
  // Navigation between screens happens via explicit navigation calls (navigate/reset).
  // This prevents unmount/remount jitter when auth state changes during onboarding.
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: theme.colors.background,
          },
          // Disable gestures to prevent accidental back navigation during onboarding
          gestureEnabled: false,
          // Use fade animation for smoother transitions
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
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
