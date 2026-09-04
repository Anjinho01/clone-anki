import type { ReactNode, ComponentType } from 'react';
import React from 'react';
import type { NumberFormatValues, SourceInfo } from 'react-number-format';
import { PatternFormat } from 'react-number-format';
import type { InputProps as FuseInputProps } from '@fuse/ui/Input';
import Input from '@fuse/ui/Input';

interface CpfCustomInputProps extends FuseInputProps {
  inputPrefix?: ReactNode;
  inputSuffix?: ReactNode;
  pattern?: string;
}

const CpfCustomInput: React.FC<CpfCustomInputProps> = ({
  pattern: _pattern,
  inputPrefix,
  inputSuffix,
  ...inputProps
}) => <Input {...inputProps} type="text" prefix={inputPrefix} suffix={inputSuffix} />;

interface CpfInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  inputPrefix?: ReactNode;
  inputSuffix?: ReactNode;
}

const CpfInput: React.FC<CpfInputProps> = ({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  disabled,
  inputPrefix,
  inputSuffix,
}) => (
  <PatternFormat
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customInput={CpfCustomInput as ComponentType<any>}
    pattern="###.###.###-##"
    format="###.###.###-##"
    mask="_"
    allowEmptyFormatting
    value={value}
    name={name}
    placeholder={placeholder}
    disabled={disabled}
    onBlur={onBlur}
    onValueChange={(values: NumberFormatValues, _info: SourceInfo) => {
      onChange?.(values.formattedValue);
    }}
    inputPrefix={inputPrefix}
    inputSuffix={inputSuffix}
  />
);

export default CpfInput;
