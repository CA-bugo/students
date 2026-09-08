const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins and methods
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create connection pool optimized for local runtime and serverless scaling
const pool = mysql.createPool({
  host: "sql.freedb.tech",
  user: "u_zuhk0L",
  password: "pyvPrDfXssnI   ",
  database: "freedb_SHBMM6UG",
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Test database connection gracefully without breaking the initialization loop
pool.getConnection((err, conn) => {
  if (err) {
    console.error(" Database Connection Error: " + err.message);
    return;
  }
  console.log("✅ Connected to MySQL database successfully.");
  conn.release();
});



// show all existing students
app.get("/api/students", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const sid = req.query.sid;
  const query = sid ? "SELECT * FROM student WHERE sid = ?" : "SELECT * FROM student";
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

// create new student
app.post("/api/students", (req, res) => {
    const fname = req.body.fname;
    const course = req.body.course;
    const sid = req.body.sid;
    const email = req.body.email;
    const ylevel = req.body.ylevel;
    const cNumber = req.body.cNumber;

    pool.query(
      "INSERT INTO student (fname, course, sid, email, ylevel, cNumber) VALUES (?, ?, ?, ?, ?, ?)",
      [fname, course, sid, email, ylevel, cNumber],
      (err, results) => {
        if (err) {
          console.error("Database query error: " + err.message);
            res.status(500).json({ error: "Database query error" });
            return;
        }
        res.status(201).json({ msg: "Successfully added" });
      }
    );

})

// update student 
app.put("/api/students", (req, res) => {
    const fname = req.body.fname;
    const course = req.body.course;
    const sid = req.body.sid;
    const email = req.body.email;
    const ylevel = req.body.ylevel;
    const cNumber = req.body.cNumber;
    const originalSid = req.body.originalSid || sid;


  pool.query(
    "UPDATE student SET fname = ?, course = ?, sid = ?, email = ?, ylevel = ?, cNumber = ? WHERE sid = ?",
    [fname, course, sid, email, ylevel, cNumber, originalSid],
    (err, result) => {
      if (err) {
        console.error("Update error: " + err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ msg: `Successfully updated` });
    }
  );
});


//delete student
app.delete("/api/students", (req, res) => {
  const sid = req.body.sid;
  pool.query("DELETE FROM student WHERE sid = ?", [sid], (err, rows, fields) => {
    if (err) {
      console.error("Delete error: " + err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ msg: `Successfully deleted` });
  });
});
    




if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running and listening locally on port ${PORT}`);
  });
}

module.exports = app;