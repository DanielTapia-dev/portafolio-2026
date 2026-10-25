import Link from 'next/link';
import {ExternalLink, Folder, FolderGit2, Github} from 'lucide-react';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Locale} from 'next-intl';
import ProjectGallery from '@/app/components/ProjectGallery';
import Reveal from '@/app/components/Reveal';
import {cn} from '@/lib/utils';
import {projects, type Project} from '@/lib/projects';

const linkClassName = (href?: string) =>
  cn(
    'text-muted-foreground transition-colors hover:text-primary',
    (!href || href === '#') && 'pointer-events-none opacity-40'
  );

function ProjectLinks({
  project,
  size,
  labels
}: {
  project: Project;
  size: number;
  labels: {code: string; live: string};
}) {
  if (!project.liveUrl) return null;

  return (
    <div className="flex gap-4">
      <Link
        href={project.githubUrl ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName(project.githubUrl)}
        aria-label={labels.code}
      >
        <Github size={size} />
      </Link>
      <Link
        href={project.liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName(project.liveUrl)}
        aria-label={labels.live}
      >
        <ExternalLink size={size} />
      </Link>
    </div>
  );
}

function SectionTitle({children}: {children: React.ReactNode}) {
  return (
    <div className="mb-12 flex items-center gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export default async function Projects({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('Projects');

  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);
  const linkLabels = {code: t('viewCode'), live: t('viewLive')};

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-20 max-w-3xl space-y-5 animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <FolderGit2 size={14} />
            {t('eyebrow')}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            {t('title')}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t('intro')}
          </p>
        </header>

        <section className="mb-28">
          <SectionTitle>{t('featured')}</SectionTitle>

          <div className="space-y-24 lg:space-y-32">
            {featuredProjects.map((project, index) => {
              const hasImages = Boolean(project.images?.length);
              // Alternate image and text sides on large screens.
              const isReversed = index % 2 === 1;
              const title = t(`items.${project.slug}.title`);

              return (
                <Reveal
                  key={project.slug}
                  className={cn(
                    'grid items-center gap-8 lg:gap-12',
                    hasImages && 'lg:grid-cols-[1.15fr_1fr]'
                  )}
                >
                  {hasImages && (
                    <div className={cn(isReversed && 'lg:order-2')}>
                      <ProjectGallery images={project.images!} title={title} />
                    </div>
                  )}

                  <div className={cn('space-y-5', isReversed && 'lg:order-1')}>
                    <p className="font-mono text-sm text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                      {title}
                    </h3>
                    <p className="leading-relaxed text-muted-foreground">
                      {t(`items.${project.slug}.description`)}
                    </p>

                    <ul className="flex flex-wrap gap-2">
                      {project.techs.map((tech) => (
                        <li
                          key={tech}
                          className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>

                    <ProjectLinks
                      project={project}
                      size={20}
                      labels={linkLabels}
                    />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle>{t('other')}</SectionTitle>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherProjects.map((project, index) => (
              <Reveal key={project.slug} delay={index * 100}>
                <div className="group flex h-full flex-col rounded-xl border border-border bg-card/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_50px_-25px_var(--primary)]">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <Folder size={20} className="text-primary" />
                    </div>
                    <ProjectLinks
                      project={project}
                      size={18}
                      labels={linkLabels}
                    />
                  </div>

                  <h3 className="mb-2 font-semibold text-foreground transition-colors group-hover:text-primary">
                    {t(`items.${project.slug}.title`)}
                  </h3>
                  <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`items.${project.slug}.description`)}
                  </p>

                  <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                    {project.techs.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
