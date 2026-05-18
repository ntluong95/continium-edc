import { redirect } from "next/navigation";
import { getFormsTabHref } from "@/modules/survey/list/lib/forms-tabs";

interface InstrumentsPageProps {
  params: Promise<{ environmentId: string }>;
}

const InstrumentsPage = async ({ params }: InstrumentsPageProps) => {
  const { environmentId } = await params;
  redirect(getFormsTabHref(environmentId, "form-version"));
};

export default InstrumentsPage;
