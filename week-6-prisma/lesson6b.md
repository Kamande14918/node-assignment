# Lesson 6b: PostgreSQL and Node.js Integration with Prisma ORM

## 1. Introduction to Prisma

Prisma is a modern ORM (Object-Relational Mapping) for Node.js and TypeScript. It provides a type-safe, auto-completing, and developer-friendly way to interact with your database, compared to writing raw SQL or using the `pg` library directly.

**Key Features:**
- Type-safe database queries
- Auto-generated client based on your schema
- Built-in migrations and schema management
- Easy integration with PostgreSQL and other databases

---

## 2. Setting Up Prisma in Your Project

### a. Install Prisma Dependencies
In your project root (where your week4 files are), install Prisma:
```bash
npm install prisma @prisma/client
npx prisma init
```

### b. Configure Your Database Connection
Update your `.env` file with PostgreSQL connection:
```
DATABASE_URI="postgresql://postgres:yourpassword@localhost:5432/testdb?schema=public"
PORT=3000
```

### c. Create Prisma Schema
Replace the content of `prisma/schema.prisma` with:
- **User model**: id, email, name, password, createdAt, tasks relation
- **Task model**: id, title, isCompleted, userId, createdAt, user relation
- **Datasource**: PostgreSQL with your DATABASE_URI
- **Generator**: prisma-client-js

### d. Run Prisma Migration
Run this command from your project root:
```bash
npx prisma migrate dev --name init
```

---

## 3. Modifying Your Week4 Files for Prisma

### a. Create Database Connection File
Create `prisma/db.js` in your project root:
- Import `PrismaClient` from `@prisma/client`
- Create a new PrismaClient instance
- Export the prisma client

### b. Modify Your User Controller
In `controllers/userController.js`, you need to:

1. **Replace the memory store import** with your Prisma client
2. **Update the register function**:
   - Keep the validation logic
   - Replace `storedUsers.find()` with `prisma.user.findUnique()`
   - Replace `storedUsers.push()` with `prisma.user.create()`
   - Use `select` to return only needed fields

3. **Update the login function**:
   - Replace the memory lookup with `prisma.user.findFirst()`
   - Check for matching email and password
   - Return user data on success

4. **Keep the logoff function** as is (it doesn't need database changes)

### c. Modify Your Task Controller
In `controllers/taskController.js`, you need to:

1. **Replace the memory store import** with your Prisma client
2. **Update the index function**:
   - Add user_id parameter from query
   - Replace `storedTasks.filter()` with `prisma.task.findMany()`
   - Filter tasks by userId (convert to integer)

3. **Update the show function**:
   - Add user_id parameter from query
   - Replace memory lookup with `prisma.task.findFirst()`
   - Filter by both task id and userId

4. **Update the create function**:
   - Add user_id parameter from query
   - Keep the validation logic
   - Replace memory push with `prisma.task.create()`
   - Include userId in the data (convert to integer)

5. **Update the update function**:
   - Add user_id parameter from query
   - Keep the validation logic
   - Replace memory update with `prisma.task.update()`
   - Filter by both task id and userId

6. **Update the deleteTask function**:
   - Add user_id parameter from query
   - Replace memory delete with `prisma.task.delete()`
   - Filter by both task id and userId
   - Handle Prisma error codes (P2025 for not found)

### d. Modify Your App.js
In your `app.js`:

1. **Import your Prisma client** instead of any memory store
2. **Add a health check endpoint** that tests the database connection using `prisma.$queryRaw`
3. **Keep your existing routes** - no changes needed to route files

---

## 4. Key Changes Made to Your Week4 Files

### Files Modified:
1. **`prisma/schema.prisma`** - NEW FILE: Prisma schema with User and Task models
2. **`prisma/db.js`** - NEW FILE: Prisma client instance
3. **`controllers/userController.js`** - Replace memory storage with Prisma Client methods
4. **`controllers/taskController.js`** - Replace memory storage with Prisma Client methods
5. **`app.js`** - Add Prisma health check
6. **`.env`** - Update with PostgreSQL connection string

### Major Changes:
- **Replaced `memoryStore.js`** with Prisma ORM
- **Added Prisma schema** - Declarative database model definition
- **Updated all database operations** to use Prisma Client methods instead of in-memory arrays
- **Added user_id parameter** to all task operations for user ownership
- **Maintained validation** - Same Joi schemas still work
- **Kept route structure** - No changes needed to route files

---

## 5. Testing Your Prisma API

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

## 6. Comparing Prisma and pg Approaches

| Feature                | pg (SQL/Pool)                | Prisma ORM                        |
|------------------------|------------------------------|-----------------------------------|
| Query style            | Raw SQL strings              | Type-safe JS/TS API               |
| Schema management      | Manual SQL/migrations        | Prisma schema + migrations        |
| Type safety            | None (unless using TS types) | Built-in                          |
| Autocomplete           | No                           | Yes (in editors with Prisma ext.) |
| Error handling         | Manual                       | Built-in                          |
| Relations              | Manual JOINs                 | Declarative in schema             |
| Refactoring            | Tedious                      | Easier (schema-driven)            |
| Learning curve         | Lower (for SQL users)        | Slightly higher, but modern       |

---

**Tips:**
- Make sure PostgreSQL is running and accessible
- Check your `.env` file for correct database credentials
- Use `npx prisma studio` to view your database
- Test each endpoint individually to ensure proper functionality
- Use the [Prisma docs](https://www.prisma.io/docs/) for more advanced features
- Your validation schemas and routes remain unchanged!
- Remember to handle Prisma error codes appropriately in your try-catch blocks
- Use `parseInt()` when converting string user_id to integer for Prisma queries

