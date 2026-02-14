import {Github, Linkedin, Twitter, Mail, X} from 'lucide-react';
import Link from 'next/link';

const socials = [
  {href: 'https://github.com/DanielTapia-dev', icon: Github, label: 'GitHub'},
  {
    href: 'https://www.linkedin.com/in/daniel-tapia-dev/',
    icon: Linkedin,
    label: 'LinkedIn'
  },
  {href: 'https://x.com/DanielT08455842', icon: X, label: 'X'},
  {href: 'mailto:d.tapialopez1@gmail.com', icon: Mail, label: 'Email'}
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
        >
          <social.icon size={20} />
        </Link>
      ))}
    </div>
  );
}
