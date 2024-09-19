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

export function extractIfEnveloped(input) {
  if(input.type == 'EnvelopedVerifiableCredential' ||
    'EnvelopedVerifiableCredential' in input.type
  ) {
    input.should.have.property('id').that.does
      .include('data:', `Missing id field.`);
    const extractedCredential = atob(input.id.split(',')[1].split('.')[1]);
    return JSON.parse(extractedCredential);
  } else if(input.type == 'EnvelopedVerifiablePresentation' ||
    'EnvelopedVerifiablePresentation' in input.type
  ) {
    input.should.have.property('id').that.does
      .include('data:', `Missing id field.`);
    const extractedPresentation = atob(input.id.split(',')[1].split('.')[1]);
    return JSON.parse(extractedPresentation);
  } else {
    return input;
  }
}
