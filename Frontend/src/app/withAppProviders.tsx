import React, { useMemo } from 'react';
import { Provider } from 'react-redux';
import routes from 'app/configs/routesConfig';
import store from './store';
import AppContext from './AppContext';

type ComponentProps = {
  name?: string;
};

function withAppProviders(Component: React.ComponentType<ComponentProps>) {
  /**
   * The component that wraps the provided component with the necessary context providers.
   */
  function WithAppProviders(props: React.PropsWithChildren<ComponentProps>) {
    /**
     * The value to pass to the AppContext provider.
     */
    const val = useMemo(
      () => ({
        routes,
      }),
      [routes]
    );

    return (
      <AppContext.Provider value={val}>
        <Provider store={store}>
          <Component {...props} />
        </Provider>
      </AppContext.Provider>
    );
  }

  return WithAppProviders;
}

export default withAppProviders;
