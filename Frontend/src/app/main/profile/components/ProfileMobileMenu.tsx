import { useRef } from 'react';
import ToggleDrawer from '@fuse/shared/ToggleDrawer';
import ProfileMenu from './ProfileMenu';
/* Types */
import type { ToggleDrawerRef } from '@fuse/shared/ToggleDrawer';

const SettingMobileMenu = () => {
  const drawerRef = useRef<ToggleDrawerRef>(null);

  return (
    <>
      <div>
        <ToggleDrawer ref={drawerRef} title="Configurações da conta">
          <ProfileMenu
            onChange={() => {
              drawerRef.current?.handleCloseDrawer();
            }}
          />
        </ToggleDrawer>
      </div>
    </>
  );
};

export default SettingMobileMenu;
