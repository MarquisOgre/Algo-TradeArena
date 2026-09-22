import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";

export type InfoSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function InfoPage({
  eyebrow,
  title,
  description,
  sections,
  notice,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: InfoSection[];
  notice?: string;
}) {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4 -ml-3">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back to ALPHENTRA
            </Link>
          </Button>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        {notice && (
          <div className="mb-5 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
            {notice}
          </div>
        )}

        <GlassCard className="divide-y divide-border p-0">
          {sections.map((section) => (
            <section key={section.title} className="px-5 py-6 sm:px-7">
              <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-6 text-muted-foreground">{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </section>
          ))}
        </GlassCard>
      </div>
    </AppShell>
  );
}
