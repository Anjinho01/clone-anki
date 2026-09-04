import { combineReducers } from '@reduxjs/toolkit';
import date from './dateSlice';
import surgeriesStatus from './surgeriesStatusSlice';
import surgeriesSuspension from './surgeriesSuspensionSlice';
import firstSurgeryDay from './firstSurgeryDaySlice';
import patientDestination from './patientDestinationSlice';

/**
 * The Overview App reducer.
 */
const reducer = combineReducers({
  date,
  surgeriesStatus,
  surgeriesSuspension,
  firstSurgeryDay,
  patientDestination,
});

export default reducer;
