import test from 'ava';
import got from 'got';
import td from 'testdouble';
import { fetchToken } from '../src';
import opts from './helpers/opts';

test.beforeEach('Setup Sinon Sandbox', t => {
  t.context.opts = opts();
});

test.afterEach('Reset Sinon Sandbox', t => {
  td.reset();
});

// TODO: Find a better way of handling stubbing, to eliminate the need
// to run tests serially - https://github.com/avajs/ava/issues/295#issuecomment-161123805

test('Only returns token from response body', async t => {
  const { client, sandbox } = t.context;
  const accessToken = 'access-token';

  td.replace(got, 'post', (uri) => {
    return Promise.resolve({
      body: {
        access_token: accessToken
      }
    });
  });

  t.is(await fetchToken(t.context.opts), accessToken);
});

test.todo('Request includes clientId, clientSecret, and refreshToken');
