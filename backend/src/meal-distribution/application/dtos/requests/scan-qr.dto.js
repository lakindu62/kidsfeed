export class ScanQrDto {
  constructor({ mealSessionId, qrToken }) {
    this.mealSessionId = mealSessionId;
    this.qrToken = qrToken;
  }
}
