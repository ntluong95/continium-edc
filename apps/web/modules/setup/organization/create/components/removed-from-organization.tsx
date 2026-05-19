"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TUser } from "@continium/types/user";
import { DeleteAccountModal } from "@/modules/account/components/DeleteAccountModal";
import { Alert, AlertDescription, AlertTitle } from "@/modules/ui/components/alert";
import { Button } from "@/modules/ui/components/button";

interface RemovedFromOrganizationProps {
  isContiniumCloud: boolean;
  disableSsoReauth: boolean;
  user: TUser;
}

export const RemovedFromOrganization = ({
  user,
  isContiniumCloud,
  disableSsoReauth,
}: RemovedFromOrganizationProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <AlertTitle>{t("setup.organization.create.no_membership_found")}</AlertTitle>
        <AlertDescription>{t("setup.organization.create.no_membership_found_description")}</AlertDescription>
      </Alert>
      <hr className="my-4 border-slate-200" />
      <p className="text-sm">{t("setup.organization.create.delete_account_description")}</p>
      <DeleteAccountModal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        user={user}
        isContiniumCloud={isContiniumCloud}
        organizationsWithSingleOwner={[]}
        disableSsoReauth={disableSsoReauth}
      />
      <Button
        onClick={() => {
          setIsModalOpen(true);
        }}>
        {t("setup.organization.create.delete_account")}
      </Button>
    </div>
  );
};
