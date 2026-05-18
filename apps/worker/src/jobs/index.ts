import type { JobContract, JobDefinition } from "@continium/jobs";
import type { ZodTypeAny } from "zod";
import { auditWriteJob } from "./audit-write.job";
import { exampleJob } from "./example.job";
import { followUpResponseJob } from "./follow-up-response.job";
import { partitionCreateJob } from "./partition-create.job";

// Widened to the base type so the runner.register() generic resolves without union-type errors.
// Add new job definitions here; they are automatically registered in main.ts.
export const jobs: Array<JobDefinition<JobContract<string, ZodTypeAny>>> = [
  followUpResponseJob,
  exampleJob,
  auditWriteJob,
  partitionCreateJob,
];
