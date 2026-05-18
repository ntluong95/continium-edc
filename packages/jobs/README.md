# @continium/jobs

Postgres-backed background jobs built on pg-boss.

## Usage

```ts
import { defineJob, defineJobContract, JobRunner } from "@continium/jobs";
import { z } from "zod";

const contract = defineJobContract(
  "example.log",
  z.object({
    message: z.string().min(1),
  })
);

const logJob = defineJob({
  contract,
  handler: async (payload) => {
    console.log(payload.message);
  },
});

const runner = new JobRunner({
  connectionString: process.env.DATABASE_URL!,
  schema: "pgboss",
});

runner.register(logJob);
await runner.start();
```

Use `createQueueClient` inside request handlers where only enqueue behavior is needed.
