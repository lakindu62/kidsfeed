class InvalidMealPlanException extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidMealPlanException';
    this.statusCode = 400;
  }
}
export default InvalidMealPlanException;
