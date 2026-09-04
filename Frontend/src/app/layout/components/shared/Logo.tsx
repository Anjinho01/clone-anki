import classNames from 'classnames';
import type { CommonProps } from '@fuse/@types/common';

interface LogoProps extends CommonProps {
  type?: 'full' | 'streamline';
  mode?: 'light' | 'dark';
  imgClass?: string;
  logoWidth?: number | string;
}

const LOGO_SRC_PATH = '/assets/images';

const Logo = (props: LogoProps) => {
  const { type = 'full', mode = 'light', className, imgClass, style, logoWidth = 'auto' } = props;

  return (
    <div
      className={classNames('logo', className)}
      style={{
        ...style,
        ...{ width: logoWidth },
      }}
    >
      <img
        className={imgClass}
        src={`${LOGO_SRC_PATH}/logo/logo-${mode}-${type}.png`}
        alt="Kaizen Logo"
      />
    </div>
  );
};

export default Logo;
