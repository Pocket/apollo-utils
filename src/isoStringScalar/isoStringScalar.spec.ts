import { Kind } from 'graphql';
import { isoStringScalar } from './isoStringScalar';

// add a simple graphql server test using this scalar in sample schema

const fullESTDateStr = '2023-02-11T13:39:48.000-05:00';
const fullESTDateObj = new Date(fullESTDateStr);
const fullUTCDateStr = '2023-02-11T18:39:48.000Z';
const fullUTCDateObj = new Date(fullUTCDateStr);
const mysqlBadDateStr = '0000-00-00 00:00:00';
const mysqlBadDateObj = new Date(mysqlBadDateStr);
const mysqlGoodDateStr = '2008-10-21 13:57:01';
const mysqlGoodDateObj = new Date(mysqlGoodDateStr);
const otherBadDateStr = '10/21/2008';

describe('isoStringScalar', () => {
  describe('serialize', () => {
    it('valid MySql client UTC-explicit TS Date object in, UTC ISOString out', async () => {
      const result = isoStringScalar.serialize(fullUTCDateObj);
      expect(result).toBe('2023-02-11T18:39:48.000Z');
    });
    it('valid MySql client UTC-implicit TS Date object in, UTC ISOString out', async () => {
      const result = isoStringScalar.serialize(mysqlGoodDateObj);
      expect(result).toBe('2008-10-21T17:57:01.000Z');
    });
    it('null in, null out', async () => {
      const result = isoStringScalar.serialize(null);
      expect(result).toBe(null);
    });
    it('invalid 0000-00-00 MySql client TS Date object in, Error out', async () => {
      expect(() => {
        isoStringScalar.serialize(mysqlBadDateObj);
      }).toThrow('Invalid Data Store Response: invalid Date object');
    });
    it('invalid type string in, error out', async () => {
      expect(() => {
        isoStringScalar.serialize(otherBadDateStr);
      }).toThrow(
        'GraphQL ISOString Scalar serializer expected a `Date` object or null'
      );
    });
  });

  describe('parseValue', () => {
    it('valid UTC-explicit String in, TS Date object out', async () => {
      const result = isoStringScalar.parseValue(fullUTCDateStr);
      expect(result).toStrictEqual(fullUTCDateObj);
    });
    it('valid EST-explicit String in, TS Date object out', async () => {
      const result = isoStringScalar.parseValue(fullESTDateStr);
      expect(result).toStrictEqual(fullESTDateObj);
    });
    it('valid UTC-implicit String in, TS Date object out', async () => {
      const result = isoStringScalar.parseValue(mysqlGoodDateStr);
      expect(result).toStrictEqual(mysqlGoodDateObj);
    });
    it('valid empty string in, null out', async () => {
      const result = isoStringScalar.parseValue('');
      expect(result).toBe(null);
    });
    it('valid null in, null out', async () => {
      const result = isoStringScalar.parseValue(null);
      expect(result).toBe(null);
    });
    it('invalid 0000-00-00 string in, error out', async () => {
      expect(() => {
        isoStringScalar.parseValue(mysqlBadDateStr);
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a ISO-8601-compliant string'
      );
    });
    it('invalid other string in, error out', async () => {
      expect(() => {
        isoStringScalar.parseValue(otherBadDateStr);
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a ISO-8601-compliant string'
      );
    });
    it('invalid other data type in, error out', async () => {
      expect(() => {
        isoStringScalar.parseValue(1234);
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a value of type string or null'
      );
    });
  });

  describe('parseLiteral', () => {
    it('valid UTC-explicit AST String in, TS Date object out', async () => {
      const result = isoStringScalar.parseLiteral({
        kind: Kind.STRING,
        value: fullUTCDateStr,
      });
      expect(result).toStrictEqual(fullUTCDateObj);
    });
    it('valid EST-explicit AST String in, TS Date object out', async () => {
      const result = isoStringScalar.parseLiteral({
        kind: Kind.STRING,
        value: fullESTDateStr,
      });
      expect(result).toStrictEqual(fullESTDateObj);
    });
    it('valid UTC-implicit AST String in, TS Date object out', async () => {
      const result = isoStringScalar.parseLiteral({
        kind: Kind.STRING,
        value: mysqlGoodDateStr,
      });
      expect(result).toStrictEqual(mysqlGoodDateObj);
    });
    it('valid empty AST String in, null out', async () => {
      const result = isoStringScalar.parseLiteral({
        kind: Kind.STRING,
        value: '',
      });
      expect(result).toStrictEqual(null);
    });
    it('invalid 0000-00-00 AST String in, error out', async () => {
      expect(() => {
        isoStringScalar.parseLiteral({
          kind: Kind.STRING,
          value: mysqlBadDateStr,
        });
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a ISO-8601-compliant string'
      );
    });
    it('invalid other AST String in, error out', async () => {
      expect(() => {
        isoStringScalar.parseLiteral({
          kind: Kind.STRING,
          value: otherBadDateStr,
        });
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a ISO-8601-compliant string'
      );
    });
  });
});
