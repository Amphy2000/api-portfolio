/* app.js */

// =========================================================================
// CONFIGURATION: UPDATE YOUR RAPIDAPI LINKS HERE
// =========================================================================
// Replace these values with your actual RapidAPI page links once published.
// If any link is missing or set to '', it will automatically fall back to
// your main developer profile page so users never hit a 404 error page.

const RAPIDAPI_PROFILE_URL = 'https://rapidapi.com/user/Amphy2000'; // Your Developer Profile Link

const RAPIDAPI_LINKS = {
  'email-shield': 'https://rapidapi.com/amphy2000/api/disposable-burner-email-shield',
  'ip-lookup': 'https://rapidapi.com/amphy2000/api/ip-geolocation-vpn-proxy-shield',
  'password-validator': 'https://rapidapi.com/amphy2000/api/password-strength-breach-checker',
  'scraper': 'https://rapidapi.com/amphy2000/api/ai-web-scraper-markdown-extractor',
  'schema-extractor': 'https://rapidapi.com/amphy2000/api/structured-schema-json-ld-parser',
  'link-preview': 'https://rapidapi.com/amphy2000/api/rich-link-preview-og-extractor',
  'ua-parser': 'https://rapidapi.com/amphy2000/api/user-agent-parser-device-detector',
  'fuel-prices': 'https://rapidapi.com/amphy2000/api/us-fuel-prices-tracker',
  'barcode': 'https://rapidapi.com/amphy2000/api/barcode-and-qr-code-generator1',
  'dns-lookup': 'https://rapidapi.com/amphy2000/api/dns-record-lookup-domain-diagnostics',
  'exchange-rates': 'https://rapidapi.com/amphy2000/api/multi-currency-crypto-exchange-rates-api',
  'shorten': 'https://rapidapi.com/amphy2000/api/url-shortener-link-analytics-api',
  'redirect': 'https://rapidapi.com/amphy2000/api/url-shortener-link-analytics-api', // Shares shorten page
  'health': 'https://rapidapi.com/amphy2000/api/url-shortener-link-analytics-api',
  'vat-validator': 'https://rapidapi.com/amphy2000/api/european-vat-company-validator',
  'ssl-checker': 'https://rapidapi.com/amphy2000/api/ssl-certificate-validity-expiry-checker',
  'whois-lookup': 'https://rapidapi.com/amphy2000/api/domain-whois-lookup-ownership-checker',
  'sms-shield': 'https://rapidapi.com/amphy2000/api/disposable-virtual-phone-sms-shield'
};

