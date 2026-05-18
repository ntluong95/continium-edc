import { describe, expect, it } from "vitest";
import { parseSchemaPrisma } from "./schema-vs-db-parity";

describe("parseSchemaPrisma", () => {
  it("extracts model name and falls back to model name when @@map is absent", () => {
    const schema = `
      model Project {
        id String @id
      }
    `;
    const { models } = parseSchemaPrisma(schema);
    expect(models).toContainEqual({ modelName: "Project", tableName: "Project" });
  });

  it("uses the @@map value as the table name", () => {
    const schema = `
      model Record {
        id String @id
        @@map("record")
      }
    `;
    const { models } = parseSchemaPrisma(schema);
    expect(models).toContainEqual({ modelName: "Record", tableName: "record" });
  });

  it("supports the @@map(name: \"…\") form too", () => {
    const schema = `
      model AuditLog {
        id String @id
        @@map(name: "audit_log")
      }
    `;
    const { models } = parseSchemaPrisma(schema);
    expect(models).toContainEqual({ modelName: "AuditLog", tableName: "audit_log" });
  });

  it("extracts enum values, ignoring comments and attribute lines", () => {
    const schema = `
      enum RecordStatus {
        INCOMPLETE
        UNVERIFIED  // entered but awaiting verification
        COMPLETE
        LOCKED
      }
    `;
    const { enums } = parseSchemaPrisma(schema);
    expect(enums).toEqual([
      {
        enumName: "RecordStatus",
        values: ["INCOMPLETE", "UNVERIFIED", "COMPLETE", "LOCKED"],
      },
    ]);
  });

  it("extracts both Webhook and Integration models and their backing enums", () => {
    const schema = `
      enum WebhookSource {
        user
        zapier
        make
        n8n
        activepieces
      }

      enum IntegrationType {
        googleSheets
        notion
        airtable
        slack
      }

      model Webhook {
        id String @id
      }

      model Integration {
        id String @id
      }
    `;
    const { models, enums } = parseSchemaPrisma(schema);
    expect(models.map((m) => m.modelName).sort()).toEqual(["Integration", "Webhook"]);
    const enumNames = enums.map((e) => e.enumName).sort();
    expect(enumNames).toEqual(["IntegrationType", "WebhookSource"]);
    expect(enums.find((e) => e.enumName === "WebhookSource")?.values).toEqual([
      "user",
      "zapier",
      "make",
      "n8n",
      "activepieces",
    ]);
  });

  it("does not extract anything from datasource or generator blocks", () => {
    const schema = `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      generator client {
        provider = "prisma-client-js"
      }

      model Real {
        id String @id
      }
    `;
    const { models, enums } = parseSchemaPrisma(schema);
    expect(models.map((m) => m.modelName)).toEqual(["Real"]);
    expect(enums).toEqual([]);
  });
});
