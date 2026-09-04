import { Navigate } from 'react-router-dom';
import FuseUtils from '@fuse/utils';
import settingsConfig from 'app/configs/settingsConfig';
import RootRedirect from 'app/main/RootRedirect';
import Error404Page from 'src/app/main/error/Error404Page';
import NotificationsConfig from 'app/main/notifications/NotificationsConfig';
import LoginConfig from 'app/main/login/LoginConfig';
import ForgotPasswordConfig from 'app/main/forgot-password/ForgotPasswordConfig';
import OtpVerificationConfig from 'app/main/otp-verification/OtpVerificationConfig';
import ResetPasswordConfig from 'app/main/reset-password/ResetPasswordConfig';
import ProfileConfig from 'app/main/profile/ProfileConfig';
import UsersConfig from 'app/main/users/UsersConfig';
import LibraryCardsConfig from 'app/main/libraryCards/LibraryCardsConfig';
import DecksConfig from 'app/main/decks/DecksConfig';
import PackagesConfig from 'app/main/packages/PackagesConfig';
import StatisticsConfig from 'app/main/statistics/StatisticsConfig';
// import dashboardConfigs from 'app/main/dashboard/dashboardConfigs';

const routeConfigs = [
  LoginConfig,
  ForgotPasswordConfig,
  OtpVerificationConfig,
  ResetPasswordConfig,
  NotificationsConfig,
  ProfileConfig,
  UsersConfig,
  LibraryCardsConfig,
  DecksConfig,
  PackagesConfig,
  StatisticsConfig,
  // ...dashboardConfigs,
];

/**
 * The routes of the application.
 */
const routes = [
  ...FuseUtils.generateRoutesFromConfigs(routeConfigs, settingsConfig.defaultAuth),
  {
    path: '/',
    exact: true,
    element: <RootRedirect />,
  },
  {
    path: '404',
    element: <Error404Page />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
];

export default routes;
