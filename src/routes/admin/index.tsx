import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: () => <Navigate to="/admin/extensions" />,
});
