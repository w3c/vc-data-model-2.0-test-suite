// Rename this file to localConfig.cjs
// Before running the tests, you can specify a BASE_URL, such as
// BASE_URL=http://localhost:40443/zDdfsdfs npm test
const baseUrl = process.env.BASE_URL || 'https://localhost:40443/id';
module.exports = {
  settings: {},
  implementations: [{
    name: 'My Company',
    implementation: 'My Implementation Name',
    issuers: [{
      id: 'did:myMethod:implementation:issuer:id',
      endpoint: `${baseUrl}/credentials/issue`
    }],
    verifiers: [{
      id: 'did:myMethod:implementation:verifier:id',
      endpoint: `${baseUrl}/credentials/verify`
    }]
  }]
};
