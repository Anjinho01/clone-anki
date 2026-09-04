import { forwardRef, useContext, useCallback, useState } from 'react';
import classNames from 'classnames';
import CheckboxGroupContext from './context';
import type { CommonProps } from '../@types/common';
import type { CheckboxValue } from './context';
import type { ChangeEvent, Ref } from 'react';

export interface CheckboxProps extends CommonProps {
  checked?: boolean;
  checkboxClass?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  labelRef?: Ref<HTMLLabelElement>;
  name?: string;
  onChange?: (checked: boolean, e: ChangeEvent<HTMLInputElement>) => void;
  value?: CheckboxValue;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const {
    checked: controlledChecked,
    className,
    checkboxClass,
    onChange,
    children,
    disabled,
    readOnly,
    name: nameProp,
    defaultChecked,
    value,
    labelRef,
    ...rest
  } = props;

  const {
    name: nameContext,
    value: groupValue,
    onChange: onGroupChange,
    checkboxClass: checkboxClassContext,
  } = useContext(CheckboxGroupContext);

  const name = nameProp ?? nameContext;

  const isChecked = useCallback(() => {
    if (typeof groupValue !== 'undefined' && typeof value !== 'undefined') {
      return groupValue.some((i) => i === value);
    }
    return controlledChecked || defaultChecked;
  }, [controlledChecked, groupValue, value, defaultChecked]);

  const [checkboxChecked, setCheckboxChecked] = useState(isChecked());

  const getControlProps = () => {
    const checkedValue = checkboxChecked;

    let groupChecked = { checked: checkedValue };
    const singleChecked: {
      defaultChecked?: boolean;
      checked?: boolean;
    } = {};

    if (typeof controlledChecked !== 'undefined') {
      singleChecked.checked = controlledChecked;
    }

    if (typeof groupValue !== 'undefined') {
      groupChecked = { checked: groupValue.includes(value as never) };
    }

    if (defaultChecked) {
      singleChecked.defaultChecked = defaultChecked;
    }
    return typeof groupValue !== 'undefined' ? groupChecked : singleChecked;
  };

  const controlProps = getControlProps();

  const onCheckboxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      let nextChecked = !checkboxChecked;

      if (typeof groupValue !== 'undefined') {
        nextChecked = !groupValue.includes(value as never);
      }

      if (disabled || readOnly) {
        return;
      }

      setCheckboxChecked(nextChecked);
      onChange?.(nextChecked, e);
      onGroupChange?.(value as CheckboxValue, nextChecked, e);
    },
    [
      checkboxChecked,
      disabled,
      readOnly,
      setCheckboxChecked,
      onChange,
      value,
      onGroupChange,
      groupValue,
    ]
  );

  const checkboxColor = checkboxClass || checkboxClassContext || `text-primary`;

  const checkboxDefaultClass = `checkbox peer ${checkboxColor}`;
  const checkboxColorClass = disabled && 'disabled';
  const labelDefaultClass = `checkbox-label`;
  const labelDisabledClass = disabled && 'disabled';

  const labelClass = classNames(labelDefaultClass, labelDisabledClass, className);

  return (
    <label ref={labelRef} className={labelClass}>
      <span className="checkbox-wrapper relative h-5">
        <input
          ref={ref}
          className={classNames(checkboxDefaultClass, checkboxColorClass)}
          type="checkbox"
          disabled={disabled}
          readOnly={readOnly}
          name={name}
          onChange={onCheckboxChange}
          {...controlProps}
          {...rest}
        />
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-neutral fill-neutral pointer-events-none absolute top-2/4 left-2/4 mt-[1.25px] h-3.5 w-3.5 -translate-x-2/4 -translate-y-2/4 opacity-0 transition-opacity peer-checked:opacity-100"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </>
      </span>
      {children ? (
        <span className={classNames(disabled ? 'opacity-50' : '')}>{children}</span>
      ) : null}
    </label>
  );
});

export default Checkbox;
