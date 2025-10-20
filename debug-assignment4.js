const httpMocks = require('node-mocks-http');
const { login, register, logoff } = require('./controllers/userController');
const { storedUsers, setLoggedOnUser } = require('./util/memoryStore');

async function run() {
  // seed users
  const user1 = { email: 'bob@sample.com', password: 'Pa$$word20', name: 'Bob' };
  const user2 = { email: 'alice@sample.com', password: 'Pa$$word20', name: 'Alice' };
  storedUsers.length = 0;
  storedUsers.push(user1, user2);
  setLoggedOnUser(user1);

  console.log('Initial loggedOnUser:', require('./util/memoryStore').getLoggedOnUser());

  // Register jim
  let req = httpMocks.createRequest({ method: 'POST', body: { email: 'jim@sample.com', name: 'Jim', password: 'Pa$$word20' } });
  let res = httpMocks.createResponse();
  await register(req, res);
  console.log('After register status:', res.statusCode, 'body:', res._getJSONData());

  // Login jim
  req = httpMocks.createRequest({ method: 'POST', body: { email: 'jim@sample.com', password: 'Pa$$word20' } });
  res = httpMocks.createResponse();
  await login(req, res);
  console.log('After login status:', res.statusCode, 'body:', res._getJSONData());

  console.log('Current loggedOnUser:', require('./util/memoryStore').getLoggedOnUser());
}

run().catch(err => { console.error(err); process.exit(1); });
