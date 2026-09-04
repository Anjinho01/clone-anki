import { forwardRef, type HTMLProps } from 'react';
import DropdownMenu from './DropdownMenu';
import { FloatingTree, useFloatingParentNodeId } from '@floating-ui/react';
import type { DropdownMenuProps, DropdownMenuRef } from './DropdownMenu';

export interface DropdownSubProps extends Omit<
  DropdownMenuProps,
  'trigger' | 'disabled' | 'activeKey'
> {
  eventKey?: string;
  id?: string;
}

const DropdownSub = forwardRef<
  DropdownMenuRef,
  DropdownSubProps & Omit<HTMLProps<HTMLElement>, 'ref'>
>((props, ref) => {
  const parentId = useFloatingParentNodeId();

  const content = <DropdownMenu {...props} ref={ref} />;

  if (parentId === null) {
    return <FloatingTree>{content}</FloatingTree>;
  }

  return content;
});

DropdownSub.displayName = 'DropdownSub';
export default DropdownSub;
