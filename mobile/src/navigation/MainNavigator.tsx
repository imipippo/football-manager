import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {HomeScreen, SquadScreen, MatchCenterScreen} from '../screens';

export type MainTabParamList = {
  Home: undefined;
  Squad: undefined;
  Market: undefined;
  Match: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MarketScreen: React.FC = () => (
  <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e'}}>
    <Text style={{color: '#fff', fontSize: 18}}>转会市场</Text>
    <Text style={{color: '#aaa', fontSize: 14, marginTop: 8}}>功能开发中...</Text>
  </SafeAreaView>
);

const ProfileScreen: React.FC = () => (
  <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e'}}>
    <Text style={{color: '#fff', fontSize: 18}}>个人中心</Text>
    <Text style={{color: '#aaa', fontSize: 14, marginTop: 8}}>功能开发中...</Text>
  </SafeAreaView>
);

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1a1a2e',
          borderBottomWidth: 1,
          borderBottomColor: '#0f3460',
        },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#16213e',
          borderTopWidth: 1,
          borderTopColor: '#0f3460',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{tabBarLabel: '首页', title: '足球经理'}}
      />
      <Tab.Screen 
        name="Squad" 
        component={SquadScreen}
        options={{tabBarLabel: '阵容'}}
      />
      <Tab.Screen 
        name="Market" 
        component={MarketScreen}
        options={{tabBarLabel: '市场'}}
      />
      <Tab.Screen 
        name="Match" 
        component={MatchCenterScreen}
        options={{tabBarLabel: '比赛'}}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{tabBarLabel: '我的'}}
      />
    </Tab.Navigator>
  );
};
