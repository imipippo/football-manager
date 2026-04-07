import React, {useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {useAuth} from '../hooks';

import {AuthNavigator} from './AuthNavigator';
import {MainNavigator} from './MainNavigator';

export const RootNavigator: React.FC = () => {
  const {isAuthenticated, loading, loadUser} = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
};
