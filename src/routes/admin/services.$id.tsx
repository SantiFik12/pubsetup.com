import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { ServiceForm } from "@/components/admin/ServiceForm";

const api = getRouteApi("/admin/services/$id");

export const Route = createFileRoute("/admin/services/$id")({
  component: EditService,
});

function EditService() {
  const { id } = api.useParams();
  return <ServiceForm serviceId={id} />;
}
