const fs = require('fs');
let code = fs.readFileSync('app/pay/page.jsx', 'utf8');

// 1. Update logo component to use transparent logo and adjust default style
code = code.replace(/src="\/logos\/logo\.png\?v=3"/, 'src="/logos/logo_transparent.png?v=2"');
code = code.replace(/style=\{\{ filter: 'drop-shadow\(0 2px 10px rgba\(56, 139, 253, 0\.25\)\)' \}\}/, 
`style={{ filter: 'drop-shadow(0 4px 15px rgba(0, 174, 239, 0.4))' }}`);

// 2. Wrap desktop logos in premium white glass cards for visibility
code = code.replace(/<div className="flex flex-col items-start gap-1 mb-9">[\s\S]*?<PayDriftLogo className="w-20 h-auto object-contain" \/>/,
`<div className="flex flex-col items-start gap-1 mb-9">
          <div className="bg-white/95 px-5 py-3 rounded-2xl shadow-[0_0_20px_rgba(0,174,239,0.15)] border border-white/20 mb-2">
            <PayDriftLogo className="w-56 h-auto object-contain -ml-2" />
          </div>`);

code = code.replace(/<div className="flex flex-col items-start gap-1 mb-10">[\s\S]*?<PayDriftLogo className="w-24 h-auto object-contain" \/>[\s\S]*?<p className="text-\[11px\] text-\[#8B949E\] font-medium tracking-wide ml-1">Universal Payment Gateway<\/p>[\s\S]*?<\/div>/,
`<div className="flex flex-col items-start gap-1 mb-8">
                <div className="bg-white/95 px-6 py-4 rounded-2xl shadow-[0_0_25px_rgba(0,174,239,0.2)] border border-white/20 mb-1">
                  <PayDriftLogo className="w-64 h-auto object-contain -ml-2" />
                </div>
              </div>`); // Removed 'Universal Payment Gateway' to keep it clean

// 3. Wrap mobile logo
code = code.replace(/<div className="flex items-center">[\s\S]*?<PayDriftLogo className="w-14 h-auto object-contain" \/>[\s\S]*?<\/div>/,
`<div className="flex items-center">
                <div className="bg-white/95 px-3 py-2 rounded-xl shadow-lg border border-white/20">
                  <PayDriftLogo className="w-32 h-auto object-contain -ml-1" />
                </div>
              </div>`);

fs.writeFileSync('app/pay/page.jsx', code);
console.log('Script executed');
