'use strict';

const got = require('got');

const rootURI = 'https://www.googleapis.com';
const refreshTokenURI = 'https://accounts.google.com/o/oauth2/token';
const upsertURI = id => `${rootURI}/upload/chromewebstore/v1.1/items/${id || ''}`;
const publishURI = (id, target) => (
    `${rootURI}/chromewebstore/v1.1/items/${id}/publish?publishTarget=${target}`
);
const extractBody = ({ body }) => body;

const requiredFields = [
    'extensionId',
    'clientId',
    'clientSecret',
    'refreshToken'
];

const publishTarget = {
  public: 'default',
  trustedTesters: 'trustedTesters'
};

module.exports = {
  insert,
  update,
  upsert,
  publish,
  publishTarget,
  fetchToken
};

function getToken(opts) {
  const { token } = opts;
  return token ? Promise.resolve(token) : fetchToken(opts);
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    'x-goog-api-version': '2'
  };
}

function insert(opts) {
  return upsert(opts);
}

function upsert(opts) {
  const { extensionId, zip } = opts;
  if (!zip) {
    return Promise.reject(new Error('Zip stream missing'));
  }

  const method = extensionId ? 'put' : 'post';
  return getToken(opts).then(token => {
    return got[method](upsertURI(extensionId), {
      headers: headers(token),
      body: zip,
      json: true
    });
  })
    .then(extractBody);
}

function update(opts) {
  if (!opts.extensionId) return Promise.reject(new Error('Extension Id missing'));

  return upsert(opts);
}

function publish(opts) {
  const { target = publishTarget.public, extensionId, zip } = opts;
  const tokenProm = getToken(opts);

  return tokenProm.then(token => {
    let upsert = Promise.resolve();
    if (zip) {
      upsert = extensionId ? upload(opts, token) : insert(opts, token);
    }

    return Promise.all([upsert, token]);
  })
    .then(([res, token]) => got.post(publishURI(extensionId || res.id, target), {
      headers: headers(token),
      json: true
    }))
    .then(extractBody);
}

function fetchToken({ clientId, clientSecret, refreshToken }) {
  return got.post(refreshTokenURI, {
    body: {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
    },
    json: true
  }).then(extractBody).then(({ access_token }) => access_token);
}
