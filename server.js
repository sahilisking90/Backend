'use strict';

const express = require('express');
const axios   = require('axios');
const cors    = require('cors');
const path    = require('path');
const db      = require('./db');
const analytics = require('./analytics');

const app = express();

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(analytics.middleware);

const OWNER   = "@sahilxalone";
const CHANNEL = "@osintnxera";

const removeFields = [
  'owner', 'OWNER', 'channel', 'CHANNEL', 'telegram', 'contact',
  'instagram', 'twitter', 'fb', 'facebook', 'website', 'github',
  'created_by', 'createdBy', 'owner_username', 'owner_channel',
  'credit', 'Credits', 'Credit', 'Source', 'source', 'provider',
  'Provider', 'api_source', 'API_Source', 'developer', 'Developer',
  'dev', 'Dev', 'invalidayushh', 'ftgamerv2', 'ftgamer2',
  '@invalidayushh', '@ftgamerv2', '@ftgamer2', 'InvalidAyush',
  '@InvalidAyush', 'invalidayush', '@invalidayush', 'DM TO BUY ACCESS',
  'xtradeep', 'Kon_Hu_Mai', 'support', '@raxusss', 'raxusss', 'Raxusss',
  'Support', 'help', 'Help'
];

const badSubstrings = [
  '@raxusss', 'raxusss', 'Raxusss',
  'InvalidAyush', '@InvalidAyush', 'invalidayush', '@invalidayush',
  'ftgamerv2', 'ftgamer2', '@ftgamerv2', '@ftgamer2', '@simpleguy444'
];

const removeFieldsLower = new Set(removeFields.map(f => f.toLowerCase()));

function cleanData(obj) {
  try {
    if (!obj || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        let val = obj;
        for (const sub of badSubstrings) {
          val = val.replace(new RegExp(sub, 'gi'), '').trim();
        }
        return val;
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => cleanData(item)).filter(item => {
        if (typeof item === 'string' && item === '') return false;
        return true;
      });
    }
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      if (removeFieldsLower.has(key.toLowerCase())) continue;
      const cleanedValue = cleanData(obj[key]);
      if (cleanedValue !== null && cleanedValue !== undefined && cleanedValue !== '') {
        cleaned[key] = cleanedValue;
      } else if (cleanedValue === 0 || cleanedValue === false || cleanedValue === true) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  } catch (e) {
    return obj;
  }
}

