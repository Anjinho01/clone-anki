import authRoles from '../../auth/authRoles';
import ForgotPasswordApp from './ForgotPasswordApp';

const ForgotPasswordConfig = {
  settings: {
    layout: {
      config: {
        navbar: {
          display: false,
        },
        toolbar: {
          display: false,
        },
        footer: {
          display: false,
        },
        rightSidePanel: {
          display: false,
        },
      },
    },
  },
  auth: authRoles.onlyGuest,
  routes: [
    {
      path: '/forgot-password',
      element: <ForgotPasswordApp />,
    },
  ],
};

export default ForgotPasswordConfig;
