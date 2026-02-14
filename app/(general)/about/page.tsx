import {SocialNetworks} from '@/app/components/SocialNertworks';

const skills = [
  {
    category: 'Frontend',
    items: [
      'React',
      'Next.js',
      'TypeScript',
      'Angular',
      'Microfrontends',
      'SCSS Modules',
      'Tailwind CSS',
      'PrimeNG',
      'Bootstrap',
      'i18n'
    ]
  },
  {
    category: 'Backend',
    items: [
      'Node.js',
      'NestJS',
      'Fastify',
      'Spring Boot',
      'REST APIs',
      'GraphQL',
      'Python'
    ]
  },
  {
    category: 'Databases',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Oracle', 'SQL Server', 'Redis']
  },
  {
    category: 'Cloud & DevOps',
    items: [
      'AWS (EC2, S3, IAM, RDS, Lambda)',
      'CloudFront',
      'Docker',
      'GitHub Actions',
      'CI/CD',
      'Vercel'
    ]
  },
  {
    category: 'Tools & Product',
    items: [
      'Git',
      'GitHub',
      'Azure DevOps',
      'Bitbucket',
      'Jira',
      'Figma',
      'Scrum',
      'Kanban'
    ]
  }
];

const certifications = [
  {title: 'AWS Certified Cloud Practitioner', issuer: 'AWS', year: '2025'},
  {
    title: 'AWS Solutions Architect (Associate)',
    issuer: 'AWS',
    year: 'In progress'
  }
];

const experience = [
  {
    period: 'Jan 2026 — Present',
    title: 'Senior Full Stack Developer',
    company: 'SmartJob · Falabella',
    description:
      'I build and maintain enterprise-scale applications for Falabella Seller Center (Promotions team), supporting a multinational retail platform across Chile, Colombia, and Mexico. I focus on scalable UI architecture, reusable components, and high-traffic seller dashboards, working closely with product, design, and backend teams in an Agile environment.',
    techs: ['React', 'Fastify', 'Microfrontends', 'Design Systems', 'i18n']
  },
  {
    period: 'Oct 2025 — Jan 2026',
    title: 'Semi Senior Full Stack Developer',
    company: 'SmartJob · Falabella',
    description:
      'Contributed to the design and implementation of scalable backend services using NestJS and PostgreSQL for a production-grade platform. Delivered core backend modules such as Escalations and Meetings, ensuring data integrity, performance, and reliability. Built and maintained database models, migrations, and optimized queries with TypeORM, while collaborating closely with cross-functional teams to translate business requirements into robust, maintainable technical solutions aligned with engineering best practices.',
    techs: ['Next.js', 'Nest.js', 'Microservices', 'Vercel', 'Postgres']
  },
  {
    period: 'Mar 2025 — Nov 2025',
    title: 'Freelance Full Stack Developer',
    company: 'Freelance',
    description:
      'I delivered automation and high-traffic web solutions end-to-end: n8n workflows integrating CRMs, WhatsApp API, Google Sheets, and WordPress; AWS S3 + CloudFront setups; CI/CD with GitHub Actions and WP-CLI; and performance/security improvements (indexing, caching, SSL/WAF/access control).',
    techs: [
      'Node.js',
      'n8n',
      'WordPress',
      'AWS S3',
      'CloudFront',
      'GitHub Actions',
      'Redis',
      'MySQL'
    ]
  },
  {
    period: 'Mar 2023 — Mar 2025',
    title: 'Senior Full Stack Developer (Angular)',
    company: 'MushroomSoft · Axle Informatics (USA)',
    description:
      'I worked on high-impact systems used in U.S. scientific and academic environments: optimizing NIH’s HITS platform and contributing to Smart-IRB (used by top-tier universities). I built Angular-based microfrontend UI and NestJS services with PostgreSQL/MongoDB, and contributed to WordPress modernization with reusable Gutenberg blocks and SEO improvements.',
    techs: [
      'Angular',
      'Microfrontends',
      'PrimeNG',
      'NestJS',
      'PostgreSQL',
      'MongoDB',
      'Azure DevOps'
    ]
  },
  {
    period: 'Jul 2022 — Mar 2023',
    title: 'Semi Senior Full-Stack Developer',
    company: 'Zeyo · Business Blockchain',
    description:
      'I delivered features for government and industry platforms: CERTERO (vote traceability with Ecuador’s National Electoral Council) and Safetrack (QR-based labeling/traceability). I also optimized ingestion pipelines to process 800k+ records in under 6 hours using Python and JavaScript.',
    techs: [
      'React',
      'Node.js',
      'Python',
      'AWS S3',
      'GitHub Actions',
      'Data Processing'
    ]
  },
  {
    period: 'Aug 2021 — Jun 2022',
    title: 'Junior Developer',
    company: 'Kengisoft',
    description:
      'I contributed to an educational platform and built an electronic invoicing system using Node.js and Angular, improving payment integration. I also shipped a packing list system (React + Spring Boot) and delivered a WordPress marketing site with custom plugins and analytics dashboards.',
    techs: ['Angular', 'Node.js', 'React', 'Spring Boot', 'WordPress', 'SQL']
  },
  {
    period: 'Jan 2020 — Present',
    title: 'Freelance Web Developer',
    company: 'Freelance',
    description:
      'I’ve built and deployed multiple web solutions for Ecuadorian institutions and businesses, including a payment management platform that helped recover $500k+ in overdue accounts and traceability systems (Spring Boot + Angular + Oracle) for incident visibility and operational response improvements.',
    techs: [
      'Spring Boot',
      'Angular',
      'Oracle',
      'WordPress',
      'Security Hardening'
    ]
  }
];

