import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth";

export const metadata = { title: "Přihlášení — GameDev Hub" };

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { sent, error } = await searchParams;
  if ((await getUser()) !== null) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Přihlaš se
      </h1>
      <p className="text-muted mt-2">
        Pošleme ti odkaz na e-mail. Žádné heslo si pamatovat nemusíš.
      </p>

      {sent !== undefined && (
        <p
          role="status"
          className="border-have/30 bg-have-soft text-have mt-6 rounded-[3px] border p-3"
        >
          Pokud k té adrese patří účet, poslali jsme na ni přihlašovací odkaz.
        </p>
      )}

      {error !== undefined && (
        <p
          role="alert"
          className="border-missing/40 bg-missing-soft/50 text-missing mt-6 rounded-[3px] border p-3"
        >
          {error === "email"
            ? "Zkontroluj adresu, tahle nevypadá platně."
            : "Odkaz už neplatí. Nech si poslat nový."}
        </p>
      )}

      <form action="/auth/magic-link" method="post" className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="border-line bg-panel focus-visible:border-ink focus-visible:ring-ink/20 mt-1 w-full rounded-[3px] border px-3 py-2 outline-none focus-visible:ring-2"
          />
        </div>

        <button
          type="submit"
          className="bg-ink text-panel focus-visible:ring-ink/40 w-full rounded-[3px] px-4 py-2.5 font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          Poslat odkaz
        </button>
      </form>
    </main>
  );
}
