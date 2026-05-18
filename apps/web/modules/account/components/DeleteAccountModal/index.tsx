"use client";

import { Dispatch, SetStateAction, useState } from "react";
import toast from "react-hot-toast";
import { Trans, useTranslation } from "react-i18next";
import { signIn } from "next-auth/react";
import { logger } from "@continium/logger";
import { TOrganization } from "@continium/types/organizations";
import { TUser } from "@continium/types/user";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { useSignOut } from "@/modules/auth/hooks/use-sign-out";
import { DeleteDialog } from "@/modules/ui/components/delete-dialog";
import { Input } from "@/modules/ui/components/input";
import { PasswordInput } from "@/modules/ui/components/password-input";
import {
  getProviderDisplayLabel,
  getReauthAuthorizationParams,
  identityProviderToNextAuthProvider,
  isSsoReauthSupportedForProvider,
} from "../../lib/account-deletion-client";
import { ACCOUNT_DELETION_SSO_REAUTH_CALLBACK_PATH } from "../../constants";
import { deleteUserAction, initiateAccountDeletionSsoReauthAction } from "./actions";
import { DELETE_ACCOUNT_WRONG_PASSWORD_ERROR } from "./constants";

interface DeleteAccountModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  user: TUser;
  isContiniumCloud: boolean;
  organizationsWithSingleOwner: TOrganization[];
  disableSsoReauth: boolean;
}

