-- Enable foreign key support, which is off by default in SQLite
PRAGMA foreign_keys = ON;

-- ----------------------------
-- Table structure for users
-- ----------------------------
CREATE TABLE IF NOT EXISTS "users" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "username" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "created_at" DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------
-- Table structure for categories
-- ----------------------------
CREATE TABLE IF NOT EXISTS "categories" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL UNIQUE
);

-- ----------------------------
-- Table structure for hero_slides
-- ----------------------------
CREATE TABLE IF NOT EXISTS "hero_slides" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "image" TEXT NOT NULL, -- Path to the image, e.g., /uploads/slides/slide-123.jpg
  "link" TEXT -- Link for the slide button, e.g., /show.html?id=5
);

-- ----------------------------
-- Table structure for shows
-- ----------------------------
CREATE TABLE IF NOT EXISTS "shows" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "poster" TEXT, -- Path to poster image
  "banner" TEXT, -- Path to banner image
  "genres" TEXT, -- Comma-separated list: "Action, Romance, Sci-Fi"
  "category_id" INTEGER,
  "created_at" DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL
);

-- ----------------------------
-- Table structure for episodes
-- ----------------------------
CREATE TABLE IF NOT EXISTS "episodes" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "show_id" INTEGER NOT NULL,
  "ep_number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "drive_url" TEXT NOT NULL, -- Google Drive embed URL
  "thumbnail" TEXT, -- Path to episode thumbnail
  "publish_date" DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY ("show_id") REFERENCES "shows" ("id") ON DELETE CASCADE -- Deleting a show deletes its episodes
);

-- ----------------------------
-- Table structure for watch_history
-- ----------------------------
CREATE TABLE IF NOT EXISTS "watch_history" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "episode_id" INTEGER NOT NULL,
  "progress" REAL DEFAULT 0, -- Store progress in seconds
  "last_watched_at" DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("episode_id") REFERENCES "episodes" ("id") ON DELETE CASCADE,
  UNIQUE ("user_id", "episode_id") -- A user has only one history entry per episode
);

-- ----------------------------
-- Initial Data for Setup
-- ----------------------------
BEGIN TRANSACTION;

-- Insert default categories
INSERT INTO "categories" ("name") VALUES ('K-Drama');
INSERT INTO "categories" ("name") VALUES ('Anime');
INSERT INTO "categories" ("name") VALUES ('Popular');
INSERT INTO "categories" ("name") VALUES ('Latest');

-- Insert a default admin user. Password is "admin"
-- The hash is for 'admin' using bcryptjs with 10 salt rounds
INSERT INTO "users" ("username", "password_hash") VALUES ('admin', '$2a$10$GS9QR.MM2hkTVG/D7GVTj.r5jz8vGUATkMvXP.CIPlsbo8nI/5Pa6');

-- Insert a placeholder hero slide
INSERT INTO "hero_slides" ("title", "subtitle", "image", "link") VALUES 
('Welcome to StreamHub', 'Your new home for K-Drama and Anime.', '/assets/images/placeholder-banner.jpg', '#');

COMMIT;