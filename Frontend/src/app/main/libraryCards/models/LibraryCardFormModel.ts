import * as yup from 'yup';

export const libraryCardFormSchema = yup.object({
  type: yup.mixed<'general' | 'private'>().oneOf(['general', 'private']).required(),
  front: yup.string().trim().required('Frente e obrigatoria').max(5000),
  back: yup.string().trim().required('Verso e obrigatorio').max(5000),
  cardType: yup
    .mixed<'basic' | 'reversed' | 'cloze' | 'mcq'>()
    .oneOf(['basic', 'reversed', 'cloze', 'mcq'])
    .required(),
});

export type LibraryCardFormValues = yup.InferType<typeof libraryCardFormSchema>;
