import Input from '@fuse/ui/Input';
import createDebouncedFunction from '@fuse/hooks/createDebouncedFunction';
import type { InputProps } from '@fuse/ui/Input';
import type { ChangeEvent, Ref } from 'react';

type DebouceInputProps = InputProps & {
  wait?: number;
  ref?: Ref<HTMLInputElement>;
};

const DebouceInput = (props: DebouceInputProps) => {
  const { wait = 500, ref, ...rest } = props;

  function handleDebounceFn(value: ChangeEvent<HTMLInputElement>) {
    props.onChange?.(value);
  }

  const debounceFn = createDebouncedFunction(handleDebounceFn, wait);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    debounceFn(e);
  };

  return <Input ref={ref} {...rest} onChange={handleInputChange} />;
};

export default DebouceInput;
