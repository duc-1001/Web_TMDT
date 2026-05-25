// client/src/lib/formData.ts
export const buildFormData = (payload: Record<string, any>): FormData => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => form.append(key, item));
    } else if (value !== undefined && value !== null) {
      form.append(key, value);
    }
  });
  return form;
};
