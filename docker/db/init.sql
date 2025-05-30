CREATE DATABASE medical_records;

\c medical_records;

CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    diagnosis TEXT,
    date_of_visit DATE
);

INSERT INTO patients (name, diagnosis, date_of_visit)
VALUES
('Ahmad Yusuf', 'Diabetes Mellitus', '2024-06-01'),
('Siti Aisyah', 'Hipertensi', '2024-06-02');
