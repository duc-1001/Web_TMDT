const normalizeBackendUrl = (value?: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "http://localhost:8000";
  }

  return trimmed.replace(/\/$/, "");
};

export const getBackendUrl = () => normalizeBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL);