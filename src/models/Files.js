const pool = require("../config/db");
const allowedTypes = [
  "application/pdf",  // PDF
  "application/msword",  // Word (.doc)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // Word (.docx)
  "image/jpeg", // JPEG
  "image/png", // PNG
  "video/mp4", // MP4
  "video/avi", // AVI
  "video/mov", // MOV
  "video/webm", // WebM
];

const File = {
  async create(fileData) {
    if (!allowedTypes.includes(fileData.FileType)) {
      throw new Error("Tipo de archivo no permitido");
    }

    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        `INSERT INTO Files (ActivityID, UserID,CourseID ,FileName, FileType, Files, UploadedAt) 
         VALUES (?, ?, ?, ?, ?, ? ,?)`,
        [
          fileData.ActivityID,
          fileData.UserID,
          fileData.CourseID,
          fileData.FileName,
          fileData.FileType,
          fileData.Files, // 
          fileData.UploadedAt,
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error en File.create:", error);
      throw error;
    } finally {
      conn.release();
    }
  },
  async getById(fileId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`SELECT * FROM Files WHERE FileID = ?`, [
        fileId,
      ]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  },

  async getByActivityId(activityId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM Files WHERE ActivityID = ?`,
        [activityId]
      );
      return rows;
    } finally {
      conn.release();
    }
  },

  async delete(fileId) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(`DELETE FROM Files WHERE FileID = ?`, [
        fileId,
      ]);
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  },
  // Obtiene archivos por actividad y usuario
  async getByActivityIdAndUser(activityId, userId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM Files WHERE ActivityID = ? AND UserID = ?`,
        [activityId, userId]
      );
      return rows;
    } finally {
      conn.release();
    }
  },
};

module.exports = File;
