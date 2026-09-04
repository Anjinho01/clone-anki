import { useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import Button from '@fuse/ui/Button';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import { Form, FormItem } from '@fuse/ui/Form';
import Input from '@fuse/ui/Input';
import Select from '@fuse/ui/Select';
import { canManageStudyContent } from 'app/auth';
import { useAppDispatch, useAppSelector } from 'app/store';
import { libraryCardFormSchema, type LibraryCardFormValues } from '../models/LibraryCardFormModel';
import {
  createLibraryCard,
  selectLibraryCardActionStatus,
  selectLibraryCardsLimits,
  updateLibraryCard,
  type LibraryCardFormData,
} from '../store/libraryCardSlice';
import {
  CARD_TYPE_OPTIONS,
  VISIBILITY_OPTIONS,
  type FlashcardType,
} from '../types/LibraryCardTypes';

function LibraryCardFormDialog({
  isOpen,
  onClose,
  initial,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial: FlashcardType | null;
}) {
  const dispatch = useAppDispatch();
  const actionStatus = useAppSelector(selectLibraryCardActionStatus);
  const limits = useAppSelector(selectLibraryCardsLimits);
  const canManagePublicCards = useAppSelector((state) => canManageStudyContent(state.user.role));
  const [submitting, setSubmitting] = useState(false);

  const visibilityOptions = canManagePublicCards
    ? VISIBILITY_OPTIONS
    : VISIBILITY_OPTIONS.filter((option) => option.value === 'private');
  const defaultVisibility = canManagePublicCards ? 'general' : 'private';

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LibraryCardFormValues>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      type: defaultVisibility,
      front: '',
      back: '',
      cardType: 'basic',
    },
    resolver: yupResolver(libraryCardFormSchema),
  });

  const selectedType = watch('type');
  const privateCardsCurrent = limits.privateOwnedCards.current;
  const privateCardsMax = limits.privateOwnedCards.max;
  const wouldIncreasePrivateCards =
    selectedType === 'private' && (!initial || initial.type !== 'private');
  const privateLimitReached = wouldIncreasePrivateCards && privateCardsCurrent >= privateCardsMax;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(
      initial
        ? {
            type: initial.type ?? 'general',
            front: initial.front,
            back: initial.back,
            cardType: initial.cardType,
          }
        : {
            type: defaultVisibility,
            front: '',
            back: '',
            cardType: 'basic',
          }
    );
  }, [defaultVisibility, initial, isOpen, reset]);

  async function onSubmit(values: LibraryCardFormValues) {
    if (privateLimitReached) {
      return;
    }

    setSubmitting(true);

    try {
      const payload: LibraryCardFormData = {
        type: values.type,
        front: values.front,
        back: values.back,
        cardType: values.cardType,
      };

      if (initial) {
        await dispatch(updateLibraryCard({ id: initial.id, data: payload })).unwrap();
      } else {
        await dispatch(createLibraryCard(payload)).unwrap();
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      width={640}
      title={initial ? 'Editar card reutilizavel' : 'Novo card reutilizavel'}
    >
      <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-2">
        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
          Esse conteudo pode ser usado em zero, um ou muitos decks sem misturar o progresso de
          estudo.
        </p>

        <div
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
            privateLimitReached
              ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200'
              : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300'
          }`}
        >
          Cards privados: {privateCardsCurrent}/{privateCardsMax}.{' '}
          {privateLimitReached
            ? 'O limite foi atingido para novos cards privados.'
            : 'Ao atingir o limite, a criacao de novos cards privados e bloqueada.'}
        </div>

        <FormItem label="Visibilidade" invalid={!!errors.type} errorMessage={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                options={visibilityOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={visibilityOptions.find((option) => option.value === field.value) ?? null}
                onChange={(option) =>
                  field.onChange(
                    (option as { value: 'general' | 'private' } | null)?.value ?? defaultVisibility
                  )
                }
              />
            )}
          />
        </FormItem>

        <FormItem
          label="Tipo de card"
          invalid={!!errors.cardType}
          errorMessage={errors.cardType?.message}
        >
          <Controller
            name="cardType"
            control={control}
            render={({ field }) => (
              <Select
                options={CARD_TYPE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={CARD_TYPE_OPTIONS.find((option) => option.value === field.value) ?? null}
                onChange={(option) =>
                  field.onChange(
                    (option as { value: FlashcardType['cardType'] } | null)?.value ?? 'basic'
                  )
                }
              />
            )}
          />
        </FormItem>

        <FormItem label="Frente" invalid={!!errors.front} errorMessage={errors.front?.message}>
          <Controller
            name="front"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                autoFocus
                textArea
                rows={4}
                placeholder="Pergunta, conceito ou termo principal"
              />
            )}
          />
        </FormItem>

        <FormItem label="Verso" invalid={!!errors.back} errorMessage={errors.back?.message}>
          <Controller
            name="back"
            control={control}
            render={({ field }) => (
              <Input {...field} textArea rows={5} placeholder="Resposta, explicacao ou exemplo" />
            )}
          />
        </FormItem>

        <DialogActions>
          <Button type="button" variant="plain" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="solid"
            disabled={privateLimitReached}
            loading={submitting || actionStatus === 'loading'}
          >
            {initial ? 'Salvar alteracoes' : 'Criar card'}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

export default LibraryCardFormDialog;
