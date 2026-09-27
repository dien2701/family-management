// Sinh lunar-years.json từ bảng tiền tính TK19–TK22 của Hồ Ngọc Đức (amlich-hnd.js).
// Chỉ giải mã bảng, KHÔNG chạy thuật toán thiên văn, nên độc lập với code Java/TS đang được test.
//
// Chạy (ở gốc repo, Node 24):  node shared/fixtures/lunar/generate.mjs [đường-dẫn-amlich-hnd.js]
// Không truyền đường dẫn thì tải bản lưu trữ ở SOURCE_URL và kiểm tra SHA-256.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL =
  'https://web.archive.org/web/2020id_/http://www.informatik.uni-leipzig.de/~duc/amlich/JavaScript/amlich-hnd.js';
const SOURCE_SHA256 = '82de416dfa6de433a991b57784483388aee73904edc2a9e3c3f1f771e6b8fff2';
// Năm âm 1899 để phủ các ngày dương đầu năm 1900 (trước Tết Canh Tý 31/01/1900).
const FIRST_YEAR = 1899;
const LAST_YEAR = 2100;

const here = dirname(fileURLToPath(import.meta.url));

async function loadSource() {
  const text = process.argv[2]
    ? readFileSync(process.argv[2], 'utf8')
    : await (await fetch(SOURCE_URL)).text();
  const sha = createHash('sha256').update(text, 'utf8').digest('hex');
  if (sha !== SOURCE_SHA256) {
    throw new Error(`SHA-256 của amlich-hnd.js không khớp: ${sha}`);
  }
  return text;
}

function readTable(text, name) {
  const start = text.indexOf(`var ${name} = new Array(`);
  if (start < 0) throw new Error(`Không thấy bảng ${name}`);
  const body = text.slice(text.indexOf('(', start) + 1, text.indexOf(');', start));
  const codes = body.split(',').map((s) => s.trim()).filter(Boolean).map((s) => Number.parseInt(s, 16));
  if (codes.length !== 100 || codes.some(Number.isNaN)) throw new Error(`Bảng ${name} hỏng`);
  return codes;
}

const DAY_MS = 86_400_000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

// Mã năm (theo decodeLunarYear của HND):
//   bit 17+  : số ngày từ 01/01 dương tới mùng 1 Tết
//   bit 16   : tháng nhuận đủ (30) hay thiếu (29)
//   bit 4–15 : độ dài 12 tháng thường, tháng 1 ở bit cao nhất (1 = 30 ngày)
//   bit 0–3  : tháng nhuận (0 = không nhuận)
function decodeYear(year, code) {
  const tetOffset = code >> 17;
  const leapMonth = code & 0xf;
  const leapDays = (code >> 16) & 1 ? 30 : 29;
  const regular = [];
  for (let i = 0, bits = code >> 4; i < 12; i++, bits >>= 1) regular[11 - i] = bits & 1 ? 30 : 29;

  const months = [];
  let start = Date.UTC(year, 0, 1) + tetOffset * DAY_MS;
  for (let month = 1; month <= 12; month++) {
    months.push({ month, leap: false, start: iso(start), days: regular[month - 1] });
    start += regular[month - 1] * DAY_MS;
    if (month === leapMonth) {
      months.push({ month, leap: true, start: iso(start), days: leapDays });
      start += leapDays * DAY_MS;
    }
  }
  return { year, tet: months[0].start, leapMonth, months, nextStart: start };
}

function toLunar(years, solar) {
  const ms = Date.parse(solar);
  for (const y of years) {
    for (const m of y.months) {
      const offset = (ms - Date.parse(m.start)) / DAY_MS;
      if (offset >= 0 && offset < m.days) return { year: y.year, month: m.month, day: offset + 1, leap: m.leap };
    }
  }
  return null;
}

const text = await loadSource();
const tables = { 18: readTable(text, 'TK19'), 19: readTable(text, 'TK20'), 20: readTable(text, 'TK21'), 21: readTable(text, 'TK22') };

const decoded = [];
for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
  decoded.push(decodeYear(year, tables[Math.floor(year / 100)][year % 100]));
}
// Bảng liền mạch: tháng cuối năm Y phải kết thúc đúng trước Tết năm Y+1.
for (let i = 0; i + 1 < decoded.length; i++) {
  if (iso(decoded[i].nextStart) !== decoded[i + 1].tet) throw new Error(`Đứt quãng giữa năm ${decoded[i].year} và ${decoded[i + 1].year}`);
}

// Các mốc tra tay từ lịch đã công bố; phải khớp bảng thì mới ghi file.
const samples = JSON.parse(readFileSync(join(here, 'samples.json'), 'utf8'));
for (const s of samples.samples) {
  const got = toLunar(decoded, s.solar);
  const want = s.lunar;
  if (!got || got.year !== want.year || got.month !== want.month || got.day !== want.day || got.leap !== want.leap) {
    throw new Error(`Mốc ${s.solar} (${s.note}) không khớp bảng: ${JSON.stringify(got)}`);
  }
}

const out = {
  source: SOURCE_URL,
  sourceSha256: SOURCE_SHA256,
  timezone: 'Năm âm < 1968: UTC+8; từ 1968: UTC+7 (theo bảng của Hồ Ngọc Đức)',
  firstYear: FIRST_YEAR,
  lastYear: LAST_YEAR,
  years: decoded.map(({ year, tet, leapMonth, months }) => ({ year, tet, leapMonth, months })),
};
const json = JSON.stringify(out, null, 1)
  // Mỗi tháng một dòng cho dễ đọc diff.
  .replace(/\{\n\s+"month": (\d+),\n\s+"leap": (\w+),\n\s+"start": "([\d-]+)",\n\s+"days": (\d+)\n\s+\}/g,
    '{"month": $1, "leap": $2, "start": "$3", "days": $4}');
writeFileSync(join(here, 'lunar-years.json'), json + '\n');
console.log(`Đã ghi ${decoded.length} năm âm (${FIRST_YEAR}–${LAST_YEAR}), ${samples.samples.length} mốc khớp bảng.`);
