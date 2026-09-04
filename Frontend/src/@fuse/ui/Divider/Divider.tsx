import classNames from '../utils/classNames';
import type { CommonProps } from '../@types/common';
import type { Ref, HTMLAttributes } from 'react';

export interface DividerProps extends CommonProps, HTMLAttributes<HTMLDivElement> {
  /** Custom thickness or color via className */
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

const Divider = (props: DividerProps) => {
  const { className, ref, ...rest } = props;

  // Default: full width, 1px top border, light/dark colors
  const baseClasses = 'w-full border-t border-gray-200 dark:border-gray-700';

  return <div ref={ref} className={classNames('divider', baseClasses, className)} {...rest} />;
};

export default Divider;
