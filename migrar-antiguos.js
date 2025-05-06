const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db'); // Ajusta si tu conexión está en otra carpeta

const documentsDir = path.join(__dirname, 'documents');

async function forzarCorregirMigracion() {
  try {
    console.log('🔎 Buscando archivos que requieren corrección...');

    const [files] = await pool.execute(`
      SELECT FileID, Files, FileType
      FROM Files
      WHERE Files LIKE '%.doc%' OR Files LIKE '%.ppt%'
    `);

    if (files.length === 0) {
      console.log('✅ No hay archivos Word/PPT para corregir.');
      process.exit(0);
    }

    let actualizados = 0;
    console.log(`🛠 Encontrados ${files.length} archivos posibles para corregir.\n`);

    for (const file of files) {
      const currentPath = path.join(__dirname, file.Files);
      const pdfPath = currentPath.replace(/\.(docx|doc|pptx|ppt)$/i, '.pdf');

      if (fs.existsSync(pdfPath)) {
        const newRelativePath = path.relative(__dirname, pdfPath).replace(/\\/g, '/');

        await pool.execute(
          `UPDATE Files SET Files = ?, FileType = 'application/pdf' WHERE FileID = ?`,
          [newRelativePath, file.FileID]
        );

        console.log(`✅ Actualizado: ${file.Files} -> ${newRelativePath}`);
        actualizados++;
      } else {
        console.warn(`⚠️ No se encontró PDF para: ${file.Files}`);
      }
    }

    console.log(`\n🎯 Corrección completada: ${actualizados} archivos actualizados.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en forzar-corregir-migracion:', error.message);
    process.exit(1);
  }
}

forzarCorregirMigracion();
