'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {ExternalLink, Folder, Github} from 'lucide-react';
import ImageGalleryModal from '../../components/ImageGalleryModal';

type Project = {
  title: string;
  description: string;
  images?: string[];
  techs: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
};

const projects: Project[] = [
  {
    title: 'Armada Reserve - Repo Trading Desk (FinTech)',
    description:
      'Full-stack work on Armada Reserve, a platform for repurchase agreement (repo) trading desks that manages the full trade lifecycle, from entry and pre-trade compliance to settlement. I deliver features across the Next.js desk and client portal and the NestJS API, including Auth0 MFA and step-up authentication, provider-aware settlement and wallet flows with digital-asset custody, and accounting records, and I harden the Kubernetes infrastructure behind SOC 2 controls.',
    techs: [
      'Next.js',
      'NestJS',
      'TypeScript',
      'PostgreSQL',
      'Kafka',
      'Auth0',
      'Kubernetes',
      'Terraform'
    ],
    featured: true
  },
  {
    title: 'Falabella Seller Center - Promotions (Enterprise)',
    description:
      'Enterprise-scale promotions experiences for Falabella Seller Center across Chile, Colombia, and Peru. Built reusable React + TypeScript components for configuration-driven promotional flows and high-traffic seller dashboards, collaborating closely with product, design, and backend teams in an Agile environment.',
    images: ['/projects/falabella-seller-center/cover.png'],
    techs: ['React', 'TypeScript', 'Microfrontends', 'i18n', 'Design Systems'],
    featured: true
  },
  {
    title: 'EEASA - Electric Utility Operations Logbook',
    description:
      'Operations logbook for Empresa Eléctrica Ambato (EEASA), an electric utility in central Ecuador. Control center and call center staff record faults, incidents, and operational events, manage work orders, and document field crew work with photos. Worked across the Angular frontend and the Spring Boot API, with role-based access, operational dashboards, and Excel/PDF reports, including reports for the national grid operator (CENACE).',
    techs: ['Angular', 'Spring Boot', 'Oracle', 'PrimeNG', 'ECharts', 'JWT'],
    featured: true
  },
  {
    title: 'NIH - HITS Platform (USA)',
    description:
      'Developed and optimized the HITS system for the U.S. National Institutes of Health, improving efficiency and scalability for scientific research workflows.',
    images: [
      '/projects/nih-hits/cover.png',
      '/projects/nih-hits/hits-explorer-filters.png',
      '/projects/nih-hits/hits-explorer-search.png',
      '/projects/nih-hits/filter-rule-popover.png',
      '/projects/nih-hits/drug-synergy-matrix.png'
    ],
    techs: [
      'Angular',
      'NestJS',
      'PostgreSQL',
      'Microfrontends',
      'Azure DevOps'
    ],
    featured: true
  },
  {
    title: 'Smart-IRB - New Version (Top U.S. Universities)',
    description:
      'Contributed to the new version of Smart-IRB, used by top-tier universities in the U.S. (including Harvard). Delivered frontend in an Angular microfrontend architecture and backend services with NestJS and SQL/NoSQL data stores.',
    images: ['/projects/smart-irb/cover.png'],
    techs: ['Angular', 'PrimeNG', 'NestJS', 'PostgreSQL', 'MongoDB'],
    featured: true
  },
  {
    title: 'CERTERO - Certificate Issuance & Verification (Blockchain)',
    description:
      'At Zeyo, I contributed to CERTERO, a blockchain-based platform focused on secure certificate issuance and verification. I worked on building and refining user-facing flows and integrations that improved transparency and trust in the certification lifecycle, collaborating with cross-functional teams to deliver maintainable, production-ready features.',
    images: ['/projects/certero/cover.png'],
    techs: ['React', 'Node.js', 'REST APIs', 'Blockchain', 'Security'],
    featured: true
  },
  {
    title: 'Safetrack - QR Labeling & Traceability',
    description:
      'At Zeyo, I worked on Safetrack, a traceability solution for product labeling and authenticity verification using QR-based flows and blockchain-backed records. I delivered key modules such as purchase order management and traceability/reporting features, improving operational control and transparency across fragmented supply chains.',
    images: ['/projects/safetrack/cover.png'],
    techs: ['React', 'Node.js', 'Python', 'AWS S3', 'QR', 'Traceability'],
    featured: true
  },
  {
    title: 'FactuPro v2 - Cloud Invoicing Platform (Web, Mobile & AWS)',
    description:
      'Second generation of FactuPro, an electronic invoicing platform for businesses in Ecuador that I build and operate end to end. A new Next.js web client and a React Native (Expo) mobile app share the Express API and add modules such as restaurant table and order management. I also moved the platform from Heroku to AWS with Terraform: Docker containers on an ARM64 EC2 instance, database migrations on every deploy, GitHub OIDC pipelines, and signing certificates stored encrypted with a key held in AWS SSM.',
    techs: [
      'Next.js',
      'React Native',
      'TypeScript',
      'Tailwind CSS',
      'Node.js',
      'PostgreSQL',
      'AWS',
      'Terraform',
      'Docker'
    ],
    featured: true
  },
  {
    title: 'FactuPro v1 - Electronic Invoicing System (Ecuador SRI)',
    description:
      'First version of FactuPro, in production since 2020 for several companies. An Angular frontend and a Node.js/Express API generate electronic invoices, sign them with XAdES-BES, and send them to Ecuador’s tax authority (SRI), then build the PDF invoice and email it to the customer. Also covers payment integration, sales reports, and Excel/PDF exports.',
    images: ['/projects/factupro-v1/cover.png'],
    techs: ['Angular', 'Node.js', 'Express', 'PostgreSQL', 'XAdES', 'Heroku'],
    featured: true
  },

  // Other Projects
  {
    title: 'Weather App - Real-Time Forecast',
    description:
      'This is a sample Angular project that demonstrates how to use the OpenWeather and VisualCrossing APIs to create an admin panel and a daily weather visualization.',
    techs: ['Angular', 'OpenWeather API', 'CSS'],
    liveUrl: '#',
    githubUrl: 'https://github.com/DanielTapia-dev/WeatherApp',
    featured: false
  },
  {
    title: 'Personal Portfolio - 2026 (Version 2)',
    description:
      'Second iteration of my personal portfolio, built with Next.js and modern frontend tooling. Focused on clean UI, performance, SEO, and clear presentation of professional experience and real-world projects.',
    techs: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    liveUrl: '#',
    githubUrl: 'https://github.com/DanielTapia-dev/portafolio-2026',
    featured: false
  },
  {
    title: 'Personal Portfolio - 2020 (Version 1)',
    description:
      'First version of my personal portfolio, developed as an early-career project. It showcases my initial work in frontend development and marks the starting point of my professional growth as a software developer.',
    techs: ['Angular', 'Tailwind CSS', 'HTML', 'SCSS'],
    liveUrl: 'https://danieltapia-dev.github.io/ProtafolioDanielTapia/pages',
    githubUrl: 'https://github.com/DanielTapia-dev/PortafolioDanielTapia',
    featured: false
  },
  {
    title:
      'Clinical Records Backend - Municipal Health Center (Thesis Project)',
    description:
      'Backend system for managing clinical histories, developed as my university thesis for the Municipal Patronage of Latacunga. Designed to handle patient records, medical consultations, and secure data access for healthcare personnel.',
    techs: ['Angular', 'Nodejs', 'REST APIs', 'MySQL', 'Security'],
    liveUrl: '#',
    githubUrl: 'https://github.com/DanielTapia-dev/Tesis',
    featured: false
  }
];

