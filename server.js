const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const app = express();
const port = process.env.API_PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize database and load CSV data
async function initializeDatabase() {
  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS healthcare_records (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INTEGER,
        gender VARCHAR(50),
        blood_type VARCHAR(10),
        medical_condition TEXT,
        date_of_admission DATE,
        doctor VARCHAR(255),
        hospital VARCHAR(255),
        insurance_provider VARCHAR(255),
        billing_amount DECIMAL(10,2),
        room_number VARCHAR(50),
        admission_type VARCHAR(100),
        discharge_date DATE,
        medication TEXT,
        test_results TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if data already exists
    const existingData = await pool.query(
      "SELECT COUNT(*) FROM healthcare_records"
    );
    if (parseInt(existingData.rows[0].count) > 0) {
      console.log("Database already has data, skipping CSV import");
      return;
    }

    // Load CSV data
    const csvPath = path.join(__dirname, "data", "healthcare_dataset.csv");
    if (!fs.existsSync(csvPath)) {
      console.log("CSV file not found, creating sample data...");
      await createSampleData();
      return;
    }

    console.log("Loading CSV data...");
    const records = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (row) => {
          records.push(row);
        })
        .on("end", async () => {
          try {
            for (const record of records) {
              await pool.query(
                `
                INSERT INTO healthcare_records (
                  name, age, gender, blood_type, medical_condition,
                  date_of_admission, doctor, hospital, insurance_provider,
                  billing_amount, room_number, admission_type, discharge_date,
                  medication, test_results
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              `,
                [
                  record.Name || record.name,
                  parseInt(record.Age || record.age) || null,
                  record.Gender || record.gender,
                  record["Blood Type"] || record.blood_type,
                  record["Medical Condition"] || record.medical_condition,
                  record["Date of Admission"] ||
                    record.date_of_admission ||
                    null,
                  record.Doctor || record.doctor,
                  record.Hospital || record.hospital,
                  record["Insurance Provider"] || record.insurance_provider,
                  parseFloat(
                    record["Billing Amount"] || record.billing_amount
                  ) || null,
                  record["Room Number"] || record.room_number,
                  record["Admission Type"] || record.admission_type,
                  record["Discharge Date"] || record.discharge_date || null,
                  record.Medication || record.medication,
                  record["Test Results"] || record.test_results,
                ]
              );
            }
            console.log(`Imported ${records.length} records from CSV`);
            resolve();
          } catch (err) {
            reject(err);
          }
        })
        .on("error", reject);
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

// Create sample data if CSV not found
async function createSampleData() {
  const sampleData = [
    {
      name: "John Doe",
      age: 45,
      gender: "Male",
      blood_type: "A+",
      medical_condition: "Hypertension",
      doctor: "Dr. Smith",
      hospital: "General Hospital",
      insurance_provider: "HealthCare Plus",
      billing_amount: 5000.0,
      room_number: "101",
      admission_type: "Emergency",
      medication: "Lisinopril",
      test_results: "Normal",
    },
    {
      name: "Jane Smith",
      age: 32,
      gender: "Female",
      blood_type: "B-",
      medical_condition: "Diabetes",
      doctor: "Dr. Johnson",
      hospital: "City Medical Center",
      insurance_provider: "MedCare",
      billing_amount: 3500.0,
      room_number: "205",
      admission_type: "Scheduled",
      medication: "Metformin",
      test_results: "Elevated glucose",
    },
  ];

  for (const record of sampleData) {
    await pool.query(
      `
      INSERT INTO healthcare_records (
        name, age, gender, blood_type, medical_condition,
        doctor, hospital, insurance_provider, billing_amount,
        room_number, admission_type, medication, test_results
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `,
      [
        record.name,
        record.age,
        record.gender,
        record.blood_type,
        record.medical_condition,
        record.doctor,
        record.hospital,
        record.insurance_provider,
        record.billing_amount,
        record.room_number,
        record.admission_type,
        record.medication,
        record.test_results,
      ]
    );
  }
  console.log("Created sample healthcare data");
}

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Get all records with pagination
app.get("/records", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    let query = "SELECT * FROM healthcare_records";
    let countQuery = "SELECT COUNT(*) FROM healthcare_records";
    const params = [];

    if (search) {
      query +=
        " WHERE name ILIKE $1 OR medical_condition ILIKE $1 OR doctor ILIKE $1";
      countQuery +=
        " WHERE name ILIKE $1 OR medical_condition ILIKE $1 OR doctor ILIKE $1";
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${
      params.length + 2
    }`;
    params.push(limit, offset);

    const [records, totalCount] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [`%${search}%`] : []),
    ]);

    res.json({
      data: records.rows,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount.rows[0].count),
        pages: Math.ceil(parseInt(totalCount.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single record
app.get("/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM healthcare_records WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new record
app.post("/records", async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      blood_type,
      medical_condition,
      date_of_admission,
      doctor,
      hospital,
      insurance_provider,
      billing_amount,
      room_number,
      admission_type,
      discharge_date,
      medication,
      test_results,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO healthcare_records (
        name, age, gender, blood_type, medical_condition,
        date_of_admission, doctor, hospital, insurance_provider,
        billing_amount, room_number, admission_type, discharge_date,
        medication, test_results
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `,
      [
        name,
        age,
        gender,
        blood_type,
        medical_condition,
        date_of_admission,
        doctor,
        hospital,
        insurance_provider,
        billing_amount,
        room_number,
        admission_type,
        discharge_date,
        medication,
        test_results,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update record
app.put("/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      age,
      gender,
      blood_type,
      medical_condition,
      date_of_admission,
      doctor,
      hospital,
      insurance_provider,
      billing_amount,
      room_number,
      admission_type,
      discharge_date,
      medication,
      test_results,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE healthcare_records SET
        name = $1, age = $2, gender = $3, blood_type = $4,
        medical_condition = $5, date_of_admission = $6, doctor = $7,
        hospital = $8, insurance_provider = $9, billing_amount = $10,
        room_number = $11, admission_type = $12, discharge_date = $13,
        medication = $14, test_results = $15, updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
    `,
      [
        name,
        age,
        gender,
        blood_type,
        medical_condition,
        date_of_admission,
        doctor,
        hospital,
        insurance_provider,
        billing_amount,
        room_number,
        admission_type,
        discharge_date,
        medication,
        test_results,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete record
app.delete("/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM healthcare_records WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Statistics endpoint
app.get("/stats", async (req, res) => {
  try {
    const [totalRecords, genderStats, conditionStats] = await Promise.all([
      pool.query("SELECT COUNT(*) as total FROM healthcare_records"),
      pool.query(
        "SELECT gender, COUNT(*) as count FROM healthcare_records GROUP BY gender"
      ),
      pool.query(
        "SELECT medical_condition, COUNT(*) as count FROM healthcare_records GROUP BY medical_condition ORDER BY count DESC LIMIT 10"
      ),
    ]);

    res.json({
      total_records: parseInt(totalRecords.rows[0].total),
      gender_distribution: genderStats.rows,
      top_conditions: conditionStats.rows,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(port, "0.0.0.0", () => {
      console.log(`EMR API Server running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await pool.end();
  process.exit(0);
});
