import { useState, useImperativeHandle, forwardRef } from 'react';
import Drawer from '@fuse/ui/Drawer';
import NavToggle from './NavToggle';
import type { DrawerProps } from '@fuse/ui/Drawer';

export type ToggleDrawerRef = {
  handleCloseDrawer: () => void;
  handleOpenDrawer: () => void;
  toggle: () => void;
};

// Não inclua `ref` no tipo de props
type ToggleDrawerProps = Omit<DrawerProps, 'isOpen'> & {
  // você pode adicionar outras props próprias aqui se quiser
};

const ToggleDrawer = forwardRef<ToggleDrawerRef, ToggleDrawerProps>(
  ({ children, placement = 'left', ...rest }, ref) => {
    const [toggled, setToggled] = useState(false);

    const handleCloseDrawer = () => setToggled(false);
    const handleOpenDrawer = () => setToggled(true);
    const toggle = () => setToggled((t) => !t);

    useImperativeHandle(ref, () => ({ handleCloseDrawer, handleOpenDrawer, toggle }), []);

    return (
      <>
        <button
          className="close-button text-xl"
          type="button"
          onClick={toggle}
          aria-label={toggled ? 'Fechar menu' : 'Abrir menu'}
        >
          <NavToggle toggled={toggled} />
        </button>

        <Drawer
          isOpen={toggled}
          width={330}
          placement={placement}
          onClose={handleCloseDrawer}
          onRequestClose={handleCloseDrawer}
          {...rest}
        >
          {children}
        </Drawer>
      </>
    );
  }
);

export default ToggleDrawer;
