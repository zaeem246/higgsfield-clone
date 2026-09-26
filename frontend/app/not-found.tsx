import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="shell py-14 md:py-20">
      <p className="label">404</p>
      <h1 className="display mt-3 max-w-2xl text-[clamp(2.75rem,8vw,5rem)]">
        That page is not here.
      </h1>
      <p className="mt-4 max-w-md text-graphite">
        The page you asked for does not exist. Generating something, and looking at what other
        people have generated, both do.
      </p>
      <div className="mt-6 flex flex-wrap gap-2.5">
        <ButtonLink href="/create" size="lg">
          Start creating
        </ButtonLink>
        <ButtonLink href="/gallery" variant="outline" size="lg">
          See examples
        </ButtonLink>
      </div>
    </div>
  );
}
