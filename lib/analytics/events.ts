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
  'certification_verified',
  'avatar_conversation_started',
  'avatar_question_asked',
  'avatar_limit_reached'
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

// The only property keys a custom event may carry.
export const ANALYTICS_PROPERTY_KEYS = [
  'placement',
  'channel',
  'project',
  'link',
  'topic',
  'outcome',
  'latency'
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

// Super properties: flags that mark the whole visit, so every later event in it
// carries them (for example the contact form after an avatar chat). Only
// allowlisted names are accepted and the value is always true.
export const ANALYTICS_SUPER_PROPERTIES = ['avatar_used'] as const;

export type AnalyticsSuperProperty = (typeof ANALYTICS_SUPER_PROPERTIES)[number];

// Browser event that client components dispatch to register a super property.
export const ANALYTICS_REGISTER_DOM_EVENT = 'portfolio:analytics-register';

export type AnalyticsRegisterDomEventDetail = {
  property: AnalyticsSuperProperty;
};

export const isAnalyticsSuperProperty = (
  value: unknown
): value is AnalyticsSuperProperty =>
  typeof value === 'string' &&
  (ANALYTICS_SUPER_PROPERTIES as readonly string[]).includes(value);

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

// Marks the current visit with a super property. Like trackEvent, it is a
// no-op until the tracker in instrumentation-client.ts is listening.
export function registerAnalyticsProperty(property: AnalyticsSuperProperty) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AnalyticsRegisterDomEventDetail>(
      ANALYTICS_REGISTER_DOM_EVENT,
      {detail: {property}}
    )
  );
}

// Cookie set on the owner's browser after signing in to the admin area, so
// their own visits are not counted. It holds no identifier.
export const INTERNAL_TRAFFIC_COOKIE = 'pf_internal';
