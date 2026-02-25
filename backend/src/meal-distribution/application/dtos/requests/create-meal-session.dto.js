export class CreateMealSessionDto {
  constructor({
    date,
    mealType,
    schoolId,
    grade,
    className,
    plannedHeadcount,
    actualServedCount,
    menuId,
  }) {
    this.date = date;
    this.mealType = mealType;
    this.schoolId = schoolId;
    this.grade = grade;
    this.className = className;
    this.plannedHeadcount = plannedHeadcount;
    this.actualServedCount = actualServedCount;
    this.menuId = menuId;
  }
}
