// src/models/Activity.js
const pool = require("../config/db");

const Activity = {
  async getAllByModuleId(moduleId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM Activities WHERE ModuleID = ? ORDER BY CreatedAt ASC`,
        [moduleId]
      );
      return rows;
    } finally {
      conn.release();
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
        `INSERT INTO Activities (ModuleID, Title, Content, Deadline, MaxSubmissions)
         VALUES (?, ?, ?, ?, ?)`,
        [
          activityData.ModuleID,
          activityData.Title,
          activityData.Content || null,
          activityData.Deadline || null,
          activityData.MaxSubmissions || 1,
        ]
      );
      return result.insertId;
    } finally {
      conn.release();
    }
  },

  async update(id, activityData) {
    const conn = await pool.getConnection();
    try {
      const updates = [];
      const params = [];

      const fieldMap = {
        title: "Title",
        content: "Content",
        deadline: "Deadline",
        maxSubmissions: "MaxSubmissions",
      };

      Object.entries(fieldMap).forEach(([key, dbField]) => {
        if (activityData[key] !== undefined) {
          updates.push(`${dbField} = ?`);
          const value = key === "deadline" && activityData[key] === "" ? null : activityData[key];
          params.push(value);
        }
      });

      if (updates.length === 0) {
        throw new Error("No se proporcionaron campos válidos para actualizar");
      }

      const sql = `UPDATE Activities SET ${updates.join(", ")} WHERE ActivityID = ?`;
      await conn.query(sql, [...params, id]);
      return true;
    } finally {
      conn.release();
    }
  },

  async delete(id) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        `DELETE FROM Activities WHERE ActivityID = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  },
  async getMaxSubmissions(activityId) {
  const conn = await pool.getConnection();
  try {
    const [[row]] = await conn.query(
      `SELECT MaxSubmissions FROM Activities WHERE ActivityID = ?`,
      [activityId]
    );
    return row?.MaxSubmissions || 1;
  } finally {
    conn.release();
  }
}

};

module.exports = Activity;
