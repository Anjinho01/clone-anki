/**
 * The AppLayout Config object.
 */
const AppLayoutConfig = {
  defaults: {
    navbar: {
      display: true,
    },
    toolbar: {
      display: true,
    },
    footer: {
      display: false,
    },
    rightSidePanel: {
      display: true,
    },
  },
};

export type AppLayoutConfigDefaultsType = (typeof AppLayoutConfig)['defaults'];

export default AppLayoutConfig;
