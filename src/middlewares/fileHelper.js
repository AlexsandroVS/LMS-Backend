// utils/fileHelper.js
const fs = require('fs');
const path = require('path');

exports.deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Archivo eliminado: ${filePath}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error eliminando archivo ${filePath}:`, err);
    return false;
  }
};