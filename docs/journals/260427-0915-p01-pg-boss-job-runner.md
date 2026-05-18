# P0.1: pg-boss Job Runner Implementation Complete

**Date**: 2026-04-27 09:14
**Severity**: Medium
**Component**: Job Queue Infrastructure (`@continium/jobs`, `@continium/worker`)
**Status**: Resolved

## What Happened

Completed Phase 01 of the clinical EDC foundation plan: integrated pg-boss as the canonical Postgres-backed job runner for Continium. This replaces the need for Redis and simplifies deployment by keeping all persistence in a single database.

**Deliverables shipped:**
- `@continium/jobs` package with `JobRunner`, `QueueClient`, `defineJob`/`defineJobContract` abstractions and pg-boss adapter
- `apps/worker` standalone Node.js process consuming queued jobs (follow-up response delivery)
- Docker Compose worker service (depends only on postgres, no Redis)
- Turbo pipeline integration: `@continium/jobs#build` wired as build dependency
- HTTP 200 response for non-transient errors to prevent retry amplification

## The Brutal Truth

Six subtle TypeScript and pg-boss API bugs emerged during implementation. Each one was a small friction point that felt like we should have caught it earlier. The frustrating part: most traced back to incomplete assumptions about the pg-boss v11 API surface and how union types flow through generic constraints in TypeScript. Shipping without validation on these would have caused silent failures in production and retry loops.

## Technical Details

**Bug 1: `toPgBossSendOptions` returned `undefined`**
- pg-boss v11 `send()` strictly requires a non-undefined options object, even if empty
- Symptom: Job scheduling silently failed with no error
- Fix: Changed return from `options || undefined` to `options || {}`

**Bug 2: `startPromise` type mismatch**
- Declared as `Promise<void>` but pg-boss v11 `boss.start()` returns `Promise<PgBoss>`
- Symptom: Type checker error on assignment
- Fix: Updated type to match actual return signature

**Bug 3: Worker job array union-type collapse**
- Typed jobs array as `(JobA | JobB)[]` — TypeScript's type inference couldn't resolve the generic `TContract` parameter
- Symptom: Cannot infer generic from discriminated union in array position
- Fix: Widened type to `Array<JobDefinition<JobContract<string, ZodTypeAny>>>` to unblock inference

**Bug 4: Contract re-export missing**
- Sub-path export `./contracts/survey-follow-up-response-job` broken because vite only builds single entry point
- Symptom: Module not found at runtime
- Fix: Re-exported all contracts from main `index.ts`

**Bug 5: `retryCount` not on `PgBoss.Job<object>` type**
- Worker callback type didn't account for pg-boss injected metadata
- Symptom: Type error accessing retry count in job handler
- Fix: Changed callback parameter type to `Array<PgBoss.Job<object> & { retryCount?: number }>`

**Bug 6: `declarationMap` conflict in tsconfig**
- Base tsconfig set `declarationMap: true`, worker build tsconfig set `declaration: false`
- TS5069: Declaration maps require declaration files
- Symptom: Conflicting config, build failed
- Fix: Explicitly set `declarationMap: false` in worker build tsconfig

## What We Tried

1. **Direct `toPgBossSendOptions` usage** → undefined returned, pg-boss silently dropped options
2. **Union discriminated types for job array** → type inference couldn't resolve the discriminant in array context
3. **Sub-path contract export** → realized vite doesn't support multiple entry points without explicit re-export
4. **Generic callback signature** → pg-boss type definition doesn't include injected metadata, had to widen type

## Root Cause Analysis

**Incomplete pg-boss v11 API study.** We read the surface documentation but didn't validate:
- Whether `send()` accepts undefined options (it doesn't)
- Whether `boss.start()` returns void or the boss instance (it returns the instance)
- Whether job metadata like `retryCount` is guaranteed on all callbacks (it's not in the type definition, but exists at runtime)

**TypeScript generics in arrays.** The compiler struggles with discriminated unions inside array types because it can't back-propagate the discriminant. Should have flattened to a single mapped type earlier.

**Build tool assumptions.** Assumed vite would handle sub-path exports; it doesn't without explicit re-export. Should have tested the build output immediately.

## Lessons Learned

1. **Test the library's actual return types early.** Don't rely on surface-level docs. Log the actual return value from `start()`, `send()`, etc. in a small PoC.

2. **Array generics need flattening.** Union types in array positions cause inference to collapse. Use mapped types or expand to a single indexed interface instead.

3. **Validate build output immediately.** After adding sub-path exports, check that `dist/contracts/` exists and contains what you expect. Don't assume the bundler did what you think.

4. **Type-widen defensively for library interop.** When working with external libraries that inject metadata at runtime, widen the callback signature to `& { [key: string]: any }` rather than fighting the type definition.

## Next Steps

- **Testing**: Run pg-boss integration tests on actual Postgres (not mocked) to catch runtime behavior divergence
- **Monitoring**: Wire up job queue depth monitoring and retry failure alerts
- **Documentation**: Add pg-boss migration guide for developers switching from Redis
- **Validation**: Run a follow-up response delivery end-to-end test against staging

**Commit**: `ce027ef5` on `phase-01-pg-boss-job-runner` branch
**Unit tests**: 3/3 passing in `@continium/jobs`
**Typecheck**: 0 errors in `@continium/worker`
