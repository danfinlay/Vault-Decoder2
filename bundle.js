(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const passworder = require('browser-passworder')

const form = document.querySelector('form')
form.addEventListener('submit', function (event) {
  event.preventDefault()
  const encrypted = JSON.parse(fileInput.value).KeyringController.vault
  passworder.decrypt(password.value, encrypted)
  .then(function (result) {
    decodedResult.innerText = JSON.stringify(result)
  })
  .catch(function (error) {
    decodedResult.innerText = `Error: ${JSON.stringify(error)}`
  })
})

},{"browser-passworder":2}],2:[function(require,module,exports){
(function (global){
var Unibabel = require('browserify-unibabel')

module.exports = {

  // Simple encryption methods:
  encrypt,
  decrypt,

  // More advanced encryption methods:
  keyFromPassword,
  encryptWithKey,
  decryptWithKey,

  // Buffer <-> Hex string methods
  serializeBufferForStorage,
  serializeBufferFromStorage,

  generateSalt,
}

// Takes a Pojo, returns cypher text.
function encrypt (password, dataObj) {
  var salt = generateSalt()

  return keyFromPassword(password, salt)
  .then(function (passwordDerivedKey) {
    return encryptWithKey(passwordDerivedKey, dataObj)
  })
  .then(function (payload) {
    payload.salt = salt
    return JSON.stringify(payload)
  })
}

function encryptWithKey (key, dataObj) {
  var data = JSON.stringify(dataObj)
  var dataBuffer = Unibabel.utf8ToBuffer(data)
  var vector = global.crypto.getRandomValues(new Uint8Array(16))
  return global.crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: vector,
  }, key, dataBuffer).then(function (buf) {
    var buffer = new Uint8Array(buf)
    var vectorStr = Unibabel.bufferToBase64(vector)
    var vaultStr = Unibabel.bufferToBase64(buffer)
    return {
      data: vaultStr,
      iv: vectorStr,
    }
  })
}

// Takes encrypted text, returns the restored Pojo.
function decrypt (password, text) {
  const payload = JSON.parse(text)
  const salt = payload.salt
  return keyFromPassword(password, salt)
  .then(function (key) {
    return decryptWithKey(key, payload)
  })
}

function decryptWithKey (key, payload) {
  const encryptedData = Unibabel.base64ToBuffer(payload.data)
  const vector = Unibabel.base64ToBuffer(payload.iv)
  return crypto.subtle.decrypt({name: 'AES-GCM', iv: vector}, key, encryptedData)
  .then(function (result) {
    const decryptedData = new Uint8Array(result)
    const decryptedStr = Unibabel.bufferToUtf8(decryptedData)
    const decryptedObj = JSON.parse(decryptedStr)
    return decryptedObj
  })
  .catch(function (reason) {
    throw new Error('Incorrect password')
  })
}

function keyFromPassword (password, salt) {
  var passBuffer = Unibabel.utf8ToBuffer(password)
  var saltBuffer = Unibabel.base64ToBuffer(salt)

  return global.crypto.subtle.importKey(
    'raw',
    passBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  ).then(function (key) {

    return global.crypto.subtle.deriveKey(
      { name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 10000,
        hash: 'SHA-256',
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  })
}

function serializeBufferFromStorage (str) {
  var stripStr = (str.slice(0, 2) === '0x') ? str.slice(2) : str
  var buf = new Uint8Array(stripStr.length / 2)
  for (var i = 0; i < stripStr.length; i += 2) {
    var seg = stripStr.substr(i, 2)
    buf[i / 2] = parseInt(seg, 16)
  }
  return buf
}

// Should return a string, ready for storage, in hex format.
function serializeBufferForStorage (buffer) {
  var result = '0x'
  var len = buffer.length || buffer.byteLength
  for (var i = 0; i < len; i++) {
    result += unprefixedHex(buffer[i])
  }
  return result
}

function unprefixedHex (num) {
  var hex = num.toString(16)
  while (hex.length < 2) {
    hex = '0' + hex
  }
  return hex
}

function generateSalt (byteCount = 32) {
  var view = new Uint8Array(byteCount)
  global.crypto.getRandomValues(view)
  var b64encoded = btoa(String.fromCharCode.apply(null, view))
  return b64encoded
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"browserify-unibabel":3}],3:[function(require,module,exports){
'use strict';

function utf8ToBinaryString(str) {
  var escstr = encodeURIComponent(str);
  // replaces any uri escape sequence, such as %0A,
  // with binary escape, such as 0x0A
  var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  });

  return binstr;
}

function utf8ToBuffer(str) {
  var binstr = utf8ToBinaryString(str);
  var buf = binaryStringToBuffer(binstr);
  return buf;
}

function utf8ToBase64(str) {
  var binstr = utf8ToBinaryString(str);
  return btoa(binstr);
}

function binaryStringToUtf8(binstr) {
  var escstr = binstr.replace(/(.)/g, function (m, p) {
    var code = p.charCodeAt(0).toString(16).toUpperCase();
    if (code.length < 2) {
      code = '0' + code;
    }
    return '%' + code;
  });

  return decodeURIComponent(escstr);
}

function bufferToUtf8(buf) {
  var binstr = bufferToBinaryString(buf);

  return binaryStringToUtf8(binstr);
}

function base64ToUtf8(b64) {
  var binstr = atob(b64);

  return binaryStringToUtf8(binstr);
}

function bufferToBinaryString(buf) {
  var binstr = Array.prototype.map.call(buf, function (ch) {
    return String.fromCharCode(ch);
  }).join('');

  return binstr;
}

function bufferToBase64(arr) {
  var binstr = bufferToBinaryString(arr);
  return btoa(binstr);
}

function binaryStringToBuffer(binstr) {
  var buf;

  if ('undefined' !== typeof Uint8Array) {
    buf = new Uint8Array(binstr.length);
  } else {
    buf = [];
  }

  Array.prototype.forEach.call(binstr, function (ch, i) {
    buf[i] = ch.charCodeAt(0);
  });

  return buf;
}

function base64ToBuffer(base64) {
  var binstr = atob(base64);
  var buf = binaryStringToBuffer(binstr);
  return buf;
}

module.exports = {
  utf8ToBinaryString: utf8ToBinaryString
, utf8ToBuffer: utf8ToBuffer
, utf8ToBase64: utf8ToBase64
, binaryStringToUtf8: binaryStringToUtf8
, bufferToUtf8: bufferToUtf8
, base64ToUtf8: base64ToUtf8
, bufferToBinaryString: bufferToBinaryString
, bufferToBase64: bufferToBase64
, binaryStringToBuffer: binaryStringToBuffer
, base64ToBuffer: base64ToBuffer

// compat
, strToUtf8Arr: utf8ToBuffer
, utf8ArrToStr: bufferToUtf8
, arrToBase64: bufferToBase64
, base64ToArr: base64ToBuffer
};

},{}]},{},[1]);
