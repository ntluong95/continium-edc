"use client";

import Link from "next/link";
import "prismjs/themes/prism.css";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { TProjectConfigChannel } from "@continium/types/project";
import { Button } from "@/modules/ui/components/button";
import { CodeBlock } from "@/modules/ui/components/code-block";
import { Html5Icon, NpmIcon } from "@/modules/ui/components/icons";
import { TabBar } from "@/modules/ui/components/tab-bar";

const tabs = [
  { id: "html", label: "HTML", icon: <Html5Icon /> },
  { id: "npm", label: "NPM", icon: <NpmIcon /> },
];

interface OnboardingSetupInstructionsProps {
  environmentId: string;
  publicDomain: string;
  channel: TProjectConfigChannel;
  appSetupCompleted: boolean;
}

export const OnboardingSetupInstructions = ({
  environmentId,
  publicDomain,
  channel,
  appSetupCompleted,
}: OnboardingSetupInstructionsProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const htmlSnippetForAppSurveys = `<!-- START Continium Surveys -->
  <script type="text/javascript">
  !function(){
      var appUrl = "${publicDomain}";
      var environmentId = "${environmentId}";
      var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src=appUrl+"/js/continium.umd.cjs",t.onload=function(){window.continium?window.continium.setup({environmentId:environmentId,appUrl:appUrl}):console.error("Continium library failed to load properly. The continium object is not available.");};var e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}();
  </script>
  <!-- END Continium Surveys -->
  `;

  const htmlSnippetForWebsiteSurveys = `<!-- START Continium Surveys -->
  <script type="text/javascript">
  !function(){
    var appUrl = "${publicDomain}";
    var environmentId = "${environmentId}";
    var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src=appUrl+"/js/continium.umd.cjs",t.onload=function(){window.continium?window.continium.setup({environmentId:environmentId,appUrl:appUrl}):console.error("Continium library failed to load properly. The continium object is not available.");};var e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}();
  </script>
  <!-- END Continium Surveys -->
  `;

  const npmSnippetForAppSurveys = `
  import continium from "@continium/js";
  
  if (typeof window !== "undefined") {
    continium.setup({
      environmentId: "${environmentId}",
      appUrl: "${publicDomain}",
    });
  }
  
  function App() {
    // your own app
  }
  
  export default App;
  `;

  const npmSnippetForWebsiteSurveys = `
  // other imports
  import continium from "@continium/js";
  
  if (typeof window !== "undefined") {
    continium.setup({
      environmentId: "${environmentId}",
      appUrl: "${publicDomain}",
    });
  }
  
  function App() {
    // your own app
  }
  
  export default App;
  
  `;

  return (
    <div>
      <div className="flex h-14 w-full items-center justify-center rounded-md border border-slate-200 bg-white">
        <TabBar
          tabs={tabs}
          activeId={activeTab}
          setActiveId={setActiveTab}
          tabStyle="button"
          className="bg-slate-100"
        />
      </div>
      <div>
        {activeTab === "npm" ? (
          <div className="prose prose-slate w-full">
            <CodeBlock customEditorClass="!bg-white border border-slate-200" language="sh">
              npm install @continium/js
            </CodeBlock>
            <p>{t("common.or")}</p>
            <CodeBlock customEditorClass="!bg-white border border-slate-200" language="sh">
              yarn add @continium/js
            </CodeBlock>
            <p className="text-sm text-slate-700">
              {t("environments.connect.import_continium_and_initialize_the_widget_in_your_component")}
            </p>
            <CodeBlock customEditorClass="!bg-white border border-slate-200" language="js">
              {channel === "app" ? npmSnippetForAppSurveys : npmSnippetForWebsiteSurveys}
            </CodeBlock>
            <Button id="onboarding-inapp-connect-read-npm-docs" className="mt-3" variant="secondary" asChild>
              <Link
                className="no-underline"
                href={`https://continium.com/docs/${channel}-surveys/framework-guides`}
                target="_blank">
                {t("common.read_docs")}
              </Link>
            </Button>
          </div>
        ) : activeTab === "html" ? (
          <div className="prose prose-slate">
            <p className="-mb-1 mt-6 text-sm text-slate-700">
              {t("environments.connect.insert_this_code_into_the_head_tag_of_your_website")}
            </p>
            <div>
              <CodeBlock customEditorClass="!bg-white border border-slate-200" language="js">
                {channel === "app" ? htmlSnippetForAppSurveys : htmlSnippetForWebsiteSurveys}
              </CodeBlock>
            </div>

            <div className="mt-4 flex justify-between space-x-2">
              <Button
                id="onboarding-inapp-connect-copy-code"
                variant={appSetupCompleted ? "secondary" : "default"}
                onClick={() => {
                  navigator.clipboard.writeText(
                    channel === "app" ? htmlSnippetForAppSurveys : htmlSnippetForWebsiteSurveys
                  );
                  toast.success(t("common.copied_to_clipboard"));
                }}>
                {t("common.copy_code")}
              </Button>

              <Button id="onboarding-inapp-connect-step-by-step-manual" variant="secondary" asChild>
                <Link
                  href={`https://continium.com/docs/${channel}-surveys/framework-guides#html`}
                  target="_blank"
                  className="no-underline">
                  {t("common.step_by_step_manual")}
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
