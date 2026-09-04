import { systemRoles } from 'app/auth/authRoles';
import type { PartialDeep } from 'type-fest';
import type { AppLayoutConfigDefaultsType } from 'app/layout/AppLayoutConfig';

/**
 * The settingsConfig object is a configuration object for the Fuse application's settings.
 */
const settingsConfig = {
  layout: {
    config: {},
  },
  defaultAuth: systemRoles,
  loginRedirectUrl: '/',
};

export type FuseSettingsConfigType = {
  layout: {
    config?: PartialDeep<AppLayoutConfigDefaultsType>;
  };
  defaultAuth?: string[];
  loginRedirectUrl: string;
};

export default settingsConfig;
