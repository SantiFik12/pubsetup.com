import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

type Props = {
  trigger: React.ReactNode;
};

type Status = "idle" | "submitting" | "success" | "error";

export function ContactDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      subject: String(fd.get("subject") || "").trim(),
      message: String(fd.get("message") || "").trim(),
      website: String(fd.get("website") || ""), // honeypot
    };

    if (payload.name.length < 1 || payload.email.length < 5 || payload.message.length < 5) {
      setStatus("error");
      setErrorMsg("Please fill in your name, a valid email, and a message (min 5 chars).");
      return;
    }

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Request failed");
      }
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // reset after dialog closes
      setTimeout(() => {
        setStatus("idle");
        setErrorMsg(null);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5 text-primary" />
            Contact us
          </DialogTitle>
          <DialogDescription>
            Have a question about an extension or our installation service? Send us a message and we'll reply within 1 business day.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Message sent</h3>
            <p className="text-sm text-muted-foreground">
              Thanks for reaching out — we'll get back to you shortly.
            </p>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="ring-focus mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot — hidden from real users */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid gap-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input id="contact-name" name="name" required maxLength={100} placeholder="Your name" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" name="email" type="email" required maxLength={255} placeholder="you@example.com" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact-subject">
                Subject <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="contact-subject" name="subject" maxLength={200} placeholder="What's it about?" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                name="message"
                required
                minLength={5}
                maxLength={5000}
                rows={5}
                placeholder="How can we help?"
              />
            </div>

            {errorMsg && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMsg}</p>
            )}

            <DialogFooter>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="ring-focus inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-hover disabled:opacity-60 sm:w-auto"
              >
                {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                {status === "submitting" ? "Sending..." : "Send message"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
