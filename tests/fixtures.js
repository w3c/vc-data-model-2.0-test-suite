/* eslint-disable max-len */
export const vc_jwt = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvZXhhbXBsZXMvdjIiXSwiaWQiOiJodHRwOi8vZXhhbXBsZS5lZHUvY3JlZGVudGlhbHMvMzczMiIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJVbml2ZXJzaXR5RGVncmVlQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOiJodHRwczovL2V4YW1wbGUuZWR1L2lzc3VlcnMvNTY1MDQ5IiwidmFsaWRGcm9tIjoiMjAxMC0wMS0wMVQwMDowMDowMFoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDpleGFtcGxlOmViZmViMWY3MTJlYmM2ZjFjMjc2ZTEyZWMyMSIsImRlZ3JlZSI6eyJ0eXBlIjoiQmFjaGVsb3JEZWdyZWUiLCJuYW1lIjoiQmFjaGVsb3Igb2YgU2NpZW5jZSBhbmQgQXJ0cyJ9fX0sImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5lZHUvaXNzdWVycy81NjUwNDkiLCJqdGkiOiJodHRwOi8vZXhhbXBsZS5lZHUvY3JlZGVudGlhbHMvMzczMiIsInN1YiI6ImRpZDpleGFtcGxlOmViZmViMWY3MTJlYmM2ZjFjMjc2ZTEyZWMyMSJ9.0fkQPZOKlD0Sl0A798KBUNMOdGq90McQQIEtKU9tgSd9K1kRcxWVKDXQJcn_FJqLvo2bk793EHk-RTeEL1HyAQ';
export const vp_jwt = 'eyJraWQiOiJFeEhrQk1XOWZtYmt2VjI2Nm1ScHVQMnNVWV9OX0VXSU4xbGFwVXpPOHJvIiwiYWxnIjoiRVMzODQifQ.eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvZXhhbXBsZXMvdjIiXSwiaWQiOiJodHRwOi8vdW5pdmVyc2l0eS5leGFtcGxlL2NyZWRlbnRpYWxzLzE4NzIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRXhhbXBsZUFsdW1uaUNyZWRlbnRpYWwiXSwiaXNzdWVyIjoiaHR0cHM6Ly91bml2ZXJzaXR5LmV4YW1wbGUvaXNzdWVycy81NjUwNDkiLCJ2YWxpZEZyb20iOiIyMDEwLTAxLTAxVDE5OjIzOjI0WiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL2V4YW1wbGUub3JnL2V4YW1wbGVzL2RlZ3JlZS5qc29uIiwidHlwZSI6Ikpzb25TY2hlbWEifSwiY3JlZGVudGlhbFN1YmplY3QiOnsiaWQiOiJkaWQ6ZXhhbXBsZToxMjMiLCJkZWdyZWUiOnsidHlwZSI6IkJhY2hlbG9yRGVncmVlIiwibmFtZSI6IkJhY2hlbG9yIG9mIFNjaWVuY2UgYW5kIEFydHMifX19.d2k4O3FytQJf83kLh-HsXuPvh6yeOlhJELVo5TF71gu7elslQyOf2ZItAXrtbXF4Kz9WivNdztOayz4VUQ0Mwa8yCDZkP9B2pH-9S_tcAFxeoeJ6Z4XnFuL_DOfkR1fP';
export const credential = {
  '@context': ['https://www.w3.org/ns/credentials/v2'],
  type: ['VerifiableCredential'],
  credentialSubject: {
    name: 'Alice'
  }
};
export const envelopedCredential = {
  '@context': 'https://www.w3.org/ns/credentials/v2',
  type: 'EnvelopedVerifiableCredential',
  id: `data:application/vc+jwt,${vc_jwt}`
};
export const presentation = {
  '@context': ['https://www.w3.org/ns/credentials/v2'],
  type: ['VerifiablePresentation']
};
export const envelopedPresentation = {
  '@context': 'https://www.w3.org/ns/credentials/v2',
  type: 'EnvelopedVerifiablePresentation',
  id: `data:application/vp+jwt,${vp_jwt}`
};

export const relatedResource = {
  id: 'https://www.w3.org/ns/credentials/v2',
  mediaType: 'application/ld+json',
  digestSRI: 'sha384-NSOcNpmdIVUxIJGvGUoe22FjTWrXiaXlsZ8q6912LdnR3KraQO2n75Ica4wK4Qeg',
  digestMultibase: 'uJKGMkOmFbVJhEfKTduMC2XCyvRAYLjOVmZWwIH1wQ7k',
};