const APIs = [
  { name: "tg",           url: "https://rootx-osint.in/?type=tg_num&key=sahil_x&query={query}",                method:"GET", description:"Telegram user info lookup"              },
  { name: "leak",         url: "https://raxxosint.onrender.com/leakosint?key=Sahilzz-17$&quiry={query}",          method:"GET", description:"Leak OSINT query lookup"                 },
  { name: "num2",          url: "https://osint.invalidayushh.workers.dev/num?key=Rack&q={number}",              method:"GET", description:"Mobile number intelligence"               },
  { name: "num",    url: "https://leakapi.dpdns.org/search?q={number}",                                  method:"GET", description:"Database number search"                  },
  { name: "num-india",    url: "https://ft-osint-api.duckdns.org/api/number?key=sahil-new&num={number}",       method:"GET", description:"India phone number lookup"               },
  { name: "num-pak",      url: "https://ft-osint-api.duckdns.org/api/pk?key=sahil-new&number={number}",        method:"GET", description:"Pakistan phone number lookup"            },
  { name: "chain",        url: "https://leakapi.dpdns.org/chain?q={number}",                                   method:"GET", description:"Hi-tech number chain intelligence"       },
  { name: "bom",          url: "https://leakapi.dpdns.org/bomb?num={number}",                                  method:"GET", description:"💣 SMS/Call bomber"                      },
  { name: "adhar",        url: "https://osint.invalidayushh.workers.dev/adhar?key=Sahil&q={adhar}",            method:"GET", description:"Aadhaar identification lookup"           },
  { name: "family",       url: "https://ayaanmods.site/family.php?key=YOUR_SUBHXCO_KEY&term={adhar}",          method:"GET", description:"Family tree demographic lookup"          },
  { name: "email",        url: "https://osint.invalidayushh.workers.dev/email?key=Rack&q={email}",             method:"GET", description:"Email breach record lookup"              },
  { name: "veh-info",     url: "https://leakapi.dpdns.org/vehicle-info?registration_number={vehicle}",         method:"GET", description:"Vehicle registration details"            },
  { name: "veh",          url: "https://leakapi.dpdns.org/api/vehicle?vehicle={vehicle}",                      method:"GET", description:"Detailed vehicle intelligence"           },
  { name: "rc",           url: "https://leakapi.dpdns.org/rc?registration_number={vehicle}",                   method:"GET", description:"RC registration lookup"                  },
  { name: "insta",        url: "https://osint.invalidayushh.workers.dev/insta?key=Rack&q={username}",          method:"GET", description:"Instagram account intelligence"          },
  { name: "git",          url: "https://ft-osint-api.duckdns.org/api/git?key=sahil-new&username={username}",   method:"GET", description:"GitHub profile intelligence"             },
  { name: "bgmi",         url: "https://ft-osint-api.duckdns.org/api/bgmi?key=sahil-new&uid={uid}",            method:"GET", description:"BGMI player ID lookup"                   },
  { name: "ff",           url: "https://ft-osint-api.duckdns.org/api/ff?key=sahil-new&uid={uid}",              method:"GET", description:"Free Fire player ID lookup"              },
  { name: "ifsc",         url: "https://ft-osint-api.duckdns.org/api/ifsc?key=sahil-new&ifsc={ifsc}",          method:"GET", description:"Bank IFSC code lookup"                   },
  { name: "pan",          url: "https://ft-osint-api.duckdns.org/api/pan?key=sahil-new&pan={pan}",             method:"GET", description:"PAN card intelligence lookup"            },
  { name: "ip",           url: "https://ft-osint-api.duckdns.org/api/ip?key=sahil-new&ip={ip}",                method:"GET", description:"IP geolocation intelligence"             },
  { name: "pin",          url: "https://ft-osint-api.duckdns.org/api/pincode?key=sahil-new&pin={pincode}",     method:"GET", description:"Postal pincode lookup"                   },
];

function exampleValFor(param) {
  if (param.includes('number') || param.includes('num')) return '9876543210';
  if (param.includes('vehicle') || param.includes('registration')) return 'DL01AB1234';
  if (param.includes('email'))    return 'test@example.com';
  if (param.includes('username') || param.includes('user')) return 'john_doe';
  if (param.includes('ifsc'))     return 'SBIN0001234';
  if (param.includes('pan'))      return 'ABCDE1234F';
  if (param.includes('pincode') || param === 'pin') return '110001';
  if (param.includes('adhar') || param.includes('aadhar')) return '123456789012';
  if (param.includes('uid'))      return '123456789';
  if (param.includes('ip'))       return '8.8.8.8';
  if (param.includes('quiry') || param.includes('query') || param === 'q') return 'test@example.com';
  return '12345678';
}

const registeredAPIs = [];
const nameSet = new Set();

APIs.forEach(api => {
  const autoName = api.name;
  nameSet.add(autoName);
  const matches = api.url.match(/\{([^}]+)\}/g);
  const required = matches ? matches.map(m => m.replace(/[{}]/g, '')) : [];

  const exampleQuery = required.length > 0
    ? required.map(p => `${p}=${exampleValFor(p)}`).join('&')
    : 'query=test';

  const exampleParam = required[0] || 'query';
  const exampleVal   = exampleValFor(exampleParam);

  const paramExamples = {};
  required.forEach(p => { paramExamples[p] = exampleValFor(p); });

  registeredAPIs.push({
    name: autoName,
    url: api.url,
    upstreamUrl: api.url.replace(/key=[^&}]+/g, 'key=***'),
    method: api.method || 'GET',
    description: api.description || 'API endpoint',
    requiredParams: required,
    exampleParam,
    exampleVal,
    exampleQuery,
    paramExamples
  });
});

