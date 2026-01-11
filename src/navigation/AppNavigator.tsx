import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen } from '../components/LoadingScreen';

// Screens
import { RegisterScreen } from '../screens/RegisterScreen';
import { OTPScreen } from '../screens/OTPScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LiveMatchingScreen } from '../screens/LiveMatchingScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { PhotoUploadScreen } from '../screens/PhotoUploadScreen';
import { FaceVerificationScreen } from '../screens/FaceVerificationScreen';
import { DateScreen } from '../screens/DateScreen';
import { SituationIntroScreen } from '../screens/SituationIntroScreen';
import { SituationSelectionScreen } from '../screens/SituationSelectionScreen';
import { SituationAnswerScreen } from '../screens/SituationAnswerScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const iconName = focused ? name : `${name}-outline`;
  const { colors } = useTheme();
  const iconColor = focused ? colors.primary : colors.textMuted;
  
  return <Ionicons name={iconName as any} size={24} color={iconColor} />;
};

const MainTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundCard,
          borderTopColor: colors.border,
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
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="LiveMatching"
        component={LiveMatchingScreen}
        options={{
          title: 'Live',
          headerShown: false,
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
        name="Matches"
        component={MatchesScreen}
        options={{
          title: 'Matches',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabBarIcon name="chatbubbles" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabBarIcon name="person" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { colors } = useTheme();

  console.log('AppNavigator render:', { 
    isAuthenticated, 
    isLoading, 
    hasPhoto: !!user?.photo,
    hasSituationResponses: user?.situationResponses?.length || 0
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Onboarding is complete when user has situation responses (final step)
  const needsOnboarding = isAuthenticated && user && (!user.situationResponses || user.situationResponses.length === 0);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.textPrimary,
          },
          cardStyle: {
            backgroundColor: colors.background,
          },
          gestureEnabled: false,
          ...TransitionPresets.FadeFromBottomAndroid,
        }}
      >
        {!isAuthenticated ? (
          // Auth Screens - Not logged in
          <>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : needsOnboarding ? (
          // Onboarding Flow - Logged in but no photo
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
            <Stack.Screen name="SituationIntro" component={SituationIntroScreen} />
            <Stack.Screen name="SituationSelection" component={SituationSelectionScreen} />
            <Stack.Screen name="SituationAnswer" component={SituationAnswerScreen} />
          </>
        ) : (
          // Main App - Fully onboarded
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                gestureEnabled: true,
                ...TransitionPresets.SlideFromRightIOS,
              }}
            />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

