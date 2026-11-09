import posthog, {type CaptureResult} from 'posthog-js';
import {
  ANALYTICS_DOM_EVENT,
  ANALYTICS_PROPERTY_KEYS,
  INTERNAL_TRAFFIC_COOKIE,
  isAnalyticsEvent,
  type AnalyticsDomEventDetail,
  type AnalyticsProperties
} from '@/lib/analytics/events';

// Runs once in the browser before the app hydrates (Next.js 15.3+).
// Tracking is privacy-first: no cookies or browser storage, no person
// profiles, no session recording and no autocapture. See README > Analytics.

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// Click IDs that ad platforms append to URLs. They are pseudo-identifiers, and
// this site runs no ads, so they are dropped. UTM parameters are kept.
const CLICK_ID_PROPERTIES = [
  'gclid',
  'gad_source',
  'gclsrc',
  'dclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'twclid',
  'li_fat_id',
  'mc_cid',
  'igshid',
  'ttclid',
  'rdt_cid',
  'epik',
  'qclid',
  'sccid',
  'irclid',
  '_kx'
];

const MAX_PROPERTY_LENGTH = 64;

const isAdminPath = (pathname: string) =>
  pathname === '/admin' || pathname.startsWith('/admin/');

const isInternalBrowser = () =>
  document.cookie
    .split(';')
    .some((cookie) => cookie.trim() === `${INTERNAL_TRAFFIC_COOKIE}=1`);

// Keeps only the origin, the path and UTM parameters of a URL.
function sanitizeUrl(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    const url = new URL(value);
    const clean = new URL(url.origin + url.pathname);
    url.searchParams.forEach((paramValue, key) => {
      if (key.startsWith('utm_')) clean.searchParams.set(key, paramValue);
    });
    return clean.toString();
  } catch {
    return undefined;
  }
}

// Keeps only the origin of the page that linked here.
function sanitizeReferrer(value: unknown): unknown {
  if (typeof value !== 'string' || value === '$direct') return value;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function sanitizeEvent(result: CaptureResult | null): CaptureResult | null {
  if (!result) return null;
  if (isAdminPath(window.location.pathname)) return null;

  const properties = result.properties;
  properties.$current_url = sanitizeUrl(properties.$current_url);
  properties.$referrer = sanitizeReferrer(properties.$referrer);
  for (const key of CLICK_ID_PROPERTIES) delete properties[key];

  // Person properties are never processed (person_profiles: 'never').
  delete result.$set;
  delete result.$set_once;
  return result;
}

function pickProperties(
  read: (key: string) => string | undefined
): AnalyticsProperties {
  const properties: AnalyticsProperties = {};
  for (const key of ANALYTICS_PROPERTY_KEYS) {
    const value = read(key);
    if (value) properties[key] = value.slice(0, MAX_PROPERTY_LENGTH);
  }
  return properties;
}

function startTracking(projectToken: string) {
  posthog.init(projectToken, {
    api_host: apiHost,
    defaults: '2026-08-30',
    // Initial pageview plus one per client-side route change.
    capture_pageview: 'history_change',
    // Needed for time on page, session duration and bounce rate.
    capture_pageleave: true,
    // Nothing is stored in the browser, so no cookie banner is needed.
    persistence: 'memory',
    person_profiles: 'never',
    respect_dnt: true,
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_product_tours: true,
    disable_conversations: true,
    disable_web_experiments: true,
    advanced_disable_flags: true,
    disable_external_dependency_loading: true,
    before_send: sanitizeEvent
  });

  // Clicks on elements marked with analyticsAttributes().
  document.addEventListener(
    'click',
    (event) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[data-analytics-event]')
          : null;
      const name = target?.dataset.analyticsEvent;
      if (!target || !isAnalyticsEvent(name)) return;

      posthog.capture(
        name,
        pickProperties((key) => target.getAttribute(`data-analytics-${key}`) ?? undefined)
      );
    },
    {capture: true}
  );

  // Non-click interactions sent with trackEvent().
  window.addEventListener(ANALYTICS_DOM_EVENT, (event) => {
    const detail = (event as CustomEvent<AnalyticsDomEventDetail>).detail;
    if (!detail || !isAnalyticsEvent(detail.event)) return;

    posthog.capture(
      detail.event,
      pickProperties((key) => detail.properties?.[key as keyof AnalyticsProperties])
    );
  });
}

if (token && !isAdminPath(window.location.pathname) && !isInternalBrowser()) {
  startTracking(token);
}
