import * as yup from 'yup';

export const packageFormSchema = yup.object({
  name: yup.string().trim().required('Nome e obrigatorio').max(200),
  description: yup.string().nullable().default('').max(2000),
  position: yup.number().integer().min(0).max(999999).required(),
  deckIds: yup.array().of(yup.number().integer().required()).default([]),
});

export type PackageFormValues = yup.InferType<typeof packageFormSchema>;
