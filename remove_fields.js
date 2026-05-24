const fs = require('fs');
let code = fs.readFileSync('app/pay/page.jsx', 'utf8');

const regex = /<div className="grid grid-cols-2 gap-3">[\s\S]*?<label className="text-\[11px\] text-\[#8B949E\] uppercase tracking-wider font-bold block mb-2">Name[\s\S]*?<label className="text-\[11px\] text-\[#8B949E\] uppercase tracking-wider font-bold block mb-2">Phone[\s\S]*?<\/div>\s*<\/div>/;

code = code.replace(regex, '');

fs.writeFileSync('app/pay/page.jsx', code);
console.log('Script executed');
