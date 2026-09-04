import './timezone';
import BrowserRouter from '@fuse/core/BrowserRouter';
import withAppProviders from './withAppProviders';
import { AuthProvider } from './auth/AuthContext';
import FuseTheme from '@fuse/core/FuseTheme';
import FuseAuthorization from '@fuse/core/FuseAuthorization';
import FuseLayout from '@fuse/core/FuseLayout';
import AppLayout from './layout/AppLayout';
import settingsConfig from 'app/configs/settingsConfig';
/* Store */
import { useSelector } from 'react-redux';
import { selectUserRole } from 'app/store/user/userSlice';

function App() {
  /**
   * The user object from the Redux store.
   */
  const userRole = useSelector(selectUserRole);

  return (
    <FuseTheme>
      <AuthProvider>
        <BrowserRouter>
          <FuseAuthorization userRole={userRole} loginRedirectUrl={settingsConfig.loginRedirectUrl}>
            <FuseLayout layout={{ default: AppLayout }} />
          </FuseAuthorization>
        </BrowserRouter>
      </AuthProvider>
    </FuseTheme>
  );
}

export default withAppProviders(App);
