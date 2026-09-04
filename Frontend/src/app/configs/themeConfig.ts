import type { Direction, Mode, ControlSize } from '@fuse/@types/theme';

export type Variables = 'primary' | 'primaryDeep' | 'primaryMild' | 'primarySubtle' | 'neutral';

export type ThemeVariables = Record<'light' | 'dark', Record<Variables, string>>;

export const themeVariables: ThemeVariables = {
  light: {
    primary: '#2a85ff',
    primaryDeep: '#0069f6',
    primaryMild: '#4996ff',
    primarySubtle: '#2a85ff1a',
    neutral: '#ffffff',
  },
  dark: {
    primary: '#2a85ff',
    primaryDeep: '#0069f6',
    primaryMild: '#4996ff',
    primarySubtle: '#2a85ff1a',
    neutral: '#ffffff',
  },
};

export type ThemeConfig = {
  themeSchema: string;
  direction: Direction;
  mode: Mode;
  panelExpand: boolean;
  controlSize: ControlSize;
};

const themeConfig: ThemeConfig = {
  mode: 'light',
  themeSchema: '',
  direction: 'ltr',
  panelExpand: false,
  controlSize: 'md',
};

export default themeConfig;
