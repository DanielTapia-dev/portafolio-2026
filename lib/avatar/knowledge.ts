import {readFileSync} from 'node:fs';
import path from 'node:path';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import {certifications, experience} from '@/lib/profile';
import type {Certification, Experience} from '@/lib/profile';
import {projects} from '@/lib/projects';
import type {Project} from '@/lib/projects';

// Only content copy: UI labels, navigation and metadata stay out of the prompt.
export const SITE_KEYS: readonly string[] = [
  'Home.availability',
  'Home.roles',
  'Home.intro',
  'About.headline',
  'About.location',
  'About.stats',
  'About.bio',
  'About.featured.items',
  'About.experience',
  'About.skills',
  'Projects.items',
  'Contact.intro',
  'Contact.location',
  'Contact.help'
];

export type KnowledgeSources = {
  site: {en: unknown; es: unknown};
  projects: readonly Project[];
  experience: readonly Experience[];
  certifications: readonly Certification[];
  cv: string;
};

export function loadKnowledgeSources(): KnowledgeSources {
  return {
    site: {en, es},
    projects,
    experience,
    certifications,
    cv: readFileSync(path.join(process.cwd(), 'content/profile/cv.md'), 'utf8')
  };
}

// Rich-text tags such as <highlight> are markup for the page, not content.
const stripTags = (value: string) => value.replace(/<\/?[a-zA-Z]+>/g, '');

function flatten(value: unknown, prefix: string, lines: string[]) {
  if (typeof value === 'string') {
    lines.push(`${prefix}: ${stripTags(value)}`);
  } else if (Array.isArray(value)) {
    lines.push(`${prefix}:`);
    for (const item of value) lines.push(`- ${stripTags(String(item))}`);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, `${prefix}.${key}`, lines);
    }
  }
}

function siteBlock(locale: 'en' | 'es', messages: unknown) {
  const lines: string[] = [];
  for (const key of SITE_KEYS) {
    const [namespace, ...rest] = key.split('.');
    let node = (messages as Record<string, unknown>)[namespace];
    for (const part of rest) node = (node as Record<string, unknown>)[part];
    flatten(node, key, lines);
  }
  return [`<site lang="${locale}">`, ...lines, '</site>'].join('\n');
}

// A '#' link is a placeholder, not a real destination.
const realUrl = (url?: string) => (url && url !== '#' ? url : undefined);

function profileDataBlock(sources: KnowledgeSources) {
  const lines: string[] = [];
  for (const project of sources.projects) {
    const parts = [
      `featured=${project.featured ? 'yes' : 'no'}`,
      `techs=${project.techs.join(', ')}`
    ];
    const github = realUrl(project.githubUrl);
    const live = realUrl(project.liveUrl);
    if (github) parts.push(`github=${github}`);
    if (live) parts.push(`live=${live}`);
    lines.push(`project ${project.slug}: ${parts.join('; ')}`);
  }
  for (const entry of sources.experience) {
    const parts = [`company=${entry.company}`];
    if ('isCurrent' in entry && entry.isCurrent) parts.push('current=yes');
    parts.push(`techs=${entry.techs.join(', ')}`);
    if ('project' in entry && entry.project) {
      parts.push(`project_techs=${entry.project.techs.join(', ')}`);
    }
    lines.push(`experience ${entry.id}: ${parts.join('; ')}`);
  }
  for (const cert of sources.certifications) {
    lines.push(
      `certification ${cert.code}: ${cert.title}; issuer=${cert.issuer}; year=${cert.year}; credly=${cert.credlyUrl}`
    );
  }
  return ['<profile_data>', ...lines, '</profile_data>'].join('\n');
}

// The order is fixed and nothing is dated, so the output is byte-identical
// on every build, which prompt caching needs.
export function buildKnowledge(sources: KnowledgeSources): string {
  return [
    siteBlock('en', sources.site.en),
    siteBlock('es', sources.site.es),
    profileDataBlock(sources),
    `<cv>\n${sources.cv.trim()}\n</cv>`
  ].join('\n\n');
}

export const KNOWLEDGE = buildKnowledge(loadKnowledgeSources());
