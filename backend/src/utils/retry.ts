export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  jitter?: boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    backoffFactor = 2,
    jitter = true,
    onRetry,
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw error;
      }

      if (onRetry) {
        onRetry(error, attempt);
      }

      // Calculate exponential backoff delay: delay = initialDelay * (factor ^ (attempt - 1))
      let delay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);

      if (jitter) {
        // Apply random jitter (between 0 and 50% of the calculated delay)
        const jitterAmount = Math.random() * (delay * 0.5);
        delay = delay + jitterAmount;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
