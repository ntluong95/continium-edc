import { IS_CONTINIUM_CLOUD } from "@/lib/constants";
import Loading from "@/modules/organization/settings/api-keys/loading";

export default function LoadingPage() {
  return <Loading isContiniumCloud={IS_CONTINIUM_CLOUD} />;
}
