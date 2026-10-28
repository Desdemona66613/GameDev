import { notFound } from "next/navigation";

import { SkillChip } from "@/components/skill-chip";
import { SiteHeader } from "@/components/site-header";
import { currentProfile, requests } from "@/lib/mock-data";

export default async function ProfilePage({
  params,
}: PageProps<"/u/[handle]">) {
  // Next 16: params is a Promise.
  const { handle } = await params;

  if (handle !== currentProfile.handle) {
    notFound();
  }

  const profile = currentProfile;
  const ownRequests = requests.filter((r) => r.author.handle === handle);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="border-line bg-panel rounded-[4px] border">
          <div className="border-line flex flex-col gap-6 border-b p-6 sm:flex-row sm:items-start">
            <div className="bg-ink font-display text-panel flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold">
              {profile.displayName.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                {profile.displayName}
              </h1>
              <p className="text-muted">{profile.location}</p>
              <p className="mt-3 max-w-xl leading-relaxed text-pretty">
                {profile.bio}
              </p>
            </div>

            <dl className="flex gap-8 sm:flex-col sm:gap-3 sm:text-right">
              <div>
                <dd className="font-display text-2xl font-semibold tabular-nums">
                  {profile.credits}
                </dd>
                <dt className="text-muted text-sm">kreditů</dt>
              </div>
              <div>
                <dd className="font-display text-2xl font-semibold tabular-nums">
                  {profile.completedTrades}
                </dd>
                <dt className="text-muted text-sm">dokončených výměn</dt>
              </div>
            </dl>
          </div>

          {/* The trade panel: the product's core mechanic, on screen. */}
          <div className="divide-line grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <section className="p-6">
              <h2 className="font-display text-have text-lg font-semibold">
                Umí
              </h2>
              <p className="text-muted mt-1 text-sm">
                Za tohle si vydělává kredity.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.offers.map((d) => (
                  <SkillChip key={d} discipline={d} state="have" />
                ))}
              </div>
            </section>

            <section className="p-6">
              <h2 className="font-display text-missing text-lg font-semibold">
                Chybí
              </h2>
              <p className="text-muted mt-1 text-sm">
                Za tohle kredity utrácí.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.needs.map((d) => (
                  <SkillChip key={d} discipline={d} state="missing" />
                ))}
              </div>
            </section>
          </div>
        </div>

        <h2 className="font-display mt-10 mb-4 text-xl font-semibold">
          Otevřené poptávky
        </h2>

        {ownRequests.length === 0 ? (
          <p className="border-line text-muted rounded-[4px] border border-dashed p-8 text-center">
            Zatím nic nepoptává. Založ poptávku a ozve se ti někdo, kdo to umí.
          </p>
        ) : (
          <ul className="divide-line border-line bg-panel divide-y overflow-hidden rounded-[4px] border">
            {ownRequests.map((request) => (
              <li
                key={request.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{request.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted">hledá</span>
                    <SkillChip discipline={request.needs} state="missing" />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-xl font-semibold tabular-nums">
                    {request.credits}
                  </div>
                  <div className="text-muted text-sm">kreditů</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
