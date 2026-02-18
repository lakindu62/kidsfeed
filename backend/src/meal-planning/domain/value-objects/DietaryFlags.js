/**
 * DietaryFlags Value Object
 *
 * Represents dietary classifications and restrictions for recipes or meals.
 * This is an immutable value object that encapsulates various dietary flags
 * such as vegetarian, vegan, halal, and allergen-free classifications.
 *
 * The object is frozen after construction to ensure immutability, making it
 * safe to use in domain-driven design patterns.
 *
 * @class DietaryFlags
 */
class DietaryFlags {
  /**
   * Creates a new immutable DietaryFlags instance
   *
   * @constructor
   * @param {Object} params - Dietary flag configuration object
   * @param {boolean} [params.vegetarian=false] - Contains no meat or fish
   * @param {boolean} [params.vegan=false] - Contains no animal products
   * @param {boolean} [params.halal=false] - Prepared according to Islamic dietary laws
   * @param {boolean} [params.glutenFree=false] - Contains no gluten
   * @param {boolean} [params.dairyFree=false] - Contains no dairy products
   * @param {boolean} [params.nutFree=false] - Contains no nuts or nut products
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

    // Freeze the object to make it immutable (value object pattern)
    Object.freeze(this);
  }

  /**
   * Checks if this dietary flags configuration complies with given requirements
   *
   * Validates whether this item meets all the dietary requirements specified.
   * Returns false if any required flag is true in requirements but false in this object.
   *
   * @param {Object} requirements - Dietary requirements to check against
   * @param {boolean} [requirements.vegetarian] - Must be vegetarian
   * @param {boolean} [requirements.vegan] - Must be vegan
   * @param {boolean} [requirements.halal] - Must be halal
   * @param {boolean} [requirements.glutenFree] - Must be gluten-free
   * @returns {boolean} True if all requirements are met, false otherwise
   *
   * @example
   * const flags = new DietaryFlags({ vegetarian: true, glutenFree: true });
   * flags.isCompliantWith({ vegetarian: true }); // returns true
   * flags.isCompliantWith({ vegan: true }); // returns false
   */
  isCompliantWith(requirements) {
    // Check if vegetarian requirement is met
    if (requirements.vegetarian && !this.vegetarian) {
      return false;
    }

    // Check if vegan requirement is met
    if (requirements.vegan && !this.vegan) {
      return false;
    }

    // Check if halal requirement is met
    if (requirements.halal && !this.halal) {
      return false;
    }

    // Check if gluten-free requirement is met
    if (requirements.glutenFree && !this.glutenFree) {
      return false;
    }

    // All specified requirements are met
    return true;
  }

  /**
   * Returns a list of human-readable labels for all active (true) dietary flags
   *
   * Useful for displaying dietary information in user interfaces or reports.
   *
   * @returns {Array<string>} Array of active dietary flag labels
   *
   * @example
   * const flags = new DietaryFlags({ vegetarian: true, halal: true });
   * flags.getActiveFlags(); // returns ['Vegetarian', 'Halal']
   */
  getActiveFlags() {
    const flags = [];

    // Collect all flags that are set to true
    if (this.vegetarian) {
      flags.push('Vegetarian');
    }
    if (this.vegan) {
      flags.push('Vegan');
    }
    if (this.halal) {
      flags.push('Halal');
    }
    if (this.glutenFree) {
      flags.push('Gluten-Free');
    }
    if (this.dairyFree) {
      flags.push('Dairy-Free');
    }
    if (this.nutFree) {
      flags.push('Nut-Free');
    }

    return flags;
  }

  /**
   * Converts the DietaryFlags object to a plain JSON object
   *
   * Useful for serialization, API responses, and database storage.
   *
   * @returns {Object} Plain object representation of dietary flags
   *
   * @example
   * const flags = new DietaryFlags({ vegetarian: true });
   * const json = flags.toJSON();
   * // { vegetarian: true, vegan: false, halal: false, ... }
   */
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
