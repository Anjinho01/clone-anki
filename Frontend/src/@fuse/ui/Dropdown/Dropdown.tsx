// Dropdown.tsx
import React, { forwardRef, type PropsWithChildren, type HTMLProps } from 'react';
import { FloatingTree, useFloatingParentNodeId } from '@floating-ui/react';
import DropdownMenu, { type DropdownMenuProps, type DropdownMenuRef } from './DropdownMenu';
import DropdownItem from './DropdownItem';
import DropdownSub from './DropdownSub';

export type DropdownRef = DropdownMenuRef;

// Props do wrapper: as mesmas do DropdownMenu + atributos HTML do host,
// e AGORA envolvendo em PropsWithChildren para incluir `children`.
export type DropdownProps = PropsWithChildren<
  DropdownMenuProps & Omit<HTMLProps<HTMLElement>, 'ref'>
>;

// Definimos a assinatura do componente com propriedades estáticas (Item/Sub)
type DropdownComponent = React.ForwardRefExoticComponent<
  DropdownProps & React.RefAttributes<DropdownMenuRef>
> & {
  Item: typeof DropdownItem;
  Sub: typeof DropdownSub;
};

const Dropdown = forwardRef<DropdownMenuRef, DropdownProps>((props, ref) => {
  const parentId = useFloatingParentNodeId();

  const content = <DropdownMenu {...props} ref={ref} />;

  if (parentId === null) {
    return <FloatingTree>{content}</FloatingTree>;
  }
  return content;
}) as DropdownComponent;

Dropdown.displayName = 'Dropdown';

// Propriedades estáticas para uso como <Dropdown.Item> e <Dropdown.Sub>
Dropdown.Item = DropdownItem;
Dropdown.Sub = DropdownSub;

export default Dropdown;
