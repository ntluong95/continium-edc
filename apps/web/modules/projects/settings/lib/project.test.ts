import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { prisma } from "@continium/database";
import { logger } from "@continium/logger";
import { StorageErrorCode } from "@continium/storage";
import { TEnvironment } from "@continium/types/environment";
import { DatabaseError, InvalidInputError, ValidationError } from "@continium/types/errors";
import { ZProject } from "@continium/types/project";
import { createEnvironment } from "@/lib/environment/service";
import { deleteFilesByEnvironmentId } from "@/modules/storage/service";
import { createProject, deleteProject, updateProject } from "./project";

const baseProject = {
  id: "p1",
  createdAt: new Date(),
  updatedAt: new Date(),
  name: "Project 1",
  organizationId: "org1",
  languages: [],
  recontactDays: 0,
  linkSurveyBranding: false,
  inAppSurveyBranding: false,
  config: { channel: null, industry: null },
  placement: "bottomRight",
  clickOutsideClose: false,
  overlay: "none",
  environments: [
    {
      id: "cmi2sra0j000004l73fvh7lhe",
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "production" as TEnvironment["type"],
      projectId: "p1",
      appSetupCompleted: false,
    },
    {
      id: "cmi2srt9q000104l7127e67v7",
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "development" as TEnvironment["type"],
      projectId: "p1",
      appSetupCompleted: false,
    },
  ],
  styling: { allowStyleOverwrite: true },
  logo: null,
  kind: "PRODUCT" as const,
};

const clinicalProject = {
  ...baseProject,
  kind: "CLINICAL" as const,
};

vi.mock("@continium/database", () => ({
  prisma: {
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
    project: {
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    enrollment: {
      deleteMany: vi.fn(),
    },
    eventInstrument: {
      deleteMany: vi.fn(),
    },
    projectTeam: {
      createMany: vi.fn(),
    },
    record: {
      deleteMany: vi.fn(),
    },
    recordValue: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@continium/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("@/modules/storage/service", () => ({
  deleteFilesByEnvironmentId: vi.fn(),
}));

vi.mock("@/lib/environment/service", () => ({
  createEnvironment: vi.fn(),
}));

describe("project lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(prisma as any));
  });

  describe("updateProject", () => {
    test("updates project and revalidates cache", async () => {
      vi.mocked(prisma.project.update).mockResolvedValueOnce(baseProject as any);
      const result = await updateProject("p1", { name: "Project 1", environments: baseProject.environments });
      expect(result).toEqual(ZProject.parse(baseProject));
      expect(prisma.project.update).toHaveBeenCalled();
    });

    test("throws DatabaseError on Prisma error", async () => {
      vi.mocked(prisma.project.update).mockRejectedValueOnce(
        new (class extends Error {
          constructor() {
            super();
            this.message = "fail";
          }
        })()
      );
      await expect(updateProject("p1", { name: "Project 1" })).rejects.toThrow();
    });

    test("throws ValidationError on Zod error", async () => {
      vi.mocked(prisma.project.update).mockResolvedValueOnce({ ...baseProject, id: 123 } as any);
      await expect(
        updateProject("p1", { name: "Project 1", environments: baseProject.environments })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("createProject", () => {
    test("creates project, environments, and revalidates cache", async () => {
      vi.mocked(prisma.project.create).mockResolvedValueOnce({ ...clinicalProject, id: "p2" } as any);
      vi.mocked(prisma.projectTeam.createMany).mockResolvedValueOnce({} as any);
      vi.mocked(createEnvironment).mockResolvedValueOnce(baseProject.environments[0] as any);
      vi.mocked(createEnvironment).mockResolvedValueOnce(baseProject.environments[1] as any);
      vi.mocked(prisma.project.update).mockResolvedValueOnce(clinicalProject as any);
      const result = await createProject("org1", { name: "Project 1", teamIds: ["t1"] });
      expect(result).toEqual(clinicalProject);
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ kind: "CLINICAL" }),
        })
      );
      expect(prisma.projectTeam.createMany).toHaveBeenCalled();
      expect(createEnvironment).toHaveBeenCalled();
    });

    test("throws ValidationError if name is missing", async () => {
      await expect(createProject("org1", {})).rejects.toThrow(ValidationError);
    });

    test("throws InvalidInputError on unique constraint", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Test Prisma Error", {
        code: "P2002",
        clientVersion: "5.0.0",
      });
      vi.mocked(prisma.project.create).mockRejectedValueOnce(prismaError);
      await expect(createProject("org1", { name: "Project 1" })).rejects.toThrow(InvalidInputError);
    });

    test("throws DatabaseError on Prisma error", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Test Prisma Error", {
        code: "P2001",
        clientVersion: "5.0.0",
      });
      vi.mocked(prisma.project.create).mockRejectedValueOnce(prismaError);
      await expect(createProject("org1", { name: "Project 1" })).rejects.toThrow(DatabaseError);
    });

    test("throws unknown error", async () => {
      vi.mocked(prisma.project.create).mockRejectedValueOnce(new Error("fail"));
      await expect(createProject("org1", { name: "Project 1" })).rejects.toThrow("fail");
    });
  });

  describe("deleteProject", () => {
    test("deletes clinical dependencies, project, files, and revalidates cache", async () => {
      vi.mocked(prisma.project.delete).mockResolvedValueOnce(baseProject as any);

      vi.mocked(deleteFilesByEnvironmentId).mockResolvedValue({ ok: true, data: undefined });
      const result = await deleteProject("p1");
      expect(result).toEqual(baseProject);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(prisma.recordValue.deleteMany).toHaveBeenCalledWith({ where: { projectId: "p1" } });
      expect(prisma.record.deleteMany).toHaveBeenCalledWith({ where: { projectId: "p1" } });
      expect(prisma.eventInstrument.deleteMany).toHaveBeenCalledWith({
        where: { event: { arm: { study: { projectId: "p1" } } } },
      });
      expect(prisma.enrollment.deleteMany).toHaveBeenCalledWith({
        where: { subject: { study: { projectId: "p1" } } },
      });
      expect(deleteFilesByEnvironmentId).toHaveBeenCalledWith("cmi2sra0j000004l73fvh7lhe");
    });

    test("logs error if file deletion fails", async () => {
      vi.mocked(prisma.project.delete).mockResolvedValueOnce(baseProject as any);
      vi.mocked(deleteFilesByEnvironmentId).mockResolvedValue({
        ok: false,
        error: { code: StorageErrorCode.Unknown },
      } as any);
      vi.mocked(logger.error).mockImplementation(() => {});
      await deleteProject("p1");
      expect(logger.error).toHaveBeenCalled();
    });

    test("throws DatabaseError on Prisma error", async () => {
      const err = new Prisma.PrismaClientKnownRequestError("Test Prisma Error", {
        code: "P2001",
        clientVersion: "5.0.0",
      });
      vi.mocked(prisma.project.delete).mockRejectedValueOnce(err as any);
      await expect(deleteProject("p1")).rejects.toThrow(DatabaseError);
    });

    test("throws unknown error", async () => {
      vi.mocked(prisma.project.delete).mockRejectedValueOnce(new Error("fail"));
      await expect(deleteProject("p1")).rejects.toThrow("fail");
    });
  });
});
