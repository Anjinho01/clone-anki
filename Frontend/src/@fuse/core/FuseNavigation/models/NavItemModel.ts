import _ from '@lodash';
import type { PartialDeep } from 'type-fest';
import type { NavItemType } from '../types/NavItemType';

/**
 *  NavItemModel
 *  Constructs a navigation item based on NavItemType
 */
function NavItemModel(data?: PartialDeep<NavItemType>) {
  data = data || {};

  return _.defaults(data, {
    id: _.uniqueId(),
    path: '',
    title: '',
    description: '',
    icon: '',
    type: 'item',
    authority: null,
    subMenu: [],
  });
}

export default NavItemModel;
