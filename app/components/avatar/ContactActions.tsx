import {Linkedin, Mail} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {analyticsAttributes} from '@/lib/analytics/events';
import {LINKEDIN_URL} from './chat-utils';

const actionClassName =
  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export default function ContactActions() {
  const t = useTranslations('Ask');

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{t('contactTitle')}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/contact"
          {...analyticsAttributes('contact_cta_clicked', {
            placement: 'avatar'
          })}
          className={`${actionClassName} bg-primary text-primary-foreground hover:opacity-90`}
        >
          <Mail size={16} aria-hidden="true" />
          {t('contactCta')}
        </Link>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          {...analyticsAttributes('contact_link_clicked', {
            channel: 'linkedin',
            placement: 'avatar'
          })}
          className={`${actionClassName} border border-border text-foreground hover:border-primary/50 hover:text-primary`}
        >
          <Linkedin size={16} aria-hidden="true" />
          {t('linkedin')}
        </a>
      </div>
    </div>
  );
}
