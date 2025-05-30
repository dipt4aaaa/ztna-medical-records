FROM postgres:13
ENV POSTGRES_DB=medical_records
ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=secret
COPY init.sql /docker-entrypoint-initdb.d/
