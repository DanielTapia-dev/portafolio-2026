import {Github, Linkedin, Mail, X} from 'lucide-react';
import Link from 'next/link';
import {analyticsAttributes} from '@/lib/analytics/events';

const socials = [
  {
    href: 'https://github.com/DanielTapia-dev',
    icon: Github,
    label: 'GitHub',
    channel: 'github'
  },
  {
    href: 'https://www.linkedin.com/in/daniel-tapia-dev/',
    icon: Linkedin,
    label: 'LinkedIn',
    channel: 'linkedin'
  },
  {href: 'https://x.com/DanielT08455842', icon: X, label: 'X', channel: 'x'},
  {
    href: 'mailto:d.tapialopez1@gmail.com',
    icon: Mail,
    label: 'Email',
    channel: 'email'
  }
];

export function SocialNetworks() {
  return (
    <div className="flex items-center gap-4">
      {socials.map((social) => (
        <Link
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label={social.label}
          {...analyticsAttributes('contact_link_clicked', {
            channel: social.channel,
            placement: 'social_icons'
          })}
        >
          <social.icon size={20} />
        </Link>
      ))}
    </div>
  );
}
