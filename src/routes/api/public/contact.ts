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
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = ContactSchema.safeParse(payload);
        if (!parsed.success) {
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

        const { data: inserted, error } = await supabaseAdmin
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
          console.error("contact_messages insert failed", error);
          return Response.json({ error: "Failed to save message" }, { status: 500 });
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
              idempotencyKey: `contact-${inserted.id}`,
              templateData: { name, email, subject: subject || "(no subject)", message },
            }),
          }).catch(() => {});
        } catch {
          // ignore — message is already persisted
        }

        return Response.json({ ok: true, id: inserted.id });
      },
    },
  },
});
