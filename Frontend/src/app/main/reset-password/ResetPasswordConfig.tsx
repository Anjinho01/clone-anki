import authRoles from '../../auth/authRoles';
import ResetPasswordApp from './ResetPasswordApp';

const ResetPasswordConfig = {
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
      path: '/reset-password',
      element: <ResetPasswordApp />,
    },
  ],
};

export default ResetPasswordConfig;
