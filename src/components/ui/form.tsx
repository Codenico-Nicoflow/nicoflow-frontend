'use client';

import * as React from 'react';

import type { Resources } from '@nicoflow/shared/i18n';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Keys under common.validation, prefixed for the default-namespace t(). Schema
// messages are exactly these keys (see schemas.ts).
type ValidationKey = `validation.${keyof Resources['common']['validation']}`;

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

function FormItem({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<'div'> & { 'data-testid'?: string }) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        data-testid={testId || 'form-item'}
        className={cn('grid gap-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { 'data-testid'?: string }) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-testid={testId || 'form-label'}
      data-error={!!error}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof Slot> & { 'data-testid'?: string }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      data-slot="form-control"
      data-testid={testId || 'form-control'}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<'p'> & { 'data-testid'?: string }) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      data-testid={testId || 'form-description'}
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<'p'> & { 'data-testid'?: string }) {
  const { error, formMessageId } = useFormField();
  const { t } = useTranslation('common');
  // Schema messages are i18n keys (see schemas.ts) under common.validation;
  // translate them here. The key arrives from RHF as a plain string so it can't
  // be proven statically — cast to the validation-key type. A missing key falls
  // back to itself, so a stray plain-string message still renders safely.
  const messageKey = error ? (String(error?.message ?? '') as ValidationKey) : undefined;
  const body = messageKey ? t(messageKey) : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      data-testid={testId || 'form-message'}
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  );
}

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField };
