import {
  PiBookOpenDuotone,
  PiChartLineUpDuotone,
  PiCirclesThreePlusDuotone,
  PiGlobeDuotone,
  PiLockDuotone,
  PiPlusCircleDuotone,
  PiUsersDuotone,
  PiStackDuotone,
} from 'react-icons/pi';
import type { JSX } from 'react';

export type NavigationIcons = Record<string, JSX.Element>;

const navigationIcon: NavigationIcons = {
  applicationsDecks: <PiStackDuotone />,
  applicationsStatistics: <PiChartLineUpDuotone />,
  applicationsPackages: <PiCirclesThreePlusDuotone />,
  applicationsLibraryCards: <PiBookOpenDuotone />,
  applicationsUsers: <PiUsersDuotone />,
  packagesGeneral: <PiGlobeDuotone />,
  decksPackages: <PiLockDuotone />,
  packagesDecks: <PiStackDuotone />,
  decksCreate: <PiPlusCircleDuotone />,
};

export default navigationIcon;
