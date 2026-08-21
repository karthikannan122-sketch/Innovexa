function cleanProjectTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .replace(/[\s_\-–—]+[iI]?[0-9]{10,15}$/, '')
    .trim();
}

const tests = [
  "OmniSensing Radar AI 1787216104625",
  "OmniSensing Radar AI i787215990984",
  "OmniSensing Radar AI I787215796097",
  "EcoLogix Carbon Ledger 1787214569696",
  "Industry 4.0 Monitoring Platform",
  "AI 2.0 Assistant",
  "3D Innovation Platform",
  "Web3 Studio",
  "Project 12",
  "Smart Agriculture System",
  "AI Healthcare Assistant",
  "Cybersecurity Threat Detection"
];

console.log('Testing cleanProjectTitle:');
tests.forEach(t => {
  console.log(`Original: "${t}" -> Cleaned: "${cleanProjectTitle(t)}"`);
});
