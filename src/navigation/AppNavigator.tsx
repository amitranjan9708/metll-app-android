import React, { useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen } from '../components/LoadingScreen';
import { socketService } from '../services/socket';

// Screens
import { RegisterScreen } from '../screens/RegisterScreen';
import { OTPScreen } from '../screens/OTPScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
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
import { CallScreen } from '../screens/CallScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Create navigation ref for global navigation
export const navigationRef = createNavigationContainerRef();

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
    isOnboarded: user?.isOnboarded,
    hasPhoto: !!user?.photo,
  });

  // Global listener for incoming calls
  useEffect(() => {
    // Only listen for calls if user is authenticated and onboarded
    if (!isAuthenticated || isLoading || (user && !user.isOnboarded)) {
      return;
    }

    // Connect socket service
    socketService.connect();
    console.log('🔌 Socket connection initiated in AppNavigator');

    // Listen for incoming calls
    const handleIncomingCall = (callData: {
      callId: number;
      matchId: number;
      channelName: string;
      callerId: number;
      callerName: string;
      callerPhoto: string | null;
      type: 'voice' | 'video';
      token: string;
      appId: string;
    }) => {
      console.log('📞 Incoming call received in AppNavigator:', callData);
      console.log('📞 Navigation ready?', navigationRef.isReady());
      
      // Navigate to CallScreen if navigation is ready
      if (navigationRef.isReady()) {
        console.log('📞 Navigating to CallScreen with params:', {
          callId: callData.callId,
          matchId: callData.matchId,
          userName: callData.callerName,
          isIncoming: true,
        });
        (navigationRef as any).navigate('Call', {
          callId: callData.callId,
          matchId: callData.matchId,
          userName: callData.callerName,
          userPhoto: callData.callerPhoto || 'https://via.placeholder.com/120',
          callType: callData.type,
          isIncoming: true,
          channelName: callData.channelName,
          token: callData.token,
          appId: callData.appId,
          callerId: callData.callerId,
        });
      } else {
        console.warn('⚠️ Navigation not ready, cannot navigate to CallScreen');
      }
    };

    socketService.on('incoming_call', handleIncomingCall);

    // Cleanup
    return () => {
      socketService.off('incoming_call', handleIncomingCall);
    };
  }, [isAuthenticated, isLoading, user?.isOnboarded]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Use local isOnboarded flag - this is the primary source of truth
  // User needs onboarding if authenticated but not yet marked as onboarded locally
  const needsOnboarding = isAuthenticated && user && !user.isOnboarded;

  return (
    <NavigationContainer ref={navigationRef}>
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
              name="Call"
              component={CallScreen}
              options={{
                gestureEnabled: false,
                ...TransitionPresets.ModalSlideFromBottomIOS,
              }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                headerShown: false,
                gestureEnabled: true,
              }}
            />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
            <Stack.Screen name="SituationIntro" component={SituationIntroScreen} />
            <Stack.Screen name="SituationSelection" component={SituationSelectionScreen} />
            <Stack.Screen name="SituationAnswer" component={SituationAnswerScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

