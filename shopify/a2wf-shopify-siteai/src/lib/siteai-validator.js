import { validateDocument } from '../../../../validator/index.js';
import { generateSiteAiDocument } from './siteai-generator.js';

export function validateGeneratedSiteAi(settings, options = {}) {
  const doc = generateSiteAiDocument(settings);
  return {
    document: doc,
    validation: validateDocument(doc, options)
  };
}
