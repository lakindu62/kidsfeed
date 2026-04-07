import { BarcodeLookupResponseDTO } from '../dtos/responses/barcode-lookup-response.dto.js';

/**
 * Service dedicated exclusively to handling external communication
 * with the Open Food Facts API, parsing crowdsourced properties
 * into predictable Domain objects.
 */
class OpenFoodFactsService {
  constructor() {
    // Dynamically select the Open Food Facts endpoint
    // Fall back to the safe Sandbox URL if NODE_ENV is not explicitly set to production
    const isProd = process.env.NODE_ENV === 'production';
    this.baseUrl = isProd
      ? process.env.OPEN_FOOD_FACTS_BASEURL_PROD
      : process.env.OPEN_FOOD_FACTS_BASEURL_DEV;
  }

  /**
   * Securely fetches product data from the external API and maps it natively to our DTO.
   *
   * @param {string} barcode
   * @returns {Promise<BarcodeLookupResponseDTO>}
   */
  async lookupByBarcode(barcode) {
    if (!barcode) {
      throw new Error(
        'Barcode is strictly required for Open Food Facts lookup'
      );
    }

    // Complying with Open Food Facts polite API rules (Fall back to a generic dev string if missing)
    const userAgent =
      process.env.OPEN_FOOD_FACTS_USER_AGENT ||
      'KidsfeedApp/1.0 (local-dev@kidsfeed.com)';

    try {
      // 1. Execute External Fetch
      const response = await fetch(`${this.baseUrl}/${barcode}.json`, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
      });

      // 2. Handle HTTP-level errors safely
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found in Open Food Facts database');
        }
        throw new Error(
          `External API connection error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Ensure the deeply nested payload structure actually exists
      if (data.status !== 1 || !data.product) {
        throw new Error(`Product data unavailable or barcode invalid`);
      }

      const product = data.product;

      // Helper: Open Food Facts nests tags with "en:" prefixes. This cleans them (e.g. "en:nuts" -> "nuts")
      const stripTags = (tags) => {
        if (!Array.isArray(tags)) {return [];}
        return tags.map((tag) => tag.replace(/^(\w{2}:)/, '').trim());
      };

      // Helper: Clean package type (takes first valid packaging type and strips prefix)
      const cleanPackageType = (product.packaging || '')
        .split(',')[0]
        .replace(/^(\w{2}:)/, '')
        .trim();

      // Safely parse numeric weights
      const rawWeight = product.product_quantity || 0;
      const packageWeight =
        typeof rawWeight === 'string' ? parseFloat(rawWeight) : rawWeight;

      // 3. Map into the standardized DTO
      const mappedData = {
        barcode: data.code,
        name: product.product_name_en || product.product_name || '',
        brand: product.brands || '',
        allergens: stripTags(product.allergens_tags),
        traces: stripTags(product.traces_tags),
        ingredients:
          product.ingredients_text_en || product.ingredients_text || '',
        imageUrl: product.image_front_url || '',
        nutritionalGrade: product.nutriscore_grade || '',
        packageWeight: packageWeight || 0,
        packageWeightUnit: product.product_quantity_unit || '',
        packageType: cleanPackageType || '',
      };

      return new BarcodeLookupResponseDTO(mappedData);
    } catch (error) {
      throw new Error(`Barcode Lookup Failed: ${error.message}`);
    }
  }
}

export const openFoodFactsService = new OpenFoodFactsService();
