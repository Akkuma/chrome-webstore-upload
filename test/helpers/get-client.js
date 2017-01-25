const webStoreUpload = require('../../src');

module.exports = function getClient() {
    return webStoreUpload({
        extensionId: 'foo',
        clientId: 'bar',
        clientSecret: 'foobar',
        refreshToken: 'heyhey'
    });
};