export const DeleteAccountModal = ({
  setOpen,
  open,
  user,
  isContiniumCloud,
  organizationsWithSingleOwner,
  disableSsoReauth,
}: DeleteAccountModalProps) => {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [password, setPassword] = useState("");
  const { signOut: signOutWithAudit } = useSignOut({ id: user.id, email: user.email });

  const isPasswordBackedAccount = user.identityProvider === "email";
  const needsSsoReauth =
    !isPasswordBackedAccount &&
    !disableSsoReauth &&
    isSsoReauthSupportedForProvider(user.identityProvider);

  const nextAuthProvider = needsSsoReauth
    ? identityProviderToNextAuthProvider(user.identityProvider)
    : null;

  const providerLabel = nextAuthProvider ? getProviderDisplayLabel(nextAuthProvider) : "";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setInputValue("");
      setPassword("");
    }
    setOpen(nextOpen);
  };

  const hasValidEmailConfirmation = inputValue.trim().toLowerCase() === user.email.toLowerCase();
  const hasValidPasswordConfirmation = isPasswordBackedAccount && password.length > 0;
  const hasValidConfirmation =
    hasValidEmailConfirmation && (!isPasswordBackedAccount || hasValidPasswordConfirmation);
  const isDeleteDisabled = needsSsoReauth ? !hasValidEmailConfirmation : !hasValidConfirmation;

  /** Standard email/password deletion flow. */
  const deleteAccount = async () => {
    try {
      if (!hasValidConfirmation) return;

      setDeleting(true);
      const result = await deleteUserAction(
        isPasswordBackedAccount
          ? { confirmationEmail: inputValue, password }
          : { confirmationEmail: inputValue }
      );

      if (!result?.data?.success) {
        const fallbackErrorMessage = t("common.something_went_wrong_please_try_again");
        let errorMessage = fallbackErrorMessage;

        if (result?.serverError === DELETE_ACCOUNT_WRONG_PASSWORD_ERROR) {
          errorMessage = t("environments.settings.profile.wrong_password");
        } else if (result) {
          errorMessage = getFormattedErrorMessage(result);
        }

        logger.error({ errorMessage }, "Account deletion action failed");
        toast.error(errorMessage || fallbackErrorMessage);
        return;
      }

      // Sign out with account deletion reason (no automatic redirect)
      await signOutWithAudit({
        reason: "account_deletion",
        redirect: false, // Prevent NextAuth automatic redirect
        clearEnvironmentId: true,
      });

      // Manual redirect after signOut completes
      if (isContiniumCloud) {
        window.location.replace("https://app.continium.com/s/clri52y3z8f221225wjdhsoo2");
      } else {
        window.location.replace("/auth/login");
      }
    } catch (error) {
      logger.error({ error }, "Account deletion failed");
      toast.error(t("common.something_went_wrong_please_try_again"));
    } finally {
      setDeleting(false);
    }
  };

  /**
   * SSO re-authentication path: creates a one-time intent token then hands off to the
   * OAuth provider. The completion route at ACCOUNT_DELETION_SSO_REAUTH_CALLBACK_PATH
   * handles the actual deletion after the OAuth round-trip.
   */
  const initiateSsoReauthDeletion = async () => {
    if (!hasValidEmailConfirmation || !nextAuthProvider) return;

    try {
      setDeleting(true);

      const result = await initiateAccountDeletionSsoReauthAction({
        confirmationEmail: inputValue,
      });

      if (!result?.data?.intentToken) {
        toast.error(t("common.something_went_wrong_please_try_again"));
        setDeleting(false);
        return;
      }

      // Build the callback URL with the intent token. Use window.location.origin so
      // the URL is always correct for the current deployment without a server-side constant.
      const callbackUrl = `${window.location.origin}${ACCOUNT_DELETION_SSO_REAUTH_CALLBACK_PATH}?intent=${result.data.intentToken}`;
      const authParams = getReauthAuthorizationParams(nextAuthProvider);

      // signIn redirects the browser to the OAuth provider; setDeleting stays true
      // to prevent re-clicks while the page navigates away.
      await signIn(nextAuthProvider, { callbackUrl }, authParams);
    } catch (error) {
      logger.error({ error }, "Failed to initiate SSO reauth for account deletion");
      toast.error(t("common.something_went_wrong_please_try_again"));
      setDeleting(false);
    }
  };

  const handleDelete = needsSsoReauth ? initiateSsoReauthDeletion : deleteAccount;

  return (
    <DeleteDialog
      open={open}
      setOpen={handleOpenChange}
      deleteWhat={t("common.account")}
      onDelete={handleDelete}
      text={t("environments.settings.profile.account_deletion_consequences_warning")}
      isDeleting={deleting}
      disabled={isDeleteDisabled}>
      <div className="py-5">
        <ul className="list-disc pb-6 pl-6">
          <li>
            {t(
              "environments.settings.profile.permanent_removal_of_all_of_your_personal_information_and_data"
            )}
          </li>
          {organizationsWithSingleOwner.length > 0 && (
            <li>
              <Trans
                i18nKey="environments.settings.profile.organizations_delete_message"
                components={{ b: <b /> }}
              />
            </li>
          )}
          {organizationsWithSingleOwner.length > 0 && (
            <ul className="ml-4" style={{ listStyleType: "circle" }}>
              {organizationsWithSingleOwner.map((organization) => {
                if (organization.name) {
                  return <li key={organization.name}>{organization.name}</li>;
                }
              })}
            </ul>
          )}
          <li>{t("environments.settings.profile.warning_cannot_undo")}</li>
        </ul>
        <form
          data-testid="deleteAccountForm"
          onSubmit={async (e) => {
            e.preventDefault();
            await handleDelete();
          }}>
          <label htmlFor="deleteAccountConfirmation">
            {t("environments.settings.profile.please_enter_email_to_confirm_account_deletion", {
              email: user.email,
            })}
          </label>
          <Input
            data-testid="deleteAccountConfirmation"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={user.email}
            className="mt-5"
            type="text"
            id="deleteAccountConfirmation"
            name="deleteAccountConfirmation"
          />
          {isPasswordBackedAccount && (
            <PasswordInput
              id="deleteAccountPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("common.password")}
              className="mt-3"
            />
          )}
          {needsSsoReauth && (
            <p className="mt-3 text-sm text-slate-500">
              {t("environments.settings.profile.sso_reauth_required_for_deletion", {
                provider: providerLabel,
                defaultValue: `You will be redirected to ${providerLabel} to confirm your identity.`,
              })}
            </p>
          )}
        </form>
      </div>
    </DeleteDialog>
  );
};
