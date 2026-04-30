import { createFileRoute } from "@tanstack/react-router";
import { ServiceForm } from "@/components/admin/ServiceForm";

export const Route = createFileRoute("/admin/services/new")({
  component: () => <ServiceForm />,
});
