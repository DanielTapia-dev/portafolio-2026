// Custom analytics events. Shared by the tracking code in the browser and the
// admin dashboard on the server, so it must not import anything client- or
// server-specific. Properties describe the interaction only; never put names,
// emails, form contents or other personal data in them.

export const ANALYTICS_EVENTS = [
  'contact_cta_clicked',
  'contact_link_clicked',
  'email_copied',
  'contact_form_submitted',
  'project_gallery_opened',
  'project_link_clicked',
  'featured_project_clicked',
  'certification_verified'
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

// The only property keys a custom event may carry.
export const ANALYTICS_PROPERTY_KEYS = [
  'placement',
  'channel',
  'project',
  'link'
] as const;

export type AnalyticsPropertyKey = (typeof ANALYTICS_PROPERTY_KEYS)[number];
export type AnalyticsProperties = Partial<Record<AnalyticsPropertyKey, string>>;

// Browser event that client components dispatch for non-click interactions.
export const ANALYTICS_DOM_EVENT = 'portfolio:analytics';

export type AnalyticsDomEventDetail = {
  event: AnalyticsEvent;
  properties?: AnalyticsProperties;
};

export const isAnalyticsEvent = (value: unknown): value is AnalyticsEvent =>
  typeof value === 'string' &&
  (ANALYTICS_EVENTS as readonly string[]).includes(value);

// Data attributes for an element whose clicks should be tracked. A single
// listener in instrumentation-client.ts reads them, so server components can
// be tracked without becoming client components.
export function analyticsAttributes(
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {}
): Record<string, string> {
  const attributes: Record<string, string> = {'data-analytics-event': event};
  for (const [key, value] of Object.entries(properties)) {
    if (value) attributes[`data-analytics-${key}`] = value;
  }
  return attributes;
}

// Records an interaction that is not a click, such as a successful form send.
// It is a no-op until the tracker in instrumentation-client.ts is listening.
export function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AnalyticsDomEventDetail>(ANALYTICS_DOM_EVENT, {
      detail: {event, properties}
    })
  );
}

// Cookie set on the owner's browser after signing in to the admin area, so
// their own visits are not counted. It holds no identifier.
export const INTERNAL_TRAFFIC_COOKIE = 'pf_internal';
