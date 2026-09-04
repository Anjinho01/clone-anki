import { useEffect, useState } from 'react';
import classNames from '@fuse/ui/utils/classNames';
import Button from '@fuse/ui/Button';
import Drawer from '@fuse/ui/Drawer';
import Badge from '@fuse/ui/Badge';
import Checkbox from '@fuse/ui/Checkbox';
import { components } from 'react-select';
import { Form, FormItem } from '@fuse/ui/Form';
import type { Option } from '@fuse/ui/Select';
import Select, { Option as DefaultOption } from '@fuse/ui/Select';
import { TbFilter } from 'react-icons/tb';
import type { ControlProps, OptionProps } from 'react-select';
/* Form */
import * as yup from 'yup';
import type { ObjectSchema } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
/* Store */
import { useAppDispatch } from 'app/store';
import { useSelector } from 'react-redux';
import { selectRoles } from '../store/rolesSlice';
import { selectFilters, setSearchFilter } from '../store/usersSlice';

export type FormSchema = {
  usersStatus: string;
  usersRoles: string[];
};

type Option = {
  value: string;
  label: string;
  className: string;
};

const { Control } = components;

const usersStatusOption: Option[] = [
  { value: 'all', label: 'Todos', className: 'bg-gray-400' },
  { value: 'actived', label: 'Ativados', className: 'bg-emerald-500' },
  { value: 'inactived', label: 'Desativados', className: 'bg-red-500' },
];

const CustomSelectOption = (props: OptionProps<Option>) => {
  return (
    <DefaultOption<Option>
      {...props}
      customLabel={(data, label) => (
        <span className="flex items-center gap-2">
          <Badge className={data.className} />
          <span className="ml-2 rtl:mr-2">{label}</span>
        </span>
      )}
    />
  );
};

const CustomControl = ({ children, ...props }: ControlProps<Option>) => {
  const selected = props.getValue()[0];
  return (
    <Control {...props}>
      {selected && <Badge className={classNames('ml-4', selected.className)} />}
      {children}
    </Control>
  );
};

/**
 * Form Validation Schema
 */
const schema: ObjectSchema<FormSchema> = yup
  .object({
    usersStatus: yup.string().required(),
    usersRoles: yup.array().of(yup.string().required()).required(),
  })
  .required();

const defaultValues = {
  usersStatus: 'all',
  usersRoles: [],
};

function FilterSidebar() {
  const dispatch = useAppDispatch();
  const filters = useSelector(selectFilters);
  const roles = useSelector(selectRoles);

  const [filterIsOpen, setFilterIsOpen] = useState(false);

  const { handleSubmit, control, getValues, reset } = useForm<FormSchema>({
    defaultValues,
    resolver: yupResolver<FormSchema>(schema),
  });

  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  function onSubmit() {
    const values = getValues();
    dispatch(setSearchFilter(values));
    setFilterIsOpen(false);
  }

  return (
    <>
      <Button icon={<TbFilter />} onClick={() => setFilterIsOpen(true)}>
        Filtro
      </Button>

      <Drawer
        title="Filtro"
        isOpen={filterIsOpen}
        onClose={() => setFilterIsOpen(false)}
        onRequestClose={() => setFilterIsOpen(false)}
        className="z-100"
      >
        <Form
          className="h-full"
          containerClassName="flex flex-col justify-between h-full"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            {/* Status */}
            <FormItem label="Por status">
              <Controller
                name="usersStatus"
                control={control}
                render={({ field }) => (
                  <Select<Option>
                    options={usersStatusOption}
                    {...field}
                    value={usersStatusOption.filter((option) => option.value === field.value)}
                    components={{
                      Option: CustomSelectOption,
                      Control: CustomControl,
                    }}
                    onChange={(option) => field.onChange(option?.value)}
                  />
                )}
              />
            </FormItem>
            {/* Função */}
            <FormItem label="Por Função">
              <div className="mt-4">
                <Controller
                  name="usersRoles"
                  control={control}
                  render={({ field }) => (
                    <Checkbox.Group vertical className="flex" {...field}>
                      {roles.map((type, index) => (
                        <Checkbox
                          key={`Roles-list-${index}.${type.roleId}`}
                          name={field.name}
                          value={`${type.roleId}`}
                          className="heading-text flex-row-reverse justify-between"
                        >
                          {type.role}
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  )}
                />
              </div>
            </FormItem>
          </div>

          <Button variant="solid" type="submit">
            Filtrar
          </Button>
        </Form>
      </Drawer>
    </>
  );
}

export default FilterSidebar;
