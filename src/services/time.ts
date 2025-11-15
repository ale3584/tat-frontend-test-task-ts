export const getDefaultRetryTimestamp = (): string =>
  new Date(Date.now() + 1000).toISOString();

export const waitFor = async (waitUntil?: string): Promise<void> => {
  if (!waitUntil) return;

  const targetTimestamp = Date.parse(waitUntil);
  if (Number.isNaN(targetTimestamp)) return;

  const delay = targetTimestamp - Date.now();
  if (delay <= 0) return;

  await new Promise<void>((resolve) => setTimeout(resolve, delay));
};
