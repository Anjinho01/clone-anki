import { useEffect } from 'react';
/* Components */
import Spinner from '@spark/ui/Spinner';
/* Widgets */
import Clock from './components/Clock';
import OperatingRoom from './widgets/OperatingRoom';
import OnHold from './widgets/OnHold';
import SurgeriesCompleted from './widgets/SurgeriesCompleted';
import ScheduledCurgeries from './widgets/ScheduledCurgeries';
import SurgeriesSuspended from './widgets/SurgeriesSuspended';
import ReasonsForSuspension from './widgets/ReasonsForSuspension';
import FirstSurgeryDay from './widgets/FirstSurgeryDay';
import PatientDestination from './widgets/PatientDestination';
/* Store */
import { useAppDispatch, useAppSelector } from 'app/store';
import { selectDate } from './store/dateSlice';
import {
  getSurgeriesStatus,
  selectSurgeriesStatusLoading,
  setLoadingSurgeriesStatus,
} from './store/surgeriesStatusSlice';
import {
  getSurgeriesSuspension,
  selectSurgeriesSuspensionLoading,
  setLoadingSurgeriesSuspension,
} from './store/surgeriesSuspensionSlice';
import {
  getFirstSurgeryDay,
  selectFirstSurgeryDayLoading,
  setLoadingFirstSurgeryDay,
} from './store/firstSurgeryDaySlice';
import {
  getPatientDestination,
  selectPatientDestinationLoading,
  setLoadingPatientDestination,
} from './store/patientDestinationSlice';

function OverviewApp() {
  const dispatch = useAppDispatch();
  const isLoadingStatus = useAppSelector(selectSurgeriesStatusLoading);
  const isLoadingSuspension = useAppSelector(selectSurgeriesSuspensionLoading);
  const isLoadingFist = useAppSelector(selectFirstSurgeryDayLoading);
  const isLoadingDestination = useAppSelector(selectPatientDestinationLoading);
  const date = useAppSelector(selectDate);

  useEffect(() => {
    // Função para carregar os dados
    const fetchData = () => {
      dispatch(getSurgeriesStatus({ date })).then(() => {
        dispatch(setLoadingSurgeriesStatus(false));
      });
      dispatch(getSurgeriesSuspension({ date })).then(() => {
        dispatch(setLoadingSurgeriesSuspension(false));
      });
      dispatch(getFirstSurgeryDay({ date })).then(() => {
        dispatch(setLoadingFirstSurgeryDay(false));
      });
      dispatch(getPatientDestination({ date })).then(() => {
        dispatch(setLoadingPatientDestination(false));
      });
    };

    // Executa imediatamente na primeira vez
    fetchData();

    // Intervalo de 30 segundos
    const intervalId = setInterval(fetchData, 30000);

    // Cleanup para evitar múltiplos intervalos
    return () => clearInterval(intervalId);
  }, [date, dispatch]);

  if (isLoadingStatus || isLoadingSuspension || isLoadingFist || isLoadingDestination) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 bg-white px-12 py-24 dark:bg-gray-800">
      <div className="mb-2 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h4 className="mb-4">Visão Geral</h4>
          <Clock timeZone="America/Sao_Paulo" showSeconds={false} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6 md:col-span-6 xl:col-span-3">
          <OperatingRoom />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-6 xl:col-span-3">
          <OnHold />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-6 xl:col-span-3">
          <SurgeriesCompleted />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-6 xl:col-span-3">
          <ScheduledCurgeries />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6 xl:col-span-6">
          <SurgeriesSuspended />
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-6">
          <ReasonsForSuspension />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6 xl:col-span-6">
          <FirstSurgeryDay />
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-6">
          <PatientDestination />
        </div>
      </div>
    </div>
  );
}

export default OverviewApp;
