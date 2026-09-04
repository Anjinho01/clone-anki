import ConfigProvider from '@fuse/ui/ConfigProvider';
import useDarkMode from '@fuse/hooks/useDarkMode';
import type { CommonProps } from '@fuse/@types/common';
import themeConfig from 'app/configs/themeConfig';

const FuseTheme = (props: CommonProps) => {
  useDarkMode();

  return (
    <ConfigProvider
      value={{
        locale: 'pt',
        ...themeConfig,
      }}
    >
      {props.children}
    </ConfigProvider>
  );
};

export default FuseTheme;
