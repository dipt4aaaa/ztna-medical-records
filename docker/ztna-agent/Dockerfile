FROM python:3.9-slim
WORKDIR /app
COPY ztna_agent.py .
RUN pip install flask psycopg2-binary
CMD ["python", "ztna_agent.py"]
