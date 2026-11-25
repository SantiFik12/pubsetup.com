import { extensionBuyingNote } from "@/lib/extension-editorial";
import type { Extension } from "@/data/types";

export function ExtensionBuyingNotes({ item }: { item: Extension }) {
  const note = extensionBuyingNote(item);
  if (!note) return null;
  return <section aria-labelledby="buying-notes-heading" className="container-page max-w-4xl border-t border-border py-12">
    <h2 id="buying-notes-heading" className="text-2xl font-bold tracking-tight text-foreground">Buying and setup notes</h2>
    <p className="mt-3 text-sm text-muted-foreground">Pubsetup editorial guidance based on the vendor documentation linked below. Reviewed {new Date(`${note.reviewedAt}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" })}.</p>
    {note.sections.map(section => <div key={section.heading} className="mt-7">
      <h3 className="text-lg font-semibold text-foreground">{section.heading}</h3>
      {section.text && <p className="mt-3 leading-relaxed text-foreground">{section.text}</p>}
      {section.items && <ul className="mt-3 ml-5 list-disc space-y-3 leading-relaxed text-foreground">{section.items.map(text => <li key={text}>{text}</li>)}</ul>}
    </div>)}
    <div className="mt-8 border-t border-border pt-5">
      <p className="text-sm font-semibold text-foreground">Vendor sources</p>
      <ul className="mt-2 space-y-2 text-sm">{note.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{source.title} ↗</a></li>)}</ul>
    </div>
  </section>;
}
