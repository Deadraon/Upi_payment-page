const fs = require('fs');
let code = fs.readFileSync('app/pay/page.jsx', 'utf8');

// Update Logo src to transparent version
code = code.replace(/src="\/logos\/logo\.png\?v=6"/, 'src="/logos/logo_transparent.png?v=1"');

// Revert Background Colors
// Form Left Branding Panel: bg-white -> bg-slate-50
code = code.replace(/<div className="order-2 md:order-1 w-full md:w-\[42%\] bg-white border-t md:border-t-0 md:border-r border-slate-100 px-7 py-8 flex flex-col justify-between">/,
`<div className="order-2 md:order-1 w-full md:w-[42%] bg-slate-50 border-t md:border-t-0 md:border-r border-slate-100 px-7 py-8 flex flex-col justify-between">`);

// Form Right Panel: bg-slate-50 -> bg-white
code = code.replace(/<div className="order-1 md:order-2 flex-1 bg-slate-50 px-7 py-8">/,
`<div className="order-1 md:order-2 flex-1 bg-white px-7 py-8">`);

// Order items background in left panel
code = code.replace(/<div className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50">/g,
`<div className="flex justify-between items-center px-3.5 py-2.5 bg-white">`);

// Payment Screen Left Panel: bg-white -> bg-slate-50
code = code.replace(/<div className="w-full md:w-\[40%\] bg-white border-b md:border-b-0 md:border-r border-slate-100">/,
`<div className="w-full md:w-[40%] bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100">`);

// Payment Screen Right Panel: bg-[#F8FAFC] -> bg-white
code = code.replace(/<div className="flex-1 bg-\[#F8FAFC\]">/,
`<div className="flex-1 bg-white">`); 

// Update apps/qr toggle bg in payment screen
code = code.replace(/<div className="flex p-1 bg-white rounded-xl mb-5 border border-slate-100">/,
`<div className="flex p-1 bg-slate-50 rounded-xl mb-5 border border-slate-100">`);

// Form screen input field bg adjustments
code = code.replace(/className="w-full bg-white border-2 border-slate-200 rounded-xl pl-9 pr-4 py-4 text-slate-900 text-2xl/g,
`className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-4 py-4 text-slate-900 text-2xl`);

// Quick select buttons bg adjustments
code = code.replace(/'bg-white border-slate-200 text-slate-500 shadow-sm hover:border-slate-300 hover:text-slate-700'/g,
`'bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'`);

// Name/Phone inputs
code = code.replace(/className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5/g,
`className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5`);

fs.writeFileSync('app/pay/page.jsx', code);
console.log('Script executed');
