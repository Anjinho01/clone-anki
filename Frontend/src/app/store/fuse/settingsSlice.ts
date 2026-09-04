import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import _ from '@lodash';
import type { FuseSettingsConfigType } from '../../configs/settingsConfig';
import AppLayoutConfig from 'app/layout/AppLayoutConfig';
/* Types */
import type { PartialDeep } from 'type-fest';
import type { AppRootStateType } from 'app/store/types';

// Tipos das configuraurações
export type LayoutConfigType = {
  navbar: { display: boolean };
  toolbar: { display: boolean };
  footer: { display: boolean };
  rightSidePanel: { display: boolean };
};

export type FuseSettingsState = {
  defaults: FuseSettingsConfigType;
  current: FuseSettingsConfigType;
  routeId: string;
};

// Exemplo de configuração default para o layout
const defaultLayoutConfig: LayoutConfigType = {
  navbar: { display: true },
  toolbar: { display: true },
  footer: { display: false },
  rightSidePanel: { display: false },
};

const initialSettings: FuseSettingsConfigType = {
  layout: {
    config: defaultLayoutConfig,
  },
  loginRedirectUrl: '/',
};

const initialState: FuseSettingsState = {
  defaults: initialSettings,
  current: initialSettings,
  routeId: '',
};

/**
 * Função que gera as configurações finais mesclando as configurações padrão (_defaultSettings)
 * com as novas configurações (_newSettings).
 */
export function generateSettings(
  _defaultSettings: PartialDeep<FuseSettingsConfigType>,
  _newSettings: PartialDeep<FuseSettingsConfigType>
): FuseSettingsConfigType {
  return _.merge(
    {},
    _defaultSettings,
    {
      layout: {
        config: AppLayoutConfig.defaults,
      },
    },
    _newSettings
  ) as FuseSettingsConfigType;
}

/**
 * The settings slice
 */
const settingsSlice = createSlice({
  name: 'fuse/settings',
  initialState,
  reducers: {
    setRouteId: (state, action) => {
      state.routeId = action.payload;
    },
    /**
     * O reducer setSettings usa a função generateSettings para mesclar as configurações
     * e atualizar o estado atual.
     */
    setSettings: (state, action: PayloadAction<FuseSettingsConfigType>) => {
      state.current = generateSettings(state.defaults, action.payload);
    },
    /**
     * Redefine o estado para os valores iniciais definidos no initialState.
     */
    setInitialSettings: () => _.merge({}, initialState),
    /**
     * Reseta as configurações atuais para as configurações padrão.
     */
    resetSettings: (state) => {
      state.current = _.merge({}, state.defaults);
    },
  },
});

export const { setRouteId, setSettings, setInitialSettings, resetSettings } = settingsSlice.actions;

export type SettingsSliceType = typeof settingsSlice;

export const selectFuseRouteId = (state: AppRootStateType) => state.fuse.settings.routeId;

export const selectFuseCurrentSettings = (state: AppRootStateType) => state.fuse.settings.current;

export const selectFuseCurrentLayoutConfig = (state: AppRootStateType) =>
  state.fuse.settings.current.layout.config;

export const selectFuseDefaultSettings = (state: AppRootStateType) => state.fuse.settings.defaults;

export default settingsSlice.reducer;
