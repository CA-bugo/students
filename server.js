const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const pool = mysql.createPool({
  host: "sql.freedb.tech",
  user: "u_zuhk0L",
  password: "pyvPrDfXssnI   ",
  database: "freedb_SHBMM6UG",
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error("Database Connection Error: " + err.message);
    return;
  }
  console.log("✅ Connected to MySQL database successfully.");
  conn.release();
});

function normalizeStudentPayload(body = {}) {
  const studentId = body.student_id ?? body.sid ?? body.id ?? "";
  const fullName = body.full_name ?? body.fname ?? body.name ?? "";
  const course = body.course ?? "";
  const yearLevel = body.year_level ?? body.ylevel ?? "";
  const email = body.email ?? "";
  const contactNumber = body.contact_number ?? body.cNumber ?? "";

  return {
    sid: studentId,
    fname: fullName,
    course,
    ylevel: yearLevel,
    email,
    cNumber: contactNumber,
  };
}

app.get("/api/students", (req, res) => {
  const sid = req.query.sid;
  const query = sid ? "SELECT * FROM student WHERE sid = ?" : "SELECT * FROM student ORDER BY sid ASC";
  const values = sid ? [sid] : [];

  pool.query(query, values, (err, results) => {
    if (err) {
      console.error("Database query error: " + err.message);
      res.status(500).json({ error: "Database query error" });
      return;
    }

    res.status(200).json(results);
  });
});

app.get("/api/students/search", (req, res) => {
  const queryText = (req.query.query || "").toString().trim();

  if (!queryText) {
    return res.status(200).json([]);
  }

  const sql = `
    SELECT *
    FROM student
    WHERE LOWER(fname) LIKE ? OR CAST(sid AS CHAR) LIKE ?
    ORDER BY sid ASC
  `;

  const wildcard = `%${queryText.toLowerCase()}%`;

  pool.query(sql, [wildcard, wildcard], (err, results) => {
    if (err) {
      console.error("Search error: " + err.message);
      return res.status(500).json({ error: "Search error" });
    }

    res.status(200).json(results);
  });
});

app.post("/api/students", (req, res) => {
  const student = normalizeStudentPayload(req.body);

  if (!student.fname || !student.course || !student.email) {
    return res.status(400).json({ error: "Missing required student fields." });
  }

  pool.query(
    "INSERT INTO student (sid, fname, course, ylevel, email, cNumber) VALUES (?, ?, ?, ?, ?, ?)",
    [student.sid, student.fname, student.course, student.ylevel, student.email, student.cNumber],
    (err) => {
      if (err) {
        console.error("Database query error: " + err.message);
        return res.status(500).json({ error: "Database query error" });
      }

      res.status(201).json({ msg: "Successfully added" });
    }
  );
});

app.put("/api/students", (req, res) => {
  const student = normalizeStudentPayload(req.body);
  const originalSid = req.body.originalSid ?? req.body.student_id ?? student.sid;

  if (!originalSid) {
    return res.status(400).json({ error: "Student ID is required for update." });
  }

  pool.query(
    "UPDATE student SET fname = ?, course = ?, sid = ?, email = ?, ylevel = ?, cNumber = ? WHERE sid = ?",
    [student.fname, student.course, student.sid, student.email, student.ylevel, student.cNumber, originalSid],
    (err) => {
      if (err) {
        console.error("Update error: " + err.message);
        return res.status(500).json({ error: err.message });
      }

      res.json({ msg: "Successfully updated" });
    }
  );
});

app.delete("/api/students", (req, res) => {
  const sid = req.body.student_id ?? req.body.sid;

  if (!sid) {
    return res.status(400).json({ error: "Student ID is required for deletion." });
  }

  pool.query("DELETE FROM student WHERE sid = ?", [sid], (err) => {
    if (err) {
      console.error("Delete error: " + err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json({ msg: "Successfully deleted" });
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running and listening locally on port ${PORT}`);
  });
}

module.exports = app;