export const spaces = /\s+/g;

export function setupMatrix(match) {
  // this will tell the report
  // to make an interop matrix with this suite
  this.matrix = true;
  this.report = true;
  this.implemented = [...match.keys()];
  this.rowLabel = 'Test Name';
  this.columnLabel = 'Implementer';
}
export function addPerTestMetadata() {
  // append test meta data to the it/test this.
  this.currentTest.cell = {
    columnId: this.currentTest.parent.title,
    rowId: this.currentTest.title
  };
}
export function trimText(string) {
  // helper function to trim long text on newlines and double spaces
  return string.replace(spaces, ' ').trim();
}
export function extractEnvelopedCredential(issuedVc) {
  issuedVc.should.have.property('id').that.does
    .include('data:application/vc+jwt', `Missing id field.`);
  const credential = atob(issuedVc.id.split(',')[1].split('.')[1]);
  return JSON.parse(credential);
}
export function extractIfEnveloped(issuedVc) {
  if(issuedVc.type == 'EnvelopedVerifiableCredential' ||
    'EnvelopedVerifiableCredential' in issuedVc.type
  ) {
    return extractEnvelopedCredential(issuedVc);
  } else {
    return issuedVc;
  }
}
