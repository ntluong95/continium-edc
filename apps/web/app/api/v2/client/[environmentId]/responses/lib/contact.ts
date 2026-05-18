import { cache as reactCache } from "react";
import { prisma } from "@continium/database";
import { TContactAttributes } from "@continium/types/contact-attribute";

export const getContact = reactCache(async (contactId: string) => {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      attributes: {
        select: {
          attributeKey: { select: { key: true } },
          value: true,
        },
      },
    },
  });

  if (!contact) {
    return null;
  }

  const contactAttributes = contact.attributes.reduce<TContactAttributes>((acc, attr) => {
    acc[attr.attributeKey.key] = attr.value;
    return acc;
  }, {});

  return {
    id: contact.id,
    attributes: contactAttributes,
  };
});
