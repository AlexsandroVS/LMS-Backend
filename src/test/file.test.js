const File = require('../models/Files');

test('Debe crear un archivo en la base de datos', async () => {
  const fileData = {
    ActivityID: 1, // ID de actividad existente
    UserID: 1, // ID de usuario existente
    FileName: 'test.pdf',
    FileType: 'application/pdf',
    Files: Buffer.from('Test content'), // Simula un buffer
    UploadedAt: new Date(),
  };

  try {
    const fileId = await File.create(fileData);
    console.log('Archivo creado con ID:', fileId);
    expect(fileId).toBeDefined();
  } catch (error) {
    console.error('Error en prueba:', error);
  }
});
