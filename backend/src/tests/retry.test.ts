import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../utils/retry.js';

describe('Retry Utility', () => {
  it('should succeed immediately if the task succeeds', async () => {
    const task = vi.fn().mockResolvedValue('success-data');
    
    const result = await withRetry(task, { maxAttempts: 3, initialDelayMs: 1 });
    
    expect(result).toBe('success-data');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('should retry task on failure and succeed if subsequent try succeeds', async () => {
    let callCount = 0;
    const task = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error('Transient error');
      }
      return 'recovered';
    });

    const result = await withRetry(task, { maxAttempts: 3, initialDelayMs: 1, jitter: false });
    
    expect(result).toBe('recovered');
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('should throw error if all attempts fail', async () => {
    const task = vi.fn().mockRejectedValue(new Error('Persistent error'));

    await expect(
      withRetry(task, { maxAttempts: 3, initialDelayMs: 1, jitter: false })
    ).rejects.toThrow('Persistent error');

    expect(task).toHaveBeenCalledTimes(3);
  });

  it('should invoke onRetry callback on each retry attempt', async () => {
    const task = vi.fn().mockRejectedValue(new Error('Transient error'));
    const onRetryMock = vi.fn();

    await expect(
      withRetry(task, { maxAttempts: 2, initialDelayMs: 1, jitter: false, onRetry: onRetryMock })
    ).rejects.toThrow('Transient error');

    expect(onRetryMock).toHaveBeenCalledTimes(1);
    expect(onRetryMock).toHaveBeenCalledWith(expect.any(Error), 1);
  });
});
