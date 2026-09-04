import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
/* Types */
import type { AppRootStateType } from 'app/store/types';

dayjs.extend(utc);
dayjs.extend(timezone);

// Definir fuso horário fixo para São Paulo
const tz = 'America/Sao_Paulo';

// Datas padrão (hoje com horário inicial no fuso correto)
const today = dayjs().tz(tz).format('YYYY-MM-DD');
const initialStart = dayjs(`${today}T00:00:00`).tz(tz).format('YYYY-MM-DDTHH:mm:ssZ');

type SurgeriesStatusState = {
  date: string;
};

const initialState: SurgeriesStatusState = {
  date: initialStart,
};

/**
 * Slice: estado do status de cirurgias
 */
export const dateSlice = createSlice({
  name: 'overviewApp/date',
  initialState,
  reducers: {
    setDate: (state, action: PayloadAction<string>) => {
      state.date = dayjs(action.payload).tz(tz).format('YYYY-MM-DDTHH:mm:ssZ');
    },
  },
});

/**
 * Actions
 */
export const { setDate } = dateSlice.actions;

/**
 * Selectors
 */
export const selectDate = (state: AppRootStateType) => state.overviewApp.date.date;

export default dateSlice.reducer;
