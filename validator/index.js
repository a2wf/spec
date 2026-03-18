import fs from 'node:fs';
import path from 'node:path';

const CORE_PERMISSION_GROUPS = ['read', 'action', 'data'];
const READ_PERMISSION_KEYS = ['productCatalog', 'pricing', 'availability', 'openingHours', 'contactInfo', 'reviews', 'faq', 'companyInfo'];
const ACTION_PERMISSION_KEYS = ['search', 'addToCart', 'checkout', 'createAccount', 'submitReview', 'submitContactForm', 'bookAppointment', 'cancelOrder', 'requestRefund'];
const DATA_PERMISSION_KEYS = ['customerRecords', 'orderHistory', 'paymentInfo', 'internalAnalytics', 'employeeData'];
const ALL_ACTION_KEYS = new Set(ACTION_PERMISSION_KEYS);
const HUMAN_VERIFICATION_METHODS = new Set(['redirect-to-browser', 'email-confirmation', 'sms-otp']);
const DEFAULT_AGENT_ACCESS = new Set(['open', 'restricted', 'minimal']);
const EU_RISK_CLASSIFICATIONS = new Set(['minimal', 'limited', 'high', 'unacceptable']);
const EXTENSION_TOP_LEVEL_KEYS = new Set([
  'keySections', 'mainContact', 'publisher', 'company', 'services', 'forms', 'apiEndpoints', 'search', 'faq', 'navigation', 'ecommerce', 'media', 'careers', 'innovations', 'securityDefinitions', 'alternateVersions'
]);
const CORE_TOP_LEVEL_KEYS = new Set([
  '@context', 'specVersion', 'identity', 'permissions', 'agentIdentification', 'scraping', 'defaults', 'humanVerification', 'legal', 'discovery', 'metadata', '$schema'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isAbsoluteHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isBcp47Like(value) {
  return isNonEmptyString(value) && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value);
}

function pushMessage(store, severity, path, message) {
  store.push({ severity, path, message });
}

function validatePermissionMap(result, pathLabel, permissionMap, knownKeys) {
  if (!isObject(permissionMap)) {
    pushMessage(result.errors, 'error', pathLabel, 'Muss ein Objekt sein.');
    return;
  }

  for (const [key, rule] of Object.entries(permissionMap)) {
    const rulePath = `${pathLabel}.${key}`;
    if (knownKeys && !knownKeys.includes(key)) {
      pushMessage(result.warnings, 'warning', rulePath, 'Unbekannter Permission-Key; laut Spezifikation müssen Consumer ihn ignorieren.');
    }
    if (!isObject(rule)) {
      pushMessage(result.errors, 'error', rulePath, 'Permission-Eintrag muss ein Objekt sein.');
      continue;
    }
    if (typeof rule.allowed !== 'boolean') {
      pushMessage(result.errors, 'error', `${rulePath}.allowed`, 'Pflichtfeld und muss Boolean sein.');
    }
    if ('rateLimit' in rule && !isPositiveInteger(rule.rateLimit)) {
      pushMessage(result.errors, 'error', `${rulePath}.rateLimit`, 'Muss eine Ganzzahl >= 0 sein.');
    }
    if ('humanVerification' in rule && typeof rule.humanVerification !== 'boolean') {
      pushMessage(result.errors, 'error', `${rulePath}.humanVerification`, 'Muss Boolean sein.');
    }
    if ('note' in rule && typeof rule.note !== 'string') {
      pushMessage(result.errors, 'error', `${rulePath}.note`, 'Muss String sein.');
    }
  }
}

function validateCore(doc, result) {
  if (!isObject(doc)) {
    pushMessage(result.errors, 'error', '$', 'Dokument muss ein JSON-Objekt sein.');
    return;
  }

  if (doc['@context'] !== undefined && doc['@context'] !== 'https://schema.org') {
    pushMessage(result.warnings, 'warning', '@context', 'Empfohlen ist "https://schema.org".');
  }

  if (doc.specVersion !== '1.0') {
    pushMessage(result.errors, 'error', 'specVersion', 'Muss exakt "1.0" sein.');
  }

  if (!isObject(doc.identity)) {
    pushMessage(result.errors, 'error', 'identity', 'Pflichtfeld und muss Objekt sein.');
  } else {
    const identity = doc.identity;
    if (!isAbsoluteHttpUrl(identity.domain)) {
      pushMessage(result.errors, 'error', 'identity.domain', 'Pflichtfeld und muss absolute HTTP(S)-URL sein.');
    }
    if (!isNonEmptyString(identity.name)) {
      pushMessage(result.errors, 'error', 'identity.name', 'Pflichtfeld und muss nichtleerer String sein.');
    }
    if (!isBcp47Like(identity.inLanguage)) {
      pushMessage(result.errors, 'error', 'identity.inLanguage', 'Pflichtfeld und sollte ein BCP-47-Sprachtag sein.');
    }
    if ('@type' in identity && typeof identity['@type'] !== 'string') {
      pushMessage(result.errors, 'error', 'identity.@type', 'Muss String sein.');
    }
    if ('contact' in identity && !isNonEmptyString(identity.contact)) {
      pushMessage(result.errors, 'error', 'identity.contact', 'Muss String sein.');
    }
    for (const optionalString of ['description', 'purpose', 'category', 'jurisdiction']) {
      if (optionalString in identity && typeof identity[optionalString] !== 'string') {
        pushMessage(result.errors, 'error', `identity.${optionalString}`, 'Muss String sein.');
      }
    }
    if ('applicableLaw' in identity && (!Array.isArray(identity.applicableLaw) || identity.applicableLaw.some((v) => typeof v !== 'string'))) {
      pushMessage(result.errors, 'error', 'identity.applicableLaw', 'Muss Array von Strings sein.');
    }
  }

  if (!isObject(doc.permissions)) {
    pushMessage(result.errors, 'error', 'permissions', 'Pflichtfeld und muss Objekt sein.');
  } else {
    validatePermissionMap(result, 'permissions.read', doc.permissions.read ?? {}, READ_PERMISSION_KEYS);
    validatePermissionMap(result, 'permissions.action', doc.permissions.action ?? {}, ACTION_PERMISSION_KEYS);
    validatePermissionMap(result, 'permissions.data', doc.permissions.data ?? {}, DATA_PERMISSION_KEYS);
  }

  if (doc.defaults !== undefined) {
    if (!isObject(doc.defaults)) {
      pushMessage(result.errors, 'error', 'defaults', 'Muss Objekt sein.');
    } else {
      if ('agentAccess' in doc.defaults && !DEFAULT_AGENT_ACCESS.has(doc.defaults.agentAccess)) {
        pushMessage(result.errors, 'error', 'defaults.agentAccess', 'Erlaubt: open, restricted, minimal.');
      }
      for (const key of ['requireIdentification', 'humanVerificationRequired', 'respectRobotsTxt']) {
        if (key in doc.defaults && typeof doc.defaults[key] !== 'boolean') {
          pushMessage(result.errors, 'error', `defaults.${key}`, 'Muss Boolean sein.');
        }
      }
      for (const key of ['maxRequestsPerMinute', 'maxRequestsPerHour']) {
        if (key in doc.defaults && !isPositiveInteger(doc.defaults[key])) {
          pushMessage(result.errors, 'error', `defaults.${key}`, 'Muss Ganzzahl >= 0 sein.');
        }
      }
    }
  }

  if (doc.agentIdentification !== undefined) {
    const ai = doc.agentIdentification;
    if (!isObject(ai)) {
      pushMessage(result.errors, 'error', 'agentIdentification', 'Muss Objekt sein.');
    } else {
      for (const key of ['requireUserAgent', 'allowAnonymousAgents']) {
        if (key in ai && typeof ai[key] !== 'boolean') {
          pushMessage(result.errors, 'error', `agentIdentification.${key}`, 'Muss Boolean sein.');
        }
      }
      if ('requiredFields' in ai && (!Array.isArray(ai.requiredFields) || ai.requiredFields.some((v) => typeof v !== 'string'))) {
        pushMessage(result.errors, 'error', 'agentIdentification.requiredFields', 'Muss Array von Strings sein.');
      }
      for (const collection of ['trustedAgents', 'blockedAgents']) {
        if (collection in ai && !Array.isArray(ai[collection])) {
          pushMessage(result.errors, 'error', `agentIdentification.${collection}`, 'Muss Array sein.');
        }
      }
    }
  }

  if (doc.scraping !== undefined) {
    if (!isObject(doc.scraping)) {
      pushMessage(result.errors, 'error', 'scraping', 'Muss Objekt sein.');
    } else {
      for (const key of ['bulkDataExtraction', 'priceMonitoring', 'contentReproduction', 'competitiveAnalysis', 'trainingDataUsage']) {
        if (key in doc.scraping && typeof doc.scraping[key] !== 'boolean') {
          pushMessage(result.errors, 'error', `scraping.${key}`, 'Muss Boolean sein.');
        }
      }
      if ('note' in doc.scraping && typeof doc.scraping.note !== 'string') {
        pushMessage(result.errors, 'error', 'scraping.note', 'Muss String sein.');
      }
    }
  }

  if (doc.humanVerification !== undefined) {
    if (!isObject(doc.humanVerification)) {
      pushMessage(result.errors, 'error', 'humanVerification', 'Muss Objekt sein.');
    } else {
      if ('methods' in doc.humanVerification) {
        if (!Array.isArray(doc.humanVerification.methods) || doc.humanVerification.methods.some((v) => !HUMAN_VERIFICATION_METHODS.has(v))) {
          pushMessage(result.errors, 'error', 'humanVerification.methods', 'Muss Array mit erlaubten Werten sein: redirect-to-browser, email-confirmation, sms-otp.');
        }
      }
      if ('requiredFor' in doc.humanVerification) {
        if (!Array.isArray(doc.humanVerification.requiredFor) || doc.humanVerification.requiredFor.some((v) => typeof v !== 'string')) {
          pushMessage(result.errors, 'error', 'humanVerification.requiredFor', 'Muss Array von Strings sein.');
        } else {
          for (const action of doc.humanVerification.requiredFor) {
            if (!ALL_ACTION_KEYS.has(action)) {
              pushMessage(result.warnings, 'warning', 'humanVerification.requiredFor', `Unbekannte Action "${action}".`);
            }
          }
        }
      }
      if ('note' in doc.humanVerification && typeof doc.humanVerification.note !== 'string') {
        pushMessage(result.errors, 'error', 'humanVerification.note', 'Muss String sein.');
      }
    }
  }

  if (doc.legal !== undefined) {
    if (!isObject(doc.legal)) {
      pushMessage(result.errors, 'error', 'legal', 'Muss Objekt sein.');
    } else {
      for (const key of ['termsUrl']) {
        if (key in doc.legal && !isAbsoluteHttpUrl(doc.legal[key])) {
          pushMessage(result.errors, 'error', `legal.${key}`, 'Muss absolute HTTP(S)-URL sein.');
        }
      }
      for (const key of ['complianceNote', 'dataRetention']) {
        if (key in doc.legal && typeof doc.legal[key] !== 'string') {
          pushMessage(result.errors, 'error', `legal.${key}`, 'Muss String sein.');
        }
      }
      if ('euAiActCompliance' in doc.legal) {
        const eu = doc.legal.euAiActCompliance;
        if (!isObject(eu)) {
          pushMessage(result.errors, 'error', 'legal.euAiActCompliance', 'Muss Objekt sein.');
        } else {
          for (const key of ['transparencyRequired', 'humanOversightMandatory']) {
            if (key in eu && typeof eu[key] !== 'boolean') {
              pushMessage(result.errors, 'error', `legal.euAiActCompliance.${key}`, 'Muss Boolean sein.');
            }
          }
          if ('riskClassification' in eu && !EU_RISK_CLASSIFICATIONS.has(eu.riskClassification)) {
            pushMessage(result.errors, 'error', 'legal.euAiActCompliance.riskClassification', 'Erlaubt: minimal, limited, high, unacceptable.');
          }
        }
      }
    }
  }

  if (doc.discovery !== undefined) {
    if (!isObject(doc.discovery)) {
      pushMessage(result.errors, 'error', 'discovery', 'Muss Objekt sein.');
    } else {
      for (const key of ['mcpEndpoint', 'a2aAgentCard', 'robotsTxt', 'llmsTxt', 'openApi']) {
        if (key in doc.discovery && !isAbsoluteHttpUrl(doc.discovery[key])) {
          pushMessage(result.errors, 'error', `discovery.${key}`, 'Muss absolute HTTP(S)-URL sein.');
        }
      }
      if ('schemaOrg' in doc.discovery && typeof doc.discovery.schemaOrg !== 'boolean') {
        pushMessage(result.errors, 'error', 'discovery.schemaOrg', 'Muss Boolean sein.');
      }
    }
  }

  if (doc.metadata !== undefined) {
    if (!isObject(doc.metadata)) {
      pushMessage(result.errors, 'error', 'metadata', 'Muss Objekt sein.');
    } else {
      for (const key of ['$schema', 'schemaVersion', 'author', 'generatedAt', 'lastUpdated', 'expiresAt', 'changelogUrl']) {
        if (key in doc.metadata && typeof doc.metadata[key] !== 'string') {
          pushMessage(result.errors, 'error', `metadata.${key}`, 'Muss String sein.');
        }
      }
      if ('metadata' in doc && '$schema' in doc) {
        pushMessage(result.warnings, 'warning', '$schema', 'Die Spezifikation beschreibt $schema unter metadata.$schema; Top-Level-$schema deutet auf Altbestand hin.');
      }
    }
  } else if ('$schema' in doc) {
    pushMessage(result.warnings, 'warning', '$schema', 'Top-Level-$schema ist in den Beispielen vorhanden, aber laut Core-Spec unter metadata.$schema dokumentiert.');
  }

  for (const action of ACTION_PERMISSION_KEYS) {
    const rule = doc.permissions?.action?.[action];
    if (rule?.humanVerification === true && !doc.humanVerification?.requiredFor?.includes(action)) {
      pushMessage(result.warnings, 'warning', `permissions.action.${action}`, 'humanVerification=true, aber humanVerification.requiredFor enthält die Action nicht.');
    }
  }

  for (const key of Object.keys(doc)) {
    if (!CORE_TOP_LEVEL_KEYS.has(key) && !EXTENSION_TOP_LEVEL_KEYS.has(key)) {
      pushMessage(result.warnings, 'warning', key, 'Unbekannter Top-Level-Key; laut Spec zulässig, aber dokumentieren empfohlen.');
    }
  }
}

function validateExtensions(doc, result) {
  if ('keySections' in doc) {
    if (!Array.isArray(doc.keySections)) {
      pushMessage(result.errors, 'error', 'keySections', 'Muss Array sein.');
    }
  }

  for (const key of ['mainContact', 'publisher', 'company', 'faq', 'navigation', 'ecommerce', 'media', 'careers', 'innovations', 'securityDefinitions']) {
    if (key in doc && !isObject(doc[key])) {
      pushMessage(result.errors, 'error', key, 'Muss Objekt sein.');
    }
  }

  for (const key of ['services', 'forms', 'apiEndpoints', 'alternateVersions']) {
    if (key in doc && !Array.isArray(doc[key])) {
      pushMessage(result.errors, 'error', key, 'Muss Array sein.');
    }
  }

  if ('search' in doc) {
    if (!isObject(doc.search)) {
      pushMessage(result.errors, 'error', 'search', 'Muss Objekt sein.');
    } else {
      if ('url' in doc.search && !isAbsoluteHttpUrl(doc.search.url)) {
        pushMessage(result.errors, 'error', 'search.url', 'Muss absolute HTTP(S)-URL sein.');
      }
      if ('parameter' in doc.search && typeof doc.search.parameter !== 'string') {
        pushMessage(result.errors, 'error', 'search.parameter', 'Muss String sein.');
      }
      if ('supportsFilters' in doc.search && typeof doc.search.supportsFilters !== 'boolean') {
        pushMessage(result.errors, 'error', 'search.supportsFilters', 'Muss Boolean sein.');
      }
      if ('searchTypes' in doc.search && (!Array.isArray(doc.search.searchTypes) || doc.search.searchTypes.some((v) => typeof v !== 'string'))) {
        pushMessage(result.errors, 'error', 'search.searchTypes', 'Muss Array von Strings sein.');
      }
      if (doc.permissions?.action?.search?.allowed !== true) {
        pushMessage(result.warnings, 'warning', 'search', 'Search-Extension vorhanden, aber permissions.action.search ist nicht explizit allowed=true.');
      }
    }
  }

  if (Array.isArray(doc.forms)) {
    doc.forms.forEach((form, index) => {
      const base = `forms[${index}]`;
      if (!isObject(form)) {
        pushMessage(result.errors, 'error', base, 'Form-Eintrag muss Objekt sein.');
        return;
      }
      for (const key of ['name', 'type', 'method']) {
        if (key in form && typeof form[key] !== 'string') {
          pushMessage(result.errors, 'error', `${base}.${key}`, 'Muss String sein.');
        }
      }
      if ('url' in form && !isAbsoluteHttpUrl(form.url)) {
        pushMessage(result.errors, 'error', `${base}.url`, 'Muss absolute HTTP(S)-URL sein.');
      }
      if ('fields' in form && (!Array.isArray(form.fields) || form.fields.some((v) => typeof v !== 'string'))) {
        pushMessage(result.errors, 'error', `${base}.fields`, 'Muss Array von Strings sein.');
      }
      if ('humanVerificationRecommended' in form && typeof form.humanVerificationRecommended !== 'boolean') {
        pushMessage(result.errors, 'error', `${base}.humanVerificationRecommended`, 'Muss Boolean sein.');
      }
    });
  }

  if (Array.isArray(doc.apiEndpoints)) {
    doc.apiEndpoints.forEach((entry, index) => {
      const base = `apiEndpoints[${index}]`;
      if (!isObject(entry)) {
        pushMessage(result.errors, 'error', base, 'API-Eintrag muss Objekt sein.');
        return;
      }
      for (const key of ['name', 'kind', 'documentationUrl']) {
        if (key in entry && typeof entry[key] !== 'string') {
          pushMessage(result.errors, 'error', `${base}.${key}`, 'Muss String sein.');
        }
      }
      if ('url' in entry && !isAbsoluteHttpUrl(entry.url)) {
        pushMessage(result.errors, 'error', `${base}.url`, 'Muss absolute HTTP(S)-URL sein.');
      }
      if ('documentationUrl' in entry && !isAbsoluteHttpUrl(entry.documentationUrl)) {
        pushMessage(result.errors, 'error', `${base}.documentationUrl`, 'Muss absolute HTTP(S)-URL sein.');
      }
      if ('authenticationRequired' in entry && typeof entry.authenticationRequired !== 'boolean') {
        pushMessage(result.errors, 'error', `${base}.authenticationRequired`, 'Muss Boolean sein.');
      }
    });
  }

  if (Array.isArray(doc.keySections)) {
    doc.keySections.forEach((entry, index) => {
      const base = `keySections[${index}]`;
      if (!isObject(entry)) {
        pushMessage(result.errors, 'error', base, 'Eintrag muss Objekt sein.');
        return;
      }
      if ('name' in entry && typeof entry.name !== 'string') {
        pushMessage(result.errors, 'error', `${base}.name`, 'Muss String sein.');
      }
      if ('entryPoint' in entry && !isAbsoluteHttpUrl(entry.entryPoint)) {
        pushMessage(result.errors, 'error', `${base}.entryPoint`, 'Muss absolute HTTP(S)-URL sein.');
      }
    });
  }

  if (Array.isArray(doc.services)) {
    doc.services.forEach((entry, index) => {
      const base = `services[${index}]`;
      if (!isObject(entry)) {
        pushMessage(result.errors, 'error', base, 'Eintrag muss Objekt sein.');
        return;
      }
      for (const key of ['name', 'category']) {
        if (key in entry && typeof entry[key] !== 'string') {
          pushMessage(result.errors, 'error', `${base}.${key}`, 'Muss String sein.');
        }
      }
      if ('url' in entry && !isAbsoluteHttpUrl(entry.url)) {
        pushMessage(result.errors, 'error', `${base}.url`, 'Muss absolute HTTP(S)-URL sein.');
      }
    });
  }

  if (Array.isArray(doc.alternateVersions)) {
    doc.alternateVersions.forEach((entry, index) => {
      const base = `alternateVersions[${index}]`;
      if (!isObject(entry)) {
        pushMessage(result.errors, 'error', base, 'Eintrag muss Objekt sein.');
        return;
      }
      if ('language' in entry && !isBcp47Like(entry.language)) {
        pushMessage(result.errors, 'error', `${base}.language`, 'Sollte BCP-47-Sprachtag sein.');
      }
      if ('url' in entry && !isAbsoluteHttpUrl(entry.url)) {
        pushMessage(result.errors, 'error', `${base}.url`, 'Muss absolute HTTP(S)-URL sein.');
      }
    });
  }
}

export function validateDocument(doc, options = {}) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    profile: options.profile ?? 'core+extensions'
  };

  validateCore(doc, result);
  if (options.profile !== 'core') {
    validateExtensions(doc, result);
  }

  result.valid = result.errors.length === 0;
  return result;
}

export function validateFile(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const doc = JSON.parse(raw);
  return {
    filePath: absolutePath,
    ...validateDocument(doc, options)
  };
}
