import cn from 'classnames';
import { twMerge } from 'tailwind-merge';

export default function classNames(...args: Parameters<typeof cn>) {
  return twMerge(cn(args));
}
