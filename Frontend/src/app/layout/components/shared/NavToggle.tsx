import { HiOutlineMenuAlt2, HiOutlineMenu } from 'react-icons/hi';
import type { CommonProps } from '@fuse/@types/common';

export interface NavToggleProps extends CommonProps {
  toggled?: boolean;
}

const NavToggle = ({ toggled, className }: NavToggleProps) => {
  return <div className={className}>{toggled ? <HiOutlineMenuAlt2 /> : <HiOutlineMenu />}</div>;
};

export default NavToggle;
