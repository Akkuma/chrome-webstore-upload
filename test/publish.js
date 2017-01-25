import got from 'got';
import test from 'ava';
import td from 'testdouble';
import url from 'url';
import opts from './helpers/opts';
import { publish, publishTarget } from '../src';

test.beforeEach(t => {
  t.context.opts = opts({ token: 'token', zip: '' });
});

test.afterEach.always('Reset Testdouble', t => {
  td.reset();
});


// TODO: Find a better way of handling stubbing, to eliminate the need
// to run tests serially - https://github.com/avajs/ava/issues/295#issuecomment-161123805

test('Publish uses default target when not provided', async t => {
  const defaultTarget = publishTarget.public;

  td.replace(got, 'post', (uri) => {
    const { query } = url.parse(uri, true);
    t.is(query.publishTarget, defaultTarget);

    return Promise.resolve({});
  });

  await publish(t.context.opts);
});

test('Publish uses target when provided', async t => {
  const target = publishTarget.trustedTesters;

  td.replace(got, 'post', (uri) => {
    const { query } = url.parse(uri, true);
    t.is(query.publishTarget, target);

    return Promise.resolve({});
  });

  t.context.opts.target = target;
  await publish(t.context.opts);
});

test('Publish does not fetch token when provided', async t => {
  td.replace(got, 'post', (uri) => {
    if (uri === 'https://accounts.google.com/o/oauth2/token') {
      return t.fail('Token should not have been fetched');

    }

    return Promise.resolve({});
  });

  await publish(t.context.opts);
  t.pass('Did not fetch token');
});

test('Publish uses token for auth', async t => {
  const token = 'token';

  td.replace(got, 'post', (uri, { headers }) => {
    t.is(headers.Authorization, `Bearer ${token}`);
    return Promise.resolve({});
  });

  await publish(t.context.opts);
});

test('Uses provided extension ID', async t => {
  const newOpts = opts('token');

  const extensionId = newOpts.extensionId;

  td.replace(got, 'post', (uri) => {
    const hasId = new RegExp(`\/items\/${extensionId}`).test(uri);
    t.true(hasId);

    return Promise.resolve({});
  });

  await publish(t.context.opts);
});

test.todo('Publish only returns response body on success');
