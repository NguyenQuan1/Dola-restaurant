-- =====================================================================
-- Dola Restaurant — Database Schema (Updated)
-- Engine: MySQL 8+
-- Dùng cho backend NestJS + TypeORM Migration
-- =====================================================================

CREATE DATABASE IF NOT EXISTS dola_restaurant
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dola_restaurant;

-- ---------------------------------------------------------------------
-- 1. Phân quyền người dùng
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(50) NOT NULL UNIQUE,        -- admin, staff, customer
  description   VARCHAR(255),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  role_id       INT NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(255),
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ---------------------------------------------------------------------
-- 2. Danh mục & món ăn
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(120) NOT NULL UNIQUE,
  description   VARCHAR(255),
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  sort_order    INT DEFAULT 0,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE foods (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  category_id   INT NOT NULL,
  name          VARCHAR(150) NOT NULL,
  slug          VARCHAR(180) NOT NULL UNIQUE,
  price         DECIMAL(12,0) NOT NULL,
  description   TEXT,
  ingredients   TEXT,
  thumbnail_url VARCHAR(255),
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  is_featured   TINYINT(1) NOT NULL DEFAULT 0,
  avg_rating    DECIMAL(2,1) DEFAULT 0,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE food_images (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  food_id       INT NOT NULL,
  image_url     VARCHAR(255) NOT NULL,
  sort_order    INT DEFAULT 0,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. Bàn & đặt bàn
-- ---------------------------------------------------------------------
CREATE TABLE tables (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(20) NOT NULL UNIQUE,
  capacity      INT NOT NULL,
  location      VARCHAR(100),
  is_active     TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE reservations (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NULL,
  table_id       INT NULL,
  full_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(20) NOT NULL,
  email          VARCHAR(150),
  reserve_date   DATE NOT NULL,
  reserve_time   TIME NOT NULL,
  guests         INT NOT NULL,
  note           VARCHAR(255),
  status         ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (table_id) REFERENCES tables(id)
);

-- ---------------------------------------------------------------------
-- 4. Đánh giá & phản hồi
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  food_id        INT NOT NULL,
  rating         TINYINT NOT NULL,                    -- 1-5
  comment        TEXT,
  image_url      VARCHAR(255),
  is_approved    TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (food_id) REFERENCES foods(id)
);

CREATE TABLE review_replies (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  review_id      INT NOT NULL,
  user_id        INT NOT NULL,
  reply_text     TEXT NOT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------------
-- 5. Khuyến mãi & tin tức
-- ---------------------------------------------------------------------
CREATE TABLE promotions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(150) NOT NULL,
  description    TEXT,
  discount_type  ENUM('percent','fixed') DEFAULT 'percent',
  discount_value DECIMAL(10,0) NOT NULL,
  start_date     DATE,
  end_date       DATE,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE news (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  author_id      INT NULL,
  title          VARCHAR(200) NOT NULL,
  slug           VARCHAR(220) NOT NULL UNIQUE,
  thumbnail_url  VARCHAR(255),
  content        TEXT,
  is_published   TINYINT(1) NOT NULL DEFAULT 1,
  published_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------------
-- 6. Liên hệ
-- ---------------------------------------------------------------------
CREATE TABLE contacts (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150),
  phone          VARCHAR(20),
  subject        VARCHAR(200),
  message        TEXT NOT NULL,
  is_resolved    TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Dữ liệu mẫu tối thiểu
-- ---------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
  ('admin', 'Quản trị viên toàn hệ thống'),
  ('staff', 'Nhân viên nhà hàng'),
  ('customer', 'Khách hàng');

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Phở', 'pho', 1),
  ('Bún', 'bun', 2),
  ('Cơm tấm', 'com-tam', 3),
  ('Bánh mì', 'banh-mi', 4),
  ('Chè & Tráng miệng', 'che-trang-mieng', 5);
