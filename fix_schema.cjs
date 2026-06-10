const fs = require('fs');

function parseSchema(path) {
  const schema = {};
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 7 && parts[0] && parts[0] !== 'table_name') {
      const [table, column, dataType, maxLen, numPrec, numScale, isNullable] = parts;
      if (!schema[table]) schema[table] = {};
      schema[table][column] = { dataType, maxLen, numPrec, numScale, isNullable };
    }
  }
  return schema;
}

const oldSchema = parseSchema('old_schema.txt');
const newSchema = parseSchema('new_schema.txt');

let sql = '-- Schema fix script generated automatically\n';
sql += 'BEGIN;\n\n';

for (const table in oldSchema) {
  if (newSchema[table]) {
    for (const col in oldSchema[table]) {
      if (!newSchema[table][col]) {
        const info = oldSchema[table][col];
        let type = info.dataType;
        if (info.maxLen) type += '(' + info.maxLen + ')';
        else if (info.numPrec && info.numScale) type += '(' + info.numPrec + ',' + info.numScale + ')';
        else if (info.numPrec) type += '(' + info.numPrec + ')';

        const nullable = info.isNullable === 'YES' ? '' : ' NOT NULL';
        sql += 'ALTER TABLE public.' + table + ' ADD COLUMN IF NOT EXISTS ' + col + ' ' + type + nullable + ';\n';
      }
    }
  }
}

sql += '\nCOMMIT;\n';
fs.writeFileSync('fix_columns.sql', sql);

const missingTables = Object.keys(oldSchema).filter(t => !newSchema[t]);
fs.writeFileSync('missing_tables.txt', missingTables.join('\n'));

console.log('Missing columns SQL written to fix_columns.sql');
console.log('Missing tables: ' + missingTables.length);