// SQL LOGGING FUNCTION
function logQuery(endpointName, inputParam, inputValue, statusCode, responseData, errorMsg, ipAddr, execTime) {
  db.run(`
    INSERT INTO queries (endpoint, input_param, input_value, response_status, response_data, error_msg, ip_address, execution_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [endpointName, inputParam, inputValue, statusCode, JSON.stringify(responseData), errorMsg, ipAddr, execTime], function(err) {
    if (err) console.error('DB log failed:', err);
  });

  db.run(`
    INSERT INTO analytics (endpoint, total_queries, successful, avg_time)
    VALUES (?, 1, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      total_queries = total_queries + 1,
      successful = successful + ?,
      avg_time = (avg_time * (total_queries - 1) + ?) / total_queries
  `, [endpointName, statusCode < 400 ? 1 : 0, execTime, statusCode < 400 ? 1 : 0, execTime], (err) => {
    if (err) console.error('Analytics update failed:', err);
  });
}

app.get('/health', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get('/analytics/data', (req, res) => {
  res.json(analytics.snapshot());
});

app.get('/analytics', (req, res) => {
  res.render('analytics', {
    owner: OWNER,
    channel: CHANNEL,
    totalEndpoints: registeredAPIs.length
  });
});

app.get('/', (req, res) => res.redirect('/api'));

app.get('/api', (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host     = req.get('host');
    const baseUrl  = `${protocol}://${host}`;

    const formattedApis = registeredAPIs.map(api => ({
      name: api.name,
      method: api.method,
      description: api.description,
      publicUrl: `${baseUrl}/api/${api.name}`,
      requiredParams: api.requiredParams,
      paramExamples: api.paramExamples,
      exampleQuery: api.exampleQuery,
      example: `${baseUrl}/api/${api.name}?${api.exampleQuery}`,
      upstreamUrl: api.upstreamUrl
    }));

    res.render('index', { apis: formattedApis, baseUrl, owner: OWNER, channel: CHANNEL });
  } catch (err) {
    console.error('Template error:', err);
    res.status(500).json({ success: false, error: "Template rendering failed", details: err.message });
  }
});

