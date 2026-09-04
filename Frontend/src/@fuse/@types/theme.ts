export type Direction = 'ltr' | 'rtl';
export type Mode = 'light' | 'dark';
export type ControlSize = 'lg' | 'md' | 'sm';

export type Theme = {
  themeSchema: string;
  direction: Direction;
  mode: Mode;
  panelExpand: boolean;
};
