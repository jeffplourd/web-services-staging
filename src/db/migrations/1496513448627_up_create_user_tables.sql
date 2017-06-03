--ALTER DATABASE classkick
--  DEFAULT CHARACTER SET utf8mb4
--  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE SCHEMA IF NOT EXISTS classkick;

CREATE TABLE IF NOT EXISTS classkick.user (
    id              VARCHAR(36)   NOT NULL,
    email           VARCHAR(190),
    verified_email  BOOL          NOT NULL DEFAULT false,
    first_name      VARCHAR(35),
    last_name       VARCHAR(35),
    display_name    VARCHAR(70),
    referral        VARCHAR(30),
    tech_use        VARCHAR(30),
    created         TIMESTAMP     NOT NULL,
    last_login      TIMESTAMP     NOT NULL,

    CONSTRAINT user_pk PRIMARY KEY (id),
    CONSTRAINT user_ux_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS classkick.user_auth (
    user_id               VARCHAR(36)  NOT NULL,
    type                  VARCHAR(20)  NOT NULL,
    created               TIMESTAMP    NOT NULL,
    salt                  VARCHAR(30)  NOT NULL,
    access_token_hash     VARCHAR(64)  NOT NULL,
    access_token_created  TIMESTAMP    NOT NULL,
    reset_token_hash      VARCHAR(64),
    reset_token_created   TIMESTAMP    NULL,
    password_hash         VARCHAR(64),

    CONSTRAINT user_auth_pk PRIMARY KEY (user_id, type)
);

CREATE TABLE IF NOT EXISTS classkick.user_role (
    user_id        VARCHAR(36)  NOT NULL,
    role           VARCHAR(20) NOT NULL,

    CONSTRAINT user_role_pk PRIMARY KEY (user_id, role)
);
