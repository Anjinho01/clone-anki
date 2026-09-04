import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from '@fuse/ui/utils/classNames';
import withHeaderItem from '@fuse/core/withHeaderItem';
import { convertNavigationToSearchQuery } from '@fuse/hooks';
import Button from '@fuse/ui/Button';
import Dialog from '@fuse/ui/Dialog';
import ScrollBar from '@fuse/ui/ScrollBar';
import navigationIcon from 'app/configs/navigation-icon.config';
import debounce from 'lodash/debounce';
import { HiOutlineSearch, HiChevronRight } from 'react-icons/hi';
import { PiMagnifyingGlassDuotone } from 'react-icons/pi';
import Highlighter from 'react-highlight-words';
/* Store */
import { useSelector } from 'react-redux';
import { selectNavigation } from 'app/store/fuse/navigationSlice';

type SearchData = {
  id: string;
  path: string;
  title: string;
  icon: string;
  category: string;
  categoryTitle: string;
};

type SearchResult = {
  title: string;
  data: SearchData[];
};

const recommendedSearch: SearchResult[] = [];

function wildCardSearch<T extends Record<string, string | number>>(
  list: T[],
  input: string,
  specifyKey?: string
): T[] {
  const searchText = (item: T): boolean => {
    for (const key in item) {
      if (item[specifyKey ? specifyKey : key] == null) {
        continue;
      }
      if (
        item[specifyKey ? specifyKey : key]
          .toString()
          .toUpperCase()
          .indexOf(input.toString().toUpperCase()) !== -1
      ) {
        return true;
      }
    }
    return false;
  };
  return list.filter((value) => searchText(value));
}

const ListItem = (props: {
  icon: string;
  label: string;
  url: string;
  isLast?: boolean;
  keyWord: string;
  onNavigate: () => void;
}) => {
  const { icon, label, url = '', keyWord, onNavigate } = props;

  return (
    <Link to={url} onClick={onNavigate}>
      <div
        className={classNames(
          'user-select flex cursor-pointer items-center justify-between rounded-xl p-3',
          'hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={classNames(
              'flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-200 bg-white text-xl text-gray-900 shadow-xs group-hover:shadow-sm dark:bg-gray-700 dark:text-gray-100'
            )}
          >
            {icon && navigationIcon[icon]}
          </div>
          <div className="text-gray-900 dark:text-gray-300">
            <Highlighter
              autoEscape
              highlightClassName={classNames(
                'text-primary',
                'underline bg-transparent font-semibold dark:text-white'
              )}
              searchWords={[keyWord]}
              textToHighlight={label}
            />
          </div>
        </div>
        <HiChevronRight className="text-lg" />
      </div>
    </Link>
  );
};

const _Search = ({ className }: { className?: string }) => {
  const navigation = useSelector(selectNavigation);
  const searchQueryPoolData = convertNavigationToSearchQuery(navigation);

  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult[]>(recommendedSearch);
  const [noResult, setNoResult] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setNoResult(false);
    setSearchResult(recommendedSearch);
  };

  const handleSearchOpen = () => {
    setSearchDialogOpen(true);
  };

  const handleSearchClose = () => {
    setSearchDialogOpen(false);
    handleReset();
  };

  const debounceFn = debounce(handleDebounceFn, 200);

  async function handleDebounceFn(query: string) {
    if (!query) {
      setSearchResult(recommendedSearch);
      return;
    }

    if (noResult) setNoResult(false);

    const result = wildCardSearch(searchQueryPoolData, query, 'title');

    const categories: string[] = [];

    result.forEach((elm) => {
      const categoryStr = String(elm.categoryTitle);
      if (!categories.includes(categoryStr)) {
        categories.push(categoryStr);
      }
    });

    const data = categories.map((category) => {
      return {
        title: category,
        data: result
          .filter((elm) => elm.categoryTitle === category)
          .filter((_, index) => index < 5),
      };
    });

    if (data) {
      if (data.length === 0) {
        setNoResult(true);
      }
      setSearchResult(data);
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debounceFn(e.target.value);
  };

  useEffect(() => {
    if (searchDialogOpen) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 100);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [searchDialogOpen]);

  const handleNavigate = () => {
    handleSearchClose();
  };

  return (
    <>
      <div className={classNames(className, 'text-2xl')} onClick={handleSearchOpen}>
        <PiMagnifyingGlassDuotone />
      </div>
      <Dialog
        contentClassName="!p-0"
        isOpen={searchDialogOpen}
        closable={false}
        onRequestClose={handleSearchClose}
      >
        <div>
          <div className="flex items-center justify-between border-b border-gray-200 px-4 dark:border-gray-600">
            <div className="flex items-center">
              <HiOutlineSearch className="text-xl" />
              <input
                ref={inputRef}
                className="block w-full bg-transparent p-4 text-base text-gray-900 ring-0 outline-hidden dark:text-gray-100"
                placeholder="Search..."
                onChange={handleSearch}
              />
            </div>
            <Button size="xs" onClick={handleSearchClose}>
              Esc
            </Button>
          </div>
          <div className="px-5 py-6">
            <ScrollBar className="max-h-[350px] overflow-y-auto">
              {searchResult.map((result) => (
                <div key={result.title} className="mb-4">
                  <h6 className="mb-3">{result.title}</h6>
                  {result.data.map((data, index) => (
                    <ListItem
                      key={data.title + index}
                      icon={data.icon}
                      label={data.title}
                      url={data.path}
                      keyWord={inputRef.current?.value || ''}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              ))}
              {searchResult.length === 0 && noResult && (
                <div className="my-10 text-center text-lg">
                  <span>Nenhum resultado para </span>
                  <span className="heading-text">
                    {`'`}
                    {inputRef.current?.value}
                    {`'`}
                  </span>
                </div>
              )}
            </ScrollBar>
          </div>
        </div>
      </Dialog>
    </>
  );
};

const Search = withHeaderItem(_Search);

export default Search;
