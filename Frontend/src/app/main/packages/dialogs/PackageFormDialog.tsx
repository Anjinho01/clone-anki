import { useEffect, useMemo, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import Button from '@fuse/ui/Button';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import { Form, FormItem } from '@fuse/ui/Form';
import Input from '@fuse/ui/Input';
import Select from '@fuse/ui/Select';
import { useAppDispatch, useAppSelector } from 'app/store';
import { packageFormSchema, type PackageFormValues } from '../models/PackageFormModel';
import { updateDeck } from '../store/deckSlice';
import { getDecks } from '../store/decksSlice';
import {
  createPackage,
  selectPackageActionStatus,
  updatePackage,
  type PackageFormData,
} from '../store/packageSlice';
import { type DeckSelectOption, type DeckType, type PackageGroupType } from '../types/PackageTypes';

function PackageFormDialog({
  isOpen,
  onClose,
  initial,
  decks,
  canLinkDecks,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial: PackageGroupType | null;
  decks: DeckType[];
  canLinkDecks: boolean;
}) {
  const dispatch = useAppDispatch();
  const actionStatus = useAppSelector(selectPackageActionStatus);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PackageFormValues>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      position: 0,
      deckIds: [],
    },
    resolver: yupResolver(packageFormSchema),
  });

  const linkedDeckIds = useMemo(() => {
    if (!initial) {
      return [] as number[];
    }

    return decks.filter((deck) => deck.packageId === initial.id).map((deck) => deck.id);
  }, [decks, initial]);

  const availableDeckOptions = useMemo<DeckSelectOption[]>(() => {
    return decks
      .filter((deck) => {
        if (deck.packageId === initial?.id) {
          return true;
        }

        return deck.type === 'general' && deck.packageId == null;
      })
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((deck) => ({
        value: deck.id,
        label: deck.name,
      }));
  }, [decks, initial?.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(
      initial
        ? {
            name: initial.name,
            description: initial.description ?? '',
            position: initial.position,
            deckIds: linkedDeckIds,
          }
        : {
            name: '',
            description: '',
            position: 0,
            deckIds: [],
          }
    );
  }, [initial, isOpen, linkedDeckIds, reset]);

  async function onSubmit(values: PackageFormValues) {
    setSubmitting(true);

    try {
      const payload: PackageFormData = {
        name: values.name,
        description: values.description || null,
        position: values.position,
      };

      const validDeckIds = (values.deckIds ?? []).filter((deckId) => {
        return availableDeckOptions.some((option) => option.value === deckId);
      });

      const savedGroup = initial
        ? await dispatch(updatePackage({ id: initial.id, data: payload })).unwrap()
        : await dispatch(createPackage(payload)).unwrap();

      if (canLinkDecks) {
        const selectedDeckIds = new Set(validDeckIds);
        const currentDeckIds = new Set(linkedDeckIds);
        const deckSyncOperations: Array<Promise<unknown>> = [];

        linkedDeckIds.forEach((deckId) => {
          if (!selectedDeckIds.has(deckId)) {
            deckSyncOperations.push(
              dispatch(
                updateDeck({
                  id: deckId,
                  data: { packageId: null },
                  silent: true,
                  refresh: false,
                })
              ).unwrap()
            );
          }
        });

        validDeckIds.forEach((deckId) => {
          if (!currentDeckIds.has(deckId)) {
            deckSyncOperations.push(
              dispatch(
                updateDeck({
                  id: deckId,
                  data: { packageId: savedGroup.id },
                  silent: true,
                  refresh: false,
                })
              ).unwrap()
            );
          }
        });

        if (deckSyncOperations.length > 0) {
          await Promise.all(deckSyncOperations);
          const refreshDecks = dispatch(getDecks());
          await refreshDecks.unwrap();
        }
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
      width={480}
      title={initial ? 'Editar package' : 'Novo package'}
    >
      <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-2">
        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
          Defina o package publico e, se necessario, posicione nele os decks publicos livres.
        </p>

        <FormItem label="Nome" invalid={!!errors.name} errorMessage={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} autoFocus placeholder="Ex.: Ingles tecnico, Medicina interna" />
            )}
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
                rows={5}
                placeholder="Explique o recorte do package e que tipo de deck ele deve abrigar"
              />
            )}
          />
        </FormItem>

        {canLinkDecks && (
          <FormItem label="Decks vinculados">
            <Controller
              name="deckIds"
              control={control}
              render={({ field }) => (
                <Select<DeckSelectOption, true>
                  isMulti
                  options={availableDeckOptions}
                  placeholder={
                    availableDeckOptions.length > 0
                      ? 'Selecione os decks publicos que pertencem a este package'
                      : 'Nenhum deck publico disponivel'
                  }
                  value={availableDeckOptions.filter((option) =>
                    (field.value ?? []).includes(option.value)
                  )}
                  onChange={(options) => {
                    const nextOptions = (options as DeckSelectOption[] | null) ?? [];
                    field.onChange(nextOptions.map((option) => option.value));
                  }}
                  noOptionsMessage={() => 'Nenhum deck disponivel'}
                />
              )}
            />
          </FormItem>
        )}

        <FormItem
          label="Posicao"
          invalid={!!errors.position}
          errorMessage={errors.position?.message}
        >
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={String(field.value ?? 0)}
                type="number"
                min={0}
                onChange={(event) => field.onChange(Number(event.target.value || 0))}
              />
            )}
          />
        </FormItem>

        <DialogActions>
          <Button type="button" variant="plain" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="solid" loading={submitting || actionStatus === 'loading'}>
            {initial ? 'Salvar alteracoes' : 'Criar package'}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

export default PackageFormDialog;
