import { redirect } from "next/navigation";

interface ClinicalPageProps {
  params: Promise<{ environmentId: string }>;
}

const ClinicalPage = async ({ params }: ClinicalPageProps) => {
  const { environmentId } = await params;
  redirect(`/environments/${environmentId}/clinical/protocol`);
};

export default ClinicalPage;
