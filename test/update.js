import test from 'ava';
import got from 'got';
import td from 'testdouble';
import { update } from '../src';
import opts from './helpers/opts';

function stubTokenRequest(t, token = 'token') {
  td.replace(got, 'post', _ => Promise.resolve({
    body: { access_token: token }
  }));
}

test.beforeEach(t => {
  t.context.opts = opts({ token: 'token' });
});

test.afterEach('Reset Testdouble', t => {
  td.reset();
});

// TODO: Find a better way of handling stubbing, to eliminate the need
// to run tests serially - https://github.com/avajs/ava/issues/295#issuecomment-161123805

test('Update fails when file stream not provided', async t => {
    try {
      await update({ extensionId: 'fake' });
        t.fail('Did not reject promise when file stream missing');
    } catch(err) {
        t.is(err.message, 'Zip stream missing');
    }
});

test.serial('Update only returns response body on success', async t => {
  const body = { foo: 'bar' };

  t.context.opts.token = '';
  td.replace(got, 'put', () => Promise.resolve({ body }) );
  stubTokenRequest(t);

  const res = await update(t.context.opts);
  t.deepEqual(res, body);
});

test('Update does not fetch token when provided', async t => {
  td.replace(got, 'post', () => {
    t.fail('Token should not have been fetched');
  });

  td.replace(got, 'put', _ => Promise.resolve({}));

  await update(t.context.opts);
  t.pass();
});

test('Update uses token for auth', async t => {
  const token = 'token';

  stubTokenRequest(t, token);
  td.replace(got, 'put', (uri, { headers }) => {
    t.is(headers.Authorization, `Bearer ${token}`);
    return Promise.resolve({});
  });

  t.context.opts.token = token;
  await update(t.context.opts);
});

test('Update uses provided extension ID', async t => {
  const extensionId = t.context.opts.extensionId;

  td.replace(got, 'put', (uri) => {
    const hasId = new RegExp(`\/items\/${extensionId}`).test(uri);
    t.true(hasId);

    return Promise.resolve({});
  });

  await update(t.context.opts);
});
