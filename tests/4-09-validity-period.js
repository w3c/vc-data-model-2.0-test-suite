/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// eslint-disable-next-line max-len
import {addPerTestMetadata, setupMatrix, trimText, validityPeriodCheck} from './helpers.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {createRequire} from 'module';
import {filterByTag} from 'vc-test-suite-implementations';
import {TestEndpoints} from './TestEndpoints.js';

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const require = createRequire(import.meta.url);

const tag = 'vc2.0';
const {match} = filterByTag({tags: [tag]});

// 4.9 Validity Period https://w3c.github.io/vc-data-model/#validity-period
describe('Validity Period', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it(trimText(`If present, the value of the validFrom property MUST be an
        [XMLSCHEMA11-2] dateTimeStamp string value representing the date
        and time the credential becomes valid, which could be a date and
        time in the future or in the past.`),
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=If%20present%2C%20the%20value%20of%20the%20validFrom%20property%20MUST%20be%20an%20%5BXMLSCHEMA11%2D2%5D%20dateTimeStamp%20string%20value%20representing%20the%20date%20and%20time%20the%20credential%20becomes%20valid%2C%20which%20could%20be%20a%20date%20and%20time%20in%20the%20future%20or%20in%20the%20past.`;
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-validfrom-ms-ok.json')),
        'Failed to accept a VC with a valid `validFrom` date-time.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-validfrom-tz-ok.json')),
        'Failed to accept a VC using the subtractive timezone format.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-validfrom-invalid-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC using an incorrect `validFrom` date-time ' +
        'format.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-validfrom-ms-ok.json')),
        'Failed to accept a VC with a `validFrom` far into the future.');
      });
      it(trimText(`If present, the value of the validUntil property MUST be an
        [XMLSCHEMA11-2] dateTimeStamp string value representing the date
        and time the credential ceases to be valid, which could be a date
        and time in the past or in the future.`),
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=If%20present%2C%20the%20value%20of%20the%20validUntil%20property%20MUST%20be%20an%20%5BXMLSCHEMA11%2D2%5D%20dateTimeStamp%20string%20value%20representing%20the%20date%20and%20time%20the%20credential%20ceases%20to%20be%20valid%2C%20which%20could%20be%20a%20date%20and%20time%20in%20the%20past%20or%20in%20the%20future`;
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-validuntil-ok.json')),
        'Failed to accept a VC with a valid `validUntil` date-time.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-validuntil-ms-ok.json')),
        'Failed to accept a VC using miliseconds in `validUntil`.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-validuntil-tz-ok.json')),
        'Failed to accept a VC using the subtractive timezone format.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-validuntil-invalid-fail.json')),
        {name: 'HTTPError'},
        trimText(`Failed to reject a VC using an inccorect 
          "validUntil" date-time format.`));
      });
      it(trimText(`If a validUntil value also exists, the validFrom value MUST
        express a datetime that is temporally the same or earlier than the
        datetime expressed by the validUntil value.`),
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=If%20a%20validUntil%20value%20also%20exists%2C%20the%20validFrom%20value%20MUST%20express%20a%20datetime%20that%20is%20temporally%20the%20same%20or%20earlier%20than%20the%20datetime%20expressed%20by%20the%20validUntil%20value.`;
        await validityPeriodCheck(endpoints);
      });
      it(trimText(`If a validFrom value also exists, the validUntil value MUST
        express a datetime that is temporally the same or later than the
        datetime expressed by the validFrom value.`),
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=If%20a%20validFrom%20value%20also%20exists%2C%20the%20validUntil%20value%20MUST%20express%20a%20datetime%20that%20is%20temporally%20the%20same%20or%20later%20than%20the%20datetime%20expressed%20by%20the%20validFrom%20value.`;
        await validityPeriodCheck(endpoints);
      });
      // 4.8.1 Representing Time https://w3c.github.io/vc-data-model/#representing-time
      it(trimText(`Time values that are incorrectly serialized without an offset
        MUST be interpreted as UTC.`),
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=Time%20values%20that%20are%20incorrectly%20serialized%20without%20an%20offset%20MUST%20be%20interpreted%20as%20UTC.`;
        // TODO: add test using regular expression from spec.
        // https://w3c.github.io/vc-data-model/#example-regular-expression-to-detect-a-valid-xml-schema-1-1-part-2-datetimestamp
        // eslint-disable-next-line max-len, no-unused-vars
        const regexp = /-?([1-9][0-9]{3,}|0[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T(([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]+)?|(24:00:00(\.0+)?))(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))/;
        this.test.cell.skipMessage = 'TBD';
        this.skip();
      });
    });
  }
});
