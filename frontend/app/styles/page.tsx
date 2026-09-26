import type { Metadata } from "next";
import Link from "next/link";
import { CameraDeck } from "@/components/camera-deck";
import { PageHeader } from "@/components/page-header";
import { ApiNotice, Notice } from "@/components/ui/notice";
import { Reveal } from "@/components/ui/reveal";
import { serverApi } from "@/lib/api.server";
import { byGroup, COMPOSE_ORDER, FAMILY_META, presetsOf } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Styles and camera moves",
  description:
    "Every look and every camera move you can add to a shot — film stock, colour, lighting, effect and camera — with the exact words each one puts into your prompt.",
};

export default async function StylesPage() {
  const catalog = await (await serverApi()).catalog();

  return (
    <div className="shell pb-14">
      <PageHeader
        kicker="Every look and move you can add"
        title="Styles & camera moves"
        lede="These are the choices you make on top of your prompt. Nothing is hidden: each one adds a fixed piece of text to what gets generated, and that text is printed here. Point at any camera move to watch it play."
        meta={
          catalog.ok
            ? [
                `${catalog.data.presets.length} choices`,
                `${COMPOSE_ORDER.length} kinds`,
                "free to browse",
              ]
            : undefined
        }
      />

      <div className="pt-6">
        {!catalog.ok ? (
          <ApiNotice error={catalog.error} />
        ) : catalog.data.presets.length === 0 ? (
          <Notice title="There is nothing to browse.">
            <p>The API answered, but returned nothing to browse.</p>
          </Notice>
        ) : (
          <div className="space-y-9">
            {COMPOSE_ORDER.map((family) => {
              const presets = presetsOf(catalog.data, family);
              if (presets.length === 0) return null;

              return (
                <section key={family} aria-labelledby={`family-${family}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule pb-2">
                    <h2 id={`family-${family}`} className="display text-[2rem] leading-none">
                      {FAMILY_META[family].label}
                    </h2>
                    <p className="text-[0.875rem] text-graphite">
                      {family === "camera"
                        ? "How the camera moves. Point at one and it plays."
                        : FAMILY_META[family].blurb}
                    </p>
                    <p className="label">{presets.length} options</p>
                  </div>

                  {family === "camera" ? (
                    <CameraDeck presets={presets} />
                  ) : (
                    byGroup(presets).map(([group, items], groupIndex) => (
                      <div key={group} className="pt-4">
                        <h3 className="label mb-2">{group}</h3>
                        <ul className="grid border-t border-l border-rule sm:grid-cols-2 lg:grid-cols-3">
                          {items.map((preset, i) => (
                            <li key={preset.id} className="border-r border-b border-rule">
                              <Reveal
                                index={Math.min(i + groupIndex, 8)}
                                className="h-full px-3 py-2.5"
                              >
                                <p className="text-[0.875rem] font-medium text-ink">
                                  {preset.name}
                                </p>
                                <p className="meta mt-1">{preset.fragment}</p>
                              </Reveal>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </section>
              );
            })}

            <p className="border-t border-rule pt-4 text-sm text-graphite">
              Put them to work — head over to{" "}
              <Link
                href="/create"
                className="text-ink underline decoration-vermilion decoration-2 underline-offset-4"
              >
                Create
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
