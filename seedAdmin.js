const bcrypt = require("bcrypt");
const db = require("./src/config/db"); // ajusta según tu estructura
const User = require("./src/models/User");

async function seedAdmin() {
  const existing = await User.getByEmail("admin@gmail.com");
  if (existing) {
    console.log("✅ Admin ya existe, no se creará de nuevo.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = {
    name: "Administrador",
    email: "admin@lms.com",
    password: hashedPassword,
    role: "admin",
    avatar: null
  };

  await User.create(admin);
  console.log("✅ Usuario administrador creado: admin@lms.com / admin123");
}

seedAdmin().then(() => process.exit());
