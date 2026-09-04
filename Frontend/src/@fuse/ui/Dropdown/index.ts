import _Dropdown from './Dropdown';
import DropdownItem from './DropdownItem';
import DropdownSub from './DropdownSub';

export type { DropdownProps, DropdownRef } from './Dropdown';
export type { DropdownItemProps } from './DropdownItem';
export type { DropdownSubProps as DropdownMenuProps } from './DropdownSub';

// Baseia no tipo real de _Dropdown (que já tem Item e Sub) e adiciona Menu como alias
type CompoundedComponent = typeof _Dropdown & {
  Menu: typeof DropdownSub;
};

const Dropdown = _Dropdown as CompoundedComponent;

// Garante as props estáticas (caso não tenham sido definidas em ./Dropdown)
Dropdown.Item = DropdownItem;
Dropdown.Sub = DropdownSub;
// Alias solicitado pela sua API: <Dropdown.Menu> === <Dropdown.Sub>
Dropdown.Menu = DropdownSub;

export { Dropdown };
export default Dropdown;
