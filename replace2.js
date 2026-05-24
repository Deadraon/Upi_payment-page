const fs = require('fs');
let code = fs.readFileSync('app/pay/page.jsx', 'utf8');

code = code.replace(/placeholder-\[#30363D\]/g, 'placeholder-slate-300');
code = code.replace(/placeholder-\[#484F58\]/g, 'placeholder-slate-400');
code = code.replace(/focus:border-indigo-500/g, 'focus:border-cyan-500');
code = code.replace(/focus:ring-indigo-500/g, 'focus:ring-cyan-500');
code = code.replace(/text-\[#30363D\]/g, 'text-slate-400');
code = code.replace(/hover:border-\[#484F58\]/g, 'hover:border-slate-300');
code = code.replace(/bg-slate-100 border border-slate-200 rounded-xl px-3 py-2\.5 text-sm/g, 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm');

fs.writeFileSync('app/pay/page.jsx', code);
console.log('Cleanup completed.');
