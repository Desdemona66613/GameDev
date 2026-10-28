import { notFound } from "next/navigation";

import { SkillChip } from "@/components/skill-chip";
import { SiteHeader } from "@/components/site-header";
import { requests } from "@/lib/mock-data";

export default async function RequestPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  const request = requests.find((r) => r.id === id);

  if (request === undefined) {
    notFound();
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <article className="border-line bg-panel rounded-[4px] border p-6">
          <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance">
            {request.title}
          </h1>

          <p className="text-muted mt-2">
            {request.author.displayName}, {request.postedAgo}
          </p>

          <div className="border-line mt-6 grid grid-cols-1 gap-6 border-t pt-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-missing font-semibold">Hledá</h2>
              <div className="mt-2">
                <SkillChip discipline={request.needs} state="missing" />
              </div>
            </div>
            <div>
              <h2 className="font-display text-have font-semibold">
                Nabízí zpět
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {request.gives.map((d) => (
                  <SkillChip key={d} discipline={d} state="have" />
                ))}
              </div>
            </div>
          </div>

          <dl className="border-line mt-6 flex gap-8 border-t pt-6">
            <div>
              <dd className="font-display text-2xl font-semibold tabular-nums">
                {request.credits}
              </dd>
              <dt className="text-muted text-sm">kreditů</dt>
            </div>
            <div>
              <dd className="font-display text-2xl font-semibold tabular-nums">
                ~{request.estimateHours} h
              </dd>
              <dt className="text-muted text-sm">odhad</dt>
            </div>
            <div>
              <dd className="font-display text-2xl font-semibold tabular-nums">
                {request.offerCount}
              </dd>
              <dt className="text-muted text-sm">nabídek</dt>
            </div>
          </dl>
        </article>
      </main>
    </>
  );
}