// SQL ENDPOINTS
app.get('/sql/stats', (req, res) => {
  db.all(`
    SELECT endpoint, total_queries, successful, ROUND(avg_time, 2) as avg_time
    FROM analytics
    ORDER BY total_queries DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

app.get('/sql/queries/:endpoint', (req, res) => {
  db.all(`
    SELECT * FROM queries
    WHERE endpoint = ?
    ORDER BY created_at DESC
    LIMIT 100
  `, [req.params.endpoint], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, count: rows.length, data: rows });
  });
});

app.get('/sql/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ success: false, error: "Missing query parameter" });
  
  db.all(`
    SELECT * FROM queries
    WHERE input_value LIKE ? OR input_param LIKE ?
    ORDER BY created_at DESC
    LIMIT 50
  `, [`%${q}%`, `%${q}%`], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, count: rows.length, data: rows });
  });
});

// MAIN API GATEWAY
const PERMANENT_ROUTES = [
  '/api/tg', '/api/leak', '/api/num', '/api/numsearch', '/api/num-india', '/api/num-pak',
  '/api/chain', '/api/bom', '/api/adhar', '/api/family', '/api/email', '/api/veh-info',
  '/api/veh', '/api/rc', '/api/insta', '/api/git', '/api/bgmi', '/api/ff', '/api/ifsc',
  '/api/pan', '/api/ip', '/api/pin',
];

PERMANENT_ROUTES.forEach(route => {
  const epName = route.replace('/api/', '');
  app.all(route, (req, res, next) => {
    req.params = req.params || {};
    req.params.endpoint = epName;
    next('route');
  });
});

app.all('/api/:endpoint', async (req, res) => {
  try {
    const startTime = Date.now();
    const endpointName = req.params.endpoint;
    const apiConfig    = registeredAPIs.find(a => a.name === endpointName);

    if (!apiConfig) {
      return res.status(404).json({
        success: false, error: "Endpoint not found",
        message: `The endpoint '/api/${endpointName}' does not exist. Visit /api to see available endpoints.`
      });
    }

    const inputParams = { ...req.query, ...req.body };
    let targetValue = null;
    let usedParam = null;

    for (const param of apiConfig.requiredParams) {
      if (inputParams[param] !== undefined && inputParams[param] !== '') {
        targetValue = inputParams[param];
        usedParam = param;
        break;
      }
    }
    
    if (!targetValue) {
      const fallbackKeys = ['query','q','number','num','adhar','aadhar','email','vehicle',
        'registration_number','username','user','uid','id','ifsc','pan','ip','pincode','pin','term','quiry'];
      for (const key of fallbackKeys) {
        if (inputParams[key] !== undefined && inputParams[key] !== '') {
          targetValue = inputParams[key];
          usedParam = key;
          break;
        }
      }
    }

    if (!targetValue) {
      return res.status(400).json({
        success: false, error: "Missing required parameter",
        required_parameters: apiConfig.requiredParams,
        message: `Please supply a valid parameter (e.g., ?${apiConfig.exampleParam}=VALUE)`
      });
    }

    let finalUpstreamUrl = apiConfig.url;
    const encodedVal = encodeURIComponent(targetValue);
    apiConfig.requiredParams.forEach(param => {
      finalUpstreamUrl = finalUpstreamUrl.replace(new RegExp(`\\{${param}\\}`, 'g'), encodedVal);
    });

    console.log(`[${new Date().toISOString()}] → ${finalUpstreamUrl}`);

    const axiosConfig = {
      method: apiConfig.method,
      url: finalUpstreamUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      validateStatus: status => status < 600
    };

    if (['POST','PUT','PATCH'].includes(axiosConfig.method.toUpperCase())) {
      axiosConfig.data = req.body;
    }

    const response = await axios(axiosConfig);
    const execTime = Date.now() - startTime;

    if (!response.data) {
      logQuery(endpointName, usedParam, targetValue, 500, {}, "No data returned", req.ip, execTime);
      return res.status(500).json({ success: false, error: "API returned no data", status: response.status, owner: OWNER, channel: CHANNEL });
    }

    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      logQuery(endpointName, usedParam, targetValue, 500, {}, "HTML error page returned", req.ip, execTime);
      return res.status(500).json({ success: false, error: "API returned HTML error page", owner: OWNER, channel: CHANNEL });
    }

    let cleaned = cleanData(response.data);

    if (!cleaned || (typeof cleaned === 'object' && Object.keys(cleaned).length === 0)) {
      logQuery(endpointName, usedParam, targetValue, 404, cleaned, "Empty response", req.ip, execTime);
      return res.status(404).json({ success: false, error: "No data found", owner: OWNER, channel: CHANNEL });
    }

    if (cleaned && typeof cleaned === 'object' && !Array.isArray(cleaned)) {
      cleaned.owner = OWNER;
      cleaned.channel = CHANNEL;
      cleaned.timestamp = new Date().toISOString();
    } else {
      cleaned = { data: cleaned, owner: OWNER, channel: CHANNEL, timestamp: new Date().toISOString() };
    }

    logQuery(endpointName, usedParam, targetValue, response.status, cleaned, null, req.ip, execTime);

    return res.status(response.status).json(cleaned);

  } catch (error) {
    const execTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    
    let errorMessage = error.message || "An unexpected error occurred";
    let errorDetails = {};

    if (error.response) {
      errorDetails.status = error.response.status;
      errorMessage = `API returned status ${error.response.status}`;
    } else if (error.request) {
      errorMessage = "No response from API server (timeout or network error)";
    }

    logQuery(req.params.endpoint, null, null, 500, {}, errorMessage, req.ip, execTime);

    return res.status(500).json({
      success: false, error: "Gateway execution error",
      message: errorMessage, details: errorDetails,
      owner: OWNER, channel: CHANNEL
    });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Owner: ${OWNER} | Channel: ${CHANNEL}`);
    console.log(`Endpoints: ${registeredAPIs.length}`);
  });
}

module.exports = app;
