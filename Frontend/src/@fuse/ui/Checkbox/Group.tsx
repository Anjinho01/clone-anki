import { forwardRef, useState, useCallback, useMemo, useEffect } from 'react';
import classNames from '../utils/classNames';
import { CheckboxGroupContextProvider } from './context';
// import cloneDeep from 'lodash/cloneDeep';
// import remove from 'lodash/remove';
// import shallowEqual from '../utils/shallowEqual';
import type { CommonProps } from '../@types/common';
import type { CheckboxGroupValue, CheckboxValue } from './context';
import type { SyntheticEvent } from 'react';

export interface CheckboxGroupProps extends CommonProps {
  checkboxClass?: string;
  name?: string;
  onChange?: (value: CheckboxGroupValue, event: SyntheticEvent) => void;
  value?: CheckboxGroupValue;
  vertical?: boolean;
}

const Group = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    { children, className, checkboxClass, name, onChange, value: valueProp, vertical, ...rest },
    ref
  ) => {
    const [value, setValue] = useState<CheckboxGroupValue>(valueProp ?? []);

    const onCheckboxGroupChange = useCallback(
      (itemValue: CheckboxValue, itemChecked: boolean, event: SyntheticEvent) => {
        let nextValue: CheckboxGroupValue = [...value];

        if (itemChecked) {
          nextValue.push(itemValue);
        } else {
          nextValue = nextValue.filter((i) => i !== itemValue);
        }

        setValue(nextValue);
        onChange?.(nextValue, event);
      },
      [onChange, value]
    );

    useEffect(() => {
      if (valueProp !== undefined) {
        setValue(valueProp);
      }
    }, [valueProp]);

    const contextValue = useMemo(
      () => ({
        vertical,
        name,
        value,
        checkboxClass,
        onChange: onCheckboxGroupChange,
      }),
      [vertical, onCheckboxGroupChange, name, checkboxClass, value]
    );

    return (
      <CheckboxGroupContextProvider value={contextValue}>
        <div
          ref={ref}
          className={classNames('inline-flex gap-4', vertical ? 'flex-col' : '', className)}
          {...rest}
        >
          {children}
        </div>
      </CheckboxGroupContextProvider>
    );
  }
);

export default Group;
