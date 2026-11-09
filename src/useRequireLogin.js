import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useApp } from './store';

/**
 * Guests can browse freely; actions that create an order call this first.
 * Returns true when signed in, otherwise opens Login (which returns here afterwards) and returns false.
 */
export function useRequireLogin() {
  const { user } = useApp();
  const navigation = useNavigation();
  return useCallback((reason) => {
    if (user) return true;
    navigation.navigate('Login', { reason });
    return false;
  }, [user, navigation]);
}
