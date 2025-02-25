const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Configura tu conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost', // o la IP del servidor
  user: 'root', // tu usuario de base de datos
  password: '', // tu contraseña de base de datos
  database: 'lms_noct' // el nombre de la base de datos
});

// Función para actualizar la contraseña de un usuario
async function updatePassword() {
  const userId = 15; // El UserID del usuario que quieres actualizar
  const plainPassword = 'heropass'; // La contraseña sin hashear

  try {
    // Hasheamos la contraseña
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Actualizamos la contraseña en la base de datos
    const query = `UPDATE users SET Password = ? WHERE UserID = ?`;

    connection.execute(query, [hashedPassword, userId], (err, results) => {
      if (err) {
        console.error('Error al actualizar la contraseña:', err);
      } else {
        console.log('Contraseña actualizada correctamente');
      }
    });
  } catch (error) {
    console.error('Error al hashear la contraseña:', error);
  } finally {
    connection.end(); // Cerramos la conexión
  }
}

// Ejecutamos la función
updatePassword();