// All 15 APIs config schema
const APIS = [
  // SECURITY & TRUST
  {
    key: 'email-shield',
    name: 'Email Shield & Validator',
    category: 'security',
    method: 'GET',
    description: 'Detects disposable/temporary email addresses, whitelists major email providers, scans recursive subdomains, and runs active DNS MX records checks to prevent fake user signups.',
    rapidApiUrl: RAPIDAPI_LINKS['email-shield'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'email', label: 'Email Address', type: 'text', placeholder: 'user@disposabledomain.com', default: 'hello@dispostable.com' },
      { name: 'check_dns', label: 'Perform Live MX DNS Lookup', type: 'checkbox', default: false }
    ]
  },
  {
    key: 'sms-shield',
    name: 'SMS Shield & Phone Validator',
    category: 'security',
    method: 'GET',
    description: 'Detects disposable burner phone numbers used by public Receive SMS websites, parses E.164 country prefixes, flags virtual VoIP blocks, and issues risk scores to block registration fraud.',
    rapidApiUrl: RAPIDAPI_LINKS['sms-shield'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'phone', label: 'Phone Number', type: 'text', placeholder: '+12015550199', default: '+12015550199' }
    ]
  },
  {
    key: 'ip-lookup',
    name: 'IP Geolocation & Threat Detector',
    category: 'security',
    method: 'GET',
    description: 'Resolves details about an IP including country, city, ISP coordinates, hosting datacenter (ASN scanner), and checks exit node lists to flag active VPN/proxy bots.',
    rapidApiUrl: RAPIDAPI_LINKS['ip-lookup'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'ip', label: 'IP Address', type: 'text', placeholder: '8.8.8.8 (Leave blank for client IP)', default: '' }
    ]
  },
  {
    key: 'password-validator',
    name: 'Password Strength & Breach Evaluator',
    category: 'security',
    method: 'POST',
    description: 'Scores password complexity rules and evaluates credentials using privacy-preserving k-Anonymity checks (sending 5 SHA-1 characters) against 800M+ compromised accounts.',
    rapidApiUrl: RAPIDAPI_LINKS['password-validator'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'password', label: 'Password to Check', type: 'text', placeholder: 'Type password here...', default: 'P@ssword123!' }
    ]
  },
  {
    key: 'ssl-checker',
    name: 'SSL Certificate Checker',
    category: 'security',
    method: 'GET',
    description: 'Queries any host on port 443 to retrieve details of its SSL/TLS certificate, including validation status, issue and expiration dates, issuer and subject names, fingerprint codes, alternative names (SANs), and days remaining.',
    rapidApiUrl: RAPIDAPI_LINKS['ssl-checker'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'domain', label: 'Target Domain Name', type: 'text', placeholder: 'google.com', default: 'google.com' },
      { name: 'port', label: 'Connection Port', type: 'text', placeholder: '443', default: '443' }
    ]
  },

  // SEO & WEB SCRAPING
  {
    key: 'scraper',
    name: 'Universal Web Scraper',
    category: 'seo',
    method: 'GET',
    description: 'Fetches raw web markup, purges layout noise (cooke banners, navbars, trackers), and translates pages into clean Markdown optimized for LLM token ingestion.',
    rapidApiUrl: RAPIDAPI_LINKS['scraper'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'url', label: 'Target Webpage URL', type: 'text', placeholder: 'https://example.com', default: 'https://example.com' },
      { name: 'mode', label: 'Extraction Mode', type: 'select', default: 'standard', options: ['standard', 'text_only'] }
    ]
  },
  {
    key: 'schema-extractor',
    name: 'Structured JSON-LD Extractor',
    category: 'seo',
    method: 'GET',
    description: 'Crawls pages, extracts all embedded applications/ld+json metadata blocks, normalizes properties, and supports Products, Recipes, Article and Event schema tags.',
    rapidApiUrl: RAPIDAPI_LINKS['schema-extractor'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'url', label: 'Webpage URL', type: 'text', placeholder: 'https://www.youtube.com', default: 'https://www.youtube.com' }
    ]
  },
  {
    key: 'link-preview',
    name: 'OG Meta Preview & Tag Extractor',
    category: 'seo',
    method: 'GET',
    description: 'Scrapes webpage targets for social previews, pulling OpenGraph, Twitter card tags, page titles, and resolves relative image routes to absolute URLs.',
    rapidApiUrl: RAPIDAPI_LINKS['link-preview'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'url', label: 'Target URL', type: 'text', placeholder: 'https://github.com', default: 'https://github.com' }
    ]
  },
  {
    key: 'ua-parser',
    name: 'User-Agent & Bot Identifier',
    category: 'seo',
    method: 'GET',
    description: 'Deconstructs User-Agent headers to verify browser details, operating systems, hardware platforms, and detect search crawlers/scraping engines.',
    rapidApiUrl: RAPIDAPI_LINKS['ua-parser'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'ua', label: 'User-Agent String', type: 'text', placeholder: 'Mozilla/5.0... (Leave blank for current browser)', default: '' }
    ]
  },
  {
    key: 'fuel-prices',
    name: 'US Fuel Prices Tracker',
    category: 'seo',
    method: 'GET',
    description: 'Scrapes live state average gas/diesel prices daily from the AAA Gas Registry. Compares state benchmarks against national benchmarks.',
    rapidApiUrl: RAPIDAPI_LINKS['fuel-prices'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'state', label: 'US State Name or Abbreviation', type: 'text', placeholder: 'TX, California, etc. (Leave blank for all)', default: 'TX' },
      { name: 'type', label: 'Fuel Grade Filter', type: 'select', default: 'all', options: ['all', 'regular', 'midgrade', 'premium', 'diesel'] }
    ]
  },

  // UTILITIES & COMMERCE
  {
    key: 'barcode',
    name: 'Barcode & QR Generator',
    category: 'utilities',
    method: 'GET',
    description: 'Renders high-quality visual outputs for barcodes (Code128, EAN13, PDF417) and QR Codes as high-speed cached PNG buffers.',
    rapidApiUrl: RAPIDAPI_LINKS['barcode'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'text', label: 'Payload Data', type: 'text', placeholder: 'Enter code payload...', default: 'Amphy Suite' },
      { name: 'type', label: 'Code Format', type: 'select', default: 'code128', options: ['code128', 'qrcode', 'ean13', 'pdf417'] }
    ]
  },
  {
    key: 'dns-lookup',
    name: 'DNS Diagnostics & SPF Engine',
    category: 'utilities',
    method: 'GET',
    description: 'Queries domain records (A, AAAA, MX, TXT, NS, CNAME) in parallel and parses active SPF and DMARC rules for server security audits.',
    rapidApiUrl: RAPIDAPI_LINKS['dns-lookup'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'domain', label: 'Target Domain Name', type: 'text', placeholder: 'example.com', default: 'github.com' }
    ]
  },
  {
    key: 'whois-lookup',
    name: 'WHOIS Domain Lookup',
    category: 'utilities',
    method: 'GET',
    description: 'Queries global domain registries directly to retrieve active ownership metadata, sponsoring registrar names, registration dates (creation, update, and expiration), domain status, and resolved nameservers.',
    rapidApiUrl: RAPIDAPI_LINKS['whois-lookup'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'domain', label: 'Target Domain Name', type: 'text', placeholder: 'github.com', default: 'github.com' }
    ]
  },
  {
    key: 'exchange-rates',
    name: 'Exchange Rates & Crypto Converter',
    category: 'utilities',
    method: 'GET',
    description: 'Fetches global fiat rates from European Central Bank feeds and live CoinGecko crypto valuations with relative base currency conversions.',
    rapidApiUrl: RAPIDAPI_LINKS['exchange-rates'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'base', label: 'Base Currency / Crypto Ticker', type: 'text', placeholder: 'USD, EUR, BTC, etc.', default: 'USD' },
      { name: 'symbols', label: 'Target Tickers (Comma separated)', type: 'text', placeholder: 'EUR,GBP,BTC,ETH,SOL', default: 'EUR,GBP,BTC,ETH,SOL' }
    ]
  },
  {
    key: 'shorten',
    name: 'URL Shortener persistency',
    category: 'utilities',
    method: 'POST',
    description: 'Creates a compressed 6-character redirect slug stored persistently in Supabase. Accepts analytics queries via GET /api/shorten?slug=...',
    rapidApiUrl: RAPIDAPI_LINKS['shorten'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'url', label: 'Long Webpage URL', type: 'text', placeholder: 'https://github.com/Amphy2000', default: 'https://github.com/Amphy2000' }
    ]
  },
  {
    key: 'redirect',
    name: 'URL Redirection Resolver',
    category: 'utilities',
    method: 'GET',
    description: 'Resolves shortened slugs and issues a 302 redirect header while logging visitor properties (referrers, browsers) in a background thread.',
    rapidApiUrl: RAPIDAPI_LINKS['redirect'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'slug', label: 'Slug Code', type: 'text', placeholder: 'e.g. mkuR35', default: '' }
    ]
  },
  {
    key: 'health',
    name: 'Server Cluster Health Checker',
    category: 'utilities',
    method: 'GET',
    description: 'Verifies the health and latency properties of the active database connectors, caches, and Vercel serverless worker nodes.',
    rapidApiUrl: RAPIDAPI_LINKS['health'] || RAPIDAPI_PROFILE_URL,
    inputs: []
  },
  {
    key: 'vat-validator',
    name: 'European VAT & Company Validator',
    category: 'utilities',
    method: 'GET',
    description: 'Queries the official EU VIES database to validate European VAT identification numbers, verifies company active registration status, and returns company name and business address details.',
    rapidApiUrl: RAPIDAPI_LINKS['vat-validator'] || RAPIDAPI_PROFILE_URL,
    inputs: [
      { name: 'vat', label: 'EU VAT Number (prefixed with country code)', type: 'text', placeholder: 'e.g. IE6388047V or DE123456789', default: 'IE6388047V' }
    ]
  }
];

