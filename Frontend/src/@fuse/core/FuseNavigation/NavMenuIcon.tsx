import navigationIcon from 'app/configs/navigation-icon.config';
import type { ElementType, ComponentPropsWithRef } from 'react';

type NavMenuIconProps = {
  icon: string;
  gutter?: string;
};

export const Icon = <T extends ElementType>({
  component,
  ...props
}: {
  header: T;
} & ComponentPropsWithRef<T>) => {
  const Component = component;
  return <Component {...props} />;
};

const NavMenuIcon = ({ icon }: NavMenuIconProps) => {
  if (typeof icon !== 'string' && !icon) {
    return <></>;
  }

  return (
    <>
      {navigationIcon[icon] && (
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-2xl leading-none">
          {navigationIcon[icon]}
        </span>
      )}
    </>
  );
};

export default NavMenuIcon;
