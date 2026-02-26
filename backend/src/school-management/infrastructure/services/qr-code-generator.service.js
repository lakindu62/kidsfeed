import QRCode from 'qrcode';

const generateQRCodeBase64 = async (data) => {
  return await QRCode.toDataURL(data, { width: 300, margin: 1 });
};

const generateQRCodeBuffer = async (data) => {
  return await QRCode.toBuffer(data, { width: 300, margin: 1 });
};

export { generateQRCodeBase64, generateQRCodeBuffer };
