// Immutable value object representing dietary classifications for a recipe
class DietaryFlags {
  /**
   * @param {Object} params
   * @param {boolean} [params.vegetarian=false]
   * @param {boolean} [params.vegan=false]
   * @param {boolean} [params.halal=false]
   * @param {boolean} [params.glutenFree=false]
   * @param {boolean} [params.dairyFree=false]
   * @param {boolean} [params.nutFree=false]
   */
  constructor({
    vegetarian = false,
    vegan = false,
    halal = false,
    glutenFree = false,
    dairyFree = false,
    nutFree = false,
  }) {
    this.vegetarian = vegetarian;
    this.vegan = vegan;
    this.halal = halal;
    this.glutenFree = glutenFree;
    this.dairyFree = dairyFree;
    this.nutFree = nutFree;

    Object.freeze(this);
  }

  // Returns false if any required flag in requirements is not satisfied
  /**
   * @param {Object} requirements
   * @returns {boolean}
   */
  isCompliantWith(requirements) {
    if (requirements.vegetarian && !this.vegetarian) {return false;}
    if (requirements.vegan && !this.vegan) {return false;}
    if (requirements.halal && !this.halal) {return false;}
    if (requirements.glutenFree && !this.glutenFree) {return false;}

    return true;
  }

  // Returns labels for all active dietary flags
  /** @returns {Array<string>} */
  getActiveFlags() {
    const flags = [];
    if (this.vegetarian) {flags.push('Vegetarian');}
    if (this.vegan) {flags.push('Vegan');}
    if (this.halal) {flags.push('Halal');}
    if (this.glutenFree) {flags.push('Gluten-Free');}
    if (this.dairyFree) {flags.push('Dairy-Free');}
    if (this.nutFree) {flags.push('Nut-Free');}

    return flags;
  }

  /** @returns {Object} */
  toJSON() {
    return {
      vegetarian: this.vegetarian,
      vegan: this.vegan,
      halal: this.halal,
      glutenFree: this.glutenFree,
      dairyFree: this.dairyFree,
      nutFree: this.nutFree,
    };
  }
}

export default DietaryFlags;
