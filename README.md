# 🛡️ ZTNA for Medical Records Database (Mininet + Docker)

This project simulates a Zero Trust Network Access (ZTNA) system similar to Netbird, used to protect access to a sensitive medical record database.

## 🔧 Components

- **Mininet** to simulate network environment (client <-> agent <-> db).
- **Docker** to simulate real-world ZTNA agent and database services.
- **ZTNA Agent** simulates access control enforcement (token-based).

## 📁 Project Structure

```
ztna-medical-records/
├── docker/
│   ├── db/
│   ├── ztna-agent/
│   └── docker-compose.yml
├── mininet/
│   ├── topology.py
│   └── ztna_forwarder.py
└── README.md
```

## 🚀 How to Run

### 1. Docker Setup

```bash
cd docker
docker-compose up --build
```

Access ZTNA agent at: `http://localhost:8000/query` with token header.

### 2. Mininet Setup

```bash
cd mininet
sudo python3 topology.py
```

### 3. Test

```bash
curl -H "Authorization: Bearer secure-token-123" http://localhost:8000/query
```

## 🧪 Dummy Data

| ID | Name         | Diagnosis          | Visit Date  |
|----|--------------|--------------------|-------------|
| 1  | Ahmad Yusuf  | Diabetes Mellitus  | 2024-06-01  |
| 2  | Siti Aisyah  | Hipertensi         | 2024-06-02  |

## 📌 Notes

- Replace token auth with proper OIDC in production.
- Expand with WireGuard or Tailscale for real tunnel.
- Simulate denial if token is wrong — full zero trust.

## 🧠 Author

Created for ZTNA learning scenario using SDN & Docker for secure system education.
