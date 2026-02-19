export class UpdateMealSessionDto {
  constructor({ date, mealType, grade, className, plannedHeadcount, status }) {
    this.date = date;
    this.mealType = mealType;
    this.grade = grade;
    this.className = className;
    this.plannedHeadcount = plannedHeadcount;
    this.status = status;
  }
}
