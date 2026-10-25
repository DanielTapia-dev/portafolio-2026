import Link from 'next/link';
import {ExternalLink, Folder, Github} from 'lucide-react';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Locale} from 'next-intl';
import ProjectGallery from '@/app/components/ProjectGallery';
import Reveal from '@/app/components/Reveal';
import {projects} from '@/lib/projects';

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

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16 space-y-4 animate-fade-up">
          <h1 className="text-4xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('intro')}</p>
        </div>

        {/* Featured Projects */}
        <section className="mb-20">
          <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase mb-8">
            {t('featured')}
          </h2>

          <div className="space-y-24">
            {featuredProjects.map((project, index) => {
              const hasImages = Boolean(project.images?.length);
              // Alternate image/text sides only when there is an image column.
              const isReversed = hasImages && index % 2 === 1;
              const title = t(`items.${project.slug}.title`);

              return (
                <Reveal
                  key={project.slug}
                  className={`grid gap-8 items-center ${hasImages ? 'lg:grid-cols-2' : ''}`}
                >
                  {/* Image */}
                  {hasImages && (
                    <div className={isReversed ? 'lg:order-2' : ''}>
                      <ProjectGallery images={project.images!} title={title} />
                    </div>
                  )}

                  {/* Content */}
                  <div
                    className={`space-y-4 ${isReversed ? 'lg:order-1 lg:text-right' : ''}`}
                  >
                    <h3 className="text-2xl font-bold text-foreground">
                      {title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-justify">
                      {t(`items.${project.slug}.description`)}
                    </p>

                    <div
                      className={`flex flex-wrap gap-2 ${isReversed ? 'lg:justify-end' : ''}`}
                    >
                      {project.techs.map((tech) => (
                        <span
                          key={tech}
                          className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    {project.liveUrl && (
                      <div
                        className={`flex gap-4 pt-2 ${isReversed ? 'lg:justify-end' : ''}`}
                      >
                        <Link
                          href={project.githubUrl ?? '#'}
                          className={`text-muted-foreground hover:text-primary transition-colors ${
                            !project.githubUrl || project.githubUrl === '#'
                              ? 'pointer-events-none opacity-40'
                              : ''
                          }`}
                          aria-label={t('viewCode')}
                        >
                          <Github size={20} />
                        </Link>

                        <Link
                          href={project.liveUrl}
                          className={`text-muted-foreground hover:text-primary transition-colors ${
                            project.liveUrl === '#'
                              ? 'pointer-events-none opacity-40'
                              : ''
                          }`}
                          aria-label={t('viewLive')}
                        >
                          <ExternalLink size={20} />
                        </Link>
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Other Projects */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase mb-8">
            {t('other')}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProjects.map((project, index) => (
              <Reveal key={project.slug} delay={index * 100}>
                <div className="group h-full p-6 rounded-lg border border-border hover:border-primary/50 hover:bg-card transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Folder size={18} className="text-primary" />
                    </div>

                    {project.liveUrl && (
                      <div className="flex gap-3">
                        <Link
                          href={project.githubUrl ?? '#'}
                          className={`text-muted-foreground hover:text-primary transition-colors ${
                            !project.githubUrl || project.githubUrl === '#'
                              ? 'pointer-events-none opacity-40'
                              : ''
                          }`}
                          target="_blank"
                          aria-label={t('viewCode')}
                        >
                          <Github size={18} />
                        </Link>
                        <Link
                          href={project.liveUrl}
                          className={`text-muted-foreground hover:text-primary transition-colors ${
                            project.liveUrl === '#'
                              ? 'pointer-events-none opacity-40'
                              : ''
                          }`}
                          target="_blank"
                          aria-label={t('viewLive')}
                        >
                          <ExternalLink size={18} />
                        </Link>
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                    {t(`items.${project.slug}.title`)}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {t(`items.${project.slug}.description`)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {project.techs.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="text-xs text-muted-foreground"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
