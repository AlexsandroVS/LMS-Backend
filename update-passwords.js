const bcrypt = require("bcrypt");

async function generatePasswordHash() {
  const password = "heropass"; // Cambia si deseas otra contraseña
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hash generado:", hashedPassword);
}

generatePasswordHash();
