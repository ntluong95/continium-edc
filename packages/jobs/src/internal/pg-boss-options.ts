import type { JobEnqueueOptions } from "../define-job";

/**
 * Translates our internal JobEnqueueOptions into the subset of pg-boss SendOptions we use.
 * Returns an empty object (not undefined) so pg-boss v11's non-optional options param is satisfied.
 */
export type PgBossSendOptions = {
  startAfter?: Date | string;
  retryLimit?: number;
  retryDelay?: number;
  retryBackoff?: boolean;
  singletonKey?: string;
};

export const toPgBossSendOptions = (options?: JobEnqueueOptions): PgBossSendOptions => {
  if (!options) {
    return {};
  }

  return {
    startAfter: options.startAfter,
    retryLimit: options.retryLimit,
    retryDelay: options.retryDelaySeconds,
    retryBackoff: options.retryBackoff,
    singletonKey: options.singletonKey,
  };
};
