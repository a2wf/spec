import { DEFAULT_SHOPIFY_PERMISSION_PRESET, EXTENSION_KEYS } from '../config/a2wf-keys.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep(target, source) {
  const output = clone(target);
  if (!isObject(source)) return output;

  for (const [key, value] of Object.entries(source)) {
    if (isObject(value) && isObject(output[key])) {
      output[key] = mergeDeep(output[key], value);
    } else {
      output[key] = value;
    }
  }

  return output;
}

function clean(value) {
  if (Array.isArray(value)) {
    const items = value.map(clean).filter((item) => item !== undefined && item !== null && item !== '');
    return items.length ? items : undefined;
  }

  if (isObject(value)) {
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      const cleaned = clean(item);
      if (cleaned !== undefined && cleaned !== null && cleaned !== '') {
        result[key] = cleaned;
      }
    }
    return Object.keys(result).length ? result : undefined;
  }

  return value;
}

export function buildShopifyIdentity({ shop = {}, core = {} } = {}) {
  return {
    '@type': 'WebSite',
    domain: core.identity?.domain || shop.primaryDomain || '',
    name: core.identity?.name || shop.name || '',
    description: core.identity?.description || shop.description || '',
    purpose: core.identity?.purpose || 'Shopify storefront for products and commerce workflows.',
    inLanguage: core.identity?.inLanguage || shop.primaryLocale || 'en',
    category: core.identity?.category || 'e-commerce',
    jurisdiction: core.identity?.jurisdiction,
    applicableLaw: core.identity?.applicableLaw,
    contact: core.identity?.contact || shop.contactEmail
  };
}

export function generateSiteAiDocument(settings = {}) {
  const core = settings.core || {};
  const extensions = settings.extensions || {};
  const publication = settings.publication || {};

  const permissions = mergeDeep(DEFAULT_SHOPIFY_PERMISSION_PRESET, core.permissions || {});

  const doc = {
    '@context': 'https://schema.org',
    specVersion: '1.0',
    identity: buildShopifyIdentity(settings),
    defaults: core.defaults,
    permissions,
    agentIdentification: core.agentIdentification,
    scraping: core.scraping,
    humanVerification: core.humanVerification,
    legal: core.legal,
    discovery: {
      ...core.discovery,
      ...(publication.publicUrl ? { publicSiteAiUrl: publication.publicUrl } : {}),
      ...(publication.robotsUrl ? { robotsTxt: publication.robotsUrl } : {})
    },
    metadata: {
      '$schema': 'https://a2wf.org/schema/siteai-1.0.json',
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),
      ...core.metadata
    }
  };

  if (extensions.enabled) {
    for (const key of EXTENSION_KEYS) {
      if (extensions[key] !== undefined && extensions[key] !== null && extensions[key] !== '') {
        doc[key] = extensions[key];
      }
    }
  }

  return clean(doc) || {};
}
