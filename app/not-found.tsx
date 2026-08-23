import Link from "next/link";
import { Container } from "@/components/section";
import { projectsByDate } from "@/lib/projects";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col justify-center py-24">
      <p className="meta-sm text-ink-faint">404</p>
      <h1 className="mt-6 max-w-[14ch] text-[clamp(2.25rem,7vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-ink">
        No node at this address.
      </h1>
      <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-muted">
        The page you asked for is not part of the system. The archive is, and
        everything in it is one click away.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/"
          className="press inline-flex h-12 items-center rounded-full bg-ink px-6 text-[13px] font-medium text-ink-inverse transition-colors hover:bg-black"
        >
          Back to the index
        </Link>
        <Link
          href="/#work"
          className="press inline-flex h-12 items-center rounded-full border border-rule-strong bg-paper-raised px-6 text-[13px] font-medium text-ink transition-colors hover:border-ink"
        >
          Open the archive
        </Link>
      </div>

      <ul className="mt-14 flex flex-wrap gap-x-6 gap-y-3 border-t border-rule pt-8">
        {projectsByDate.map((project) => (
          <li key={project.id}>
            <Link
              href={`/work/${project.id}`}
              className="meta-sm text-ink-faint transition-colors hover:text-ink"
            >
              {project.title}
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
