import type {Messages} from 'next-intl';

// Titles and descriptions live in messages/<locale>.json under Projects.items.
export type ProjectSlug = keyof Messages['Projects']['items'];

export type Project = {
  slug: ProjectSlug;
  // Paths under /public/projects/<slug>/. The first image is the cover.
  images?: string[];
  techs: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
};

// Screenshots live in public/projects/<slug>/; list the cover first.
const screenshots = (slug: ProjectSlug, files: string[]) =>
  files.map((file) => `/projects/${slug}/${file}`);

export const projects: Project[] = [
  {
    slug: 'falabella-seller-center',
    images: screenshots('falabella-seller-center', ['cover.png']),
    techs: ['React', 'TypeScript', 'Microfrontends', 'i18n', 'Design Systems'],
    featured: true
  },
  {
    slug: 'armada-reserve',
    images: screenshots('armada-reserve', [
      'cover.png',
      'trading-desk.png',
      'command-centre.png',
      'rfqs.png',
      'admin-dashboard.png',
      'mfa-settings.png'
    ]),
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
    slug: 'eeasa-operations-logbook',
    images: screenshots('eeasa-operations-logbook', [
      'cover.png',
      'incidents-inbox.png',
      'incident-history.png',
      'incident-detail.png',
      'group-assignment.png'
    ]),
    techs: ['Angular', 'Spring Boot', 'Oracle', 'PrimeNG', 'ECharts', 'JWT'],
    featured: true
  },
  {
    slug: 'nih-hits',
    images: screenshots('nih-hits', [
      'cover.png',
      'hits-explorer-filters.png',
      'hits-explorer-search.png',
      'filter-rule-popover.png',
      'drug-synergy-matrix.png'
    ]),
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
    slug: 'smart-irb',
    images: screenshots('smart-irb', ['cover.png']),
    techs: ['Angular', 'PrimeNG', 'NestJS', 'PostgreSQL', 'MongoDB'],
    featured: true
  },
  {
    slug: 'certero',
    images: screenshots('certero', ['cover.png']),
    techs: ['React', 'Node.js', 'REST APIs', 'Blockchain', 'Security'],
    featured: true
  },
  {
    slug: 'safetrack',
    images: screenshots('safetrack', ['cover.png']),
    techs: ['React', 'Node.js', 'Python', 'AWS S3', 'QR', 'Traceability'],
    featured: true
  },
  {
    slug: 'factupro-v2',
    images: screenshots('factupro-v2', [
      'cover.png',
      'home.png',
      'new-invoice.png',
      'restaurant-tables.png',
      'issued-invoices.png',
      'company-settings.png'
    ]),
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
    slug: 'factupro-v1',
    images: screenshots('factupro-v1', [
      'cover.png',
      'monthly-dashboard.png',
      'invoice-form.png',
      'issued-invoices.png'
    ]),
    techs: ['Angular', 'Node.js', 'Express', 'PostgreSQL', 'XAdES', 'Heroku'],
    featured: true
  },

  // Other Projects

  {
    slug: 'weather-app',
    techs: ['Angular', 'OpenWeather API', 'CSS'],
    liveUrl: '#',
    githubUrl: 'https://github.com/DanielTapia-dev/WeatherApp',
    featured: false
  },
  {
    slug: 'portfolio-v2',
    techs: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    liveUrl: '#',
    githubUrl: 'https://github.com/DanielTapia-dev/portafolio-2026',
    featured: false
  },
  {
    slug: 'portfolio-v1',
    techs: ['Angular', 'Tailwind CSS', 'HTML', 'SCSS'],
    liveUrl: 'https://danieltapia-dev.github.io/ProtafolioDanielTapia/pages',
    githubUrl: 'https://github.com/DanielTapia-dev/PortafolioDanielTapia',
    featured: false
  },
  {
    slug: 'clinical-records-backend',
    techs: ['Angular', 'Nodejs', 'REST APIs', 'MySQL', 'Security'],
    liveUrl: '#',
    githubUrl: 'https://github.com/DanielTapia-dev/Tesis',
    featured: false
  }
];