const sections = [
  {id: 'bio', label: 'Bio'},
  {id: 'experience', label: 'Experience'},
  {id: 'skills', label: 'Skills'},
  {id: 'certifications', label: 'Certifications'}
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 scroll-smooth">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:h-fit space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">About</h1>
              <p className="text-muted-foreground">
                A quick snapshot of my background
              </p>
            </div>

            <nav className="flex flex-row lg:flex-col gap-4">
              {sections.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="w-8 h-px bg-muted-foreground" />
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden lg:block">
              <SocialNetworks />
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-16">
            {/* Bio Section */}
            <section id="bio" className="space-y-6 scroll-mt-28">
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-foreground leading-relaxed">
                  I’m a senior full-stack developer with a strong frontend
                  focus. I build scalable, high-performance web applications
                  with React/Next.js and Angular, and I care a lot about clean
                  architecture, maintainable code, and shipping pixel-accurate
                  UIs that work reliably in real production environments.
                </p>

                <br />

                <p className="text-muted-foreground leading-relaxed text-justify">
                  I currently work at{' '}
                  <span className="text-foreground font-medium">Falabella</span>{' '}
                  (Seller Center · Promotions), building configuration-driven
                  promotional experiences and high-traffic dashboards across
                  multiple countries. I collaborate closely with product,
                  design, and backend teams to deliver solutions aligned with
                  regional requirements—balancing speed, quality, and long-term
                  maintainability.
                </p>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  I’m cloud-oriented and enjoy bringing solid engineering
                  practices into day-to-day delivery: pragmatic CI/CD,
                  performance optimization, strong code reviews, and
                  continuously improving the developer experience.
                </p>
              </div>
            </section>

            {/* Experience Section */}
            <section id="experience" className="space-y-8 scroll-mt-28">
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                Experience
              </h2>
              <div className="space-y-8">
                {experience.map((exp, index) => (
                  <div
                    key={index}
                    className="group grid md:grid-cols-[160px_1fr] gap-4 p-4 -mx-4 rounded-lg hover:bg-card transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {exp.period}
                    </span>
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {exp.title} ·{' '}
                        <span className="text-primary">{exp.company}</span>
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed text-justify">
                        {exp.description}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {exp.techs.map((tech) => (
                          <span
                            key={tech}
                            className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills Section */}
            <section id="skills" className="space-y-8 scroll-mt-28">
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                Skills & Tools
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {skills.map((skillGroup) => (
                  <div key={skillGroup.category} className="space-y-4">
                    <h3 className="font-medium text-foreground">
                      {skillGroup.category}
                    </h3>
                    <ul className="space-y-2">
                      {skillGroup.items.map((skill) => (
                        <li
                          key={skill}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Certifications Section */}
            <section id="certifications" className="space-y-8 scroll-mt-28">
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                Certifications
              </h2>
              <div className="space-y-4">
                {certifications.map((c) => (
                  <div
                    key={c.title}
                    className="flex items-start justify-between gap-4 p-4 -mx-4 rounded-lg hover:bg-card transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium text-foreground">{c.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {c.issuer}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {c.year}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Mobile Social */}
        <div className="mt-12 lg:hidden">
          <SocialNetworks />
        </div>
      </div>
    </div>
  );
}
