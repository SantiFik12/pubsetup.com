import { createFileRoute } from "@tanstack/react-router";
import { ExtensionForm } from "@/components/admin/ExtensionForm";

export const Route = createFileRoute("/admin/extensions/new")({
  component: () => <ExtensionForm />,
});
