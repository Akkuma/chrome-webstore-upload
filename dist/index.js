'use strict';

var got = require('got');

var rootURI = 'https://www.googleapis.com';
var refreshTokenURI = 'https://accounts.google.com/o/oauth2/token';
var upsertURI = function (id) { return (rootURI + "/upload/chromewebstore/v1.1/items/" + (id || '')); };
var publishURI = function (id, target) { return (
    (rootURI + "/chromewebstore/v1.1/items/" + id + "/publish?publishTarget=" + target)
); };
var extractBody = function (ref) {
  var body = ref.body;

  return body;
};

var requiredFields = [
    'extensionId',
    'clientId',
    'clientSecret',
    'refreshToken'
];

var publishTarget = {
  public: 'default',
  trustedTesters: 'trustedTesters'
};

module.exports = {
  insert: insert,
  update: update,
  upsert: upsert,
  publish: publish,
  publishTarget: publishTarget,
  fetchToken: fetchToken
};

function getToken(opts) {
  var token = opts.token;
  return token ? Promise.resolve(token) : fetchToken(opts);
}

function headers(token) {
  return {
    Authorization: ("Bearer " + token),
    'x-goog-api-version': '2'
  };
}

function insert(opts) {
  return upsert(opts);
}

function upsert(opts) {
  var extensionId = opts.extensionId;
  var zip = opts.zip;
  if (!zip) {
    return Promise.reject(new Error('Zip stream missing'));
  }

  var method = extensionId ? 'put' : 'post';
  return getToken(opts).then(function (token) {
    return got[method](upsertURI(extensionId), {
      headers: headers(token),
      body: zip,
      json: true
    });
  })
    .then(extractBody);
}

function update(opts) {
  if (!opts.extensionId) { return Promise.reject(new Error('Extension Id missing')); }

  return upsert(opts);
}

function publish(opts) {
  var target = opts.target; if ( target === void 0 ) target = publishTarget.public;
  var extensionId = opts.extensionId;
  var zip = opts.zip;
  var tokenProm = getToken(opts);

  return tokenProm.then(function (token) {
    var upsert = Promise.resolve();
    if (zip) {
      upsert = extensionId ? upload(opts, token) : insert(opts, token);
    }

    return Promise.all([upsert, token]);
  })
    .then(function (ref) {
      var res = ref[0];
      var token = ref[1];

      return got.post(publishURI(extensionId || res.id, target), {
      headers: headers(token),
      json: true
    });
  })
    .then(extractBody);
}

function fetchToken(ref) {
  var clientId = ref.clientId;
  var clientSecret = ref.clientSecret;
  var refreshToken = ref.refreshToken;

  return got.post(refreshTokenURI, {
    body: {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
    },
    json: true
  }).then(extractBody).then(function (ref) {
    var access_token = ref.access_token;

    return access_token;
  });
}
