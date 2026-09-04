import classNames from 'classnames';
import { HiCheckCircle } from 'react-icons/hi';
import type { CommonProps } from '@fuse/@types/common';
import type { Ref } from 'react';

interface PresetSegmentItemOptionProps extends CommonProps {
  active: boolean;
  customCheck?: string | React.ReactNode;
  defaultGutter?: boolean;
  disabled?: boolean;
  hoverable?: boolean;
  onSegmentItemClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  ref?: Ref<HTMLDivElement>;
}

const PresetSegmentItemOption = (props: PresetSegmentItemOptionProps) => {
  const {
    active,
    children,
    className,
    customCheck,
    defaultGutter = true,
    disabled,
    hoverable,
    onSegmentItemClick,
    ref,
  } = props;

  return (
    <div
      ref={ref}
      className={classNames(
        'flex',
        !customCheck && 'justify-between',
        'items-center',
        'border',
        'rounded-md',
        'border-gray-200 dark:border-gray-600',
        defaultGutter && 'px-4 py-5',
        'cursor-pointer',
        'select-none',
        'w-100',
        active && `ring-primary border-primary ring-1`,
        hoverable && `hover:ring-primary hover:border-primary hover:ring-1`,
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={onSegmentItemClick}
    >
      {children}
      {active && !customCheck && <HiCheckCircle className="text-primary text-2xl" />}
      {active && customCheck}
    </div>
  );
};

export default PresetSegmentItemOption;
