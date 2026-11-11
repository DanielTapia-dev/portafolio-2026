// Periods, titles, summaries and highlights live in messages under About.experience.<id>.
export const experience = [
  // TODO(Daniel): team size, one or two concrete architecture decisions and any
  // documented outcome would make this entry stronger. Nothing is invented here.
  {
    id: 'falabella',
    isCurrent: true,
    company: 'SmartJob · Falabella',
    techs: [
      'React',
      'TypeScript',
      'Fastify',
      'BFF',
      'Microfrontends',
      'Design Systems',
      'i18n'
    ]
  },
  {
    id: 'stafi',
    company: 'Stafi 🇺🇸',
    techs: [
      'Next.js',
      'TypeScript',
      'NestJS',
      'Clerk',
      'PostgreSQL',
      'Vercel',
      'Microservices'
    ]
  },
  {
    id: 'freelance-fullstack',
    company: 'Freelance',
    techs: [
      'Node.js',
      'n8n',
      'WordPress',
      'AWS S3',
      'CloudFront',
      'GitHub Actions',
      'Redis',
      'MySQL'
    ],
    // A project delivered within this engagement, not a separate employer.
    project: {
      techs: [
        'Next.js',
        'NestJS',
        'TypeScript',
        'PostgreSQL',
        'Kafka',
        'Auth0',
        'Kubernetes',
        'Terraform',
        'Fireblocks',
        'Coinbase'
      ]
    }
  },
  {
    id: 'axle',
    company: 'MushroomSoft · Axle Informatics 🇺🇸',
    techs: [
      'Angular',
      'PrimeNG',
      'Microfrontends',
      '.NET 8',
      'PostgreSQL',
      'MongoDB',
      'Azure DevOps',
      'GitHub'
    ]
  },
  {
    id: 'zeyo',
    company: 'Zeyo · Business Blockchain',
    techs: [
      'Python',
      'JavaScript',
      'Angular',
      'React',
      'Node.js',
      'Blockchain',
      'AWS S3',
      'GitHub Actions',
      'Data Processing'
    ]
  },
  {
    id: 'kengisoft',
    company: 'Kengisoft',
    techs: ['Angular', 'Node.js', 'Spring Boot', 'WordPress', 'SQL']
  },
  {
    id: 'freelance-web',
    company: 'Freelance',
    techs: [
      'Java',
      'Spring Boot',
      'Angular',
      'Oracle',
      'WordPress',
      'Security Hardening'
    ]
  }
] as const;

export type Experience = (typeof experience)[number];

// Badge images are optional: drop the PNG exported from Credly at `badge`
// (under public/) and it replaces the generic icon at the next build.
export type Certification = {
  title: string;
  issuer: string;
  code: string;
  year: string;
  credlyUrl: string;
  badge: string;
  trackingId: string;
};

export const certifications: Certification[] = [
  {
    title: 'AWS Certified Solutions Architect – Associate',
    issuer: 'AWS',
    code: 'SAA-C03',
    year: '2026',
    credlyUrl: 'https://www.credly.com/badges/90f04c41-bef3-4dca-8b81-6c9f546b2d93',
    badge: '/certifications/aws-solutions-architect-associate.png',
    trackingId: 'aws-solutions-architect-associate'
  },
  {
    title: 'AWS Certified Cloud Practitioner',
    issuer: 'AWS',
    code: 'CLF-C02',
    year: '2025',
    credlyUrl: 'https://www.credly.com/badges/37db155a-683c-4195-babe-e6b773d740c9',
    badge: '/certifications/aws-cloud-practitioner.png',
    trackingId: 'aws-cloud-practitioner'
  }
];
