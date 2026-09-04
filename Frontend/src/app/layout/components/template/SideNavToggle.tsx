import withHeaderItem from '@fuse/core/withHeaderItem';
import useResponsive from '@fuse/hooks/useResponsive';
import NavToggle from '../shared/NavToggle';
import type { CommonProps } from '@fuse/@types/common';
/* Store */
import { useDispatch, useSelector } from 'react-redux';
import { navbarToggle, selectFuseNavbar } from 'app/store/fuse/navbarSlice';

const _SideNavToggle = ({ className }: CommonProps) => {
  const dispatch = useDispatch();
  const stateNavbar = useSelector(selectFuseNavbar);
  const { open } = stateNavbar;

  const { larger } = useResponsive();

  return (
    <>
      {larger.md && (
        <div className={className} role="button" onClick={() => dispatch(navbarToggle())}>
          <NavToggle className="text-2xl" toggled={open} />
        </div>
      )}
    </>
  );
};

const SideNavToggle = withHeaderItem(_SideNavToggle);

export default SideNavToggle;
