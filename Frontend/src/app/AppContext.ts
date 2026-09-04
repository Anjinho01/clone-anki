import { createContext } from 'react';
import type { RouteObject } from 'react-router';

export type AppContextType = {
  routes: RouteObject[];
};
const AppContext = createContext<AppContextType>({ routes: [] });

export default AppContext;
