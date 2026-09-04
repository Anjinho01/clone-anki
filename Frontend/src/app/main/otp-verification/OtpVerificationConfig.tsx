import authRoles from '../../auth/authRoles';
import OtpVerificationApp from './OtpVerificationApp';

const OtpVerificationConfig = {
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
      path: '/otp-verification',
      element: <OtpVerificationApp />,
    },
  ],
};

export default OtpVerificationConfig;
