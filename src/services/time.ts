export const getDefaultRetryTimestamp = (): string =>
  new Date(Date.now() + 1000).toISOString();

export const waitFor = async (
  waitUntil?: string,
  signal?: AbortSignal
): Promise<void> => {
  if (!waitUntil) return;

  const targetTimestamp = Date.parse(waitUntil);
  if (Number.isNaN(targetTimestamp)) return;

  const delay = targetTimestamp - Date.now();
  if (delay <= 0) return;

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, delay);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
    };

    const handleAbort = () => {
      cleanup();
      reject(new DOMException('Operation aborted', 'AbortError'));
    };

    if (signal) {
      if (signal.aborted) {
        handleAbort();
        return;
      }

      signal.addEventListener('abort', handleAbort);
    }
  });
};
