import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(5000),
  // honeypot
  website: z.string().max(0).optional().or(z.literal("")),
});

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Diagnostic: surface env presence (no values, just booleans)
        console.log("[contact] env check", {
          SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
          VITE_SUPABASE_URL: Boolean(import.meta.env.VITE_SUPABASE_URL),
          SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          SUPABASE_PUBLISHABLE_KEY: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY),
        });

        let payload: unknown;
        try {
          payload = await request.json();
        } catch (e) {
          console.error("[contact] invalid JSON", e);
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = ContactSchema.safeParse(payload);
        if (!parsed.success) {
          console.warn("[contact] validation failed", parsed.error.flatten());
          return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
        }
        const { name, email, subject, message, website } = parsed.data;

        // Honeypot triggered → pretend success
        if (website) return Response.json({ ok: true });

        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          null;
        const userAgent = request.headers.get("user-agent") || null;

        let inserted: { id: string } | null = null;
        try {
          const { data, error } = await supabaseAdmin
            .from("contact_messages")
            .insert({
              name,
              email,
              subject: subject || null,
              message,
              ip,
              user_agent: userAgent,
            })
            .select("id")
            .single();

          if (error) {
            console.error("[contact] insert error", {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            });
            return Response.json(
              { error: "Failed to save message", debug: error.message },
              { status: 500 },
            );
          }
          inserted = data;
        } catch (e) {
          console.error("[contact] insert threw", e instanceof Error ? { message: e.message, stack: e.stack } : e);
          return Response.json(
            { error: "Server error", debug: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }

        // Best-effort email notification via Lovable Emails (only if configured).
        // The actual email send route is added once an email domain is set up.
        try {
          const origin = new URL(request.url).origin;
          await fetch(`${origin}/lovable/email/transactional/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateName: "contact-form-notification",
              recipientEmail: "contact@pubsetup.com",
              idempotencyKey: `contact-${inserted!.id}`,
              templateData: { name, email, subject: subject || "(no subject)", message },
            }),
          }).catch(() => {});
        } catch {
          // ignore — message is already persisted
        }

        return Response.json({ ok: true, id: inserted!.id });
      },
    },
  },
});
