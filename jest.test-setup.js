// Jest test setup: shim jsonPromise for node-mocks-http response objects
// Some versions of node-mocks-http don't include jsonPromise; tests expect it.
module.exports = () => {
  const originalCreateResponse = require('node-mocks-http').createResponse;
  const httpMocks = require('node-mocks-http');

  // Wrap createResponse to add jsonPromise if missing
  const wrappedCreateResponse = function (...args) {
    const res = originalCreateResponse.apply(this, args);
    if (typeof res.jsonPromise !== 'function') {
      res.jsonPromise = () => {
        return new Promise((resolve) => {
          // node-mocks-http stores json data in _getJSONData
          // wait a tick to simulate async behavior
          setImmediate(() => resolve(res._getJSONData()));
        });
      };
    }
    return res;
  };

  // Patch the module's exported function
  httpMocks.createResponse = wrappedCreateResponse;
};
