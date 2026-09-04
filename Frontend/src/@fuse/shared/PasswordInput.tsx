import type { MouseEvent } from 'react';
import { useState, forwardRef } from 'react';
import type { InputProps } from '@fuse/ui/Input';
import { Input } from '@fuse/ui/Input';
import { HiOutlineEyeOff, HiOutlineEye } from 'react-icons/hi';

interface PasswordInputProps extends InputProps {
  onVisibleChange?: (visible: boolean) => void;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const { onVisibleChange, ...rest } = props;
  const [pwInputType, setPwInputType] = useState('password');

  const onPasswordVisibleClick = (e: MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const nextValue = pwInputType === 'password' ? 'text' : 'password';
    setPwInputType(nextValue);
    onVisibleChange?.(nextValue === 'text');
  };

  return (
    <Input
      {...rest}
      ref={ref}
      type={pwInputType}
      suffix={
        <span
          className="cursor-pointer text-xl select-none"
          role="button"
          onClick={onPasswordVisibleClick}
        >
          {pwInputType === 'password' ? <HiOutlineEyeOff /> : <HiOutlineEye />}
        </span>
      }
    />
  );
});

export default PasswordInput;
