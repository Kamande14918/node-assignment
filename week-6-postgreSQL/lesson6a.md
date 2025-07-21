# Lesson 6a: PostgreSQL and Node.js Integration


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
```bash
psql "postgresql://postgres:yourpassword@localhost:5432/yourdatabase" -f week-6-postgreSQL/tasks-schema.sql
```
---

## 3. Building a Task API with Node.js and PostgreSQL

### a. Create the Folder and File Structure
- `week-6-postgreSql/`
  - `app.js` (main server file)
  - `db.js` (exports the shared PostgreSQL pool)
  - `taskController.js` (handles task CRUD logic)
  - `taskRoutes.js` (Express routes for tasks)
  - `tasks-schema.sql` (your table schema)
  - `.env` (your environment variables)

### b. Create the Database Pool in db.js
In `db.js`:
```js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
```

### c. Create the Task Controller
In `taskController.js`:
```js
const pool = require('./db');

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
  const { completed, title } = req.body;
  try {
    let result;
    if (title !== undefined) {
      result = await pool.query(
        'UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
        [title, completed, id]
      );
    } else {
      result = await pool.query(
        'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *',
        [completed, id]
      );
    }
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

### d. Create the Task Routes
In `taskRoutes.js`:
```js
const express = require('express');
const router = express.Router();
const taskController = require('./taskController');

router.get('/tasks', taskController.getTasks);
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

module.exports = router;
```

### e. Set Up the Express Server
In `app.js`:
```js
const express = require('express');
const pool = require('./db');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

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

const taskRoutes = require('./taskRoutes');
app.use('/api', taskRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## 4. Testing Your Task API

1. **Start your PostgreSQL database** and make sure the `tasks` table exists.
2. **Start your Node.js server:**
   ```bash
   npm run week6a
   ```
3. **Test your API endpoints** using [Postman](https://www.postman.com/) or curl:
   - `GET /api/tasks` – Get all tasks
   - `POST /api/tasks` – Create a new task (send JSON body: `{ "title": "My Task" }`)
   - `PUT /api/tasks/:id` – Update a task (send JSON body: `{ "completed": true }`)
   - `DELETE /api/tasks/:id` – Delete a task
4. **Check the responses** to make sure your CRUD operations work as expected.

---

**Tips:**
- Double-check your `.env` file for typos and correct credentials.
- If you get a connection error, make sure PostgreSQL is running and your `DATABASE_URI` is correct.
- Use `console.log` statements to debug your code if something isn’t working.
- If you change your schema, rerun the SQL in your database.
- Ask for help if you get stuck!
