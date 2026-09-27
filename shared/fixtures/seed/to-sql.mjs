// Sinh migration Flyway V7__seed_members.sql từ members.json (DECISIONS #68). Không sửa file SQL bằng tay:
// sửa members.json rồi chạy lại script này. Cách chạy ghi ở README.md cùng thư mục.
//
//   node shared/fixtures/seed/to-sql.mjs            ghi vào apps/backend/src/main/resources/db/migration/
//   node shared/fixtures/seed/to-sql.mjs <đường-dẫn>  ghi vào file khác
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, 'members.json')
const target = resolve(
  process.argv[2] ?? resolve(here, '../../../apps/backend/src/main/resources/db/migration/V7__seed_members.sql'),
)

const ALLOWED = new Set(['fullName', 'isDeceased', 'deathLunar', 'deathSolar', 'burialPlace'])

// Giống SearchText.normalize của backend: bỏ dấu, đ thành d, chữ thường, gộp khoảng trắng
const searchName = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const str = (value) => (value === undefined || value === null ? 'NULL' : `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`)
const num = (value) => (value === undefined || value === null ? 'NULL' : String(Number(value)))

const members = JSON.parse(readFileSync(source, 'utf8'))
if (!Array.isArray(members) || members.length === 0) throw new Error('members.json phải là mảng khác rỗng')

const rows = members.map((m, index) => {
  const id = index + 1
  for (const key of Object.keys(m)) {
    if (!ALLOWED.has(key)) throw new Error(`Thành viên ${id}: trường "${key}" chưa được hỗ trợ khi sinh SQL`)
  }
  if (typeof m.fullName !== 'string' || m.fullName.trim() !== m.fullName || !m.fullName) {
    throw new Error(`Thành viên ${id}: họ tên trống hoặc còn khoảng trắng thừa ở hai đầu`)
  }
  const lunar = m.deathLunar
  const solar = m.deathSolar
  if (lunar?.year != null && !solar) throw new Error(`Thành viên ${id}: có năm âm nhưng thiếu deathSolar`)
  if (solar && lunar?.year == null) throw new Error(`Thành viên ${id}: có deathSolar nhưng deathLunar không có năm`)
  if ((lunar || solar) && !m.isDeceased) throw new Error(`Thành viên ${id}: có ngày mất nhưng không phải người đã mất`)

  const values = [
    id,
    str(m.fullName),
    str(searchName(m.fullName)),
    m.isDeceased ? 'TRUE' : 'FALSE',
    num(solar?.year),
    num(solar?.month),
    num(solar?.day),
    num(lunar?.year),
    num(lunar?.month),
    num(lunar?.day),
    lunar?.leap ? 'TRUE' : 'FALSE',
    str(m.burialPlace),
    'UTC_TIMESTAMP(6)',
    'UTC_TIMESTAMP(6)',
  ]
  return `    (${values.join(', ')})`
})

const sql = `-- Dữ liệu ban đầu: ${members.length} thành viên (IDEA Phụ lục A, DECISIONS #68).
-- SINH TỰ ĐỘNG bằng shared/fixtures/seed/to-sql.mjs từ shared/fixtures/seed/members.json. KHÔNG SỬA TAY:
-- sửa members.json rồi chạy lại script (xem shared/fixtures/seed/README.md).
-- id gán theo thứ tự trong members.json (1..${members.length}); created_by để NULL vì đây là dữ liệu hệ thống.
INSERT INTO member (id, full_name, search_name, is_deceased,
                    death_year, death_month, death_day,
                    death_lunar_year, death_lunar_month, death_lunar_day, death_lunar_leap,
                    burial_place, created_at, updated_at)
VALUES
${rows.join(',\n')};
`

writeFileSync(target, sql, 'utf8')
console.log(`Đã ghi ${members.length} thành viên vào ${target}`)
