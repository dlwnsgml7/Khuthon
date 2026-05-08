import React from 'react';
import { ActivityIndicator, View, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import LoginScreen          from '../screens/LoginScreen';
import SignupScreen         from '../screens/SignupScreen';
import HomeScreen           from '../screens/HomeScreen';
import ProvinceScreen       from '../screens/ProvinceScreen';
import CourseListScreen     from '../screens/CourseListScreen';
import CourseDetailScreen   from '../screens/CourseDetailScreen';
import ChargeScreen         from '../screens/ChargeScreen';
import CourseRegisterScreen from '../screens/CourseRegisterScreen';
import ChatScreen           from '../screens/ChatScreen';
import ProfileScreen        from '../screens/ProfileScreen';
import MyCoursesScreen      from '../screens/MyCoursesScreen';
import MyPurchasesScreen    from '../screens/MyPurchasesScreen';
import ReviewScreen         from '../screens/ReviewScreen';
import ChatRoomScreen       from '../screens/ChatRoomScreen';
import VerifyIdScreen       from '../screens/VerifyIdScreen';

import { useAuth } from '../api/auth';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  '홈':       'compass',
  '코스 등록': 'plus-circle',
  '채팅':     'message-circle',
  '프로필':   'user',
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"     component={HomeScreen} />
      <Stack.Screen name="Province"     component={ProvinceScreen} />
      <Stack.Screen name="CourseList"   component={CourseListScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Charge"       component={ChargeScreen} />
      <Stack.Screen name="Review"       component={ReviewScreen} />
      <Stack.Screen name="ChatRoom"     component={ChatRoomScreen} />
    </Stack.Navigator>
  );
}

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatMain" component={ChatScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain"  component={ProfileScreen} />
      <Stack.Screen name="MyCourses"    component={MyCoursesScreen} />
      <Stack.Screen name="MyPurchases"  component={MyPurchasesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Review"       component={ReviewScreen} />
      <Stack.Screen name="ChatRoom"     component={ChatRoomScreen} />
      <Stack.Screen name="Charge"       component={ChargeScreen} />
      <Stack.Screen name="VerifyId"     component={VerifyIdScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Feather
            name={TAB_ICONS[route.name]}
            size={22}
            color={focused ? colors.primary : '#48484A'}
          />
        ),
        tabBarLabel: ({ focused }) => (
          <Text style={{
            fontSize: 10, fontWeight: focused ? '700' : '500',
            color: focused ? colors.primary : '#48484A',
            marginBottom: Platform.OS === 'ios' ? 0 : 4,
            letterSpacing: 0.2,
          }}>
            {route.name}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: '#242428',
          borderTopColor: '#3A3A3E',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="홈"       component={HomeStack} />
      <Tab.Screen name="코스 등록" component={CourseRegisterScreen} />
      <Tab.Screen name="채팅"     component={ChatStack} />
      <Tab.Screen name="프로필"   component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1E' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login"  component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