// Alternate image/text sides only for projects that have an image column.
const isReversed = (project: Project, index: number) =>
  Boolean(project.images?.length) && index % 2 === 1;

export default function Projects() {
  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);

  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(
    null
  );

  const activeProject =
    activeProjectIndex === null ? null : featuredProjects[activeProjectIndex];
  const activeImages = useMemo(
    () => activeProject?.images ?? [],
    [activeProject?.images]
  );

  const openGallery = (projectIndex: number) => {
    setActiveProjectIndex(projectIndex);
  };

  const closeGallery = () => {
    setActiveProjectIndex(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16 space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">
            A curated selection of real-world projects I have contributed to,
            from enterprise platforms and microfrontends to automation systems
            and end-to-end full-stack deliveries.
          </p>
        </div>

        <section className="mb-20">
          <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase mb-8">
            Featured Projects
          </h2>

          <div className="space-y-24">
            {featuredProjects.map((project, index) => (
              <div
                key={project.title}
                className={`grid gap-8 items-center ${project.images?.length ? 'lg:grid-cols-2' : ''}`}
              >
                {project.images?.length ? (
                  <div
                    className={`relative group ${isReversed(project, index) ? 'lg:order-2' : ''}`}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => openGallery(index)}
                      aria-label={`Open gallery for ${project.title}`}
                    >
                      <div className="overflow-hidden rounded-lg border border-border">
                        <img
                          src={project.images[0]}
                          alt={project.title}
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    </button>
                  </div>
                ) : null}

                <div
                  className={`space-y-4 ${isReversed(project, index) ? 'lg:order-1 lg:text-right' : ''}`}
                >
                  <h3 className="text-2xl font-bold text-foreground">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-justify">
                    {project.description}
                  </p>

                  <div
                    className={`flex flex-wrap gap-2 ${isReversed(project, index) ? 'lg:justify-end' : ''}`}
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
                      className={`flex gap-4 pt-2 ${isReversed(project, index) ? 'lg:justify-end' : ''}`}
                    >
                      <Link
                        href={project.githubUrl || '#'}
                        className={`text-muted-foreground hover:text-primary transition-colors ${
                          project.githubUrl === '#'
                            ? 'pointer-events-none opacity-40'
                            : ''
                        }`}
                        aria-label="View code on GitHub"
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
                        aria-label="View live project"
                      >
                        <ExternalLink size={20} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase mb-8">
            Other Projects
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProjects.map((project) => (
              <div
                key={project.title}
                className="group p-6 rounded-lg border border-border hover:border-primary/50 hover:bg-card transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Folder size={18} className="text-primary" />
                  </div>

                  {project.liveUrl && (
                    <div className="flex gap-3">
                      <Link
                        href={project.githubUrl || '#'}
                        className={`text-muted-foreground hover:text-primary transition-colors ${
                          project.githubUrl === '#'
                            ? 'pointer-events-none opacity-40'
                            : ''
                        }`}
                        target="_blank"
                        aria-label="GitHub repository"
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
                        aria-label="Live project"
                      >
                        <ExternalLink size={18} />
                      </Link>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {project.title}
                </h3>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.techs.slice(0, 3).map((tech) => (
                    <span key={tech} className="text-xs text-muted-foreground">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ImageGalleryModal
        isOpen={!!activeProject}
        title={activeProject?.title || ''}
        images={activeImages}
        onClose={closeGallery}
      />
    </div>
  );
}
