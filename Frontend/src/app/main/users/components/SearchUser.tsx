import Input from '@fuse/ui/Input';
import createDebouncedFunction from '@fuse/hooks/createDebouncedFunction';
import { TbSearch } from 'react-icons/tb';
/* Types */
import type { ChangeEvent } from 'react';

type SearchUserProps = {
  onInputChange: (value: string) => void;
  className?: string;
};

const SearchUser = (props: SearchUserProps) => {
  const { onInputChange, className } = props;

  function handleDebounceFn(value: string) {
    onInputChange?.(value);
  }

  const debounceFn = createDebouncedFunction(handleDebounceFn, 500);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    debounceFn(e.target.value);
  };

  return (
    <Input
      className={className}
      placeholder="Buscar por nome, login ou email"
      suffix={<TbSearch className="text-lg" />}
      onChange={handleInputChange}
    />
  );
};

export default SearchUser;
