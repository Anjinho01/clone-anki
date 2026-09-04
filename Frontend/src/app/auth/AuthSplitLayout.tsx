import type { ReactNode } from 'react';

type AuthFeature = {
  eyebrow: string;
  title: string;
  description: string;
};

type AuthSplitLayoutProps = {
  leftEyebrow: string;
  leftTitle: string;
  leftDescription: string;
  features: AuthFeature[];
  rightEyebrow: string;
  rightTitle: string;
  rightDescription: string;
  children: ReactNode;
};

function AuthSplitLayout(props: AuthSplitLayoutProps) {
  const {
    leftEyebrow,
    leftTitle,
    leftDescription,
    features,
    rightEyebrow,
    rightTitle,
    rightDescription,
    children,
  } = props;

  return (
    <div className="grid min-h-screen w-full bg-white lg:grid-cols-2 dark:bg-gray-900">
      <div className="relative hidden min-h-screen overflow-hidden lg:flex">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/assets/auth-side-bg.png"
          alt="Ilustração do Packages"
        />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(6,23,78,0.5)_0%,rgba(10,26,101,0.78)_48%,rgba(3,8,34,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.22),transparent_28%)]" />

        <div className="relative flex min-h-screen w-full flex-col justify-between px-14 py-12 xl:px-18 xl:py-16">
          <div className="max-w-xl rounded-[36px] border border-white/15 bg-white/8 p-8 text-white shadow-[0_32px_120px_rgba(2,6,23,0.45)] backdrop-blur-md">
            <p className="text-xs font-semibold tracking-[0.32em] text-sky-100 uppercase">
              {leftEyebrow}
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white xl:text-5xl">
              {leftTitle}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-blue-50/88 xl:text-lg">
              {leftDescription}
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.eyebrow}
                className="rounded-[28px] border border-white/12 bg-slate-950/20 p-5 text-white shadow-[0_18px_60px_rgba(2,6,23,0.35)] backdrop-blur-md"
              >
                <p className="text-xs font-semibold tracking-[0.28em] text-sky-100/80 uppercase">
                  {feature.eyebrow}
                </p>
                <p className="mt-3 text-lg font-semibold">{feature.title}</p>
                <p className="mt-2 text-sm leading-6 text-blue-50/78">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-[380px] xl:max-w-[450px]">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-[0.28em] text-sky-600 uppercase dark:text-sky-400">
              {rightEyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {rightTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
              {rightDescription}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthSplitLayout;
