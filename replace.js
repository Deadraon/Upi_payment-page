const fs = require('fs');
let code = fs.readFileSync('app/pay/page.jsx', 'utf8');

code = code.replace(/GitHub Dark \(slate, readable, not too dark\)/, 'Light & Clean');
code = code.replace(/bg:      #0D1117  card: #161B22  surface: #21262D/, 'bg:      #F8FAFC  card: #FFFFFF  surface: #F1F5F9');
code = code.replace(/border:  #30363D  text: #E6EDF3  muted:   #8B949E/, 'border:  #E2E8F0  text: #0F172A  muted:   #64748B');

code = code.replace(/bg-\[#0D1117\]/g, 'bg-slate-50');
code = code.replace(/bg-\[#161B22\]/g, 'bg-white');
code = code.replace(/bg-\[#21262D\]/g, 'bg-slate-100');
code = code.replace(/bg-\[#1C2B4A\]/g, 'bg-blue-50');
code = code.replace(/bg-\[#282E37\]/g, 'bg-slate-50');

code = code.replace(/border-\[#30363D\]/g, 'border-slate-200');
code = code.replace(/border-\[#21262D\]/g, 'border-slate-100');
code = code.replace(/divide-\[#21262D\]/g, 'divide-slate-100');
code = code.replace(/border-\[#388BFD\]/g, 'border-blue-500');

code = code.replace(/text-\[#E6EDF3\]/g, 'text-slate-900');
code = code.replace(/text-\[#8B949E\]/g, 'text-slate-500');
code = code.replace(/text-\[#484F58\]/g, 'text-slate-400');
code = code.replace(/text-\[#C9D1D9\]/g, 'text-slate-700');

code = code.replace(/bg-indigo-600 hover:bg-indigo-500/g, 'bg-gradient-to-r from-[#00AEEF] to-[#0F2942] hover:from-[#009BD6] hover:to-[#0B1E31]');
code = code.replace(/bg-indigo-600\/25 border-indigo-500 text-indigo-300/g, 'bg-cyan-50 border-cyan-500 text-cyan-700');
code = code.replace(/text-indigo-400/g, 'text-cyan-600');
code = code.replace(/bg-indigo-600\/20 border border-indigo-500\/40/g, 'bg-cyan-50 border border-cyan-200');
code = code.replace(/bg-indigo-600/g, 'bg-[#00AEEF]');
code = code.replace(/shadow-indigo-600\/25/g, 'shadow-cyan-500/25');
code = code.replace(/hover:border-\[#484F58\] hover:text-\[#C9D1D9\]/g, 'hover:border-slate-300 hover:text-slate-600');
code = code.replace(/shadow-black\/60/g, 'shadow-slate-200/50');
code = code.replace(/shadow-black\/50/g, 'shadow-slate-200/50');

code = code.replace(/const PayDriftLogo = \(\{\s*className\s*=\s*'w-8 h-8 object-contain'\s*\}\) => \([\s\S]*?\);/, `const PayDriftLogo = ({ className = 'w-48 h-auto mix-blend-multiply object-contain' }) => (
  <img
    src="/logos/logo.png"
    alt="PayDrift"
    className={\`\${className} transition-transform duration-300 hover:scale-[1.02]\`}
  />
);`);

code = code.replace(/className="w-8 h-8 object-contain bg-white p-1\.5 rounded-xl"/g, 'className="w-8 h-8 object-contain bg-white p-1 rounded-xl shadow-sm border border-slate-100"');

code = code.replace(/<div className="flex items-center gap-3 mb-9">[\s\S]*?<PayDriftLogo className="w-10 h-10 object-contain" \/>[\s\S]*?<div>[\s\S]*?<p className="font-black text-\[15px\] text-slate-900">PayDrift<\/p>[\s\S]*?\{project && project !== CONFIG\.businessName && \([\s\S]*?<p className="text-\[10px\] text-slate-500 -mt-0\.5">via \{project\}<\/p>[\s\S]*?\)\}[\s\S]*?<\/div>[\s\S]*?<\/div>/, 
`<div className="flex flex-col items-start gap-1 mb-9">
          <PayDriftLogo className="w-36 h-auto mix-blend-multiply object-contain -ml-1" />
          {project && project !== CONFIG.businessName && (
            <p className="text-[10px] text-slate-500 font-medium ml-1">via {project}</p>
          )}
        </div>`);

code = code.replace(/<div className="flex items-center gap-3 mb-10">[\s\S]*?<PayDriftLogo className="w-11 h-11 object-contain" \/>[\s\S]*?<div>[\s\S]*?<p className="font-black text-\[17px\] text-slate-900 tracking-tight">PayDrift<\/p>[\s\S]*?<p className="text-\[10px\] text-slate-500 font-medium">Universal Payment Gateway<\/p>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
`<div className="flex flex-col items-start gap-1 mb-10">
                <PayDriftLogo className="w-44 h-auto mix-blend-multiply object-contain -ml-2" />
                <p className="text-[11px] text-slate-500 font-medium tracking-wide ml-1">Universal Payment Gateway</p>
              </div>`);

code = code.replace(/<div className="flex items-center gap-2">[\s\S]*?<PayDriftLogo className="w-7 h-7 object-contain" \/>[\s\S]*?<span className="font-black text-sm text-slate-900">PayDrift<\/span>[\s\S]*?<\/div>/,
`<div className="flex items-center">
                <PayDriftLogo className="w-24 h-auto mix-blend-multiply object-contain -ml-1" />
              </div>`);

fs.writeFileSync('app/pay/page.jsx', code);
console.log('Replacements completed.');
