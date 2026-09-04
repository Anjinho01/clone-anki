import { useEffect } from 'react';
/* Components */
import SearchUser from './components/SearchUser';
import FilterSidebar from './components/FilterSidebar';
/* Store */
import { useAppDispatch } from 'app/store';
import { setSearchText } from './store/usersSlice';

function UsersTools() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setSearchText(''));
  }, []);

  const handleInputChange = (value: string) => {
    dispatch(setSearchText(value));
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <SearchUser className="w-full md:max-w-xl" onInputChange={handleInputChange} />
      <FilterSidebar />
    </div>
  );
}

export default UsersTools;
