import { useState, useCallback } from 'react';
import { z } from 'zod';

export function useFormValidation<T extends z.ZodTypeAny>(schema: T) {
  type FormData = z.infer<T>;
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback((data: FormData) => {
    const result = schema.safeParse(data);
    if (result.success) {
      setErrors({});
      setIsValid(true);
      return true;
    } else {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      const flattened = result.error.flatten();
      Object.entries(flattened.fieldErrors).forEach(([field, messages]) => {
        const msgs = messages as string[] | undefined;
        if (msgs && msgs.length > 0) {
          fieldErrors[field as keyof FormData] = msgs[0];
        }
      });
      setErrors(fieldErrors);
      setIsValid(false);
      return false;
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  return { errors, isValid, validate, clearErrors };
}