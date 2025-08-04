# Lesson 6a: PostgreSQL and Node.js Integration

## 1. Introduction to PostgreSQL

PostgreSQL is a powerful, open-source object-relational database system known for its reliability, feature set, and performance. It is widely used in production environments for web, mobile, and analytics applications.

**Key Features:**
- Open source and free
- ACID compliant
- Supports advanced data types and indexing
- Extensible with custom functions and plugins

## 2. Setting Up Your Database

### a. Check if PostgreSQL is Installed- Should have been Installed at the start of the cohort 
Open your terminal and run:
```bash
psql --version
```
If you see a version number, PostgreSQL is installed. If not, follow the [official installation guide](https://www.postgresql.org/download/) for your OS.


### b. Set Up Your Database Connection
Update your `.env` file with PostgreSQL connection:
```
DATABASE_URI=postgresql://postgres:yourpassword@localhost:5432/yourdatabase
PORT=3000
```

### d. Create the Database Tables
Create a file called `schema.sql` in your project root with the following tables:
- **Users table**: id, email, name, password, created_at
- **Tasks table**: id, title, is_completed, user_id (foreign key), created_at

Run this SQL in your PostgreSQL database:
```bash
psql "postgresql://postgres:yourpassword@localhost:5432/yourdatabase" -f schema.sql
```

---

## 3. Modifying Your Express App for PostgreSQL

### a. Create Database Connection File
Create `db.js` in your project root:
- Import `pg` and `dotenv`
- Create a new Pool with your DATABASE_URI
- Export the pool

### b. Modify Your User Controller
In `controllers/userController.js`, you need to:

1. **Replace the memory store import** with your database pool
2. **Update the register function**:
   - Keep the validation logic
   - Replace `storedUsers.find()` with a SQL query to check for existing users
   - Replace `storedUsers.push()` with an INSERT query
   - Return the created user data

3. **Update the login function**:
   - Replace the memory lookup with a SQL SELECT query
   - Check for matching email and password
   - Return user data on success

4. **Keep the logoff function** as is (it doesn't need database changes)

### c. Modify Your Task Controller
In `controllers/taskController.js`, you need to:

1. **Replace the memory store import** with your database pool
2. **Update the index function**:
   - Add user_id parameter from query
   - Replace `storedTasks.filter()` with a SQL SELECT query
   - Filter tasks by user_id

3. **Update the show function**:
   - Add user_id parameter from query
   - Replace memory lookup with SQL SELECT query
   - Filter by both task id and user_id

4. **Update the create function**:
   - Add user_id parameter from query
   - Keep the validation logic
   - Replace memory push with SQL INSERT query
   - Include user_id in the insert

5. **Update the update function**:
   - Add user_id parameter from query
   - Keep the validation logic
   - Replace memory update with SQL UPDATE query
   - Filter by both task id and user_id

6. **Update the deleteTask function**:
   - Add user_id parameter from query
   - Replace memory delete with SQL DELETE query
   - Filter by both task id and user_id

### d. Modify Your App.js
In your `app.js`:

1. **Import your database pool** instead of any memory store
2. **Add a health check endpoint** that tests the database connection
3. **Keep your existing routes** - no changes needed to route files

---

## 4. Key Changes Made to Your Week4 Files

### Files Modified:
1. **`db.js`** - NEW FILE: PostgreSQL connection pool
2. **`controllers/userController.js`** - Replace memory storage with SQL queries
3. **`controllers/taskController.js`** - Replace memory storage with SQL queries
4. **`app.js`** - Add database health check
5. **`.env`** - Update with PostgreSQL connection string
6. **`schema.sql`** - NEW FILE: Database table definitions

### Major Changes:
- **Replaced `memoryStore.js`** with PostgreSQL database
- **Added user_id parameter** to all task operations for user ownership
- **Updated all database operations** to use SQL queries instead of in-memory arrays
- **Maintained validation** - Same Joi schemas still work
- **Kept route structure** - No changes needed to route files

---

## 5. Testing Your PostgreSQL API

1. **Start your PostgreSQL database** and make sure the tables exist.
2. **Start your Node.js server:**
   ```bash
   npm start
   ```
3. **Test your API endpoints** using [Postman](https://www.postman.com/) or curl:
   - Register: `POST /api/users/register`
   - Login: `POST /api/users/login`
   - Create task: `POST /api/tasks?user_id=1`
   - Get tasks: `GET /api/tasks?user_id=1`
   - Update task: `PATCH /api/tasks/1?user_id=1`
   - Delete task: `DELETE /api/tasks/1?user_id=1`

---

**Tips:**
- Make sure PostgreSQL is running and accessible
- Check your `.env` file for correct database credentials
- Use `console.log` to debug database queries
- Test each endpoint individually to ensure proper functionality
- Your validation schemas and routes remain unchanged!
- Remember to handle SQL errors appropriately in your try-catch blocks
