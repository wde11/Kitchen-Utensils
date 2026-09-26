CREATE TABLE IF NOT EXISTS utensils (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(80)  NOT NULL,
    category    VARCHAR(40)  NOT NULL,
    material    VARCHAR(60)  NULL,
    quantity    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    description TEXT         NULL,
    image_path  VARCHAR(255) NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_utensils_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
