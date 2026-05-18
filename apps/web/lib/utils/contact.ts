import { TContactAttributes } from "@continium/types/contact-attribute";
import { TResponseContact } from "@continium/types/responses";

export const getContactIdentifier = (
  contact: TResponseContact | null,
  contactAttributes: TContactAttributes | null
): string => {
  return contactAttributes?.email || contact?.userId || "";
};
