export function mapShopToSiteAiSeed(shop = {}) {
  return {
    shop: {
      name: shop.name || '',
      primaryDomain: shop.primaryDomain || '',
      primaryLocale: shop.primaryLocale || 'en',
      description: shop.description || '',
      contactEmail: shop.contactEmail || ''
    },
    core: {
      identity: {
        domain: shop.primaryDomain || '',
        name: shop.name || '',
        inLanguage: shop.primaryLocale || 'en',
        category: 'e-commerce',
        contact: shop.contactEmail || ''
      }
    }
  };
}
