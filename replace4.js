const fs = require('fs');
let code = fs.readFileSync('app/pay/page.jsx', 'utf8');

// 1. Remove mix-blend-multiply and bump version
code = code.replace(/mix-blend-multiply /g, '');
code = code.replace(/logo\.png\?v=5/g, 'logo.png?v=6');

// 2. Update PayDriftLogo component default width
code = code.replace(/className = 'w-48 h-auto object-contain'/g, "className = 'w-full max-w-[240px] h-auto object-contain'");

// 3. Remove "Universal Payment Gateway" and increase sizes
code = code.replace(/<div className="flex flex-col items-start gap-1 mb-10">[\s\S]*?<PayDriftLogo className="w-56 md:w-64 h-auto object-contain -ml-2" \/>[\s\S]*?<p className="text-\[11px\] text-slate-500 font-medium tracking-wide ml-1">Universal Payment Gateway<\/p>[\s\S]*?<\/div>/,
`<div className="flex flex-col items-start mb-8">
                <PayDriftLogo className="w-full max-w-[260px] h-auto object-contain" />
              </div>`);

code = code.replace(/<div className="flex flex-col items-start gap-1 mb-9">[\s\S]*?<PayDriftLogo className="w-48 md:w-52 h-auto object-contain -ml-2" \/>/,
`<div className="flex flex-col items-start gap-1 mb-9">
          <PayDriftLogo className="w-64 h-auto object-contain" />`);

code = code.replace(/<PayDriftLogo className="w-32 h-auto object-contain -ml-1" \/>/,
`<PayDriftLogo className="w-40 h-auto object-contain" />`);

// 4. Swap backgrounds for the Form screen
code = code.replace(/<div className="order-2 md:order-1 w-full md:w-\[42%\] bg-slate-50 border-t md:border-t-0 md:border-r border-slate-100 px-7 py-8 flex flex-col justify-between">/,
`<div className="order-2 md:order-1 w-full md:w-[42%] bg-white border-t md:border-t-0 md:border-r border-slate-100 px-7 py-8 flex flex-col justify-between">`);

code = code.replace(/<div className="order-1 md:order-2 flex-1 bg-white px-7 py-8">/,
`<div className="order-1 md:order-2 flex-1 bg-slate-50 px-7 py-8">`);

code = code.replace(/<div className="flex justify-between items-center px-3\.5 py-2\.5 bg-white">/g,
`<div className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50">`);

// 5. Swap backgrounds for the Payment screen
code = code.replace(/<div className="w-full md:w-\[40%\] bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100">/,
`<div className="w-full md:w-[40%] bg-white border-b md:border-b-0 md:border-r border-slate-100">`);

code = code.replace(/<div className="flex-1 bg-white">/,
`<div className="flex-1 bg-[#F8FAFC]">`); // using hex for slate-50 to ensure unique replacement

// Update apps/qr toggle bg in payment screen
code = code.replace(/<div className="flex p-1 bg-slate-50 rounded-xl mb-5 border border-slate-100">/,
`<div className="flex p-1 bg-white rounded-xl mb-5 border border-slate-100">`);

// Form screen input field bg adjustments
code = code.replace(/className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-4 py-4 text-slate-900 text-2xl/g,
`className="w-full bg-white border-2 border-slate-200 rounded-xl pl-9 pr-4 py-4 text-slate-900 text-2xl`);

// Quick select buttons bg adjustments
code = code.replace(/'bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'/g,
`'bg-white border-slate-200 text-slate-500 shadow-sm hover:border-slate-300 hover:text-slate-700'`);

// Name/Phone inputs
code = code.replace(/className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2\.5/g,
`className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5`);

fs.writeFileSync('app/pay/page.jsx', code);
console.log('Script executed');
