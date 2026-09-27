const fs = require('fs')

let content = fs.readFileSync('shared/api/openapi.yaml', 'utf8')

// We need to replace:
// type: integer
// nullable: true
// with:
// type:
//   - integer
//   - 'null'

content = content.replace(/type: integer\s+nullable: true/g, 'type:\n            - integer\n            - \'null\'')
content = content.replace(/type: object\s+nullable: true/g, 'type:\n            - object\n            - \'null\'')
content = content.replace(/type: string\s+nullable: true/g, 'type:\n            - string\n            - \'null\'')
content = content.replace(/type: string\s+format: date-time\s+nullable: true/g, 'type:\n            - string\n            - \'null\'\n          format: date-time')

fs.writeFileSync('shared/api/openapi.yaml', content, 'utf8')
