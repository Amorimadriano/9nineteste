const fs = require('fs');

const missingTables = fs.readFileSync('missing_tables.txt', 'utf8').split('\n').filter(t => t.trim());
const dump = fs.readFileSync('public_schema_old.sql', 'utf8');

let sql = '-- Create missing tables from old project\n';
sql += 'BEGIN;\n\n';

for (const table of missingTables) {
  const escaped = table.replace(/[.*+?^${}()|[\]\]/g, '\\$&');
  const pattern = 'CREATE TABLE public.' + escaped + ' \((?:[^;]|\;)*\);';
  const regex = new RegExp(pattern, 's');
  const match = dump.match(regex);
  if (match) {
    sql += match[0] + '\n\n';
  } else {
    console.log('WARNING: CREATE TABLE not found for ' + table);
  }
}

sql += 'COMMIT;\n';
fs.writeFileSync('create_missing_tables.sql', sql);
console.log('Created create_missing_tables.sql for ' + missingTables.length + ' tables');
