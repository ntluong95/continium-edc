"use client";

import { PipelineTriggers, Webhook } from "@prisma/client";
import clsx from "clsx";
import { Webhook as WebhookIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { TSurvey } from "@continium/types/surveys/types";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { SurveyCheckboxGroup } from "@/modules/integrations/webhooks/components/survey-checkbox-group";
import { TriggerCheckboxGroup } from "@/modules/integrations/webhooks/components/trigger-checkbox-group";
import { WebhookCreatedModal } from "@/modules/integrations/webhooks/components/webhook-created-modal";
import { isDiscordWebhook, validWebHookURL } from "@/modules/integrations/webhooks/lib/utils";
import { Button } from "@/modules/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/ui/components/dialog";
import { Input } from "@/modules/ui/components/input";
import { Label } from "@/modules/ui/components/label";
import { createWebhookAction, testEndpointAction } from "../actions";
import { TWebhookInput } from "../types/webhooks";

interface AddWebhookModalProps {
  environmentId: string;
  open: boolean;
  surveys: TSurvey[];
  setOpen: (v: boolean) => void;
  allowInternalUrls: boolean;
}

export const AddWebhookModal = ({
  environmentId,
  surveys,
  open,
  setOpen,
  allowInternalUrls,
}: AddWebhookModalProps) => {
  const router = useRouter();
  const {
    handleSubmit,
    reset,
    register,
    formState: { isSubmitting },
  } = useForm<TWebhookInput>();
  const { t } = useTranslation();
  const [testEndpointInput, setTestEndpointInput] = useState("");
  const [hittingEndpoint, setHittingEndpoint] = useState<boolean>(false);
  const [endpointAccessible, setEndpointAccessible] = useState<boolean>();
  const [selectedTriggers, setSelectedTriggers] = useState<PipelineTriggers[]>([]);
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [selectedAllSurveys, setSelectedAllSurveys] = useState(false);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [createdWebhook, setCreatedWebhook] = useState<Webhook | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | undefined>();

  const handleTestEndpoint = async (
    sendSuccessToast: boolean
  ): Promise<{ success: boolean; secret?: string }> => {
    try {
      const { valid, error } = validWebHookURL(testEndpointInput, allowInternalUrls);
      if (!valid) {
        toast.error(error ?? t("common.something_went_wrong_please_try_again"));
        return { success: false };
      }
      setHittingEndpoint(true);
      const result = await testEndpointAction({ url: testEndpointInput, secret: webhookSecret });
      if (!result?.data) {
        throw new Error(getFormattedErrorMessage(result));
      }
      setHittingEndpoint(false);
      if (sendSuccessToast) toast.success(t("environments.integrations.webhooks.endpoint_pinged"));
      setEndpointAccessible(true);
      if (result.data.secret) setWebhookSecret(result.data.secret);
      return result.data;
    } catch (err) {
      setHittingEndpoint(false);
      const errMessage = err instanceof Error ? err.message : "Unknown error occurred";
      toast.error(
        `${t("environments.integrations.webhooks.endpoint_pinged_error")} \n ${
          errMessage.length < 250 ? errMessage : t("environments.integrations.webhooks.please_check_console")
        }`,
        { className: errMessage.length < 250 ? "break-all" : "" }
      );
      setEndpointAccessible(false);
      return { success: false };
    }
  };

  const handleSelectAllSurveys = () => {
    setSelectedAllSurveys(!selectedAllSurveys);
    setSelectedSurveys([]);
  };

  const handleSelectedSurveyChange = (surveyId: string) => {
    setSelectedSurveys((prev) =>
      prev.includes(surveyId) ? prev.filter((id) => id !== surveyId) : [...prev, surveyId]
    );
  };

  const handleCheckboxChange = (selectedValue: PipelineTriggers) => {
    setSelectedTriggers((prev) =>
      prev.includes(selectedValue) ? prev.filter((v) => v !== selectedValue) : [...prev, selectedValue]
    );
  };

  const submitWebhook = async (data: TWebhookInput): Promise<void> => {
    if (!isSubmitting) {
      try {
        setCreatingWebhook(true);
        if (!testEndpointInput) {
          throw new Error(t("environments.integrations.webhooks.please_enter_a_url"));
        }
        if (selectedTriggers.length === 0) {
          throw new Error(t("common.please_select_at_least_one_trigger"));
        }
        if (!selectedAllSurveys && selectedSurveys.length === 0) {
          throw new Error(t("common.please_select_at_least_one_survey"));
        }
        if (isDiscordWebhook(testEndpointInput)) {
          throw new Error(t("environments.integrations.webhooks.discord_webhook_not_supported"));
        }

        const testResult = await handleTestEndpoint(false);
        if (!testResult.success) return;

        const updatedData: TWebhookInput = {
          name: data.name,
          url: testEndpointInput,
          source: "user",
          triggers: selectedTriggers,
          surveyIds: selectedSurveys,
        };

        const result = await createWebhookAction({
          environmentId,
          webhookInput: updatedData,
          webhookSecret: testResult.secret,
        });
        if (result?.data) {
          router.refresh();
          setCreatedWebhook(result.data);
          toast.success(t("environments.integrations.webhooks.webhook_added_successfully"));
        } else {
          toast.error(getFormattedErrorMessage(result));
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Unknown error occurred");
      } finally {
        setCreatingWebhook(false);
      }
    }
  };

  const resetAndClose = () => {
    setOpen(false);
    reset();
    setTestEndpointInput("");
    setEndpointAccessible(undefined);
    setSelectedSurveys([]);
    setSelectedTriggers([]);
    setSelectedAllSurveys(false);
    setCreatedWebhook(null);
    setWebhookSecret(undefined);
  };

  if (createdWebhook) {
    return <WebhookCreatedModal open={open} webhook={createdWebhook} onClose={resetAndClose} />;
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent>
        <DialogHeader>
          <WebhookIcon />
          <DialogTitle>{t("environments.integrations.webhooks.add_webhook")}</DialogTitle>
          <DialogDescription>
            {t("environments.integrations.webhooks.add_webhook_description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitWebhook)}>
          <DialogBody className="space-y-4 pb-4">
            <div className="col-span-1">
              <Label htmlFor="name">{t("common.name")}</Label>
              <div className="mt-1 flex">
                <Input
                  type="text"
                  id="name"
                  {...register("name")}
                  placeholder={t("environments.integrations.webhooks.webhook_name_placeholder")}
                />
              </div>
            </div>

            <div className="col-span-1">
              <Label htmlFor="URL">{t("common.url")}</Label>
              <div className="mt-1 flex">
                <Input
                  type="url"
                  id="URL"
                  value={testEndpointInput}
                  onChange={(e) => setTestEndpointInput(e.target.value)}
                  className={clsx(
                    endpointAccessible === true
                      ? "border-green-500 bg-green-50"
                      : endpointAccessible === false
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200 bg-white"
                  )}
                  placeholder={t("environments.integrations.webhooks.webhook_url_placeholder")}
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={hittingEndpoint}
                  className="ml-2 whitespace-nowrap"
                  disabled={testEndpointInput.trim() === ""}
                  onClick={() => handleTestEndpoint(true)}>
                  {t("environments.integrations.webhooks.test_endpoint")}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="Triggers">{t("environments.integrations.webhooks.triggers")}</Label>
              <TriggerCheckboxGroup
                selectedTriggers={selectedTriggers}
                onCheckboxChange={handleCheckboxChange}
                allowChanges={true}
              />
            </div>

            <div>
              <Label htmlFor="Surveys">{t("common.surveys")}</Label>
              <SurveyCheckboxGroup
                surveys={surveys}
                selectedSurveys={selectedSurveys}
                selectedAllSurveys={selectedAllSurveys}
                onSelectAllSurveys={handleSelectAllSurveys}
                onSelectedSurveyChange={handleSelectedSurveyChange}
                allowChanges={true}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={resetAndClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={creatingWebhook}>
              {t("environments.integrations.webhooks.add_webhook")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
