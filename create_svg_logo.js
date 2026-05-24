const fs = require('fs');
let code = fs.readFileSync('app/pay/page.jsx', 'utf8');

// 1. Replace PayDriftLogo Component
const svgLogo = `const PayDriftLogo = ({ className = 'w-48 h-auto' }) => (
  <svg viewBox="0 0 520 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={\`\${className} transition-transform duration-300 hover:scale-[1.02]\`} style={{ filter: 'drop-shadow(0 4px 15px rgba(0, 174, 239, 0.2))' }}>
    {/* Shield/Icon Background */}
    <rect x="5" y="10" width="100" height="100" rx="30" fill="url(#pd-grad)" />
    
    {/* P shape */}
    <path d="M35 35H55C66.0457 35 75 43.9543 75 55C75 66.0457 66.0457 75 55 75H35V35Z" fill="white" />
    <path d="M35 35V85" stroke="white" strokeWidth="12" strokeLinecap="round" />
    
    {/* D curve overlay (Arrows feel) */}
    <path d="M55 25L80 50L55 75" stroke="#0D1117" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Text PAY */}
    <text x="125" y="75" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="68" fill="white" letterSpacing="-2">PAY</text>
    {/* Text DRIFT */}
    <text x="265" y="75" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="68" fill="#00AEEF" letterSpacing="-2">DRIFT</text>
    
    {/* Tagline */}
    <text x="130" y="100" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="16" fill="#8B949E" letterSpacing="5">SECURE UPI PAYMENTS</text>
    
    <defs>
      <linearGradient id="pd-grad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00AEEF" />
        <stop offset="1" stopColor="#0056D2" />
      </linearGradient>
    </defs>
  </svg>
);`;

// Regex to replace the old component
code = code.replace(/const PayDriftLogo = \(\{ className = '.*?' \}\) => \([\s\S]*?<\/img>\n\);/m, svgLogo);

// 2. Remove negative margins from usages
code = code.replace(/<PayDriftLogo className="w-56 h-auto object-contain -ml-5 md:-ml-7" \/>/g, '<PayDriftLogo className="w-64 h-auto object-contain" />');
code = code.replace(/<PayDriftLogo className="w-64 h-auto object-contain -ml-5 md:-ml-7" \/>/g, '<PayDriftLogo className="w-72 h-auto object-contain" />');
code = code.replace(/<PayDriftLogo className="w-32 h-auto object-contain -ml-3" \/>/g, '<PayDriftLogo className="w-40 h-auto object-contain" />');

fs.writeFileSync('app/pay/page.jsx', code);
console.log('Script executed');
