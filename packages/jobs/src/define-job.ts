import type { ZodTypeAny, z } from "zod";

export type JobContract<TName extends string, TSchema extends ZodTypeAny> = {
  name: TName;
  schema: TSchema;
};

export type JobEnqueueOptions = {
  startAfter?: Date | string;
  retryLimit?: number;
  retryDelaySeconds?: number;
  retryBackoff?: boolean;
  singletonKey?: string;
};

export type JobMetadata = {
  id: string;
  name: string;
  retryCount: number;
};

export type JobDefinition<TContract extends JobContract<string, ZodTypeAny>> = {
  contract: TContract;
  handler: (payload: z.infer<TContract["schema"]>, metadata: JobMetadata) => Promise<void>;
  options?: {
    concurrency?: number;
    defaultEnqueueOptions?: JobEnqueueOptions;
  };
};

export const defineJobContract = <TName extends string, TSchema extends ZodTypeAny>(
  name: TName,
  schema: TSchema
): JobContract<TName, TSchema> => ({
  name,
  schema,
});

export const defineJob = <TContract extends JobContract<string, ZodTypeAny>>(
  definition: JobDefinition<TContract>
): JobDefinition<TContract> => definition;

export const parseJobPayload = <TContract extends JobContract<string, ZodTypeAny>>(
  contract: TContract,
  payload: unknown
): z.infer<TContract["schema"]> => {
  return contract.schema.parse(payload) as z.infer<TContract["schema"]>;
};
