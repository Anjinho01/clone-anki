import type { NavItemType } from '@fuse/core/FuseNavigation/types/NavItemType';

export type SearchData = {
  id: string;
  path: string;
  title: string;
  icon: string;
  category: string;
  categoryTitle: string;
};

function convertNavigationToSearchQuery(navigation: NavItemType[]): SearchData[] {
  const result: SearchData[] = [];

  const traverse = (items: NavItemType[], currentCategory: string = '') => {
    items.forEach((item) => {
      if (item.type === 'title') {
        // Atualiza a categoria para os itens do submenu
        const newCategory = item.title || currentCategory;
        if (item.subMenu && item.subMenu.length > 0) {
          traverse(item.subMenu, newCategory);
        }
      } else if (item.type === 'item') {
        // Cria o novo objeto no formato desejado
        result.push({
          id: item.id,
          path: item.path,
          title: item.title || '',
          icon: item.icon || '',
          category: currentCategory,
          categoryTitle: currentCategory,
        });
        // Se o item possuir subMenu, também o percorre
        if (item.subMenu && item.subMenu.length > 0) {
          traverse(item.subMenu, currentCategory);
        }
      }
    });
  };

  traverse(navigation);
  return result;
}

export default convertNavigationToSearchQuery;
