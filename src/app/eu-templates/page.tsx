import { EUTemplateLibraryView } from "@/components/eu-templates/EUTemplateLibraryView";

export const metadata = {
  title: "EU MDR Document Library | Anathem Governance",
  description: "Generate, review and download all 93 EU MDR required documents.",
};

export default function EUTemplatesPage() {
  return <EUTemplateLibraryView />;
}
