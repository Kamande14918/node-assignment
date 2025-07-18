# Lesson 5: PostgreSQL and Node.js Integration

## 0. Running SQL Commands from Your Terminal

You can run SQL commands directly from your terminal using the `psql` command-line tool or a GUI client.

### a. Using `psql` (PostgreSQL CLI)
1. **Install `psql`** if you don’t have it:
   - On Mac: `brew install libpq` then `brew link --force libpq`
   - On Ubuntu: `sudo apt-get install postgresql-client`
   - On Windows: Use the [PostgreSQL installer](https://www.postgresql.org/download/windows/)

2. **Connect to your Neon database:**
   ```bash
   psql "postgresql://neondb_owner:npg_BbUPHQ3k7vwM@ep-fancy-art-a4fdltb3-pooler.us-east-1.aws.neon.tech/testdb?sslmode=require"
   ```
   - Paste your full connection string in quotes.

3. **Run SQL commands interactively:**
   - Once connected, you’ll see a prompt like `testdb=>`
   - Type SQL commands (e.g., `SELECT * FROM tasks;`) and press Enter.
   - Type `\q` to quit.

### b. Run a SQL File
If you have a file (e.g., `tasks-schema.sql`):
```bash
psql "postgresql://postgres:yourpassword@localhost:5432/yourdatabase" -f week-6-postgreSQL/tasks-schema.sql
```

### c. Use a GUI Client
- Use a tool like [DBeaver](https://dbeaver.io/), [TablePlus](https://tableplus.com/), or [pgAdmin](https://www.pgadmin.org/).
- Connect using your connection string and run SQL in the query editor.

---

## 1. Introduction to PostgreSQL

PostgreSQL is a powerful, open-source object-relational database system known for its reliability, feature set, and performance. It is widely used in production environments for web, mobile, and analytics applications.

**Key Features:**
- Open source and free
- ACID compliant
- Supports advanced data types and indexing
- Extensible with custom functions and plugins

## 2. Setting Up Your Project and Database

### a. Check if PostgreSQL is Installed
Open your terminal and run:
```bash
psql --version
```
If you see a version number, PostgreSQL is installed. If not, follow the [official installation guide](https://www.postgresql.org/download/) for your OS.

### b. Create a New Node.js Project (if you haven't already)
```bash
mkdir week-6-postgreSQL
cd week-6-postgreSQL
npm init -y
```

### c. Install Required Packages
```bash
npm install express pg dotenv
```

### d. Set Up Your Database Connection
Create a `.env` file in your `week-6-postgreSQL` folder with the following content (replace with your actual credentials):
```
DATABASE_URI=postgresql://postgres:yourpassword@localhost:5432/yourdatabase
PORT=3000
```

### e. Create the Tasks Table
Create a file called `tasks-schema.sql` in your `week-6-postgreSQL` folder with this content:
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);
```
Run this SQL in your PostgreSQL database (using `psql` or a GUI like DBeaver or TablePlus) to create the table.

---

## 3. Building a Task API with Node.js and PostgreSQL

### a. Create the Folder and File Structure
- `week-6-postgreSQL/`
  - `server.js` (main server file)
  - `todoController.js` (handles task CRUD logic)
  - `todoRoutes.js` (Express routes for tasks)
  - `tasks-schema.sql` (your table schema)
  - `.env` (your environment variables)

### b. Create the Task Controller
In `todoController.js`:
```js
const { Pool } = require('pg');
const pool = new Pool();

exports.getTasks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTask = async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *',
      [completed, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### c. Create the Task Routes
In `todoRoutes.js`:
```js
const express = require('express');
const router = express.Router();
const taskController = require('./todoController');

router.get('/tasks', taskController.getTasks);
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

module.exports = router;
```

### d. Set Up the Express Server
In `server.js`:
```js
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
});

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

const taskRoutes = require('./todoRoutes');
app.use('/api', taskRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

---

## 4. Testing Your Task API

1. **Start your PostgreSQL database** and make sure the `tasks` table exists.
2. **Start your Node.js server:**
   ```bash
   node server.js
   ```
3. **Test your API endpoints** using [Postman](https://www.postman.com/) or curl:
   - `GET /api/tasks` – Get all tasks
   - `POST /api/tasks` – Create a new task (send JSON body: `{ "title": "My Task" }`)
   - `PUT /api/tasks/:id` – Update a task (send JSON body: `{ "completed": true }`)
   - `DELETE /api/tasks/:id` – Delete a task
4. **Check the responses** to make sure your CRUD operations work as expected.

---

**Tips for Beginners:**
- Double-check your `.env` file for typos and correct credentials.
- If you get a connection error, make sure PostgreSQL is running and your `DATABASE_URI` is correct.
- Use `console.log` statements to debug your code if something isn’t working.
- If you change your schema, rerun the SQL in your database.
- Ask for help if you get stuck—everyone starts as a beginner!
