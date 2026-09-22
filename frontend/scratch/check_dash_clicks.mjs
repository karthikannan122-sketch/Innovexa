import fs from 'fs';

const code = fs.readFileSync('./src/pages/DashboardPage.jsx', 'utf8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('onClick') || line.includes('setActiveTab') || line.includes('setSelectedInnoId')) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
