// src/app/main/apps/decks/dialogs/EditDeckDialog.tsx
import { useEffect, useMemo, useState } from 'react';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import { Form, FormItem } from '@fuse/ui/Form';
import Button from '@fuse/ui/Button';
import Input from '@fuse/ui/Input';
import Select from '@fuse/ui/Select';
import { canManageStudyContent } from 'app/auth';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from 'app/store';
import type { RootState } from 'app/store';
import {
  selectEditDeckDialog,
  closeEditDeckDialog,
  updateDeck,
  selectDeckActionStatus,
} from '../store/deckSlice';
import { getPackages } from '../store/packageSlice';
import type { PackageGroupType } from '../types/DeckTypes';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type PackagesStateShape = {
  ids?: Array<number | string>;
  entities?: Record<number | string, PackageGroupType | undefined>;
  status?: RequestStatus;
};

type PackagesRootState = RootState & {
  decksApp?: {
    packages?: PackagesStateShape;
  };
};

type PackageOption = {
  value: number | null;
  label: string;
};

const schema = yup.object({
  name: yup.string().trim().required('Nome é obrigatório').max(200),
  description: yup.string().trim().max(1000).optional(),
  packageId: yup.number().nullable().default(null),
  newCardsPerDay: yup
    .number()
    .transform((v) => (isNaN(v) ? undefined : v))
    .min(0)
    .max(9999)
    .optional(),
  reviewCardsPerDay: yup
    .number()
    .transform((v) => (isNaN(v) ? undefined : v))
    .min(0)
    .max(9999)
    .optional(),
});

type FormValues = yup.InferType<typeof schema>;

export default function EditDeckDialog() {
  const dispatch = useAppDispatch();
  const dialog = useAppSelector(selectEditDeckDialog);
  const status = useAppSelector(selectDeckActionStatus);
  const canManage = useAppSelector((state) => canManageStudyContent(state.user.role));
  const packagesState = useAppSelector((state) => {
    return (state as PackagesRootState).decksApp?.packages;
  });
  const [submitting, setSubmitting] = useState(false);

  const isOpen = dialog?.props.isOpen ?? false;
  const deckData = dialog?.data;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      packageId: null,
      newCardsPerDay: 20,
      reviewCardsPerDay: 100,
    },
  });

  const packages = useMemo(() => {
    const ids = packagesState?.ids ?? [];
    const entities = packagesState?.entities ?? {};

    return ids.map((id) => entities[id]).filter((pkg): pkg is PackageGroupType => Boolean(pkg));
  }, [packagesState]);

  const packageOptions = useMemo<PackageOption[]>(() => {
    const options = packages
      .filter((pkg) => {
        return pkg.type === deckData?.type || pkg.id === deckData?.packageId;
      })
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((pkg) => ({
        value: pkg.id,
        label: pkg.name,
      }));

    return [{ value: null, label: 'Sem package' }, ...options];
  }, [deckData?.type, deckData?.packageId, packages]);

  useEffect(() => {
    if (isOpen && deckData) {
      reset({
        name: deckData.name ?? '',
        description: deckData.description ?? '',
        packageId: deckData.packageId ?? null,
        newCardsPerDay: deckData.newCardsPerDay ?? 20,
        reviewCardsPerDay: deckData.reviewCardsPerDay ?? 100,
      });
    }
  }, [isOpen, deckData, reset]);

  useEffect(() => {
    if (!isOpen || !canManage) {
      return;
    }

    const request = dispatch(getPackages());

    return () => {
      request.abort();
    };
  }, [canManage, dispatch, isOpen]);

  function onClose() {
    dispatch(closeEditDeckDialog());
  }

  async function onSubmit(values: FormValues) {
    if (!deckData?.id) return;
    setSubmitting(true);
    try {
      await dispatch(updateDeck({ id: deckData.id, data: values })).unwrap();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} width={480} title="Editar Deck">
      <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-2">
        <FormItem label="Nome *" invalid={!!errors.name} errorMessage={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Ex: Anatomia Humana" autoFocus />}
          />
        </FormItem>

        <FormItem
          label="Descrição"
          invalid={!!errors.description}
          errorMessage={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ''}
                textArea
                rows={3}
                placeholder="Opcional"
              />
            )}
          />
        </FormItem>

        {canManage && (
          <FormItem label="Package">
            <Controller
              name="packageId"
              control={control}
              render={({ field }) => (
                <Select<PackageOption>
                  options={packageOptions}
                  value={packageOptions.find((option) => option.value === field.value) ?? null}
                  onChange={(option) =>
                    field.onChange((option as PackageOption | null)?.value ?? null)
                  }
                  placeholder="Selecione um package"
                  noOptionsMessage={() => 'Nenhum package disponivel'}
                />
              )}
            />
          </FormItem>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormItem
            label="Novos por dia"
            invalid={!!errors.newCardsPerDay}
            errorMessage={errors.newCardsPerDay?.message}
          >
            <Controller
              name="newCardsPerDay"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                  }
                  type="number"
                  min={0}
                  max={9999}
                />
              )}
            />
          </FormItem>

          <FormItem
            label="Revisões por dia"
            invalid={!!errors.reviewCardsPerDay}
            errorMessage={errors.reviewCardsPerDay?.message}
          >
            <Controller
              name="reviewCardsPerDay"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                  }
                  type="number"
                  min={0}
                  max={9999}
                />
              )}
            />
          </FormItem>
        </div>

        <DialogActions>
          <Button type="button" variant="plain" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="solid" loading={submitting || status === 'loading'}>
            Salvar
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
