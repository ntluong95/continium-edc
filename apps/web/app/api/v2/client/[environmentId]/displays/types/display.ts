import { z } from "zod";
import { ZId } from "@continium/types/common";
import { ZDisplayCreateInput } from "@continium/types/displays";

export const ZDisplayCreateInputV2 = ZDisplayCreateInput.omit({ userId: true }).extend({
  contactId: ZId.optional(),
});

export type TDisplayCreateInputV2 = z.infer<typeof ZDisplayCreateInputV2>;
