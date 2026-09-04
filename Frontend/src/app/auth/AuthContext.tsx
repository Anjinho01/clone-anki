import * as React from 'react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
/* Store */
import { useAppDispatch } from 'app/store';
import { logoutUser, setUser } from 'app/store/user/userSlice';
import type { RawApiUser } from 'app/store/user';
import { resetAll as resetNotifications } from 'app/store/notifications/notificationsSlice';
/* Services/UX */
import apiService from './services/apiService';
import FuseSplashScreen from '@fuse/core/FuseSplashScreen';
import { notify } from 'app/services/notificationService';

const AuthContext = React.createContext({});

type AuthProviderProps = { children: ReactNode };

function AuthProvider(props: AuthProviderProps) {
  const { children } = props;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [waitAuthCheck, setWaitAuthCheck] = useState(true);
  const dispatch = useAppDispatch();
  const val = useMemo(() => ({ isAuthenticated }), [isAuthenticated]);
  const initCompleteRef = useRef(false);

  useEffect(() => {
    const handleAutoLogin = (...args: unknown[]) => {
      const user = args[0] as RawApiUser;
      success(user, 'Acessando');
    };

    const handleLogin = (...args: unknown[]) => {
      const user = args[0] as RawApiUser;
      success(user, 'Conectado');
    };

    const handleLogout = () => {
      pass('Desconectado');
      dispatch(logoutUser()); // deckNavListener reage a userLoggedOut automaticamente
      dispatch(resetNotifications());
    };

    const handleAutoLogout = (...args: unknown[]) => {
      const message = (args[0] as string | undefined) ?? 'Sessão expirada';
      pass(message);
      dispatch(logoutUser()); // deckNavListener reage a userLoggedOut automaticamente
      dispatch(resetNotifications());
    };

    const handleNoAccessToken = () => {
      pass();
      // opcional: garante limpeza se app iniciar sem token
      dispatch(resetNotifications());
    };

    function handleSessionExpired() {
      if (!initCompleteRef.current) return;

      pass('Sessão expirada');
      dispatch(logoutUser());
      dispatch(resetNotifications());
    }

    apiService.on('onAutoLogin', handleAutoLogin);
    apiService.on('onLogin', handleLogin);
    apiService.on('onLogout', handleLogout);
    apiService.on('onAutoLogout', handleAutoLogout);
    apiService.on('onNoAccessToken', handleNoAccessToken);
    window.addEventListener('auth:session-expired', handleSessionExpired);

    apiService.init();

    function success(user: RawApiUser, message: string) {
      // setUser.fulfilled dispara o deckNavListener automaticamente
      Promise.all([dispatch(setUser(user))]).then(() => {
        if (message) notify(message);
        initCompleteRef.current = true;
        setWaitAuthCheck(false);
        setIsAuthenticated(true);
      });
    }

    function pass(message?: string) {
      if (message) notify(message);
      initCompleteRef.current = true;
      setWaitAuthCheck(false);
      setIsAuthenticated(false);
    }

    return () => {
      apiService.removeListener('onAutoLogin', handleAutoLogin);
      apiService.removeListener('onLogin', handleLogin);
      apiService.removeListener('onLogout', handleLogout);
      apiService.removeListener('onAutoLogout', handleAutoLogout);
      apiService.removeListener('onNoAccessToken', handleNoAccessToken);
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [dispatch]);

  return waitAuthCheck ? (
    <FuseSplashScreen />
  ) : (
    <AuthContext.Provider value={val}>{children}</AuthContext.Provider>
  );
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
}

export { useAuth, AuthProvider };
