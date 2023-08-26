/* eslint-disable consistent-return */
/* eslint-disable new-cap */
/* eslint-disable no-underscore-dangle */

const { spawn } = require('child_process');
const { writeFileSync } = require('fs');

/**
 * @param {number} v
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
function inRange(v, min, max) {
  return v >= min && v <= max;
}

/**
 * @param {string} name
 * @param {string} type
 * @param {number} v
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function checkRange(name, type, v, min, max) {
  if (!inRange(v, min, max))
    throw Error(
      `${type} "${name}" has value ${v} which is not in range of ${min} to ${max}`,
    );
  return v;
}

/**
 * @param {number} value
 * @param {number} size
 * @returns {number[]}
 */
function intToBytes(value, size) {
  const out = [];
  for (let i = size; i > 0; i -= 1) out.push((value >> ((i - 1) * 8)) & 0xff);
  return out;
}

/**
 * @param {string} name
 * @param {DataTypes} value
 * @returns {{name: string, value: DataTypes, size: number, encode: () => number[]}}
 */
function Table(name, value) {
  if (!(this instanceof Table)) return new Table(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(Table.prototype, {
  size: {
    get() {
      return this.value.length === 0
        ? 0
        : this.value.map((v) => v.size).reduce((a, b) => a + b);
    },
  },
  encode: {
    value() {
      return this.value.map((v) => v.encode()).flat();
    },
  },
});

/**
 * 8-bit unsigned integer
 * @param {string} name
 * @param {number} value
 * @returns {{name: string, value: number, size: number, encode: () => number[]}}
 */
function uint8(name, value) {
  if (!(this instanceof uint8)) return new uint8(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(uint8.prototype, {
  value: {
    get() {
      return this._value;
    },
    set(newValue) {
      this._value = checkRange(this.name, 'uint8', newValue, 0, 0xff);
    },
  },
  size: { value: 1 },
  encode: {
    value() {
      return intToBytes(this._value, 1);
    },
  },
});

/**
 * 16-bit unsigned integer
 * @param {string} name
 * @param {number} value
 * @returns {{name: string, value: number, size: number, encode: () => number[]}}
 */
function uint16(name, value) {
  if (!(this instanceof uint16)) return new uint16(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(uint16.prototype, {
  value: {
    get() {
      return this._value;
    },
    set(newValue) {
      this._value = checkRange(this.name, 'uint16', newValue, 0, 0xffff);
    },
  },
  size: { value: 2 },
  encode: {
    value() {
      return intToBytes(this._value, 2);
    },
  },
});

/**
 * 16-bit signed integer
 * @param {string} name
 * @param {number} value
 * @returns {{name: string, value: number, size: number, encode: () => number[]}}
 */
function int16(name, value) {
  if (!(this instanceof int16)) return new int16(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(int16.prototype, {
  value: {
    get() {
      return this._value;
    },
    set(newValue) {
      this._value = checkRange(this.name, 'int16', newValue, -0x8000, 0x7fff);
    },
  },
  size: { value: 2 },
  encode: {
    value() {
      return intToBytes(this._value, 2);
    },
  },
});

/**
 * 24-bit unsigned integer
 * @param {string} name
 * @param {number} value
 * @returns {{name: string, value: number, size: number, encode: () => number[]}}
 */
function uint24(name, value) {
  if (!(this instanceof uint24)) return new uint24(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(uint24.prototype, {
  value: {
    get() {
      return this._value;
    },
    set(newValue) {
      this._value = checkRange(this.name, 'uint24', newValue, 0, 0xffffff);
    },
  },
  size: { value: 3 },
  encode: {
    value() {
      return intToBytes(this._value, 3);
    },
  },
});

/**
 * 32-bit unsigned integer
 * @param {string} name
 * @param {number} value
 * @returns {{name: string, value: number, size: number, encode: () => number[]}}
 */
function uint32(name, value) {
  if (!(this instanceof uint32)) return new uint32(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(uint32.prototype, {
  value: {
    get() {
      return this._value;
    },
    set(newValue) {
      this._value = checkRange(this.name, 'uint32', newValue, 0, 0xffffffff);
    },
  },
  size: { value: 4 },
  encode: {
    value() {
      return intToBytes(this._value, 4);
    },
  },
});

/**
 * 32-bit signed fixed-point number
 * @param {string} name
 * @param {number} value
 * @returns {{name: string, value: number, size: number, encode: () => number[]}}
 */
function Fixed(name, value) {
  if (!(this instanceof Fixed)) return new Fixed(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(Fixed.prototype, {
  value: {
    get() {
      return this._value;
    },
    set(newValue) {
      checkRange(this.name, 'Fixed', Math.floor(newValue), -0x8000, 0x7fff);
      checkRange(
        this.name,
        'Fixed',
        Math.floor((newValue - Math.floor(newValue)) * 0x10000),
        0,
        0xffff,
      );
      this._value = newValue;
    },
  },
  size: { value: 4 },
  encode: {
    value() {
      return intToBytes(
        (Math.floor(this._value) << 16) +
          Math.floor((this._value - Math.floor(this._value)) * 0x10000),
        4,
      );
    },
  },
});

/**
 * Date and time represented in number of seconds since 1904. The value is represented as a signed 64-bit integer.
 * @param {string} name
 * @param {Date} value
 * @returns {{name: string, value: Date, size: number, encode: () => number[]}}
 */
function LongDateTime(name, value) {
  if (!(this instanceof LongDateTime)) return new LongDateTime(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(LongDateTime.prototype, {
  size: { value: 8 },
  encode: {
    value() {
      return [
        0,
        0,
        0,
        0,
        ...intToBytes(Math.round(this.value.getTime() / 1000) + 0x7c25b080, 4),
      ];
    },
  },
});

/**
 * String represented as array of 8-bit unsigned integers
 * @param {string} name
 * @param {string} value
 * @returns {{name: string, value: string, size: number, encode: () => number[]}}
 */
function String8(name, value) {
  if (!(this instanceof String8)) return new String8(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(String8.prototype, {
  size: {
    get() {
      return this.value.length;
    },
  },
  encode: {
    value() {
      return this.value
        .split('')
        .map((v) => intToBytes(v.charCodeAt(0), 1))
        .flat();
    },
  },
});

/**
 * String represented as array of 16-bit unsigned integers
 * @param {string} name
 * @param {string} value
 * @returns {{name: string, value: string, size: number, encode: () => number[]}}
 */
function String16(name, value) {
  if (!(this instanceof String16)) return new String16(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(String16.prototype, {
  size: {
    get() {
      return this.value.length * 2;
    },
  },
  encode: {
    value() {
      return this.value
        .split('')
        .map((v) => intToBytes(v.charCodeAt(0), 2))
        .flat();
    },
  },
});

/**
 * @param {string} name
 * @param {DataTypes} value
 * @returns {{name: string, value: DataTypes, size: number, encode: () => number[]}}
 */
function CffIndex(name, value) {
  if (!(this instanceof CffIndex)) return new CffIndex(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(CffIndex.prototype, {
  size: {
    get() {
      return this.encode().length;
    },
  },
  encode: {
    value() {
      if (this.value.length > 0) {
        const dataTable = Table('data', []);
        const offsets = [1];
        for (let i = 0; i < this.value.length; i += 1) {
          dataTable.value.push(this.value[i]);
          offsets.push(dataTable.size + 1);
        }
        let offSize;
        for (let i = 1; i < 5; i += 1) {
          offSize = i;
          for (let j = 0; j < offsets.length; j += 1) {
            if (offsets[j] > 2 ** (i * 8)) {
              offSize = undefined;
              break;
            }
          }
          if (offSize) break;
        }
        const offsetType = { 1: uint8, 2: uint16, 3: uint24, 4: uint32 }[
          offSize
        ];
        return Table(this.name, [
          uint32('count', this.value.length),
          uint8('offSize', offSize),
          Table(
            'offsets',
            offsets.map((v, i) => offsetType(`offset${i}`, v)),
          ),
          dataTable,
        ]).encode();
      }
      return Table(this.name, [uint32('count', 0)]).encode();
    },
  },
});

/**
 * @param {string} name
 * @param {number} value
 * @returns {{name: string, value: number, size: number, encode: () => number[]}}
 */
function CffNum(name, value) {
  if (!(this instanceof CffNum)) return new CffNum(name, value);
  this.name = name;
  this.value = value;
}
Object.defineProperties(CffNum.prototype, {
  size: {
    get() {
      return this.encode().length;
    },
  },
  encode: {
    value() {
      if (inRange(this.value, -107, 107)) {
        return [this.value + 139];
      }
      if (inRange(this.value, 108, 1131)) {
        const tempVal = this.value - 108;
        return [(tempVal >> 8) + 247, tempVal & 0xff];
      }
      if (inRange(this.value, -1131, -108)) {
        const tempVal = -this.value - 108;
        return [(tempVal >> 8) + 251, tempVal & 0xff];
      }
      return [28, ...intToBytes(this.value, 2)];
    },
  },
});

/**
 * @typedef {Array<Table|uint8|uint16|int16|uint24|uint32|Fixed|LongDateTime|String8|String16|CffIndex|CffNum>} DataTypes
 */

/** @typedef {{ xMin: number, yMin: number, xMax: number, yMax: number }} glyphBounds */

/**
 * https://docs.microsoft.com/en-us/typography/opentype/spec/head
 * @param {object} props
 * @param {number} props.majorVersion
 * @param {number} props.minorVersion
 * @param {uint32} props.checksumAdjustment
 * @param {uint16} props.flags
 * @param {Date} props.date
 * @param {glyphBounds} props.glyphBounds
 * @returns {Table}
 */
const genHead = ({
  majorVersion,
  minorVersion,
  checksumAdjustment,
  flags,
  date,
  glyphBounds,
}) =>
  Table('head', [
    uint16('majorVersion', 1),
    uint16('minorVersion', 0),
    uint16('fontRevisionMajor', majorVersion),
    uint16('fontRevisionMinor', minorVersion),
    checksumAdjustment,
    uint32('magicNumber', 0x5f0f3cf5),
    flags,
    uint16('unitsPerEm', 1000),
    LongDateTime('created', date),
    LongDateTime('modified', date),
    int16('xMin', glyphBounds.xMin),
    int16('yMin', glyphBounds.yMin),
    int16('xMax', glyphBounds.xMax),
    int16('yMax', glyphBounds.yMax),
    uint16('macStyle', 0b0000000000000000),
    uint16('lowestRecPPEM', 8),
    int16('fontDirectionHint', 2),
    int16('indexToLocFormat', 0),
    int16('glyphDataFormat', 0),
  ]);

/**
 * https://docs.microsoft.com/en-us/typography/opentype/spec/hhea
 * @param {object} props
 * @param {glyphBounds} props.glyphBounds
 * @param {number} props.width
 * @returns {Table}
 */
const genHhea = ({ glyphBounds, width }) =>
  Table('hhea', [
    uint16('majorVersion', 1),
    uint16('minorVersion', 0),
    int16('ascender', glyphBounds.yMax),
    int16('descender', glyphBounds.yMin),
    int16('lineGap', 90),
    uint16('advanceWidthMax', width),
    int16('minLeftSideBearing', glyphBounds.xMin),
    int16('minRightSideBearing', glyphBounds.xMax),
    int16('xMaxExtent', glyphBounds.xMax),
    int16('caretSlopeRise', 1),
    int16('caretSlopeRun', 0),
    int16('caretOffset', 0),
    int16('reserved1', 0),
    int16('reserved2', 0),
    int16('reserved3', 0),
    int16('reserved4', 0),
    int16('metricDataFormat', 0),
    uint16('numberOfHMetrics', 1),
  ]);

/**
 * https://docs.microsoft.com/en-us/typography/opentype/spec/maxp
 * @returns {Table}
 */
const genMaxp = () =>
  Table('maxp', [uint32('version', 0x00005000), uint16('numGlyphs', 2)]);

/**
 * https://docs.microsoft.com/en-us/typography/opentype/spec/os2
 * @param {object} props
 * @param {number} props.width
 * @param {glyphBounds} props.glyphBounds
 * @returns {Table}
 */
const genOS2 = ({ width, glyphBounds }) =>
  Table('OS/2', [
    uint16('version', 4),
    int16('xAvgCharWidth', width),
    uint16('usWeightClass', 400),
    uint16('usWidthClass', 5),
    uint16('fsType', 0),
    int16('ySubscriptXSize', 650),
    int16('ySubscriptYSize', 700),
    int16('ySubscriptXOffset', 0),
    int16('ySubscriptYOffset', 140),
    int16('ySuperscriptXSize', 650),
    int16('ySuperscriptYSize', 700),
    int16('ySuperscriptXOffset', 0),
    int16('ySuperscriptYOffset', 480),
    int16('yStrikeoutSize', 50),
    int16('yStrikeoutPosition', 260),
    int16('sFamilyClass', 0),
    Table('panose', [
      uint8('bFamilyType', 0),
      uint8('bSerifStyle', 0),
      uint8('bWeight', 0),
      uint8('bProportion', 0),
      uint8('bContrast', 0),
      uint8('bStrokeVariation', 0),
      uint8('bArmStyle', 0),
      uint8('bLetterform', 0),
      uint8('bMidline', 0),
      uint8('bXHeight', 0),
    ]),
    uint32('ulUnicodeRange1', 0xffffffff),
    uint32('ulUnicodeRange2', 0xffffffff),
    uint32('ulUnicodeRange3', 0xffffffff),
    uint32('ulUnicodeRange4', 0x07ffffff),
    uint32('achVendID', 0),
    uint16('fsSelection', 0b0000000111000000),
    uint16('usFirstCharIndex', 0x0020),
    uint16('usLastCharIndex', 0xffff),
    int16('sTypoAscender', 800),
    int16('sTypoDescender', -200),
    int16('sTypoLineGap', 90),
    uint16('usWinAscent', glyphBounds.yMax),
    uint16('usWinDescent', Math.max(-glyphBounds.yMin, 0)),
    uint32('ulCodePageRange1', 0),
    uint32('ulCodePageRange2', 0),
    int16('sxHeight', glyphBounds.yMax),
    int16('sCapHeight', glyphBounds.yMax),
    uint16('usDefaultChar', 0),
    uint16('usBreakChar', 32),
    uint16('usMaxContext', 1),
  ]);

/**
 * https://docs.microsoft.com/en-us/typography/opentype/spec/name
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.version
 * @returns {Table}
 */
const genName = ({ name, version }) => {
  const nameData = Table('data', [
    String16('copyright', 'github.com/jwr1/fallback-font'),
    String16('fontFamily', name),
    String16('fontSubfamily', 'Regular'),
    String16('uniqueID', `${name.replace(/ /g, '')}-${version}`),
    String16('fullName', name),
    String16('version', version),
    String16('postScriptName', name.replace(/ /g, '')),
  ]);
  const nameRecords = Table('nameRecords', []);
  let currentOffset = 0;
  for (let i = 0; i < 7; i += 1) {
    const currentLength = nameData.value[i].size;
    nameRecords.value.push(
      Table(`record${i}`, [
        uint16('platformID', 3),
        uint16('encodingID', 1),
        uint16('languageID', 0x0409),
        uint16('nameID', i),
        uint16('length', currentLength),
        uint16('stringOffset', currentOffset),
      ]),
    );
    currentOffset += currentLength;
  }
  return Table('name', [
    uint16('version', 0),
    uint16('count', 7),
    uint16('storageOffset', 90),
    nameRecords,
    nameData,
  ]);
};

/**
 * https://docs.microsoft.com/en-us/typography/opentype/spec/cmap
 * @returns {Table}
 */
const genCmap = () =>
  Table('cmap', [
    uint16('version', 0),
    uint16('numTables', 1),
    Table('encodingRecords', [
      Table('encodingRecord0', [
        uint16('platformID', 3),
        uint16('encodingID', 10),
        uint32('subtableOffset', 12),
      ]),
    ]),
    Table('subtables', [
      Table('subtable0', [
        uint16('format', 13),
        uint16('reserved', 0),
        uint32('length', 28),
        uint32('language', 0),
        uint32('numGroups', 1),
        uint32('startCharCode', 0),
        uint32('endCharCode', 0x10ffff),
        uint32('glyphID', 1),
      ]),
    ]),
  ]);

/**
 * https://docs.microsoft.com/en-us/typography/opentype/spec/post
 * @returns {Table}
 */
const genPost = () =>
  Table('post', [
    uint32('version', 0x00030000),
    Fixed('italicAngle', 0),
    int16('underlinePosition', -75),
    int16('underlineThickness', 50),
    uint32('isFixedPitch', 1),
    uint32('minMemType42', 0),
    uint32('maxMemType42', 0),
    uint32('minMemType1', 0),
    uint32('maxMemType1', 0),
  ]);

class Path {
  constructor() {
    this.cffPath = [];
    this.x = 0;
    this.y = 0;
    this.xMin = Infinity;
    this.yMin = Infinity;
    this.xMax = -Infinity;
    this.yMax = -Infinity;
  }

  addPathPosition(x, y) {
    this.x += x;
    this.y += y;
    this.xMin = Math.min(this.xMin, this.x);
    this.yMin = Math.min(this.yMin, this.y);
    this.xMax = Math.max(this.xMax, this.x);
    this.yMax = Math.max(this.yMax, this.y);
  }

  /**
   * @param  {number} x
   * @param  {number} y
   */
  move(x, y) {
    this.cffPath.push(CffNum('x', x), CffNum('y', y), uint8('op', 21));
    this.addPathPosition(x, y);
    return this;
  }

  /**
   * @param  {number} x
   */
  horizontalMove(x) {
    this.cffPath.push(CffNum('x', x), uint8('op', 22));
    this.addPathPosition(x, 0);
    return this;
  }

  /**
   * @param  {number} y
   */
  verticalMove(y) {
    this.cffPath.push(CffNum('y', y), uint8('op', 4));
    this.addPathPosition(0, y);
    return this;
  }

  /**
   * @param  {...number} args
   */
  line(...args) {
    this.cffPath.push(...args.map((v) => CffNum('num', v)), uint8('op', 5));
    for (let i = 0; i < args.length; i += 1) {
      if (i % 2 === 0) {
        this.addPathPosition(args[i], 0);
      } else this.addPathPosition(0, args[i]);
    }
    return this;
  }

  /**
   * @param  {...number} args
   */
  horizontalLine(...args) {
    this.cffPath.push(...args.map((v) => CffNum('num', v)), uint8('op', 6));
    for (let i = 0; i < args.length; i += 1) {
      if (i % 2 === 0) {
        this.addPathPosition(args[i], 0);
      } else this.addPathPosition(0, args[i]);
    }
    return this;
  }

  /**
   * @param  {...number} args
   */
  verticalLine(...args) {
    this.cffPath.push(...args.map((v) => CffNum('num', v)), uint8('op', 7));
    for (let i = 0; i < args.length; i += 1) {
      if (i % 2 === 0) {
        this.addPathPosition(0, args[i]);
      } else this.addPathPosition(args[i], 0);
    }
    return this;
  }
}

/**
 * https://docs.microsoft.com/en-us/typography/opentype/spec/cff2
 * @param {Path} path
 * @returns {Table}
 */
const genCff2 = (path) =>
  Table('CFF2', [
    uint8('majorVersion', 2),
    uint8('minorVersion', 0),
    uint8('headerSize', 5),
    uint16('topDictLength', 5),
    Table('topDict', [
      Table('FDArray', [CffNum('num', 26), uint16('op', 3108)]),
      Table('CharStrings', [CffNum('num', 14), uint8('op', 17)]),
    ]),
    CffIndex('globalSubrIndex', []),
    CffIndex('charStringsIndex', [
      Table('glyph0', [
        Table('callsubr', [CffNum('offset', -107), uint8('op', 10)]),
      ]),
      Table('glyph1', [
        Table('callsubr', [CffNum('offset', -107), uint8('op', 10)]),
      ]),
    ]),
    CffIndex('fontDictIndex', [
      Table('Private', [
        CffNum('size', 2),
        CffNum('offset', 36),
        uint8('op', 18),
      ]),
    ]),
    Table('privateDict0', [
      Table('Subrs', [CffNum('num', 2), uint8('op', 19)]),
    ]),
    CffIndex('localSubrIndex', [Table('localSubrIndex0', path.cffPath)]),
  ]);

/**
 * https://docs.microsoft.com/en-us/typography/opentype/spec/hmtx
 * @param {object} props
 * @param {number} props.width
 * @param {glyphBounds} props.glyphBounds
 * @returns {Table}
 */
const genHmtx = ({ width, glyphBounds }) =>
  Table('hmtx', [
    Table('glyph0', [
      uint16('advanceWidth', width),
      int16('lsb', glyphBounds.xMin),
    ]),
    Table('glyph1', [
      uint16('advanceWidth', width),
      int16('lsb', glyphBounds.xMin),
    ]),
  ]);

/**
 * @param {number[]} data
 * @returns {number}
 */
const calcChecksum = (data) => {
  const bytes = [...data];
  while (bytes.length % 4 !== 0) bytes.push(0);

  let sum = 0;
  for (let i = 0; i < bytes.length; i += 4) {
    const val =
      (bytes[i] << 24) +
      (bytes[i + 1] << 16) +
      (bytes[i + 2] << 8) +
      bytes[i + 3];
    sum += val < 0 ? val + 0x100000000 : val;
  }

  return sum % 2 ** 32;
};

module.exports = {
  Path,
  /**
   * @param {object} props
   * @param {string} props.name
   * @param {string} props.version
   * @param {Path} props.path
   * @param {number} props.width
   * @param {Date} [props.date]
   */
  genFont({ name, version, path, width, date = new Date() }) {
    const fileName = name.toLowerCase().replace(/ /g, '-');
    const [majorVersion, minorVersion] = version
      .split('.')
      .map((v) => parseInt(v, 10));
    const glyphBounds = {
      xMin: path.xMin,
      yMin: path.yMin,
      xMax: path.xMax,
      yMax: path.yMax,
    };

    const tableData = Table('data', []);
    const tableRecordsData = Table('records', []);
    const checksumAdjustment = uint32('checksumAdjustment', 0);

    const tables = [
      genHead({
        majorVersion,
        minorVersion,
        date,
        checksumAdjustment,
        flags: uint16('flags', 0b0000000000000011),
        glyphBounds,
      }),
      genHhea({ glyphBounds, width }),
      genMaxp(),
      genOS2({ width, glyphBounds }),
      genName({ name, version }),
      genCmap(),
      genPost(),
      genCff2(path),
      genHmtx({ width, glyphBounds }),
    ];

    tables.forEach((v) => {
      tableRecordsData.value.push(
        Table(v.name, [
          String8('tableTag', v.name),
          uint32('checksum', calcChecksum(v.encode())),
          uint32('offset', 156 + tableData.size),
          uint32('length', v.size),
        ]),
      );
      tableData.value.push(v);
      while (tableData.size % 4 > 0) tableData.value.push(uint8('PAD', 0));
    });

    tableRecordsData.value.sort((a, b) => (a.name > b.name ? 1 : -1));

    const otfFile = Table('otfFile', [
      String8('sfntVersion', 'OTTO'),
      uint16('numTables', 9),
      uint16('searchRange', 128),
      uint16('entrySelector', 3),
      uint16('rangeShift', 16),
      tableRecordsData,
      tableData,
    ]);
    const newChecksumAdjustment = 0xb1b0afba - calcChecksum(otfFile.encode());
    checksumAdjustment.value =
      newChecksumAdjustment < 0
        ? newChecksumAdjustment + 0x100000000
        : newChecksumAdjustment;
    writeFileSync(`./dist/${fileName}.otf`, new Uint8Array(otfFile.encode()));

    spawn('./woff2/woff2_compress', [`./dist/${fileName}.otf`]);

    writeFileSync(
      `./dist/${fileName}.css`,
      `@font-face {
  font-family: ${name.match(/ /).length ? `'${name}'` : name};
  src: url(${fileName}.woff2);
}`,
    );
  },
};

// attempt at generating woff2 file just with nodejs

// case 'UIntBase128': {
//   let { value } = table;
//   const nums = [];
//   while (value > 0) {
//     nums.push(value & 0x7f);
//     value >>= 7;
//   }
//   return nums.reverse().map((v, i, a) => (i !== a.length - 1 ? v | 0x80 : v));
// }

// checksumAdjustment.value = 0;
// flags.value = 0b0000100000000011;
// tables.sort((a, b) => (a.name > b.name ? 1 : -1));

// let tableOffset = 156;
// let headerChecksum = 1331713247;
// for (let i = 0; i < tables.length; i+=1) {
//   const currentTableLength = encodeTable(tables[i]).length;
//   headerChecksum += calcChecksum(
//     encodeTable({ name: 'tableTag', type: 'String8', value: tables[i].name })
//   );
//   headerChecksum += calcChecksum(encodeTable(tables[i]));
//   headerChecksum += tableOffset;
//   headerChecksum += currentTableLength;
//   tableOffset += currentTableLength + (currentTableLength % 4);
// }

// checksumAdjustment.value =
//   0xb1b0afba -
//   ((headerChecksum + tables.map((v) => calcChecksum(encodeTable(v))).reduce((a, b) => a + b)) %
//     2 ** 32);

// /** @type {tableLiteral} */
// const woff2CompressedFontData = {
//   name: 'CompressedFontData',
//   type: 'Literal',
//   value: Array.from(
//     new Uint8Array(
//       zlib.brotliCompressSync(
//         Buffer.from(
//           new Uint8Array(encodeTable({ name: 'tableData', type: 'Table', value: tables }))
//         ),
//         {
//           params: {
//             [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
//             [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_FONT,
//           },
//         }
//       )
//     )
//   ),
// };

// /** @returns {tableValue[]} */
// const woff2FlagGen = (tag) => {
//   const table = [{ name: 'flags', type: 'uint8', value: 63 }];
//   switch (tag) {
//     case 'cmap':
//       table[0].value = 0;
//       break;
//     case 'head':
//       table[0].value = 1;
//       break;
//     case 'hhea':
//       table[0].value = 2;
//       break;
//     case 'hmtx':
//       table[0].value = 3;
//       break;
//     case 'maxp':
//       table[0].value = 4;
//       break;
//     case 'name':
//       table[0].value = 5;
//       break;
//     case 'OS/2':
//       table[0].value = 6;
//       break;
//     case 'post':
//       table[0].value = 7;
//       break;
//     default:
//       table.push({ name: 'tag', type: 'String8', value: tag });
//       break;
//   }
//   return table;
// };

// /** @type {tableUint32} */
// const woff2FileLength = { name: 'length', type: 'uint32', value: 0 };

// /** @type {table} */
// const woff2File = {
//   name: 'woff2File',
//   type: 'Table',
//   value: [
//     { name: 'signature', type: 'String8', value: 'wOF2' },
//     { name: 'flavor', type: 'String8', value: 'OTTO' },
//     woff2FileLength,
//     { name: 'numTables', type: 'uint16', value: 9 },
//     { name: 'reserved', type: 'uint16', value: 0 },
//     { name: 'totalSfntSize', type: 'uint32', value: encodeTable(otfFile).length },
//     {
//       name: 'totalCompressedSize',
//       type: 'uint32',
//       value: encodeTable(woff2CompressedFontData).length,
//     },
//     { name: 'majorVersion', type: 'uint16', value: majorVersion },
//     { name: 'minorVersion', type: 'uint16', value: minorVersion },
//     { name: 'metaOffset', type: 'uint32', value: 0 },
//     { name: 'metaLength', type: 'uint32', value: 0 },
//     { name: 'metaOrigLength', type: 'uint32', value: 0 },
//     { name: 'privOffset', type: 'uint32', value: 0 },
//     { name: 'privLength', type: 'uint32', value: 0 },
//     {
//       name: 'TableDirectory',
//       type: 'Table',
//       value: tables.map((v) => ({
//         name: v.name,
//         type: 'Table',
//         value: [
//           ...woff2FlagGen(v.name),
//           { name: 'origLength', type: 'UIntBase128', value: encodeTable(v).length },
//         ],
//       })),
//     },
//     woff2CompressedFontData,
//   ],
// };

// woff2FileLength.value = encodeTable(woff2File).length;

// writeFileSync(`./dist/${fileName}.woff2`, new Uint8Array(encodeTable(woff2File)));
