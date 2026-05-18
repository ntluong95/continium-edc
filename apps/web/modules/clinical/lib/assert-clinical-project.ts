import "server-only";
import { notFound } from "next/navigation";
import type { TProject, TProjectKind } from "@continium/types/project";

/** Branded project type proving `kind === "CLINICAL"` check passed. */
export type TClinicalProject = TProject & { kind: Extract<TProjectKind, "CLINICAL"> };

/**
 * Asserts the project exists and is a CLINICAL project.
 * Calls notFound() otherwise — mapping to the nearest 404 boundary in both
 * server components and server actions.
 *
 * Usage:
 *   const project = await getProjectByEnvironmentId(environmentId);
 *   assertClinicalProject(project);
 *   // project is now TClinicalProject
 */
export function assertClinicalProject(project: TProject | null): asserts project is TClinicalProject {
  if (!project || project.kind !== "CLINICAL") {
    notFound();
  }
}
