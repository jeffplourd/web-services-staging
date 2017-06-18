const config = {
  "env": "staging",
  "postgres": {
    "host": process.env.DB_HOST || "104.154.139.93",
    "port": process.env.DB_PORT || "5432",
    "user": process.env.DB_USER  || "postgres",
    "database": "postgres",
    "password": process.env.DB_PASSWORD || "postgres",
    "ssl": {
      "rejectUnauthorized": false,
      "ca": "certs/server-ca.pem",
      "key": "certs/client-key.pem",
      "cert": "certs/client-cert.pem"
    }
  }
}

export = config;