/* eslint-disable */
// ⚡ Otimização: Import específico do lodash reduz bundle
import isEqual from 'lodash/isEqual';
import { useCallback, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

// Implementação nativa de setIn (substitui lodash mixin)
const setIn = <T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T => {
  const keys = path.split('.');
  const lastKey = keys.pop() as string;
  const target = keys.reduce((acc: Record<string, unknown>, key: string) => {
    if (!acc[key]) acc[key] = {};
    return acc[key] as Record<string, unknown>;
  }, obj as Record<string, unknown>);
  target[lastKey] = value;
  return obj;
};

type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

interface UseFormReturn<T> {
  form: T;
  handleChange: (event: ChangeEvent<FormElement>) => void;
  handleSubmit: (event?: FormEvent<HTMLFormElement>) => void;
  resetForm: () => void;
  setForm: (form: T | ((prevForm: T) => T)) => void;
  setInForm: (name: string, value: unknown) => void;
}

function useForm<T extends Record<string, unknown>>(
  initialState: T,
  onSubmit?: () => void,
): UseFormReturn<T> {
  const [form, setForm] = useState<T>(initialState);

  const handleChange = useCallback(
    (event: ChangeEvent<FormElement>) => {
      event.persist();
      setForm((_form: T) =>
        setIn(
          { ..._form },
          event.target.name,
          event.target.type === 'checkbox'
            ? (event.target as HTMLInputElement).checked
            : event.target.value,
        ),
      );
    },
    [],
  );

  const resetForm = useCallback(() => {
    if (!isEqual(initialState, form)) {
      setForm(initialState);
    }
  }, [form, initialState]);

  const setInForm = useCallback((name: string, value: unknown) => {
    setForm((_form: T) => setIn(_form, name, value));
  }, []);

  const handleSubmit = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }
      if (onSubmit) {
        onSubmit();
      }
    },
    [onSubmit],
  );

  return {
    form,
    handleChange,
    handleSubmit,
    resetForm,
    setForm,
    setInForm,
  };
}

export default useForm;
