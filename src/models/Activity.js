// src/models/Activity.js
const pool = require("../config/db"); // Importa el pool con promesas

const Activity = {
  async getAllByModuleId(moduleId) {
    const conn = await pool.getConnection(); // Usar la conexión
    try {
      const [rows] = await conn.query(
        `SELECT * FROM Activities WHERE ModuleID = ? ORDER BY CreatedAt ASC`,
        [moduleId]
      );
      return rows;
    } finally {
      conn.release(); // Liberar la conexión
    }
  },

  async getById(activityId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM Activities WHERE ActivityID = ?`,
        [activityId]
      );
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  },

  async create(activityData) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        "INSERT INTO Activities (ModuleID, Title, Content, Type, Deadline, MaxAttempts) VALUES (?, ?, ?, ?, ?, ?)",
        [
          activityData.ModuleID,
          activityData.Title,
          activityData.Content,
          activityData.Type,
          activityData.Deadline,
          activityData.MaxAttempts || 1,
        ]
      );
      return result.insertId; // Retorna el ID de la actividad creada
    } finally {
      conn.release();
    }
  },

  async update(id, activityData) {
    const conn = await pool.getConnection();
    try {
      const updates = [];
      const params = [];

      // Mapeo de los campos que se pueden actualizar
      const fieldMap = {
        title: "Title",
        content: "Content",
        type: "Type",
        deadline: "Deadline",
        maxAttempts: "MaxAttempts", 
      };
      

      // Preparar la consulta SQL para los campos que se deben actualizar
      Object.entries(fieldMap).forEach(([key, dbField]) => {
        if (activityData[key] !== undefined) {
          updates.push(`${dbField} = ?`);
          const value =
            key === "deadline" && activityData[key] === ""
              ? null
              : activityData[key];
          params.push(value);
        }
      });

      // Si no se proporcionan campos para actualizar, lanzamos un error
      if (updates.length === 0) {
        throw new Error("No se proporcionaron campos válidos para actualizar");
      }

      // Construir la consulta SQL
      const sql = `
        UPDATE Activities
        SET ${updates.join(", ")}
        WHERE ActivityID = ?
      `;

      // Ejecutar la consulta
      await conn.query(sql, [...params, id]);
      return true; // Retornar que la actualización fue exitosa
    } finally {
      conn.release(); // Liberar la conexión
    }
  },

  // En el modelo Activity.js
  async delete(id) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        // Desestructura el array para obtener el primer elemento
        "DELETE FROM Activities WHERE ActivityID = ?",
        [id]
      );
      console.log(`Eliminación de actividad con ID ${id}:`, result);
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  },
};

module.exports = Activity;
