import { createFileRoute } from "@tanstack/react-router";
import { ExtensionForm } from "@/components/admin/ExtensionForm";

export const Route = createFileRoute("/admin/extensions/$id")({
  component: EditExtensionPage,
});

function EditExtensionPage() {
  const { id } = Route.useParams();
  return <ExtensionForm id={id} />;
}
