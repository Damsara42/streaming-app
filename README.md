# StreamHub: K-Drama & Anime Streaming Site

This is a complete, full-stack K-Drama and Anime streaming website built with a **Vanilla HTML/CSS/JS** frontend and a **Node.js (Express) + SQLite** backend. It includes a full-featured Admin Panel (CMS) for managing all content.

## 🎬 Main Features

### User Frontend
* **Modern Dark UI:** Glassmorphism and neon accents.
* **Hero Slider:** Auto-playing banner managed from the admin panel.
* **Dynamic Homepage:** Categories and shows are loaded dynamically from the API.
* **AJAX Search:** Live search for shows by title, genre, or description.
* **Show & Episode Pages:** Detailed pages for each show and its episode list.
* **Video Player:** Plays embedded Google Drive videos.
* **User System:** Local user registration and login.
* **Watch History:** Saves user progress (simulated for G-Drive).

### Admin Backend (CMS)
* **Secure Admin Login:** Separate, token-based authentication for the admin.
* **Analytics Dashboard:** View quick stats (users, shows, episodes).
* **Content Management:** Full CRUD (Create, Read, Update, Delete) functionality for:
    * Hero Banner Slides
    * Categories
    * Shows (with poster/banner uploads)
    * Episodes (with video URLs and scheduling)

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Vanilla)
* **JavaScript:** Vanilla JS (ES6+), `fetch()` for AJAX
* **Backend:** Node.js, Express.js
* **Database:** SQLite3
* **Authentication:** JWT (JSON Web Tokens), `bcryptjs` for hashing
* **File Uploads:** `multer`

## 📂 Project Structure

```
/streaming-app
|-- /admin            (Admin Panel SPA)
|-- /api              (Backend Server & Routes)
|-- /database         (SQLite file and schema)
|-- /public           (User-facing site)
|   |-- /css
|   |-- /js
|   |-- /assets
|   |-- /uploads      (Uploaded images)
|-- .gitignore
|-- package.json
|-- README.md
```

## 🚀 How to Run Locally

### Prerequisites

1.  **Node.js:** Download and install it from [nodejs.org](https://nodejs.org/). This includes `npm`.
2.  **SQLite3 (Command Line):** You need the SQLite command-line tool to initialize the database.
    * **Windows:** Download the "precompiled binaries" from [sqlite.org](https://www.sqlite.org/download.html).
    * **macOS:** Should be included. If not, run `brew install sqlite`.
    * **Linux:** Run `sudo apt-get install sqlite3`.

### 1. Clone the Repository

Clone or download all the project files into a single `streaming-app` folder.

### 2. Install Dependencies

Open a terminal or command prompt, navigate into the project's root folder (`/streaming-app`), and run:

```bash
npm install
```
This will read `package.json` and install all the required packages (Express, sqlite3, etc.) into a `node_modules` folder.

### 3. Initialize the Database

You only need to do this **one time**. Run the `initdb` script you added to `package.json`:

```bash
npm run initdb
```
This command will execute `sqlite3 database/stream.db < database/schema.sql`, creating the `stream.db` file and setting up all your tables and the default admin user.

**Admin Login:** `admin`
**Admin Password:** `admin`

### 4. Run the Server

To start the server, run:

```bash
npm start
```
For development (server auto-restarts on file changes), run:

```bash
npm run dev
```
You should see the following in your terminal:

```
Server running on http://localhost:3000
Connected to the SQLite database.
Foreign keys enabled.
```

### 5. Access Your Site

You're all set!

* **Main Site:** Open your browser to [**http://localhost:3000**](http://localhost:3000)
* **Admin Panel:** Open [**http://localhost:3000/admin/login.html**](http://localhost:3000/admin/login.html)