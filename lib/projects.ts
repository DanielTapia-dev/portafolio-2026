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

export const projects: Project[] = [
  {
    slug: 'armada-reserve',
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
    slug: 'falabella-seller-center',
    images: ['/projects/falabella-seller-center/cover.png'],
    techs: ['React', 'TypeScript', 'Microfrontends', 'i18n', 'Design Systems'],
    featured: true
  },
  {
    slug: 'eeasa-operations-logbook',
    techs: ['Angular', 'Spring Boot', 'Oracle', 'PrimeNG', 'ECharts', 'JWT'],
    featured: true
  },
  {
    slug: 'nih-hits',
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
    slug: 'smart-irb',
    images: ['/projects/smart-irb/cover.png'],
    techs: ['Angular', 'PrimeNG', 'NestJS', 'PostgreSQL', 'MongoDB'],
    featured: true
  },
  {
    slug: 'certero',
    images: ['/projects/certero/cover.png'],
    techs: ['React', 'Node.js', 'REST APIs', 'Blockchain', 'Security'],
    featured: true
  },
  {
    slug: 'safetrack',
    images: ['/projects/safetrack/cover.png'],
    techs: ['React', 'Node.js', 'Python', 'AWS S3', 'QR', 'Traceability'],
    featured: true
  },
  {
    slug: 'factupro-v2',
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
    images: ['/projects/factupro-v1/cover.png'],
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
