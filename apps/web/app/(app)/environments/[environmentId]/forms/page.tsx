import { SurveysPage, metadata } from "@/modules/survey/list/page";

export { metadata };

interface FormsPageProps {
  params: Promise<{ environmentId: string }>;
  searchParams?: Promise<{ tab?: string | string[] }>;
}

const FormsPage = ({ params, searchParams }: FormsPageProps) => {
  return <SurveysPage params={params} searchParams={searchParams} />;
};

export default FormsPage;
