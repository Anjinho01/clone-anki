// src/app/main/apps/decks/dialogs/NewDeckDialog.tsx
import { useEffect, useMemo, useState } from 'react';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import { Form, FormItem } from '@fuse/ui/Form';
import Button from '@fuse/ui/Button';
import Input from '@fuse/ui/Input';
import Select from '@fuse/ui/Select';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from 'app/store';
import type { RootState } from 'app/store';
import { selectUserId } from 'app/store/user/userSlice';
import {
  selectNewDeckDialog,
  closeNewDeckDialog,
  createDeck,
  selectDeckActionStatus,
} from '../store/deckSlice';
import { getPackages } from '../store/packageSlice';
import { selectAllDecks } from '../store/decksSlice';
import type { PackageGroupType } from '../types/DeckTypes';

const MAX_PRIVATE_DECKS_PER_USER = 150;
const MAX_GENERAL_DECKS = 100;

const DECK_TYPE_OPTIONS = [
  { value: 'private', label: 'Privado (apenas eu)' },
  { value: 'general', label: 'Geral (todos os usuarios)' },
];

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
  name: yup.string().trim().required('Nome e obrigatorio').max(200),
  description: yup.string().trim().max(1000).optional(),
  type: yup.mixed<'general' | 'private'>().oneOf(['general', 'private']).default('private'),
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

const defaultValues: FormValues = {
  name: '',
  description: '',
  type: 'private',
  packageId: null,
  newCardsPerDay: 20,
  reviewCardsPerDay: 100,
};

export default function NewDeckDialog() {
  const dispatch = useAppDispatch();
  const dialog = useAppSelector(selectNewDeckDialog);
  const status = useAppSelector(selectDeckActionStatus);
  const userId = useAppSelector(selectUserId);
  const decks = useAppSelector(selectAllDecks);
  const canManagePublicDecks = useAppSelector(
    (state) =>
      state.user.role === 'admin' || state.user.role === 'develop' || state.user.role === 'monitor'
  );
  const packagesState = useAppSelector((state) => {
    return (state as PackagesRootState).decksApp?.packages;
  });
  const [submitting, setSubmitting] = useState(false);

  const isOpen = dialog?.props.isOpen ?? false;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
    resolver: yupResolver(schema),
  });

  const selectedType = watch('type');
  const selectedPackageId = watch('packageId');
  const privateDeckCount = useMemo(
    () => decks.filter((deck) => deck.type === 'private' && deck.ownerUserId === userId).length,
    [decks, userId]
  );
  const generalDeckCount = useMemo(
    () => decks.filter((deck) => deck.type === 'general').length,
    [decks]
  );
  const deckLimitReached =
    selectedType === 'general'
      ? generalDeckCount >= MAX_GENERAL_DECKS
      : privateDeckCount >= MAX_PRIVATE_DECKS_PER_USER;

  const packages = useMemo(() => {
    const ids = packagesState?.ids ?? [];
    const entities = packagesState?.entities ?? {};

    return ids.map((id) => entities[id]).filter((pkg): pkg is PackageGroupType => Boolean(pkg));
  }, [packagesState]);

  const packageOptions = useMemo<PackageOption[]>(() => {
    const options = packages
      .filter((pkg) => pkg.type === selectedType)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((pkg) => ({
        value: pkg.id,
        label: pkg.name,
      }));

    return [{ value: null, label: 'Sem package' }, ...options];
  }, [packages, selectedType]);

  useEffect(() => {
    if (isOpen) reset(defaultValues);
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen || !canManagePublicDecks) {
      return;
    }

    const request = dispatch(getPackages());

    return () => {
      request.abort();
    };
  }, [canManagePublicDecks, dispatch, isOpen]);

  useEffect(() => {
    if (selectedPackageId == null) {
      return;
    }

    const selectedExists = packageOptions.some((option) => option.value === selectedPackageId);

    if (!selectedExists) {
      setValue('packageId', null);
    }
  }, [packageOptions, selectedPackageId, setValue]);

  function onClose() {
    dispatch(closeNewDeckDialog());
  }

  async function onSubmit(values: FormValues) {
    if (deckLimitReached) {
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(createDeck(values)).unwrap();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} width={480} title="Novo Deck">
      <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-2">
        <FormItem label="Nome *" invalid={!!errors.name} errorMessage={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Ex: Anatomia Humana" autoFocus />}
          />
        </FormItem>

        <FormItem
          label="Descricao"
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

        {canManagePublicDecks && (
          <>
            <div
              className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                deckLimitReached
                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200'
                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300'
              }`}
            >
              Decks privados: {privateDeckCount}/{MAX_PRIVATE_DECKS_PER_USER}. Decks publicos no
              sistema: {generalDeckCount}/{MAX_GENERAL_DECKS}.{' '}
              {deckLimitReached
                ? 'Troque o tipo do deck ou libere espaco antes de criar um novo.'
                : 'Esses limites sao aplicados no frontend e confirmados no backend.'}
            </div>

            <FormItem
              label="Tipo de deck"
              invalid={!!errors.type}
              errorMessage={errors.type?.message}
            >
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    options={DECK_TYPE_OPTIONS}
                    value={DECK_TYPE_OPTIONS.find((o) => o.value === field.value) ?? null}
                    onChange={(opt) =>
                      field.onChange((opt as { value: string } | null)?.value ?? 'private')
                    }
                  />
                )}
              />
            </FormItem>

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
          </>
        )}

        {!canManagePublicDecks && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            Decks privados: {privateDeckCount}/{MAX_PRIVATE_DECKS_PER_USER}. Ao atingir o limite, a
            criacao de novos decks privados e bloqueada.
          </div>
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
            label="Revisoes por dia"
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
          <Button
            type="submit"
            variant="solid"
            disabled={deckLimitReached}
            loading={submitting || status === 'loading'}
          >
            Criar Deck
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
