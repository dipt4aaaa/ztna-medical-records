from flask import Flask, request, jsonify
import psycopg2

app = Flask(__name__)

@app.route("/query", methods=["POST"])
def query_db():
    token = request.headers.get("Authorization")
    if token != "Bearer secure-token-123":
        return jsonify({"error": "Unauthorized"}), 401

    conn = psycopg2.connect(
        dbname="medical_records",
        user="admin",
        password="secret",
        host="db"
    )
    cur = conn.cursor()
    cur.execute("SELECT * FROM patients;")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify(rows)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
