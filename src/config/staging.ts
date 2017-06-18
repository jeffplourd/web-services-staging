const config = {
  "env": "staging",
  "postgres": {
    "host": process.env.DB_HOST || "127.0.0.1",
    "port": process.env.DB_PORT || "5432",
    "user": process.env.DB_USER  || "postgres",
    "database": "postgres",
    "password": "postgres",
    "ssl": {
      "rejectUnauthorized": false,
      "ca": "certs/server-ca.pem",
      "key": "certs/client-key.pem",
      "cert": "certs/client-cert.pem"
    }
  }
}

export = config;