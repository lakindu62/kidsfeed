/**
 * Data Transfer Object for returning clean, standardized Open Food Facts data to the frontend
 */
export class BarcodeLookupResponseDTO {
  /**
   * @param {Object} data
   * @param {string} data.barcode
   * @param {string} data.name
   * @param {string} data.brand
   * @param {number} data.weight
   * @param {string} data.unit
   * @param {string[]} data.allergens
   * @param {string[]} data.traces
   * @param {string} data.ingredients
   * @param {string} data.imageUrl
   * @param {string} data.nutritionalGrade
   * @param {number} data.packageWeight
   * @param {string} data.packageWeightUnit
   * @param {string} data.packageType
   */
  constructor(data) {
    this.barcode = data.barcode || null;
    this.name = data.name || '';
    this.brand = data.brand || '';
    this.weight = data.weight || 0;
    this.unit = data.unit || 'pieces';
    this.allergens = data.allergens || [];
    this.traces = data.traces || [];
    this.ingredients = data.ingredients || '';
    this.imageUrl = data.imageUrl || '';
    this.nutritionalGrade = data.nutritionalGrade || '';
    this.packageWeight = data.packageWeight || 0;
    this.packageWeightUnit = data.packageWeightUnit || '';
    this.packageType = data.packageType || '';
  }
}