// Active State variables
let activeApi = APIS[0];
let activeTab = 'json';
let currentResponseData = null;

// DOM Selectors
const categoryLists = {
  security: document.getElementById('category-security'),
  seo: document.getElementById('category-seo'),
  utilities: document.getElementById('category-utilities')
};
const searchInput = document.getElementById('api-search');
const panelTitle = document.getElementById('panel-title');
const panelDesc = document.getElementById('panel-desc');
const panelMethod = document.getElementById('panel-method');
const dynamicInputs = document.getElementById('dynamic-inputs');
const btnRun = document.getElementById('btn-run');
const btnSubscribe = document.getElementById('btn-subscribe');
const btnMainCta = document.getElementById('btn-main-cta');
const infoPath = document.getElementById('info-path');
const infoHost = document.getElementById('info-host');
const consoleOutput = document.getElementById('console-output');
const consoleContainer = document.getElementById('console-container');
const consoleImgContainer = document.getElementById('console-img-container');
const consoleImage = document.getElementById('console-image');
const loadingSpinner = document.getElementById('loading-spinner');
const consoleTabs = document.querySelectorAll('.tab-btn');
const btnCopy = document.getElementById('btn-copy');

// Set Host matching local vs production
const apiHost = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;

// Syntax highlighting for JSON output
function highlightJson(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
    let cls = 'json-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

// Generate Code Snippets based on current inputs
function getCodeSnippet(api, values, lang) {
  const isPost = api.method === 'POST';
  const queryStr = !isPost && Object.keys(values).length > 0 
    ? '?' + Object.entries(values).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') 
    : '';
  const postBody = isPost ? JSON.stringify(values, null, 2) : '';

  if (lang === 'js') {
    return `// JavaScript (Fetch implementation)
const options = {
  method: '${api.method}',
  headers: {
    'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY',
    'x-rapidapi-host': 'amphy-apis.p.rapidapi.com'${isPost ? ',\n    \'Content-Type\': \'application/json\'' : ''}
  }${isPost ? `,\n  body: JSON.stringify(${postBody.replace(/\n/g, '\n  ')})` : ''}
};

fetch('https://amphy-apis.p.rapidapi.com/api/${api.key}${queryStr}', options)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));`;
  }

  if (lang === 'python') {
    const pyHeaders = isPost 
      ? `headers = {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "amphy-apis.p.rapidapi.com",
    "Content-Type": "application/json"
}` 
      : `headers = {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "amphy-apis.p.rapidapi.com"
}`;

    const pyParams = !isPost && Object.keys(values).length > 0
      ? `\nquerystring = ${JSON.stringify(values, null, 4).replace(/\n/g, '\n')}\n`
      : '';

    const pyBody = isPost
      ? `\npayload = ${JSON.stringify(values, null, 4).replace(/\n/g, '\n')}\n`
      : '';

    return `import requests

url = "https://amphy-apis.p.rapidapi.com/api/${api.key}"
${pyHeaders}
${pyParams}${pyBody}
response = requests.request(
    "${api.method}",
    url,
    headers=headers${isPost ? ', json=payload' : ''}${!isPost && pyParams ? ', params=querystring' : ''}
)

print(response.json())`;
  }

  if (lang === 'curl') {
    const headerStr = `--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \\\n\t--header 'x-rapidapi-host: amphy-apis.p.rapidapi.com'`;
    if (isPost) {
      return `curl --request POST \\
\t--url 'https://amphy-apis.p.rapidapi.com/api/${api.key}' \\
\t${headerStr} \\
\t--header 'Content-Type: application/json' \\
\t--data '${JSON.stringify(values)}'`;
    } else {
      return `curl --request GET \\
\t--url 'https://amphy-apis.p.rapidapi.com/api/${api.key}${queryStr}' \\
\t${headerStr}`;
    }
  }

  return '';
}

// Populate Sidebar Categories
function renderSidebar() {
  // Clear lists
  Object.values(categoryLists).forEach(list => list.innerHTML = '');

  APIS.forEach(api => {
    const list = categoryLists[api.category];
    if (!list) return;

    const li = document.createElement('li');
    li.className = 'api-item';
    li.innerHTML = `
      <a class="api-link ${api.key === activeApi.key ? 'active' : ''}" data-key="${api.key}">
        <!-- Dynamic Icons depending on keys -->
        ${getApiIcon(api.key)}
        <span>${api.name}</span>
      </a>
    `;
    list.appendChild(li);

    // Attach click handler
    li.querySelector('.api-link').addEventListener('click', () => {
      selectApi(api);
    });
  });
}

// Map key to SVG icon
function getApiIcon(key) {
  const icons = {
    'email-shield': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    'sms-shield': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line><path d="M9 6h6"></path><circle cx="12" cy="12" r="1"></circle></svg>',
    'ip-lookup': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>',
    'password-validator': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    'ssl-checker': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><path d="M12 15v3"></path></svg>',
    'whois-lookup': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><path d="M11 8v3h3"></path></svg>',
    'scraper': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
    'schema-extractor': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    'link-preview': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
    'ua-parser': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
    'fuel-prices': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 22V2h10l2 3h6v17H3z"></path><line x1="13" y1="2" x2="13" y2="22"></line><circle cx="8" cy="9" r="2"></circle></svg>',
    'barcode': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="5" x2="3" y2="19"></line><line x1="8" y1="5" x2="8" y2="19"></line><line x1="12" y1="5" x2="12" y2="19"></line><line x1="17" y1="5" x2="17" y2="19"></line><line x1="21" y1="5" x2="21" y2="19"></line></svg>',
    'dns-lookup': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
    'exchange-rates': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
    'shorten': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"></path><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
    'redirect': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>',
    'health': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
    'vat-validator': '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 8h10M7 12h4m-4 4h10"></path></svg>'
  };
  return icons[key] || '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>';
}

// Switch between active APIs
function selectApi(api) {
  activeApi = api;
  
  // Update sidebar active highlights
  document.querySelectorAll('.api-link').forEach(link => {
    if (link.getAttribute('data-key') === api.key) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update panel text
  panelTitle.innerHTML = `${getApiIcon(api.key)} ${api.name}`;
  panelDesc.textContent = api.description;
  panelMethod.textContent = api.method;
  panelMethod.className = `info-badge badge-${api.method.toLowerCase()}`;
  
  // Set details path footer
  infoPath.textContent = `/api/${api.key}`;
  btnSubscribe.href = api.rapidApiUrl;
  if (btnMainCta) btnMainCta.href = api.rapidApiUrl;

  // Build inputs dynamically
  renderFormInputs(api.inputs);
  
  // Clear old console and reset
  resetConsole();
}

// Generate dynamic form controls
function renderFormInputs(inputs) {
  dynamicInputs.innerHTML = '';
  
  if (inputs.length === 0) {
    dynamicInputs.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; margin-bottom: 1rem;">No parameters required for this endpoint.</p>';
    triggerConsoleUpdate();
    return;
  }

  inputs.forEach(input => {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    let inputHtml = '';
    
    if (input.type === 'text') {
      inputHtml = `
        <label class="form-label" for="field-${input.name}">${input.label}</label>
        <div class="input-container">
          <input type="text" id="field-${input.name}" class="form-input" placeholder="${input.placeholder || ''}" value="${input.default}">
        </div>
      `;
    } else if (input.type === 'checkbox') {
      inputHtml = `
        <label class="form-checkbox-label">
          <input type="checkbox" id="field-${input.name}" class="form-checkbox" ${input.default ? 'checked' : ''}>
          <span>${input.label}</span>
        </label>
      `;
    } else if (input.type === 'select') {
      const optionsHtml = input.options.map(opt => `<option value="${opt}" ${opt === input.default ? 'selected' : ''}>${opt}</option>`).join('');
      inputHtml = `
        <label class="form-label" for="field-${input.name}">${input.label}</label>
        <select id="field-${input.name}" class="form-select">
          ${optionsHtml}
        </select>
      `;
    } else if (input.type === 'range') {
      inputHtml = `
        <label class="form-label" for="field-${input.name}">${input.label}</label>
        <div class="slider-group">
          <input type="range" id="field-${input.name}" class="form-range" min="${input.min}" max="${input.max}" value="${input.default}">
          <span class="slider-value" id="val-${input.name}">${input.default}</span>
        </div>
      `;
    }

    formGroup.innerHTML = inputHtml;
    dynamicInputs.appendChild(formGroup);

    // Attach listeners to update code snippets automatically as inputs change
    const element = document.getElementById(`field-${input.name}`);
    if (element) {
      const eventType = input.type === 'checkbox' ? 'change' : (input.type === 'range' ? 'input' : 'keyup');
      element.addEventListener(eventType, () => {
        if (input.type === 'range') {
          const valEl = document.getElementById(`val-${input.name}`);
          if (valEl) valEl.textContent = element.value;
        }
        triggerConsoleUpdate();
      });
      
      // Also catch select change
      if (input.type === 'select') {
        element.addEventListener('change', triggerConsoleUpdate);
      }
    }
  });

  triggerConsoleUpdate();
}

// Gather form data values
function getFormValues() {
  const values = {};
  if (!activeApi.inputs) return values;

  activeApi.inputs.forEach(input => {
    const el = document.getElementById(`field-${input.name}`);
    if (!el) return;
    
    if (input.type === 'checkbox') {
      values[input.name] = el.checked;
    } else {
      values[input.name] = el.value;
    }
  });

  return values;
}

// Trigger console rerender (update snippets only, preserving JSON state)
function triggerConsoleUpdate() {
  const values = getFormValues();
  
  if (activeTab === 'json') {
    if (currentResponseData) {
      consoleOutput.innerHTML = highlightJson(currentResponseData);
    } else {
      consoleOutput.innerHTML = highlightJson({ info: "Click 'Send Request' to trigger a live API call." });
    }
  } else {
    consoleOutput.textContent = getCodeSnippet(activeApi, values, activeTab);
  }
}

// Switch between Response and Code Snippet tabs
function selectTab(tab) {
  activeTab = tab;
  consoleTabs.forEach(btn => {
    if (btn.getAttribute('data-tab') === tab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('remove'); // Reset active classes correctly
      btn.classList.remove('active');
    }
  });

  // Hide image viewport if switching to code tabs
  if (tab !== 'json') {
    consoleContainer.style.display = 'block';
    consoleImgContainer.style.display = 'none';
  } else if (activeApi.key === 'barcode' && currentResponseData && currentResponseData._is_image) {
    consoleContainer.style.display = 'none';
    consoleImgContainer.style.display = 'flex';
  }

  triggerConsoleUpdate();
}

// Reset output display
function resetConsole() {
  currentResponseData = null;
  consoleContainer.style.display = 'block';
  consoleImgContainer.style.display = 'none';
  consoleImage.src = '';
  triggerConsoleUpdate();
}

// Execute live call to local Vercel endpoint
async function executeRequest() {
  loadingSpinner.style.display = 'flex';
  const values = getFormValues();
  const isPost = activeApi.method === 'POST';
  
  let fetchUrl = `/api/${activeApi.key}`;
  let fetchOptions = {
    method: activeApi.method,
    headers: {}
  };

  if (isPost) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(values);
  } else {
    const query = Object.entries(values)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    if (query) fetchUrl += '?' + query;
  }

  try {
    const response = await fetch(fetchUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    // Handle Barcode binary buffer image output
    if (contentType.includes('image/')) {
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      currentResponseData = { _is_image: true, url: objectUrl };
      
      consoleImage.src = objectUrl;
      
      if (activeTab === 'json') {
        consoleContainer.style.display = 'none';
        consoleImgContainer.style.display = 'flex';
      } else {
        triggerConsoleUpdate();
      }
    } else {
      // Handle standard JSON response
      const data = await response.json();
      currentResponseData = data;
      
      consoleContainer.style.display = 'block';
      consoleImgContainer.style.display = 'none';
      
      // Force tab to JSON on success to show results immediately
      selectTab('json');
    }
  } catch (err) {
    currentResponseData = {
      error: 'Failed to complete execution',
      details: err.message
    };
    selectTab('json');
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

// Copy to Clipboard
function copyToClipboard() {
  const text = consoleOutput.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btnCopy.classList.add('show');
    setTimeout(() => {
      btnCopy.classList.remove('show');
    }, 1500);
  });
}

// Search & Filter API list
function handleSearch() {
  const query = searchInput.value.toLowerCase();
  
  document.querySelectorAll('.api-item').forEach(item => {
    const link = item.querySelector('.api-link');
    const apiKey = link.getAttribute('data-key');
    const api = APIS.find(a => a.key === apiKey);
    
    if (api) {
      const matches = api.name.toLowerCase().includes(query) || 
                      api.description.toLowerCase().includes(query) ||
                      api.category.toLowerCase().includes(query);
      if (matches) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    }
  });
}

// Attach Event Listeners
function initApp() {
  renderSidebar();
  selectApi(APIS[0]);

  // Form submit handler
  document.getElementById('playground-form').addEventListener('submit', (e) => {
    e.preventDefault();
    executeRequest();
  });

  // Tabs handlers
  consoleTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      selectTab(btn.getAttribute('data-tab'));
    });
  });

  // Copy button handler
  btnCopy.addEventListener('click', copyToClipboard);

  // Search input handler
  searchInput.addEventListener('input', handleSearch);
}

// Run application
document.addEventListener('DOMContentLoaded', initApp);
