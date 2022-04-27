"use strict";
(self["webpackChunkhiring_app"] = self["webpackChunkhiring_app"] || []).push([[976],{

/***/ 8976:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "init": () => (/* reexport */ init),
  "logout": () => (/* reexport */ logout),
  "shield": () => (/* reexport */ shield),
  "useDynamicScript": () => (/* reexport */ useDynamicScript),
  "useFederatedComponent": () => (/* reexport */ useFederatedComponent),
  "useFederatedModule": () => (/* reexport */ useFederatedModule),
  "verifyLogin": () => (/* reexport */ verifyLogin)
});

// EXTERNAL MODULE: ./node_modules/query-string/index.js
var query_string = __webpack_require__(9587);
;// CONCATENATED MODULE: ./node_modules/blox-js-sdk/blox-js-sdk.js

const base = window.location.origin;
let clientId = null;
const authorizationEndpoint = 'https://shield-dev.appblox.io/login';

const getCodeInUrl = function () {
  const parsedQuery = query_string.parseUrl(window.location.href);
  const code = parsedQuery.query.code;
  return code;
};

class TokenStore {
  constructor() {
    if (!getCodeInUrl()) {
      this.initRefreshCycle();
    }
  }

  t;
  rt;
  te;
  sendRefreshBefore = 10000;
  timeoutHandle;

  setToken(token) {
    this.t = token;
    localStorage.setItem('_ab_t', token);
  }

  initRefreshCycle() {
    clearTimeout(this.timeoutHandle);
    let expiresIn = this.getExpiry();
    console.log('expires in = ', expiresIn);
    if (!expiresIn) return false;
    expiresIn *= 1000;
    let timer = expiresIn - new Date().getTime();

    if (!timer || timer < this.sendRefreshBefore || isNaN(timer)) {
      if (!timer) console.log('!timer');
      if (timer < this.sendRefreshBefore) console.log('less than', this.sendRefreshBefore);
      if (isNaN(timer)) console.log('isNan');
      console.log('invalid expiry time ', new Date().getTime(), expiresIn, timer);
      return null;
    }

    timer = parseInt(timer) - this.sendRefreshBefore;
    console.log('valid expiry time ', new Date().getTime(), expiresIn, timer);
    this.timeoutHandle = setTimeout(() => {
      refreshAccessToken();
    }, timer);
  }

  setExpiry(timestamp) {
    this.te = timestamp;
    localStorage.setItem('_ab_t_e', timestamp);
  }

  getExpiry() {
    return this.te || localStorage.getItem('_ab_t_e');
  }

  removeToken(token) {
    this.t = token;
    localStorage.removeItem('_ab_t');
  }

  setRefreshToken(token) {
    this.rt = token;
    localStorage.setItem('_ab_rt', token);
  }

  removeRefreshToken(token) {
    this.rt = token;
    localStorage.removeItem('_ab_rt');
  }

  getToken() {
    return this.t || localStorage.getItem('_ab_t');
  }

  getRefreshToken() {
    return this.rt || localStorage.getItem('_ab_rt');
  }

  clearTokens() {
    this.removeRefreshToken();
    this.removeToken();
  }

}

const tokenStore = new TokenStore();

const refreshAccessToken = async () => {
  console.log('calling refresh access token');
  const server = 'https://shield-dev.appblox.io/refresh-token';

  try {
    const res = await fetch(server, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStore.getToken()} ${tokenStore.getRefreshToken()}`
      }
    });
    const data = await res.json();

    if (data && data.data.AccessToken) {
      console.log('data is ', data.data);
      tokenStore.setToken(data.data.AccessToken);
      tokenStore.setExpiry(data.data.AtExpires);
      tokenStore.setRefreshToken(data.data.RefreshToken);
      tokenStore.initRefreshCycle();
    } else if (data.status === 401) {
      console.log('expired token');
      tokenStore.clearTokens();
      await verifyLogin(); // await logout()
      // verifyLogin();
    }
  } catch (error) {
    console.log('error in refreshing = ', error); // await logout()
    // verifyLogin();
  }
};

const logout = async () => {
  await shieldLogout();
  tokenStore.removeRefreshToken();
  tokenStore.removeToken();
  await verifyLogin();
};
const verifyLogin = async () => {
  let token = tokenStore.getToken();

  if (!token) {
    const authorizationUrl = getAuthUrl();
    window.location = authorizationUrl;
  } else {
    const isValid = await validateAccessToken();

    if (!isValid) {
      const authorizationUrl = getAuthUrl();
      window.location = authorizationUrl;
    }

    return isValid;
  }
};

const validateAccessToken = async () => {
  const server = `https://shield-dev.appblox.io/validate-appblox-acess-token`;

  try {
    const res = await fetch(server, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStore.getToken()}`
      }
    });
    const data = await res.json(); // access token set to appblox io cookie

    return data.data && data.data === 'valid';
  } catch (error) {
    console.log(error);
  }
};

const shieldLogout = async () => {
  const server = `https://shield-dev.appblox.io/logout`;

  try {
    const res = await fetch(server, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStore.getToken()}`
      }
    });
    const data = await res.json(); // access token set to appblox io cookie

    return data;
  } catch (error) {
    console.log(error);
  }
};

const getAuthUrl = () => {
  const oAuthQueryParams = {
    response_type: 'code',
    scope: 'user private_repo',
    redirect_uri: base,
    client_id: clientId,
    state: 'state123'
  };
  const query = query_string.stringify(oAuthQueryParams);
  const authorizationUrl = `${authorizationEndpoint}?${query}`;
  return authorizationUrl;
};

const init = async function (id) {
  clientId = id;
  const code = getCodeInUrl(); // var cookie;

  if (code) {
    const tokenData = await sendCodeToServer(code);

    if (tokenData.success && tokenData.data) {
      tokenStore.setToken(tokenData.data.ab_at);
      tokenStore.setExpiry(tokenData.data.expires_in);
      tokenStore.setRefreshToken(tokenData.data.ab_rt);
      tokenStore.initRefreshCycle();
    }
  }
};

async function sendCodeToServer(code) {
  const server = `https://shield-dev.appblox.io/auth/get-token?grant_type=authorization_code&code=${code}&redirect_uri=${base}`;

  try {
    const res = await fetch(server, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json(); // access token set to appblox io cookie

    if (location.href.includes('?')) {
      history.pushState({}, null, location.href.split('?')[0]);
    }

    console.log('🚀  file: index.js  line 50  sendCodeToServer  data', data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

const shield = {
  init,
  verifyLogin,
  tokenStore,
  getAuthUrl,
  logout
};
;// CONCATENATED MODULE: ./node_modules/blox-js-sdk/useDynamicScript.js
const urlCache = new Set();
const useDynamicScript = (url, React) => {
  const [ready, setReady] = React.useState(false);
  const [errorLoading, setErrorLoading] = React.useState(false);
  React.useEffect(() => {
    if (!url) return;

    if (urlCache.has(url)) {
      setReady(true);
      setErrorLoading(false);
      return;
    }

    setReady(false);
    setErrorLoading(false);
    const element = document.createElement('script');
    element.src = url;
    element.type = 'text/javascript';
    element.async = true;

    element.onload = () => {
      urlCache.add(url);
      setReady(true);
    };

    element.onerror = () => {
      setReady(false);
      setErrorLoading(true);
    };

    document.head.appendChild(element);
    return () => {
      urlCache.delete(url);
      document.head.removeChild(element);
    };
  }, [url]);
  return {
    errorLoading,
    ready
  };
};
/* harmony default export */ const blox_js_sdk_useDynamicScript = (useDynamicScript);
;// CONCATENATED MODULE: ./node_modules/blox-js-sdk/utils.js
function loadComponent(scope, module) {
  return async () => {
    // Initializes the share scope. This fills it with known provided modules from this build and all remotes
    await __webpack_require__.I('default');
    const container = window[scope]; // or get the container somewhere else
    // Initialize the container, it may provide shared modules

    await container.init(__webpack_require__.S.default);
    const factory = await window[scope].get(module);
    const Module = factory();
    return Module;
  };
}


;// CONCATENATED MODULE: ./node_modules/blox-js-sdk/useFederatedComponent.js


const useFederatedComponent_urlCache = new Set();
const componentCache = new Map();
const useFederatedComponent = (remoteUrl, scope, module, React) => {
  const key = `${remoteUrl}-${scope}-${module}`;
  const [Component, setComponent] = React.useState(null);
  const {
    ready,
    errorLoading
  } = blox_js_sdk_useDynamicScript(remoteUrl, React);
  React.useEffect(() => {
    if (Component) setComponent(null); // Only recalculate when key changes
  }, [key]);
  React.useEffect(() => {
    if (ready && !Component) {
      const Comp = React.lazy(loadComponent(scope, module));
      componentCache.set(key, Comp);
      setComponent(Comp);
    } // key includes all dependencies (scope/module)

  }, [Component, ready, key]);
  return {
    errorLoading,
    Component
  };
};
;// CONCATENATED MODULE: ./node_modules/blox-js-sdk/useFederatedModule.js


const scriptCache = new Map();
const useFederatedModule = (remoteUrl, scope, module, React) => {
  const key = `${remoteUrl}-${scope}-${module}`;
  const [scriptModule, setScriptModule] = React.useState(null);
  const {
    ready,
    errorLoading
  } = blox_js_sdk_useDynamicScript(remoteUrl, React);
  React.useEffect(() => {
    if (scriptModule) setScriptModule(null); // Only recalculate when key changes
  }, [key]);
  React.useEffect(() => {
    if (ready && !scriptModule) {
      let src = null;

      const loadAsyncComp = async () => {
        src = await loadComponent(scope, module)();
        scriptCache.set(key, src);
        setScriptModule(src);
      };

      loadAsyncComp();
    } // key includes all dependencies (scope/module)

  }, [scriptModule, ready, key]);
  const errorinLoading = errorLoading;
  return {
    errorinLoading,
    scriptModule
  };
};
;// CONCATENATED MODULE: ./node_modules/blox-js-sdk/index.js





/***/ }),

/***/ 336:
/***/ ((module) => {



var token = '%[a-f0-9]{2}';
var singleMatcher = new RegExp(token, 'gi');
var multiMatcher = new RegExp('(' + token + ')+', 'gi');

function decodeComponents(components, split) {
  try {
    // Try to decode the entire string first
    return decodeURIComponent(components.join(''));
  } catch (err) {// Do nothing
  }

  if (components.length === 1) {
    return components;
  }

  split = split || 1; // Split the array in 2 parts

  var left = components.slice(0, split);
  var right = components.slice(split);
  return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
}

function decode(input) {
  try {
    return decodeURIComponent(input);
  } catch (err) {
    var tokens = input.match(singleMatcher);

    for (var i = 1; i < tokens.length; i++) {
      input = decodeComponents(tokens, i).join('');
      tokens = input.match(singleMatcher);
    }

    return input;
  }
}

function customDecodeURIComponent(input) {
  // Keep track of all the replacements and prefill the map with the `BOM`
  var replaceMap = {
    '%FE%FF': '\uFFFD\uFFFD',
    '%FF%FE': '\uFFFD\uFFFD'
  };
  var match = multiMatcher.exec(input);

  while (match) {
    try {
      // Decode as big chunks as possible
      replaceMap[match[0]] = decodeURIComponent(match[0]);
    } catch (err) {
      var result = decode(match[0]);

      if (result !== match[0]) {
        replaceMap[match[0]] = result;
      }
    }

    match = multiMatcher.exec(input);
  } // Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else


  replaceMap['%C2'] = '\uFFFD';
  var entries = Object.keys(replaceMap);

  for (var i = 0; i < entries.length; i++) {
    // Replace all decoded components
    var key = entries[i];
    input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
  }

  return input;
}

module.exports = function (encodedURI) {
  if (typeof encodedURI !== 'string') {
    throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
  }

  try {
    encodedURI = encodedURI.replace(/\+/g, ' '); // Try the built in decoder first

    return decodeURIComponent(encodedURI);
  } catch (err) {
    // Fallback to a more advanced decoder
    return customDecodeURIComponent(encodedURI);
  }
};

/***/ }),

/***/ 9106:
/***/ ((module) => {



module.exports = function (obj, predicate) {
  var ret = {};
  var keys = Object.keys(obj);
  var isArr = Array.isArray(predicate);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var val = obj[key];

    if (isArr ? predicate.indexOf(key) !== -1 : predicate(key, val, obj)) {
      ret[key] = val;
    }
  }

  return ret;
};

/***/ }),

/***/ 9587:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



const strictUriEncode = __webpack_require__(757);

const decodeComponent = __webpack_require__(336);

const splitOnFirst = __webpack_require__(2003);

const filterObject = __webpack_require__(9106);

const isNullOrUndefined = value => value === null || value === undefined;

const encodeFragmentIdentifier = Symbol('encodeFragmentIdentifier');

function encoderForArrayFormat(options) {
  switch (options.arrayFormat) {
    case 'index':
      return key => (result, value) => {
        const index = result.length;

        if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
          return result;
        }

        if (value === null) {
          return [...result, [encode(key, options), '[', index, ']'].join('')];
        }

        return [...result, [encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')];
      };

    case 'bracket':
      return key => (result, value) => {
        if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
          return result;
        }

        if (value === null) {
          return [...result, [encode(key, options), '[]'].join('')];
        }

        return [...result, [encode(key, options), '[]=', encode(value, options)].join('')];
      };

    case 'colon-list-separator':
      return key => (result, value) => {
        if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
          return result;
        }

        if (value === null) {
          return [...result, [encode(key, options), ':list='].join('')];
        }

        return [...result, [encode(key, options), ':list=', encode(value, options)].join('')];
      };

    case 'comma':
    case 'separator':
    case 'bracket-separator':
      {
        const keyValueSep = options.arrayFormat === 'bracket-separator' ? '[]=' : '=';
        return key => (result, value) => {
          if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
            return result;
          } // Translate null to an empty string so that it doesn't serialize as 'null'


          value = value === null ? '' : value;

          if (result.length === 0) {
            return [[encode(key, options), keyValueSep, encode(value, options)].join('')];
          }

          return [[result, encode(value, options)].join(options.arrayFormatSeparator)];
        };
      }

    default:
      return key => (result, value) => {
        if (value === undefined || options.skipNull && value === null || options.skipEmptyString && value === '') {
          return result;
        }

        if (value === null) {
          return [...result, encode(key, options)];
        }

        return [...result, [encode(key, options), '=', encode(value, options)].join('')];
      };
  }
}

function parserForArrayFormat(options) {
  let result;

  switch (options.arrayFormat) {
    case 'index':
      return (key, value, accumulator) => {
        result = /\[(\d*)\]$/.exec(key);
        key = key.replace(/\[\d*\]$/, '');

        if (!result) {
          accumulator[key] = value;
          return;
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = {};
        }

        accumulator[key][result[1]] = value;
      };

    case 'bracket':
      return (key, value, accumulator) => {
        result = /(\[\])$/.exec(key);
        key = key.replace(/\[\]$/, '');

        if (!result) {
          accumulator[key] = value;
          return;
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = [value];
          return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
      };

    case 'colon-list-separator':
      return (key, value, accumulator) => {
        result = /(:list)$/.exec(key);
        key = key.replace(/:list$/, '');

        if (!result) {
          accumulator[key] = value;
          return;
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = [value];
          return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
      };

    case 'comma':
    case 'separator':
      return (key, value, accumulator) => {
        const isArray = typeof value === 'string' && value.includes(options.arrayFormatSeparator);
        const isEncodedArray = typeof value === 'string' && !isArray && decode(value, options).includes(options.arrayFormatSeparator);
        value = isEncodedArray ? decode(value, options) : value;
        const newValue = isArray || isEncodedArray ? value.split(options.arrayFormatSeparator).map(item => decode(item, options)) : value === null ? value : decode(value, options);
        accumulator[key] = newValue;
      };

    case 'bracket-separator':
      return (key, value, accumulator) => {
        const isArray = /(\[\])$/.test(key);
        key = key.replace(/\[\]$/, '');

        if (!isArray) {
          accumulator[key] = value ? decode(value, options) : value;
          return;
        }

        const arrayValue = value === null ? [] : value.split(options.arrayFormatSeparator).map(item => decode(item, options));

        if (accumulator[key] === undefined) {
          accumulator[key] = arrayValue;
          return;
        }

        accumulator[key] = [].concat(accumulator[key], arrayValue);
      };

    default:
      return (key, value, accumulator) => {
        if (accumulator[key] === undefined) {
          accumulator[key] = value;
          return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
      };
  }
}

function validateArrayFormatSeparator(value) {
  if (typeof value !== 'string' || value.length !== 1) {
    throw new TypeError('arrayFormatSeparator must be single character string');
  }
}

function encode(value, options) {
  if (options.encode) {
    return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
  }

  return value;
}

function decode(value, options) {
  if (options.decode) {
    return decodeComponent(value);
  }

  return value;
}

function keysSorter(input) {
  if (Array.isArray(input)) {
    return input.sort();
  }

  if (typeof input === 'object') {
    return keysSorter(Object.keys(input)).sort((a, b) => Number(a) - Number(b)).map(key => input[key]);
  }

  return input;
}

function removeHash(input) {
  const hashStart = input.indexOf('#');

  if (hashStart !== -1) {
    input = input.slice(0, hashStart);
  }

  return input;
}

function getHash(url) {
  let hash = '';
  const hashStart = url.indexOf('#');

  if (hashStart !== -1) {
    hash = url.slice(hashStart);
  }

  return hash;
}

function extract(input) {
  input = removeHash(input);
  const queryStart = input.indexOf('?');

  if (queryStart === -1) {
    return '';
  }

  return input.slice(queryStart + 1);
}

function parseValue(value, options) {
  if (options.parseNumbers && !Number.isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '') {
    value = Number(value);
  } else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
    value = value.toLowerCase() === 'true';
  }

  return value;
}

function parse(query, options) {
  options = Object.assign({
    decode: true,
    sort: true,
    arrayFormat: 'none',
    arrayFormatSeparator: ',',
    parseNumbers: false,
    parseBooleans: false
  }, options);
  validateArrayFormatSeparator(options.arrayFormatSeparator);
  const formatter = parserForArrayFormat(options); // Create an object with no prototype

  const ret = Object.create(null);

  if (typeof query !== 'string') {
    return ret;
  }

  query = query.trim().replace(/^[?#&]/, '');

  if (!query) {
    return ret;
  }

  for (const param of query.split('&')) {
    if (param === '') {
      continue;
    }

    let [key, value] = splitOnFirst(options.decode ? param.replace(/\+/g, ' ') : param, '='); // Missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters

    value = value === undefined ? null : ['comma', 'separator', 'bracket-separator'].includes(options.arrayFormat) ? value : decode(value, options);
    formatter(decode(key, options), value, ret);
  }

  for (const key of Object.keys(ret)) {
    const value = ret[key];

    if (typeof value === 'object' && value !== null) {
      for (const k of Object.keys(value)) {
        value[k] = parseValue(value[k], options);
      }
    } else {
      ret[key] = parseValue(value, options);
    }
  }

  if (options.sort === false) {
    return ret;
  }

  return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce((result, key) => {
    const value = ret[key];

    if (Boolean(value) && typeof value === 'object' && !Array.isArray(value)) {
      // Sort object keys, not values
      result[key] = keysSorter(value);
    } else {
      result[key] = value;
    }

    return result;
  }, Object.create(null));
}

exports.extract = extract;
exports.parse = parse;

exports.stringify = (object, options) => {
  if (!object) {
    return '';
  }

  options = Object.assign({
    encode: true,
    strict: true,
    arrayFormat: 'none',
    arrayFormatSeparator: ','
  }, options);
  validateArrayFormatSeparator(options.arrayFormatSeparator);

  const shouldFilter = key => options.skipNull && isNullOrUndefined(object[key]) || options.skipEmptyString && object[key] === '';

  const formatter = encoderForArrayFormat(options);
  const objectCopy = {};

  for (const key of Object.keys(object)) {
    if (!shouldFilter(key)) {
      objectCopy[key] = object[key];
    }
  }

  const keys = Object.keys(objectCopy);

  if (options.sort !== false) {
    keys.sort(options.sort);
  }

  return keys.map(key => {
    const value = object[key];

    if (value === undefined) {
      return '';
    }

    if (value === null) {
      return encode(key, options);
    }

    if (Array.isArray(value)) {
      if (value.length === 0 && options.arrayFormat === 'bracket-separator') {
        return encode(key, options) + '[]';
      }

      return value.reduce(formatter(key), []).join('&');
    }

    return encode(key, options) + '=' + encode(value, options);
  }).filter(x => x.length > 0).join('&');
};

exports.parseUrl = (url, options) => {
  options = Object.assign({
    decode: true
  }, options);
  const [url_, hash] = splitOnFirst(url, '#');
  return Object.assign({
    url: url_.split('?')[0] || '',
    query: parse(extract(url), options)
  }, options && options.parseFragmentIdentifier && hash ? {
    fragmentIdentifier: decode(hash, options)
  } : {});
};

exports.stringifyUrl = (object, options) => {
  options = Object.assign({
    encode: true,
    strict: true,
    [encodeFragmentIdentifier]: true
  }, options);
  const url = removeHash(object.url).split('?')[0] || '';
  const queryFromUrl = exports.extract(object.url);
  const parsedQueryFromUrl = exports.parse(queryFromUrl, {
    sort: false
  });
  const query = Object.assign(parsedQueryFromUrl, object.query);
  let queryString = exports.stringify(query, options);

  if (queryString) {
    queryString = `?${queryString}`;
  }

  let hash = getHash(object.url);

  if (object.fragmentIdentifier) {
    hash = `#${options[encodeFragmentIdentifier] ? encode(object.fragmentIdentifier, options) : object.fragmentIdentifier}`;
  }

  return `${url}${queryString}${hash}`;
};

exports.pick = (input, filter, options) => {
  options = Object.assign({
    parseFragmentIdentifier: true,
    [encodeFragmentIdentifier]: false
  }, options);
  const {
    url,
    query,
    fragmentIdentifier
  } = exports.parseUrl(input, options);
  return exports.stringifyUrl({
    url,
    query: filterObject(query, filter),
    fragmentIdentifier
  }, options);
};

exports.exclude = (input, filter, options) => {
  const exclusionFilter = Array.isArray(filter) ? key => !filter.includes(key) : (key, value) => !filter(key, value);
  return exports.pick(input, exclusionFilter, options);
};

/***/ }),

/***/ 2003:
/***/ ((module) => {



module.exports = (string, separator) => {
  if (!(typeof string === 'string' && typeof separator === 'string')) {
    throw new TypeError('Expected the arguments to be of type `string`');
  }

  if (separator === '') {
    return [string];
  }

  const separatorIndex = string.indexOf(separator);

  if (separatorIndex === -1) {
    return [string];
  }

  return [string.slice(0, separatorIndex), string.slice(separatorIndex + separator.length)];
};

/***/ }),

/***/ 757:
/***/ ((module) => {



module.exports = str => encodeURIComponent(str).replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

/***/ })

}]);