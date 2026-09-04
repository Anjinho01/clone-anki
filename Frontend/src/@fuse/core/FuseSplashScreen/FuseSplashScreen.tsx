import { memo } from 'react';

/**
 * The FuseSplashScreen component is responsible for rendering a splash screen with a logo and a loading spinner.
 * It uses various MUI components to render the logo and spinner.
 * The component is memoized to prevent unnecessary re-renders.
 */
function FuseSplashScreen() {
  return (
    <div
      id="splash-screen"
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-50 text-slate-900"
    >
      <div className="logo">
        <img
          width="128"
          src="/assets/images/logo/logo-light-streamline.png"
          alt="Packages"
          className="h-auto w-[120px] max-w-[120px]"
        />
      </div>
      <div className="mt-10 flex w-14 items-center justify-between" aria-hidden="true">
        <div className="h-3 w-3 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.32s]" />
        <div className="h-3 w-3 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.16s]" />
        <div className="h-3 w-3 animate-bounce rounded-full bg-sky-500" />
      </div>
    </div>
  );
}

export default memo(FuseSplashScreen);
