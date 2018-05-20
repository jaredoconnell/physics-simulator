;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
(function(process){'use strict';

var M = require('./lib');
if (process.env.JSCAS_COVERAGE){
  var dir = './lib-cov';
  M = require(dir);
}

if (typeof window !== 'undefined') {
    var _M = window.M;
    window.M = M;
    M.noConflict = function () {
        window.M = _M;
        return M;
    };
}
if (typeof module !== 'undefined') {
    module.exports = M;
}

})(require("__browserify_process"))
},{"./lib":3,"__browserify_process":1}],3:[function(require,module,exports){
(function(){/*jslint node: true */

// not sure if this is required:
/*jshint sub: true */

"use strict";

var Expression  = require('./Expression'),
    Context     = require('./Context'),
    MathError   = require('./Error'),
    language    = require('./Language/default'),
    Code        = require('./Language').Code,
    Global      = require('./global');

// Define sin, cos, tan, etc.
var defaults    = require('./global/defaults');
defaults.attach(Global);

module.exports = M;

function M(e, c) {
    return language.parse(e, c || Global);
}

M.toString = function() {
    return [
    'function M(expression, context) {',
    '    /*!',
    '     *  Math JavaScript Library v3.9.1',
    '     *  https://github.com/aantthony/javascript-cas',
    '     *  ',
    '     *  Copyright 2010 Anthony Foster. All rights reserved.',
    '     */',
    '    [awesome code]',
    '}'].join('\n');
};

M['Context']    = Context;
M['Expression'] = Expression;
M['Global']     = Global;
M['Error']      = MathError;

Expression.prototype.s = function (lang) {
    Code.language = language;
    Code.newContext();
    return this._s(Code, lang);
};
Expression.prototype.compile = function (x) {
    return this.s('text/javascript').compile(x);
}

var extensions = {};

M['register'] = function (name, installer){
    if(Expression.prototype[name]) {
        throw('Method .' + name + ' is already in use!');
    }
    extensions[name] = installer;
};

M['load'] = function(name, config) {
    extensions[name](M, Expression, config);
    delete extensions[name];
};

})()
},{"./Language/default":4,"./global/defaults":5,"./Context":6,"./Error":7,"./Expression":8,"./global":9,"./Language":10}],7:[function(require,module,exports){
function MathError(str) {
    this.message = str;
}
MathError.prototype = Object.create(Error.prototype);

module.exports = MathError;

},{}],9:[function(require,module,exports){
var context = {};

module.exports = context;

},{}],11:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":12}],12:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":1}],13:[function(require,module,exports){
(function(process){/* parser generated by jison 0.4.17 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,8],$V1=[1,7],$V2=[1,5],$V3=[1,6],$V4=[1,12],$V5=[1,13],$V6=[1,14],$V7=[1,15],$V8=[5,25],$V9=[1,17],$Va=[1,18],$Vb=[1,19],$Vc=[1,20],$Vd=[1,21],$Ve=[1,22],$Vf=[1,23],$Vg=[1,24],$Vh=[1,25],$Vi=[1,26],$Vj=[1,27],$Vk=[5,8,9,10,11,12,13,15,17,18,19,20,21,22,23,24,25,26,27,28,29,30,32,33,36,37,38,39],$Vl=[5,8,9,10,11,12,13,15,18,19,20,21,23,25,26,28],$Vm=[2,26],$Vn=[5,8,9,10,11,12,13,15,18,19,20,25,26,28],$Vo=[15,18];
var parser = {trace: function trace() {
        Jison.print.apply(null, arguments);
    },
yy: {},
symbols_: {"error":2,"expressions":3,"S":4,"EOF":5,"e":6,"stmt":7,"=":8,"!=":9,"<=":10,"<":11,">":12,">=":13,"csl":14,",":15,"vector":16,"(":17,")":18,"+":19,"-":20,"*":21,"%":22,"/":23,"POWER{":24,"}":25,"_{":26,"!":27,"_SINGLE":28,"SQRT{":29,"FRAC{":30,"{":31,"^SINGLEA":32,"^SINGLEP":33,"identifier":34,"number":35,"IDENTIFIER":36,"LONGIDENTIFIER":37,"DECIMAL":38,"INTEGER":39,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"=",9:"!=",10:"<=",11:"<",12:">",13:">=",15:",",17:"(",18:")",19:"+",20:"-",21:"*",22:"%",23:"/",24:"POWER{",25:"}",26:"_{",27:"!",28:"_SINGLE",29:"SQRT{",30:"FRAC{",31:"{",32:"^SINGLEA",33:"^SINGLEP",36:"IDENTIFIER",37:"LONGIDENTIFIER",38:"DECIMAL",39:"INTEGER"},
productions_: [0,[3,2],[4,1],[4,1],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[14,3],[14,3],[16,3],[6,3],[6,3],[6,3],[6,3],[6,3],[6,4],[6,4],[6,2],[6,2],[6,3],[6,6],[6,2],[6,2],[6,2],[6,2],[6,3],[6,1],[6,1],[6,1],[34,1],[34,1],[35,1],[35,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1]; 
break;
case 2: case 3: case 29: case 30: case 31:
this.$ = $$[$0];
break;
case 4:
this.$ = ['=', $$[$0-2], $$[$0]];
break;
case 5:
this.$ = ['!=', $$[$0-2], $$[$0]];
break;
case 6:
this.$ = ['<=', $$[$0-2], $$[$0]];
break;
case 7:
this.$ = ['<', $$[$0-2], $$[$0]];
break;
case 8:
this.$ = ['>', $$[$0-2], $$[$0]];
break;
case 9:
this.$ = ['>=', $$[$0-2], $$[$0]];
break;
case 10:
this.$ = [',.', $$[$0-2], $$[$0]];
break;
case 11:
this.$ = [',', $$[$0-2], $$[$0]];
break;
case 12:
this.$ = $$[$0-1];
break;
case 13:
this.$ = ['+', $$[$0-2], $$[$0]];
break;
case 14:
this.$ = ['-', $$[$0-2], $$[$0]];
break;
case 15:
this.$ = ['*', $$[$0-2], $$[$0]];
break;
case 16:
this.$ = ['%', $$[$0-2], $$[$0]];
break;
case 17:
this.$ = ['/', $$[$0-2], $$[$0]];
break;
case 18:
this.$ = ['^', $$[$0-3], $$[$0-1]];
break;
case 19:
this.$ = ['_', $$[$0-3], $$[$0-1]];
break;
case 20:
this.$ = ['!', $$[$0-1]];
break;
case 21:
this.$ = ['_', $$[$0-1], {type: 'Single', primitive: yytext.substring(1)}];
break;
case 22:
this.$ = ['sqrt', $$[$0-1]];
break;
case 23:
this.$ = ['frac', $$[$0-4], $$[$0-1]];
break;
case 24:
this.$ = ['^', $$[$0-1], yytext.substring(1)];
break;
case 25:
this.$ = ['^', $$[$0-1], {type: 'Single', primitive: yytext.substring(1)}];
break;
case 26:
this.$ = ['@-', $$[$0]]
break;
case 27:
this.$ = ['default', $$[$0-1], $$[$0]];
break;
case 28:
this.$ = $$[$0-1]
break;
case 32:
this.$ = yytext;
break;
case 33:
this.$ = yytext.substring(1);
break;
case 34: case 35:
this.$ = {type: 'Number', primitive: yytext};
break;
}
},
table: [{3:1,4:2,6:3,7:4,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{1:[3]},{5:[1,16]},o($V8,[2,2],{16:9,34:10,35:11,6:28,8:[1,29],9:[1,30],10:[1,31],11:[1,32],12:[1,33],13:[1,34],17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($V8,[2,3]),{6:35,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:36,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:37,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:38,14:39,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},o($Vk,[2,29]),o($Vk,[2,30]),o($Vk,[2,31]),o($Vk,[2,32]),o($Vk,[2,33]),o($Vk,[2,34]),o($Vk,[2,35]),{1:[2,1]},{6:40,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:41,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:42,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:43,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:44,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:45,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{4:46,6:3,7:4,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},o($Vk,[2,20]),o($Vk,[2,21]),o($Vk,[2,24]),o($Vk,[2,25]),o([5,8,9,10,11,12,13,15,18,19,20,21,22,23,25,26,27,28,29,30],[2,27],{16:9,34:10,35:11,6:28,17:$V0,24:$Ve,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),{6:47,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:48,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:49,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:50,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:51,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:52,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:28,16:9,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,25:[1,53],26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{6:28,16:9,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,25:[1,54],26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},o($Vl,$Vm,{16:9,34:10,35:11,6:28,17:$V0,22:$Vc,24:$Ve,27:$Vg,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),{6:28,15:[1,56],16:9,17:$V0,18:[1,55],19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{15:[1,58],18:[1,57]},o($Vn,[2,13],{16:9,34:10,35:11,6:28,17:$V0,21:$Vb,22:$Vc,23:$Vd,24:$Ve,27:$Vg,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($Vn,[2,14],{16:9,34:10,35:11,6:28,17:$V0,21:$Vm,23:$Vm,22:$Vc,24:$Ve,27:$Vg,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($Vl,[2,15],{16:9,34:10,35:11,6:28,17:$V0,22:$Vc,24:$Ve,27:$Vg,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o([5,8,9,10,11,12,13,15,18,19,20,21,23,25,26,27,28,29],[2,16],{16:9,34:10,35:11,6:28,17:$V0,22:$Vc,24:$Ve,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($Vl,[2,17],{16:9,34:10,35:11,6:28,17:$V0,22:$Vc,24:$Ve,27:$Vg,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),{6:28,16:9,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,25:[1,59],26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},{25:[1,60]},o($V8,[2,4],{16:9,34:10,35:11,6:28,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($V8,[2,5],{16:9,34:10,35:11,6:28,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($V8,[2,6],{16:9,34:10,35:11,6:28,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($V8,[2,7],{16:9,34:10,35:11,6:28,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($V8,[2,8],{16:9,34:10,35:11,6:28,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($V8,[2,9],{16:9,34:10,35:11,6:28,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($Vk,[2,22]),{31:[1,61]},o($Vk,[2,28]),{6:62,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},o($Vk,[2,12]),{6:63,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},o($Vk,[2,18]),o($Vk,[2,19]),{6:64,16:9,17:$V0,20:$V1,29:$V2,30:$V3,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},o($Vo,[2,11],{16:9,34:10,35:11,6:28,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),o($Vo,[2,10],{16:9,34:10,35:11,6:28,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,36:$V4,37:$V5,38:$V6,39:$V7}),{6:28,16:9,17:$V0,19:$V9,20:$Va,21:$Vb,22:$Vc,23:$Vd,24:$Ve,25:[1,65],26:$Vf,27:$Vg,28:$Vh,29:$V2,30:$V3,32:$Vi,33:$Vj,34:10,35:11,36:$V4,37:$V5,38:$V6,39:$V7},o($Vk,[2,23])],
defaultActions: {16:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        function _parseError (msg, hash) {
            this.message = msg;
            this.hash = hash;
        }
        _parseError.prototype = Error;

        throw new _parseError(str, hash);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 'TEXT'
break;
case 2:return 17
break;
case 3:return 18
break;
case 4:return 30
break;
case 5:return 29
break;
case 6:return 21
break;
case 7:return 10
break;
case 8:return 13
break;
case 9:return 'NE'
break;
case 10:return 37
break;
case 11:return 36
break;
case 12:return 38
break;
case 13:return 39
break;
case 14:return 8
break;
case 15:return 21
break;
case 16:return 21
break;
case 17:return 23
break;
case 18:return 20
break;
case 19:return 19
break;
case 20:return 10
break;
case 21:return 13
break;
case 22:return 11
break;
case 23:return 12
break;
case 24:return 9
break;
case 25:return '&&'
break;
case 26:return 28
break;
case 27:return 33
break;
case 28:return 32
break;
case 29:return 26
break;
case 30:return 24
break;
case 31:return 27
break;
case 32:return 22
break;
case 33:return 22
break;
case 34:return 15
break;
case 35:return '?'
break;
case 36:return ':'
break;
case 37:return 17
break;
case 38:return 18
break;
case 39:return 31
break;
case 40:return 25
break;
case 41:return '['
break;
case 42:return ']'
break;
case 43:return 5
break;
}
},
rules: [/^(?:\s+)/,/^(?:\$[^\$]*\$)/,/^(?:\\left\()/,/^(?:\\right\))/,/^(?:\\frac\{)/,/^(?:\\sqrt\{)/,/^(?:\\cdo[t])/,/^(?:\\l[e])/,/^(?:\\g[e])/,/^(?:\\n[e])/,/^(?:\\[a-zA-Z]+)/,/^(?:[a-zA-Z])/,/^(?:[0-9]+\.[0-9]*)/,/^(?:[0-9]+)/,/^(?:=)/,/^(?:\*)/,/^(?:\.)/,/^(?:\/)/,/^(?:-)/,/^(?:\+)/,/^(?:<=)/,/^(?:>=)/,/^(?:<)/,/^(?:>)/,/^(?:!=)/,/^(?:&&)/,/^(?:_[^\(\{])/,/^(?:\^[0-9])/,/^(?:\^[^\(\{0-9])/,/^(?:_\{)/,/^(?:\^\{)/,/^(?:!)/,/^(?:%)/,/^(?:\\%)/,/^(?:,)/,/^(?:\?)/,/^(?::)/,/^(?:\()/,/^(?:\))/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
})(require("__browserify_process"))
},{"fs":14,"path":15,"__browserify_process":1}],5:[function(require,module,exports){
(function(){var Expression = require('../Expression');
var util = require('util');

module.exports.attach = function (global) {


    function Derivative(wrt) {
        return new Expression.Function({
            default: function (x) {
                return x.differentiate(wrt);
            }
        })
    }
        

    global['Infinity'] = new Expression.NumericalReal(Infinity, 0);
    global['Infinity'].title = 'Infinity';
    global['Infinity'].description = '';
    global['infty'] = global.Infinity;


    global['Zero'] = new Expression.Integer(0);
    global['Zero'].title = 'Zero';
    global['Zero'].description = 'Additive Identity';
    global['Zero']['*'] = function (x) {
        return global.Zero;
    };
    global['Zero']['+'] = function (x) {
        return x;
    };
    global['Zero']['@-'] = function (x) {
        return this;
    };

    global['Zero']['-'] = function (x) {
        return x['@-']();
    };

    global['One'] = new Expression.Integer(1);
    global['One'].title = 'One';
    global['One'].description = 'Multiplicative Identity';
    global['One']['*'] = function (x) {
        return x;
    };

    function gammln(xx) {
        var j;
        var x, tmp, y, ser;
        var cof = [
             57.1562356658629235,
            -59.5979603554754912,
             14.1360979747417471,
            -0.491913816097620199,
             0.339946499848118887e-4,
             0.465236289270485756e-4,
            -0.983744753048795646e-4,
             0.158088703224912494e-3,
            -0.210264441724104883e-3,
             0.217439618115212643e-3,
            -0.164318106536763890e-3,
             0.844182239838527433e-4,
            -0.261908384015814087e-4,
             0.368991826595316234e-5
        ];
        if (xx <= 0){
            throw(new Error('bad arg in gammln'));
        }
        y = x = xx;
        tmp = x + 5.24218750000000000;
        tmp = (x + 0.5) * Math.log(tmp) - tmp;
        ser = 0.999999999999997092;
        for (j = 0; j < 14; j++){
            ser += cof[j] / ++y;
        }
        return tmp + Math.log(2.5066282746310005 * ser / x);
    }


    var CartSine = new Expression.Function({
        default: function (x) {
            if(x instanceof Expression.NumericalReal
                || x instanceof Expression.List.Real
                || x instanceof Expression.Symbol.Real) {
                return new M.Expression.List.ComplexCartesian([global.sin.default(x), global.Zero]);
            } else {
                throw(new Error('Complex Sine Cartesian form not implemented yet.'));
            }
        }
    });

    global['sin'] = new Expression.Function({
        default: function(x) {
            if(x instanceof Expression.NumericalReal) {
                return new Expression.NumericalReal(Math.sin(x.value));
            }
            if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
                return Expression.List.Real([global.sin, x]);
            }
            return Expression.List([global.sin, x]);
            
            /*
                    // sin(a+bi) = sin(a)cosh(b) + i cos(a)sinh(b)
                    var exp_b = Math.exp(x._imag);
                    var cosh_b = (exp_b + 1 / exp_b) / 2;
                    var sinh_b = (exp_b - 1 / exp_b) / 2;
                    return new Expression.ComplexNumerical(Math.sin(x._real) * cosh_b, Math.cos(x._real) * sinh_b);
            */
        },
        realimag: function () {
            return CartSine;
        },
        'text/latex': '\\sin',
        'text/javascript': 'Math.sin',
        'x-shader/x-fragment': 'sin',
        title: 'Sine Function',
        description: 'See http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent',
        examples: ['\\sin (\\pi)'],
        related: ['cos', 'tan']
    });
    global['cos'] = new Expression.Function({
        default: function(x) {
            if(x instanceof Expression.NumericalReal) {
                return new Expression.NumericalReal(Math.cos(x.value));
            }
            if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
                return Expression.List.Real([global.cos, x]);
            }
            return Expression.List([global.cos, x]);
            
        },
        derivative: global.sin['@-'](),
        'text/latex': '\\cos',
        'text/javascript': 'Math.cos',
        'x-shader/x-fragment': 'cos',
        title: 'Cosine Function',
        description: 'Cosine Function desc',
        examples: ['\\cos (\\pi)'],
        related: ['sin', 'tan']
    });

    global.sin.derivative = global.cos;

    global['sec'] = (function () {
        var s = new Expression.Symbol.Real();
        var y = global['One']['/'](global['cos'].default(s));
        return new Expression.Function.Symbolic(y, [s]);
    }());

    global['tan'] = new Expression.Function({
        default: function(x) {
            if(x instanceof Expression.NumericalReal) {
                return new Expression.NumericalReal(Math.tan(x.value));
            }
            if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
                return Expression.List.Real([global.tan, x]);
            }
            return Expression.List([global.tan, x]);
            
        },
        derivative: global.sec['^'](new Expression.Integer(2)),
        'text/latex': '\\tan',
        'text/javascript': 'Math.tan',
        'x-shader/x-fragment': 'tan',
        title: 'Tangent Function',
        description: 'Tangent Function desc',
        examples: ['\\tan(\\pi/3)', '\\tan (\\pi/2)'],
        related: ['sin', 'cos']
    });

    global['csc'] = global['cosec'] = (function () {
        var s = new Expression.Symbol.Real();
        var y = global['One']['/'](global['sin'].default(s));
        return new Expression.Function.Symbolic(y, [s]);
    }());

    global['log'] = new Expression.Function({
        default: function (x, assumptions) {

            if(x instanceof Expression.Integer && x.a === 1) {
                return global.Zero;
            } else if(x instanceof Expression.Integer && x.a === 0) {
                return global.Infinity['@-']();
            } else if(x instanceof Expression.NumericalReal) {
                var v = x.value;
                if(v > 0){
                    return new Expression.NumericalReal(Math.log(v));
                }
            }

            if(assumptions && assumptions.positive) {
                return Expression.List.Real([global.log, x]);
            }
            
            return Expression.List([global.log, x]);
        },
        realimag: function (x) {
            return CartLog;
        },
        'text/latex': '\\log',
        'text/javascript': 'Math.log',
        'x-shader/x-fragment': 'log',
        title: 'Natural Logarithm',
        description: 'Base e. See http://en.wikipedia.org/wiki/Natural_logarithm',
        examples: ['\\log (ye^(2x))'],
        related: ['exp', 'Log']
    });
    var Half = new Expression.Rational(1, 2);
    var CartLog = new Expression.Function({
        default: function (x) {
            return new Expression.List.ComplexCartesian([
                global.log.default(x.abs()),
                x.arg()
            ])['*'](Half);
        }
    });
    CartLog.__proto__ = global.log;
    global['atan2'] = new Expression.Function({
        default: function(x) {
            if(! (x instanceof Expression.Vector)) {
                throw ('atan only takes vector arguments');
            }
            if(x[0] instanceof Expression.NumericalReal) {
                if(x[1] instanceof Expression.NumericalReal) {
                    return new Expression.NumericalReal(Math.atan2(x[0].value, x[1].value));
                }
            }
            
            return new Expression.List.Real([global.atan2, x]);
            
            return Expression.List([global.atan2, x]);
        },
        apply_realimag: function(op, x) {
            //TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
            return [Expression.List([global.atan2, x]), M.global.Zero];
        },
        'text/latex': '\\tan^{-1}',
        'text/javascript': 'Math.atan2',
        'x-shader/x-fragment': 'atan',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        title: 'Two argument arctangent function',
        description: 'Arctan(y, x). Will equal arctan(y / x) except when x and y are both negative. See http://en.wikipedia.org/wiki/Atan2'
    });

    global['factorial'] = new Expression.Function({
        default: function (x) {
            return global.Gamma.default(x['+'](global.One));
        },
        'text/latex': '\\factorial'
    });

    global['atan'] = global.atan2;

    global['Gamma'] = new Expression.Function({
        default: function(x){
            if (x instanceof Expression.Integer) {
                var v = x.a;
                if(v < 0) {
                    return global.ComplexInfinity;
                }
                if(v < 15) {
                    var p = 1;
                    var i = 0;
                    for(i = 1; i < v; i++) {
                        p *= i;
                    }
                    return new Expression.Integer(p);
                }
                return Expression.List.Real([global.Gamma, x]);
            } else if (x instanceof Expression.NumericalReal) {
                var v = x.value;
                if (v === 0) {
                    return global.Infinity;
                } else if(v < 0) {
                    return new Expression.NumericalReal(-Math.PI / (v * Math.sin(Math.PI * v) * Math.exp(gammln(-v))));
                }
                return new Expression.NumericalReal(Math.exp(gammln(v)));
            } else if(x instanceof Expression.NumericalComplex) {
                
            }
            return Expression.List([global.Gamma, x]);
        },
        'text/latex': '\\Gamma',
        'text/javascript': gammln,
        'x-shader/x-fragment': function () {

        },
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        title: 'Gamma Function',
        description: 'See http://en.wikipedia.org/wiki/Gamma_function',
        examples: ['\\Gamma (x)', 'x!'],
        related: ['Log', 'LogGamma']
    });

    global['Re'] = new Expression.Function({
        default: function(x) {
            return x.real();
        },
        apply_realimag: function(op, x) {
            return [x.real(), global.Zero];
        },
        'text/latex': '\\Re'
    });

    global['Im'] = new Expression.Function({
        default: function(x) {
            return x.imag();
        },
        distributed_under_differentiation: true,
        apply_realimag: function(op, x) {
            return [x.imag(), global.Zero];
        },
        'text/latex': '\\Im'
    });

    function FiniteSet(elements) {
        this.elements = elements || [];
    }
    FiniteSet.prototype.intersect = function (x) {
        var res = [];
        for(var i = 0; i < this.elements.length; i++) {
            if (x.elements.indexOf(this.elements[i]) !== -1) {
                res.push(this.elements[i]);
            }
        }
        return new FiniteSet(res);
    };
    FiniteSet.prototype.enumerate = function (n, fn) {
        this.elements = [];
        for(var i = 0; i < n; i++) {
            this.elements[i] = null;
        }
        if (fn) {
            this.map(fn);
        }
    };
    FiniteSet.prototype.map = function (fn) {
        for(var i = 0, l = this.elements.length; i < l; i++) {
            this.elements[i] = new fn(this.elements[i], i);
        }
        return this;
    };
    FiniteSet.prototype.subset = function (x) {
        for(var i = 0, l = this.elements.length; i < l; i++) {
            if (x.elements.indexOf(this.elements[i]) === -1) {
                return false;
            }
        }
        return false;
    };
    FiniteSet.prototype.psubset = function (x) {
        return (this.elements.length < x.elements.length) && this.subset(x);
    };
    FiniteSet.prototype.supset = function (x) {
        return x.subset(this);
    };

    FiniteSet.prototype.equals = function (x) {
        if (!this.elements.length !== x.elements.length) return false;

        for(var i = 0, l = this.elements.length; i < l; i++) {
            if (this.elements[i] !== x.elements[i]) return false;
        }

        return true;
    }

    util.inherits(ModuloGroup, FiniteSet);
    function ModuloGroup(n, operator) {
        FiniteSet.call(this);

        operator = operator || 'default';

        function Element(_, n) {
            this.n = n;
        }

        Element.prototype[operator]
        = Element.prototype.default
        = function (x) {
            return new Element((this.n + x.n) % n);
        };
        
        this.enumerate(n, Element);

        this.prototype = Element.prototype;

    };

    util.inherits(MultiValue, FiniteSet);

    function MultiValue(elements) {
        FiniteSet.call(this, elements);
    }


    MultiValue.prototype.default = function (x) {
        this.operator('default', x);
    };

    MultiValue.prototype['+'] = function (x) {
        this.operator('+', x);
    };

    MultiValue.prototype['*'] = function (x) {
        this.operator('*', x);
    };

    MultiValue.prototype.operator = function (operator, x) {

        if (x instanceof MultiValue) {
            var res = [];
            for(var i = 0; i < this.elements.length; i++) {
                for(var j = 0; j < x.elements.length; j++) {
                    var n = this.elements[i][operator](j);
                    res.push(n);
                }
            }

            return new MultiValue(res);
        } else {
            return this.map(function (a) {
                return a[operator](x);
            });
        }
    };


    function quadrant(x) {
        if (x instanceof Expression.NumericalReal) {
            return x.value > 0 ? '+' : '-';
        }
        if (x instanceof Expression.Symbol.Real) {
            return '+-';
        }
        if (x instanceof Expression.List.Real) {
            if (x.operator === '^') {
                var q0 = quadrant(x[0]);
                var n = x[1].value;

                if (q0 === '+') return '+';
                if (q0 === '-' || q0 === '+-') return n % 2 === 0 ? '+' : '-';

                return '+-';
            }
            var q = [].map.call(x, quadrant);

            if (q[0] === '+-' || q[1] === '+-') return '+-';

            switch (x.operator) {
                case '-':
                    if (q[1] === '-') q[1] = '+';
                    if (q[1] === '+') q[1] = '-';

                case '+': return q[0] === q[1] ? q[0] : '+-';


                case '/':
                case '*': return q[0] === q[1] ? '+' : '-';


            }
        }
    }

    function isPositive(x) {
        var s = quadrant(x);
        return s === '+';
    }

    global['sqrt'] = new Expression.Function({
        default: function (x) {

            if (x instanceof Expression.NumericalReal) {
                var v = x.value;
                var sqrtMagX = Math.sqrt(v)
                if(v < 0) {
                    return new Expression.List.ComplexCartesian([
                        global.Zero, new Expression.NumericalReal(sqrtMagX)
                    ]);
                }
                return new Expression.NumericalReal(sqrtMagX);

            } else if (x instanceof Expression.List.ComplexPolar) {
                return new Expression.List.ComplexPolar([
                    x[0],
                    x[1]['/'](new Expression.Integer(2))
                ]);
            } else if (x instanceof Expression.List) {
                var pos = isPositive(x);

                // if it is positive
                if (pos === '+') {
                    return Expression.List.Real([global.sqrt, x]);
                    
                } else {
                    return Expression.List([global.sqrt, x]);
                }

            } else if (x instanceof Expression.List.ComplexCartesian) {
                return new Expression.List([global.sqrt, x]);
            }

            return Expression.List([global.sqrt, x]);

            throw('SQRT: ???');
            switch (x.constructor) {
                case Expression.Complex:
                    //http://www.mathpropress.com/stan/bibliography/complexSquareRoot.pdf
                    var sgn_b;
                    if (x._imag === 0.0) {
                        return new Expression.Complex(Math.sqrt(x._real), 0);
                    } else if(x._imag>0) {
                        sgn_b = 1.0;
                    } else {
                        sgn_b = -1.0;
                    }
                    var s_a2_b2 = Math.sqrt(x._real * x._real + x._imag * x._imag);
                    var p = one_on_rt2 * Math.sqrt(s_a2_b2 + x._real);
                    var q = sgn_b * one_on_rt2 * Math.sqrt(s_a2_b2 - x._real);
                case Expression.NumericalReal:
                    return new Expression.RealNumerical(Math.sqrt(x));
                case Expression.List.Real:
                case Expression.List:
                    if (x.operator === '^') {
                        return global.abs.apply(undefined, x[0].apply('^', x[1].apply('/', new Expression.NumericalReal(2,0))));
                    }
                default:
                    return Expression.List([global.sqrt, x]);
            }
        },
        apply_realimag: function(op, x) {
            //TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
            
            //Uses exp, atan2 and log functions. A really bad idea. (square rooting, then squaring, then atan, also [exp(log)])
            return x['^'](new Expression.Rational(1, 2)).realimag();
            //var ri = x.realimag();
            //return [Expression.List([global.sqrt, x]), M.global.Zero];
        },
        'text/latex': '\\sqrt',
        'text/javascript': 'Math.sqrt',
        'x-shader/x-fragment': 'sqrt',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        title: 'Sqrt Function',
        description: 'See http://en.wikipedia.org/wiki/Square_Root',
        examples: ['\\sqrt (x^4)'],
        related: ['pow', 'abs', 'mod']
    });
    global['abs'] = new Expression.Function({
        default: function (x) {
            //Using abs is better (I think) because it finds the method through the prototype chain,
            //which is going to be faster than doing an if list / switch case list.
            return x.abs();
        },
        'text/latex': '\\abs',
        'text/javascript': 'Math.abs',
        'x-shader/x-fragment': 'abs',
        titie: 'Absolute Value Function',
        description: 'Abs',
        examples: ['\\abs (-3)', '\\abs (i+3)'],
        related: ['arg', 'tan']
    });

    // It is self-referential
    global.abs.derivative = (function () {
            var s = new Expression.Symbol.Real();
            var y = s['/'](s.abs());
            return new Expression.Function.Symbolic(y, [s]);
    }());
    global['arg'] = {
        default: function (x) {
            console.warn('ARG IS FOR USER INPUT ONLY. USE .arg()');
            //Using abs is better (I think) because it finds the method through the prototype chain,
            //which is going to be faster than doing an if list / switch case list. TODO: Check the truthfullnes of this!
            return x.arg();
        },
        'text/latex': '\\arg', //temp
        'text/javascript': 'Math.arg_real',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        titie: 'Arg Function',
        description: 'Arg',
        examples: ['\\arg (-3)', '\\arg (3)', '\\arg(3+2i)'],
        related: ['abs']
    }



    global['e'] = new Expression.NumericalReal(Math.E, 0);
    global['e'].title = 'e';
    global['e'].description = 'The transcendental number that is the base of the natural logarithm, approximately equal to 2.71828.';
    global.e.s = function (lang) {
        if(lang === 'text/javascript') {
            return new Code('Math.E');
        }
        if(lang == 'text/latex') {
            return new Code('e');
        }
        return new Code('2.718281828459045');
    };


    global['pi'] = new Expression.NumericalReal(Math.PI, 0);
    global['pi'].title = 'Pi';
    global['pi'].description = '';
    global.pi.s = function (lang) {
        if(lang === 'text/javascript') {
            return new Code('Math.PI');
        }
        if(lang === 'text/latex') {
            return new Code('\\pi');
        }
        return new Code('3.141592653589793');
    };
    // The real circle constant:
    global.tau = global['pi']['*'](new Expression.Integer(2));


    global.log.derivative = new Expression.Function.Symbolic(global.One['/'](new Expression.Symbol.Real()));

    global['i'] = new Expression.List.ComplexCartesian([global['Zero'], global['One']]);
    global['i'].title = 'Imaginary Unit';
    global['i'].description = 'A number which satisfies the property <m>i^2 = -1</m>.';
    global['i'].realimag = function(){
        return Expression.List.ComplexCartesian([
            global.Zero,
            global.One
        ]);
    };
    global['i']['*[TODO]'] = function (x) {
        
    };

    global['d'] = new Expression.Function({
        default: function(x) {
            return new Expression.Infinitesimal(x);
        }
    });

    global.d['/'] = function (x) {
        if(x instanceof Expression.Infinitesimal) {
            if(x.x instanceof Expression.Symbol) {
        
                // Derivative operator
                
                return new Derivative(x.x);
            }
            if(x.x instanceof Expression.Vector) {
                return Expression.Vector(Array.prototype.map.call(x.x, function (x) {
                    return new Derivative(x);
                }));
            }
            throw new Error('Confusing infitesimal operator division');
        }

        throw('Dividing d by some large number.');
        
    };
    global['undefined'] = {
        s: function (lang){
            if (lang === 'text/javascript') {
                return new Code('undefined');
            } else if (lang === 'x-shader/x-fragment') {
                return new Code('(1.0/0.0)');
            }
        },
        differentiate: function (){
            return this;
        },
        '*': function (){
            return this;
        },
        '+': function (){
            return this;
        },
        '-': function () {
            return this;
        },
        '/': function () {
            return this;
        },
        '^': function () {
            return this;
        },
        '@-': function () {
            return this;
        }
    };
    global['sum'] = new Expression.Function({
        default: function (x) {
            throw('Sum not properly constructed yet.');
            return 3;
        }
    });
    global['sum']['_'] = function (eq) {
        // start: 
        var t = eq[0];
        var v = eq[1];
        return new Expression.Sum.Real(t, v);
    }
    
};
})()
},{"util":11,"../Expression":8}],10:[function(require,module,exports){
var util = require('util');

function Language(parser, Construct, language) {
    this.cfg = parser;
    this.Construct = Construct;
    var operators = this.operators = {},
        opPrecedence = 0;
    function op(v, associativity, arity) {

    }
    language.forEach(function (o) {
        function defop(str, o) {
            var associativity = o[1] || 0;
            var arity = (o[2] === undefined) ? 2 : o[2];

            operators[str] =  {
                associativity: associativity,
                precedence: opPrecedence++,
                arity: arity
            };
        }
        var str = o[0];
        if (typeof str === 'string') {
            defop(str, o);
        } else {
            str.forEach(function (s) {
                defop(s, o);
            });
        }
    });
}

Language.Code = require('./Code');

var _        = Language.prototype;

_.parse      = require('./parse');
_.stringify  = require('./stringify');

_.postfix = function (str) {
    var operator = this.operators[str];
    return  operator.associativity === 0 && 
            operator.arity === 1;
};

_.unary = function (str) {
    var unary_secondarys = ['+', '-', '±'];
    return (unary_secondarys.indexOf(o) !== -1) ? ('@' + o) : false;
};

_.associative = function (str) {
    return this.operators[str].associativity === 0;
};



module.exports = Language;

},{"util":11,"./parse":16,"./Code":17,"./stringify":18}],4:[function(require,module,exports){
(function(){var Language = require('./');

var Expression = require('../Expression'),
    Global     = require('../global');

var crossProduct = String.fromCharCode(215); // &times; character

// Built by Jison:
var parser = require('../../grammar/parser.js');

parser.parseError = function (str, hash) {
    // {
    //     text: this.lexer.match,
    //     token: this.terminals_[symbol] || symbol,
    //     line: this.lexer.yylineno,
    //     loc: yyloc,
    //     expected:
    //     expected
    // }
    var er = new SyntaxError(str);
    er.line = hash.line;
    throw er;
};


var left = -1, right = +1;
var L = left;
var R = right;



var language = module.exports = new Language(parser, {
        Number: function (str) {
            if (str === '1') {
                return Global.One;
            } else if (str === '0') {
                return Global.Zero;
            }

            if (/^\d+$/.test(str)) {
                return new Expression.Integer(Number(str));
            }
            if (/^[\d]*\.[\d]+$/.test(str)) {
                var decimalPlace = str.indexOf('.');
                // 12.345 -> 12345 / 1000
                // 00.5 -> 5/10
                var denom_p = str.length - decimalPlace - 1;
                var d = Math.pow(10, denom_p);
                var n = Number(str.replace('.', ''));
                
                return new Expression.Rational(n, d).reduce();
            }
            return new Expression.NumericalReal(Number(str));
        },
        String: function (str) {
            return str;
        },
        Single: function (str) {
            // Single latex chars for x^3, x^y etc (NOT x^{abc})
            if (!isNaN(str)) {
                return new Expression.Integer(Number(str));
            }
            
            return new Expression.Symbol.Real(str);
        }
    },
    [
    [';'],          /*L / R makes no difference???!??!? */
    [','],
    [['=', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|='],R],
    [['?',':'],R,2],
    [['∨']],
    [['&&']],
    [['|']],
    [['??????']],//XOR
    [['&']],
    [['==', '≠', '!==', '===']],
    [['<', '<=', '>', '>='],L],
    [['>>', '<<']],
    ['±', R, 2],
    [['+'], true],
    [['-'], L],
    [['∫', '∑'], R, 1],
    [['%']],
    [['*']],
    [crossProduct, R],
    [['@+', '@-', '@±'], R, 1], //unary plus/minus
    [['¬'], L, 1],
    ['default', 0, 2], //I changed this to R for 5sin(t)
    ['∘', 0, 2],
    [['/']],
    [['^']],//e**x
    ['!', L, 1],
    [['~'], R, 1], //bitwise negation
    [['++', '++', '.', '->'],L,1],
    [['::']],
    [['_'], L, 2],
    ['var', R, 1],
    ['break', R, 0],
    ['throw', R, 1],
    ['\'', L, 1],
    ['\u221A', R, 1], // Sqrt
    ['#', R, 1] /*anonymous function*/
]);

/*
 Language spec columns in order of _increasing precedence_:
 * operator string representation(s). These are different operators, but share all properties.
 * Associativity
 * Operand count (Must be a fixed number) 
 * (TODO??) commute group? - or should this be derived?
 * (TODO?) associative? commutative?  - Should be calculated?
 * (TODO?) Identity?
*/

// var mathematica = new Language([
//     [';'],
//     [','],
//     [['=', '+=']]
// ]);

})()
},{"../../grammar/parser.js":13,"../Expression":8,"./":10,"../global":9}],6:[function(require,module,exports){
(function(){var util    = require('util');
var Global  = require('../global');

module.exports = Context;

util.inherits(Context, {prototype: Global});

function Context() {

}

Context.prototype.reset = function () {
    this.splice(0);
};

})()
},{"util":11,"../global":9}],8:[function(require,module,exports){
(function(){var Global = require('../global');

function Expression() {
    
}

module.exports = Expression;

Expression.List                   = require('./List');
Expression.List.Real              = require('./List/Real');
Expression.List.ComplexCartesian  = require('./List/ComplexCartesian');
Expression.List.ComplexPolar      = require('./List/ComplexPolar');
Expression.Constant               = require('./Constant');
Expression.NumericalComplex       = require('./NumericalComplex');
Expression.NumericalReal          = require('./NumericalReal');
Expression.Rational               = require('./Rational');
Expression.Integer                = require('./Integer');
Expression.Symbol                 = require('./Symbol');
Expression.Symbol.Real            = require('./Symbol/Real');
Expression.Statement              = require('./Statement');
Expression.Vector                 = require('./Vector');
Expression.Matrix                 = require('./Matrix');
Expression.Function               = require('./Function');
Expression.Function.Symbolic      = require('./Function/Symbolic');
Expression.Infinitesimal          = require('./Infinitesimal');

var _ = Expression.prototype;

_.toString = null;
_.valueOf = null;

_.imageURL = function () {
    return 'http://latex.codecogs.com/gif.latex?' +
        encodeURIComponent(this.s('text/latex').s);
};

_.renderLaTeX = function () {
    var image = new Image();
    image.src = this.imageURL();
    return image;
};

// substution default:
_.sub = function () {
    return this;
};

// limit default
_.lim = function (x, y) {
    return this.sub(x, y);
};

_[','] = function (x) {
    if(x instanceof Expression.Statement) {
        return new Expression.Conditional(x, this);
    }
    return Expression.Vector([this, x]);
};


['=', '!=', '>', '>=', '<', '<='].forEach(function (operator) {
    _[operator] = function (x) {
        return new Expression.Statement(this, x, operator);
    };
});



// crossProduct is the '&times;' character
var crossProduct = String.fromCharCode(215);

_[crossProduct] = function (x) {
    return this['*'](x);
};


// The default operator occurs when two expressions are adjacent to eachother: S -> e e.
// Depending on the type, it usually represents associative multiplication.
// See below for the default '*' operator implementation.
_.default = function (x) {
    return this['*'](x);
};

['/', '+', '-', '@-', '^', '%'].forEach(function (operator) {
    _[operator] = function (x) {
        return new Expression.List([this, x], operator);
    };
});




// This may look like we are assuming that x is a number,
// but really the important assumption is simply
// that it is finite.
// Thus infinities and indeterminates should ALWAYS
// override this operator

_['*'] = function (x) {
    if(x === Global.Zero) {
        return x;
    }
    if(x === Global.One) {
        return this;
    }
    return new Expression.List([this, x], '*');
};











})()
},{"./Constant":19,"./NumericalComplex":20,"./NumericalReal":21,"./Integer":22,"./Rational":23,"./List/Real":24,"../global":9,"./List/ComplexCartesian":25,"./List/ComplexPolar":26,"./List":27,"./Statement":28,"./Symbol":29,"./Function":30,"./Vector":31,"./Symbol/Real":32,"./Function/Symbolic":33,"./Matrix":34,"./Infinitesimal":35}],14:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],15:[function(require,module,exports){
(function(process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

})(require("__browserify_process"))
},{"__browserify_process":1}],17:[function(require,module,exports){
(function(){// stop jshint from complaing about Function (which it calls eval)
/*jshint -W061 */

module.exports = Code;

function Code(s, pre){
    this.pre = [] || pre;
    this.s = '' || s;
    this.vars = 0;
    this.p = Infinity;
}

var _ = Code.prototype;

/*
    This uses a global state.

    Perhaps there is a nicer way, but this will work.
*/
Code.newContext = function () {
    Code.contextVariableCount = 0;
};

Code.newContext();

// For faster evaluation multiple statments. For example (x+3)^2 will first calculate x+3, and so on.
_.variable = function () {
    return 't' + (Code.contextVariableCount++).toString(36);
};

_.merge = function (o, str, p, pre) {
    this.s = str;
    if (pre) {
        this.pre.push(pre);
    }
    var i;
    this.pre.push.apply(this.pre, o.pre);
    this.vars += o.vars;
    this.p = p;
    return this;
};

_.update = function (str, p, pre) {
    this.p = p;
    if(pre) {
        this.pre.push(pre);
    }
    this.s = str;
    return this;
};

// Javascript compliation
_.compile = function (x) {
    return Function(x, this.pre.join('\n') + 'return ' + this.s);
};

_.glslFunction = function (type, name, parameters) {
    return type + ' ' + name + '(' + parameters + '){\n' + this.pre.join('\n') + 'return ' + this.s + ';\n}\n';
};


})()
},{}],18:[function(require,module,exports){
module.exports = function stringify(expr, lang) {
    return expr.s(lang);
};

},{}],20:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./Constant');
var Global = require('../global');

module.exports = NumericalComplex;

util.inherits(NumericalComplex, sup);

function NumericalComplex(real, imag) {
    this._real = real;
    this._imag = imag;
}

var _ = NumericalComplex.prototype;

_.real = function() {
    return new Expression.NumericalReal(this._real);
};

_.imag = function() {
    return new Expression.NumericalReal(this._imag);
};

_.realimag = function() {
    return Expression.List.ComplexCartesian([
        new Expression.NumericalReal(this._real),
        new Expression.NumericalReal(this._imag)
    ]);
};

_.conjugate = function() {
    return new Expression.NumericalComplex(this._real, -this._imag);
};

_['+'] = function (x) {
    if(this._real === 0 && this._imag === 0) {
        return x;
    }
    if(x instanceof Expression.NumericalComplex){
        return new Expression.NumericalComplex(this._real + x._real, this._imag + x._imag);
    } else if (x instanceof Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real + x.value, this._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        throw ('Unknown Type for NumericalComplex +');
    }
};

_['-'] = function (x) {
    if(this._real === 0 && this._imag === 0) {
        return x['@-']();
    }
    if(x instanceof Expression.NumericalComplex){
        return new Expression.NumericalComplex(this._real - x._real, this._imag - x._imag);
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real - x.value, this._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x['@-']())['+'](this);
    } else {
        throw ('Unknown Type for NumericalComplex -');
    }
};

_['*'] = function (x) {
    if(this._imag === 0) {
        if(this._real === 0) {
            return Global.Zero;
        }
        if(this._real === 1) {
            return x;
        }
    }
    
    if(x.constructor === this.constructor){
        return new Expression.NumericalComplex(this._real * x._real - this._imag * x._imag, this._real * x._imag + this._imag * x._real);
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real * x.value, this._imag * x.value);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return (x)['*'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['*'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['*'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['*'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['*'](this);
    } else {
        throw ('Unknown Type for NumericalComplex *');
    }
};

_['/'] = function (x) {
    if(this._imag === 0 && this._real === 0) {
        // TODO: Provided x != 0
        return Global.Zero;
    }
    
    if(x.constructor === this.constructor){
        var cc_dd = x._real * x._real + x._imag * x._imag;
        return new Expression.NumericalComplex((this._real * x._real + this._imag * x._imag)/cc_dd, (this._imag * x._real - this._real * x._imag) / cc_dd);
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real / x.value, this._imag / x.value);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return this.realimag()['/'](x);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return this.polar()['/'](x);
    } else if(x.constructor === Expression.List.Real) {
        return Expression.List([this, x], '/');
    } else if(x.constructor === Expression.Symbol.Real) {
        return Expression.List([this, x], '/');
    } else if(x.constructor === Expression.List) {
        return Expression.List([this, x], '/');
    } else {
        throw ('Unknown Type for NumericalComplex /');
    }
};

_['!'] = function (){
    return Global.Gamma.apply(this);
};

// (function(){
//     return;
//     var one_on_rt2 = 1/Math.sqrt(2);
//     Expression.NumericalComplex.prototype.apply = function(operator, x) {
//         switch (operator){
//             case '^':
//                 if(this._real === 0 && this._imag === 0) {
//                     return Global.Zero; // Contradicts x^0 = 1
//                 }
//                 break;
//             case '+':
//                 if(this._real === 0 && this._imag === 0) {
//                     return x;
//                 }
//                 break;
//             case '-':
//                 if(this.value === 0) {
//                     return x.apply('@-');
//                 }
//                 break;
//             case undefined:
//             case '*':
//                 if(this._real === 1 && this._imag === 0){
//                     return x;
//                 }
//                 //Note: There is not meant to be a break here.
//             case '/':
//                 if(this._real === 0 && this._imag === 0){
//                     return Global.Zero; //Contradics x/0 = Infinity
//                 }
//         }
//         if (operator === ',') {
//             return Expression.Vector([this, x]);
//         } else if (x === undefined) {
//             switch (operator) {
                
//                 case '@+':
//                     return this;
//                 case '@-':
//                     return new Expression.NumericalComplex(-this._real, -this._imag);
//                 case '\u221A':
//                     throw('OLD SQRT. New one is a function, not operator.')
//                     return new Expression.NumericalComplex(p, q);
//                 case '++':
//                 case '--':
//                     throw(new TypeError('Postfix ' +operator + ' operator applied to value that is not a reference.'));
//                 case '+=':
//                 case '-=':
//                 case '*=':
//                 case '/=':
//                     throw(new ReferenceError('Left side of assignment is not a reference.'));
//                 case '!':
//                     return Global.Gamma.apply(undefined, new Expression.NumericalComplex(this._real + 1, this._imag));
//             }
//         } else if (x.constructor === Expression.NumericalReal) {
//             switch (operator) {
//                 case '*':
//                 case undefined:
//                     return new Expression.NumericalComplex(this._real * x.value, this._imag * x.value);
//                 case '+':
//                     return new Expression.NumericalComplex(this._real + x.value, this._imag);
//                 case '-':
//                     return new Expression.NumericalComplex(this._real - x.value, this._imag);
//                 case '/':
//                     return new Expression.NumericalComplex(this._real / x.value, this._imag / x.value);
//                 case '^':
//                     var a = this._real;
//                     var b = this._imag;
//                     var c = x.value;

//                     var hlm = 0.5 * Math.log(a*a + b*b);
//                     var theta = Math.atan2(b, a);
//                     var hmld_tc = theta * c;
//                     var e_hmlc_td = Math.exp(hlm * c);
//                     return new Expression.NumericalComplex(
//                         (e_hmlc_td * Math.cos(hmld_tc)),
//                         (e_hmlc_td * Math.sin(hmld_tc))
//                     );
//                 default:
//             }
//         } else if (x.constructor === this.constructor) {
//             switch (operator) {
//                 case '*':
//                 case undefined:
//                     // (a+bi)(c+di) = (ac-bd) + (ad+bc)i 
//                     return new Expression.NumericalComplex(this._real * x._real - this._imag * x._imag, this._real * x._imag + this._imag * x._real);
//                 case '+':
//                     return new Expression.NumericalComplex(this._real + x._real, this._imag + x._imag);
//                 case '-':
//                     return new Expression.NumericalComplex(this._real - x._real, this._imag - x._imag);
//                 case '/':
//                     //  (a+bi)/(c+di) 
//                     //= [(a+bi)(c-di)]/[(c+di)(c-di)]
//                     //= [(a+bi)(c-di)]/[cc + dd]
//                     //= [ac -dai +bci + bd]/[cc+dd]
//                     //= [ac + bd + (bc - da)]/[cc+dd]
//                     var cc_dd = x._real * x._real + x._imag * x._imag;
//                     return new Expression.NumericalComplex((this._real * x._real + this._imag * x._imag)/cc_dd, (this._imag * x._real - this._real*x._imag)/cc_dd);
//                 case '^':
//                     var a = this._real;
//                     var b = this._imag;
//                     var c = x._real;
//                     var d = x._imag;

//                     var hlm = 0.5 * Math.log(a*a + b*b);
//                     var theta = Math.atan2(b, a);
//                     var hmld_tc = hlm * d + theta * c;
//                     var e_hmlc_td = Math.exp(hlm * c - theta * d);
//                     return new Expression.NumericalComplex(
//                         (e_hmlc_td * Math.cos(hmld_tc)),
//                         (e_hmlc_td * Math.sin(hmld_tc))
//                     );
//                 default:
//             }
//         } else if(x.constructor === Expression.List.ComplexCartesian) {
//             return this.realimag().apply(operator, x);
//         } else if(x.constructor === Expression.List.ComplexPolar) {
//             return this.polar().apply(operator, x);
//         } else if(x.constructor === Expression.List.Real) {
//             return this.realimag().apply(operator, x);
//         } else if(x.constructor === Expression.Symbol.Real) {
//             return this.realimag().apply(operator, x);
//         }
//         console.error('cmplx . ' + operator + ' => E.List?');
//         /*
//         if(this._real === 0.0 && this._imag === 0.0){
//             return this;
//         }
//         */
        
        
//         return this.realimag().apply(operator, x);
//         return Expression.List([this, x], operator);
//     }
    
// }());

})()
},{"util":11,"./Constant":19,"../global":9}],21:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./NumericalComplex');
var Global = require('../global');
var Expression = require('./');
module.exports = NumericalReal;

util.inherits(NumericalReal, sup);

function NumericalReal(e) {
    this.value = e;
}

var _ = NumericalReal.prototype;

Object.defineProperty(_, "_real", {
    get: function () {
        return this.value;
    }
});
_._imag = 0;

_.real = function() {
    return this;
};
_.imag = function() {
    return Global.Zero;
};
_.realimag = function() {
    return Expression.List.ComplexCartesian([
        this,
        Global.Zero
    ]);
};
_.conjugate = function() {
    return this;
};

_['+'] = function (x) {
    if(this.value === 0) {
        return x;
    }
    if(x instanceof NumericalReal){
        return new NumericalReal(this.value + x.value);
    }
    return x['+'](this);
};

_['@-'] = function (x) {
    return new NumericalReal(-this.value);
};

_['-'] = function (x) {
    if(this.value === 0) {
        return x;
    }
    if(x instanceof NumericalReal) {
        return new NumericalReal(this.value - x.value);
    }
    return x['@-']()['+'](this);
};


_['%'] = function (x) {
    var nonreal = 'The modular arithmetic operator \'%\' is not defined for non-real numbers.';
    if(this.value === 0) {
        return Global.Zero;
    }
    if(x instanceof NumericalReal){
        return new NumericalReal(this.value % x.value);
    } else if(x.constructor === Expression.List.Real) {
        return Expression.List.Real([this, x], '%');
    } else if(x.constructor === Expression.Symbol.Real) {
        return Expression.List.Real([this, x], '%');
    } else if(x.constructor === Expression.List) {
        throw('Not sure about this...');
        // Not sure about this
        // return Expression.List.Real([this, x], '%');
    } else if (x.constructor === Expression.NumericalComplex) {
        throw(new TypeError(nonreal));
    } else if (x.constructor === Expression.List.ComplexCartesian) {
        throw(new TypeError(nonreal));
    } else if (x.constructor === Expression.List.ComplexPolar) {    
        throw(new TypeError(nonreal));
    } else {
        throw ('Unknown Type for NumericalReal %');
    }
};
_['*'] = function (x) {
    if(x instanceof NumericalReal){
        return new NumericalReal(this.value * x.value);
    }
    return x['*'](this);
};
_['/'] = function (x) {
    if(this.value === 0) {
        return Global.Zero;
    }
    if(x instanceof NumericalReal){
        if(x.value === 0) {
            throw('Division by zero not allowed!');
        }
        return new NumericalReal(this.value / x.value);
    } else if (x.constructor === Expression.NumericalComplex) {
        var cc_dd = x._real * x._real + x._imag * x._imag;
        return new Expression.Complex((this.value * x._real)/cc_dd, (-this.value * x._imag) / cc_dd);
    } else if(x instanceof Expression.List.ComplexCartesian) {
        // a/(x+yi) = a/(x+yi) (x-yi)/(x-yi) = a(x-yi) / (x^2 + y^2)
        var x_conj = Expression.List.ComplexCartesian([
            x[0],
            x[1]['@-']()
        ]);
        var two = NumericalReal(2);
        return x_conj['*'](this)['/'](
            (x[0]['^'])(two)
            ['+'] (
                (x[1]['^'])(two)
            )
        );
    // } else if(x instanceof Expression.List.ComplexPolar) {
        
    } else if(x instanceof Expression.List.Real) {
        // TODO: given x != 0
        return Expression.List.Real([this, x], '/');
    } else if(x instanceof Expression.Symbol.Real) {
        // TODO: given x != 0
        return Expression.List.Real([this, x], '/');
    } else if(x instanceof Expression.List) {   
        return Expression.List([this, x], '/');
    } else {
        console.log('Unknown type: ', this, x);
        throw ('Unknown Type for NumericalReal /');
    }
};
_['^'] = function (x) {
    if (this.value === 0) {
        return Global.Zero;
    }
    if (this.value === 1) {
        return Global.One;
    }
    if(x === Global.Zero) {
        return Global.One;
    }
    if(x === Global.One) {
        return this;
    }
    if (x instanceof Expression.Integer) {
        return new NumericalReal(Math.pow(this.value, x.a));
    } else if(x instanceof NumericalReal){
        if(this.value > 0) {
            return new NumericalReal(Math.pow(this.value, x.value));
        }
        // TODO: This will produce ugly decimals. Maybe we should express it in polar form?!
        //      <- I think no, because why else start with a numerical. Implement a rational/integer type
        var r = Math.pow(-this.value, x.value);
        var theta = Math.PI * x.value;
        return new Expression.List.ComplexPolar([
            new NumericalReal(r),
            new NumericalReal(theta)
        ]);
    } else if (x.constructor === Expression.NumericalComplex) {
        var a = this.value;
        var c = x._real;
        var d = x._imag;
        console.error('Bad implementation ( num ^ complex)');
        var hlm = 0.5 * Math.log(a*a);
        var hmld_tc = hlm * d;
        var e_hmlc_td = Math.exp(hlm * c);
        return new Expression.NumericalComplex(
            (e_hmlc_td * Math.cos(hmld_tc)),
            (e_hmlc_td * Math.sin(hmld_tc))
        );
    } else if (x.constructor === Expression.List.ComplexCartesian) {
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.List.ComplexPolar) {
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.List.Real) {
        if(this.value > 0) {
            return Expression.List.Real([this, x], '^');
        }
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.Symbol.Real) {
        if(this.value > 0) {
            return Expression.List.Real([this, x], '^');
        }
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.List) {
        return Expression.List([this, x], '^');
    } else {
        throw console.error ('Unknown Type for NumericalReal ^', x, x instanceof NumericalReal);
    }
};
_['>'] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value > x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['>'].call(this, x);
};
_['<'] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value < x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['<'].call(this, x);
};
_['<='] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value <= x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['<='].call(this, x);
};
_['>='] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value >= x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['>='].call(this, x);
};

_._s = function (Code, lang) {
    if(lang === 'x-shader/x-fragment') {
        var num = this.value.toExponential();
        if(num.indexOf('.') === -1){
            num = num.replace('e','.e');
        }
        return new Code(num);
    }
    return new Code(this.value.toString());
};
// _.applyOld = function(operator, x) {
//     switch (operator){
//         case ',':
//             return Expression.Vector([this, x]);
//         case '^':
//             if(this.value === 0) {
//                 return Global.Zero; // Contradicts x^0 = 1
//             }
//             break;
//         case '+':
//             if(this.value === 0) {
//                 return x;
//             }
//             break;
//         case '-':
//             if(this.value === 0) {
//                 return x.apply('@-');
//             }
//             break;
//         case undefined:
//         case '*':
//             if(this.value === 1){
//                 return x;
//             }
//             //Note: There is not meant to be a break here.
//         case '/':
//             if(this.value === 0){
//                 return Global.Zero; //Contradics x/0 = Infinity
//             }
//     }
//     if(x === undefined){
//         //Unary
//         switch (operator) {
//             case '@+':
//                 return this;
//             case '@-':
//                 return new NumericalReal(-this.value);
//             case '++':
//             case '--':
//                 throw(new TypeError('Postfix ' +operator + ' operator applied to value that is not a reference.'));
//             case '+=':
//             case '-=':
//             case '*=':
//             case '/=':
//                 throw(new ReferenceError('Left side of assignment is not a reference.'));
//             case '!':
//                 return Global.Gamma.apply(undefined, new NumericalReal(this.value + 1));
//         }
//     } else if(x.constructor === this.constructor){
//         switch (operator) {
//             case '*':
//             case undefined:
//                 return new NumericalReal(this.value * x.value);
//             case '+':
//                 return new NumericalReal(this.value + x.value);
//             case '-':
//                 return new NumericalReal(this.value - x.value);
//             case '/':
//                 return new NumericalReal(this.value / x.value);
//             case '^':
//                 if(this.value > 0) {
//                     return new NumericalReal(Math.pow(this.value, x.value));
//                 } else {
//                     // TODO: This will produce ugly decimals. Maybe we should express it in polar form?!
//                     var r = Math.pow(-this.value, x.value)
//                     var theta = Math.PI * x.value;
//                     return new Expression.Complex(r*Math.cos(theta), r*Math.sin(theta));
//                 }
//             default:
            
//         }
//     } else if (x.constructor === Expression.Complex) {
//         switch (operator) {
//             case '*':
//             case undefined:
//                 return new Expression.Complex(this.value * x._real, this.value * x._imag);
//             case '+':
//                 return new Expression.Complex(this.value + x._real, x._imag);
//             case '-':
//                 return new Expression.Complex(this.value - x._real, -x._imag);
//             case '/':
//                 var cc_dd = x._real * x._real + x._imag * x._imag;
//                 return new Expression.Complex((this.value * x._real)/cc_dd, (-this.value*x._imag)/cc_dd);
//             case '^':
//                 var a = this.value;
//                 var c = x._real;
//                 var d = x._imag;
//                 console.error('Bad implementation ( num ^ complex)');
//                 var hlm = 0.5 * Math.log(a*a);
//                 var hmld_tc = hlm * d;
//                 var e_hmlc_td = Math.exp(hlm * c);
//                 return new Expression.Complex(
//                     (e_hmlc_td * Math.cos(hmld_tc)),
//                     (e_hmlc_td * Math.sin(hmld_tc))
//                 );
//             default:
//         }
//     } else if(x.constructor === Expression.List.ComplexCartesian) {
//         switch (operator) {
//             case '+':
//             case '-':
//                 return Expression.List.ComplexCartesian([
//                     x[0].apply(operator, this),
//                     x[1]
//                 ]);
//             case undefined:
//                 operator = '*';
//             case '*':
//             case '/':
//                 return Expression.List.ComplexCartesian([
//                     x[0].apply(operator, this),
//                     x[1].apply(operator, this)
//                 ]);
//             case '^':
//                 console.warn('ineffecient: NR ^ CL');
//                 return this.realimag().apply(operator, x);
            
//         }
//     } else if(x.constructor === Expression.List.ComplexPolar) {
//         switch (operator) {
//             case '+':
//             case '-':
//             case '^':
//                 //(a+bi)+Ae^(ik)
//                 return Expression.List([this, x], operator);
//                 // or ? return this.apply(operator, x.realimag()); //Jump up to above +-
//             case undefined:
//                 operator = '*';
//             case '*':
//                 return Expression.List.ComplexPolar([
//                     x[0].apply(operator, this),
//                     x[1]
//                 ]);
//             case '/':
//                 return Expression.List.ComplexPolar([
//                     x[0].apply(operator, this),
//                     x[1]
//                 ]);
//         }
//     } else if (x.constructor === Expression.List.Real) {
//         switch(operator) {
//             case undefined:
//                 operator = '*';
//             case '*':
//             case '+':
//             case '-':
//             case '/':
//                 return Expression.List.Real([this, x], operator);
//             case '^':
//                 if(this.value === 0){
//                     throw('N(0) ^ x');
//                 }
//                 if(this.value > 0) {
//                     return Expression.List.Real([this, x], operator);
//                 } else {
//                     return Expression.List.ComplexPolar([
//                         (new Expression.Numerical(-this.value)).apply('^', x),
//                         Global.pi.apply('*', x)
//                     ]);
//                 }
//         }
                
//     } else if (x.constructor === Expression.Symbol.Real) {
//         switch(operator) {
//             case undefined:
//                 operator = '*';
//             case '*':
//             case '+':
//             case '-':
//             case '/':
//                 return Expression.List.Real([this, x], operator);
//             case '^':
//                 if(this.value === 0){
//                     throw('N(0) ^ x');
//                 }
//                 if(this.value > 0) {
//                     return Expression.List.Real([this, x], operator);
//                 } else {
//                     return Expression.List.ComplexPolar([
//                         Expression.List.Real([(new NumericalReal(-this.value)), x], '^'),
//                         Global.pi.apply('*', x)
//                     ]);
//                 }
//         }
//     }
//     throw('?? - real');
//     return Expression.List([this, x], operator);
// };

})()
},{"util":11,"./NumericalComplex":20,"../global":9,"./":8}],19:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./');
var Global = require('../global');

module.exports = Constant;

util.inherits(Constant, sup);

function Constant() {
    throw new Error('Expression.Constant created directly');
}

var _ = Constant.prototype;

_.simplify = function() {
    return this;
};

_.differentiate = function() {
    return Global.Zero;
};

_.apply = function (x){
    return this['*'](x);
};

})()
},{"util":11,"../global":9,"./":8}],23:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./NumericalReal');
var Global = require('../global');
var Expression = require('./');

module.exports = Rational;

util.inherits(Rational, sup);

function Rational(a, b) {
    this.a = a;
    this.b = b;
}

var _ = Rational.prototype;


_.__defineGetter__("value", function () {
    return this.a / this.b;
});

_['+'] = function (x) {
    if(this.a === 0) {
        return x;
    }
    if(x instanceof Rational){
        /*
            a   c     ad   cb    ad + bc
            - + -  =  -- + -- =  -------
            b   d     bd   bd      b d
        */
        return new Rational(this.a * x.b + this.b * x.a, this.b * x.b);
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.NumericalComplex(this.value + x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        console.warn('Swapped operator order for + with Rational');
        return (x)['+'](this);
        // throw ('Unknown Type for Rational +');
    }
    
    
};

_['-'] = function (x) {
    if(this.a === 0) {
        return x['@-']();
    }
    if(x instanceof Rational){
        /*
            a   c     ad   cb    ad + bc
            - + -  =  -- + -- =  -------
            b   d     bd   bd      b d
        */
        return new Rational(this.a * x.b - this.b * x.a, this.b * x.b);
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.NumericalComplex(this.value - x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x['@-']())['+'](this);
    } else {
        console.warn('Swapped operator order for - with Rational');
        return (x)['+'](this);
        // throw ('Unknown Type for Rational +');
    }
};

_['*'] = function (x) {
    if (this.a === 0) {
        return Global.Zero;
    }
    if (x instanceof Rational){
        return new Rational(this.a * x.a, this.b * x.b);
    }
    return sup.prototype['*'].call(this, x);
};


_['/'] = function (x) {
    if (this.a === 0) {
        return Global.Zero;
    }
    if (x instanceof Rational){
        if (x.a === 0) {
            throw('Division By Zero is not defined for Rational numbers!');
        }
        return new Rational(this.a * x.b, this.b * x.a).reduce();
    }
    return Expression.NumericalReal.prototype['/'].call(this, x);
};

_['^'] = function (x) {
    if(x === Global.Zero) {
        return Global.One;
    }
    if(x === Global.One) {
        return this;
    }
    if(this.a === 0) {
        return Global.Zero;
    }
    if(this.a === this.b) {
        return Global.One;
    }
    if(x instanceof Expression.Integer) {
        return new Rational(
            Math.pow(this.a, x.a),
            Math.pow(this.b, x.a)
        );
    } else if (x instanceof Rational) {
        
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
        }

        return Expression.NumericalReal.prototype['^'].call(
            this,
            x
        );
        
    }

    return Expression.List([this, x], '^');
    
};

_.reduce = function () {
    // mutable.
    function gcd(a, b) {
        if(b === 0) {
            return a;
        }
        return gcd(b, a % b);
    }
    var g = gcd(this.b, this.a);
    this.a /= g;
    this.b /= g;
    if(this.b === 1) {
        return new Expression.Integer(this.a);
    }
    if(this.b < 0) {
        this.a = -this.a;
        this.b = -this.b;
    }
    
    return this;
};

})()
},{"util":11,"./NumericalReal":21,"../global":9,"./":8}],22:[function(require,module,exports){
(function(){var util = require('util');
var sup = require('./Rational');
var Global = require('../global');

module.exports = Integer;

util.inherits(Integer, sup);

function Integer(x) {
    this.a = x;
}

var _ = Integer.prototype;

_.b = 1;

_['+'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a + x.a);
    }
    return x['+'](this);
};

_['-'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a - x.a);
    }
    return sup.prototype['-'].call(this, x);
};

_['/'] = function (x) {
    if(x instanceof Integer) {
        if(this.a % x.a === 0) {
            return new Integer(this.a / x.a);
        }
        return new sup(this.a, x.a);
    }
    return sup.prototype['/'].call(this, x);
};

_['@-'] = function () {
    return new Integer(-this.a);
};

_['*'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a * x.a);
    }
    return x['*'](this);
};

_['^'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(Math.pow(this.a, x.a));
    } else if (x.constructor === sup) {
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
        } else {
            return Expression.NumericalReal.prototype['^'].call(
                this,
                x
            );
        }
    } else if (x.constructor === Expression.List.Real || x.constructor === Expression.Symbol.Real) {
        if(this.a > 0) {
            return Expression.List.Real([
                this,
                x
            ], '^');
        }
    }
    return Expression.NumericalReal.prototype['^'].call(
        this,
        x
    );
    
};

_['%'] = function (x) {
    if(x instanceof Integer) {
        return new Integer(this.a % x.a);
    } else if (x.constructor === sup) {
        return new sup();// @todo: !
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalReal(this % x.value);
    } else {
        return Expression.List.Real([this, x], '%');
    }
};

_._s = function (Code, lang) {
    if(lang === 'x-shader/x-fragment') {
        return new Code(this.a.toString() + '.0');
    }
    return new Code(this.a.toString());
};
})()
},{"util":11,"./Rational":23,"../global":9}],16:[function(require,module,exports){
(function(){var Expression = require('../Expression');
var Global = require('../global');

module.exports = function (s, base) {
    var self = this;
    if (s === '' || s === undefined) {
        return undefined;
    }

    s = s.replace(/ /g, '');
    
    var root = Object.create({});
    var context = root;
    
    var free = {};
    var bound = {};
    
    function down(vars) {
        var parent = context;
        context = Object.create(context);
        context.$parent = parent;
        var i;
        for (i in vars) {
            if (vars.hasOwnProperty(i)) {
                context[i] = vars[i];
            }
        }
    }
    
    function up(entity) {
        context = context.$parent;
        return entity;
    }
    /*
        Evaluate AST tree (top-down)
        
        Examples:
            * y=x^2
                ['=', y, ['^', x, 2]]
    
    */
    var loose = false;
    function evaluate(ast) {
        if (typeof ast === 'string') {
            var symbol;
            if ((symbol = context[ast])) {
                return symbol;
            } else if ((symbol = base[ast])) {
                bound[ast] = symbol;
            } else {
                free[ast] = symbol = new Expression.Symbol.Real(ast);
            }
            root[ast] = symbol;
            return symbol;
        } else if (ast.primitive) {
            return self.Construct[ast.type](ast.primitive);
        } else if (typeof ast === 'object') {
            
            var ast1 = evaluate(ast[1]);
            
            if (ast.length === 3) {
                switch (ast[0]) {
                    case 'frac':
                        ast[0] = '/';
                        break;
                    case '_':
                        // Don't bind underneath
                        if (ast[1] === 'sum') {
                            var limit = ast[2];
                            if (limit[0] === '=') {
                                // dummy variable: 
                                var x = new Expression.Symbol.Real(limit[1]);
                                
                                // lower limit
                                var a = evaluate(limit[2]);
                                var summinator = new Expression.Sum.Real(x, a);
                                summinator.vars = {};
                                summinator.vars[x.symbol] = x;
                                return summinator;
                            }
                        }
                        break;
                }
                if (ast[0] === 'default' && ast1.vars) {
                    down(ast1.vars);
                        var result = ast1[ast[0]](evaluate(ast[2]));
                        delete result.vars;
                    return up(result);
                }
                return ast1[ast[0]](evaluate(ast[2]));
            }
            if (ast.length === 2) {
                switch (ast[0]) {
                    case 'sqrt':
                        return Global.sqrt.default(evaluate(ast[1]));
                    case '!':
                        return Global.factorial.default(evaluate(ast[1]));
                }
                
                return evaluate(ast[1])[ast[0]]();
            }
            if (ast.length === 4) {
                return evaluate(ast[1])[ast[0]](evaluate(ast[1]), evaluate(ast[2]));
            }
        }
        return ast;
    }
    
    
    // Parse using context free grammar ([graph]/grammar/calculator.jison)
    var ast = this.cfg.parse(s);
    var result = evaluate(ast);
    result._ast = ast;
    if (root !== context) {
        throw('Context still open');
    }
    
    result.unbound = free;
    result.bound = bound;
    return result;
};



})()
},{"../Expression":8,"../global":9}],27:[function(require,module,exports){
var util = require('util'),
    sup  = require('../'),
    Expression = require('../');

module.exports = List;

util.inherits(List, sup);

/*
    Expression.List should be avoided whenever Expression.List.Real can
    be used. However, knowing when to use Real is an impossible (?) task,
    so sometimes this will have to do as a fallback.
*/
function List(e, operator) {
    e.__proto__ = Expression.List.prototype;
    e.operator = operator;
    return e;
}

List.prototype._s = function (Code, lang) {
    if(lang === 'text/latex') {
        return Expression.List.Real.prototype._s.apply(this, arguments);
    }
    throw(new Error('Use real(), imag(), or abs(), or arg() first.'));
};

List.prototype.sub = function (x, y) {
    var a = this[0].sub(x, y);
    var b = this[1] && this[1].sub(x, y);

    return a[this.operator || 'default'](b);
};

List.prototype.map = function (f) {
    var elements = Array.prototype.map.call(this, f);
    return elements[0][this.operator || 'default'].apply(this, elements.slice(1));
};
},{"util":11,"../":8}],29:[function(require,module,exports){
(function(){var util = require('util'),
    sup  = require('../'),
    Global = require('../../global');

module.exports = Symbol;

util.inherits(Symbol, sup);

function Symbol(str) {
    this.symbol = str;
}

var _ = Symbol.prototype;

_.differentiate = function (x) {
    return this === x ? Global.One : Global.Zero;
};
_.integrate = function (x) {
    if (this === x) {
        return new Expression.NumericalReal(0.5, 0) ['*'] (x ['^'] (new Expression.NumericalReal(2,0)));
    }
    return (this) ['*'] (x);
};
_.sub = function (x, y) {
    // TODO: Ensure it is real (for Expression.Symbol.Real)
    return this === x ? y : this;
};

_._s = function (Code, x) {
    return new Code(this.symbol || 'x_{free}');
};
})()
},{"util":11,"../":8,"../../global":9}],30:[function(require,module,exports){
var util = require('util');
var sup  = require('../');
var Expression = require('../');

module.exports = EFunction;

util.inherits(EFunction, sup);

function EFunction (p) {
    this.default = p.default;
    this['text/latex'] = (p['text/latex']);
    this['x-shader/x-fragment'] = (p['x-shader/x-fragment']);
    this['text/javascript'] = (p['text/javascript']);
    this.derivative = p.derivative;
    this.realimag = p.realimag;
};

var _ = EFunction.prototype;

// @abstract
_.default = function (argument) {
    return;
};

// @abstract
_.differentiate = function () {
    if (this.derivative) {
        return this.derivative;
    }
    throw new Error('EFunction has no derivative defined.');
};

_._s = function (Code, lang) {
    if (this[lang]) {
        return new Code(this[lang]);
    }
    throw new Error('Could not compile function into ' + lang);
};

_['+'] = function (x) {
    var a = new Expression.Symbol();
    return new EFunction.Symbolic(this.default(a)['+'](x), [a]);
};

_['@-'] = function (x) {
    var a = new Expression.Symbol();
    return new EFunction.Symbolic(this.default(a)['@-'](), [a]);
};


},{"util":11,"../":8}],31:[function(require,module,exports){
(function(){// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');
var Expression  = require('../');
var Global = require('../../global');

module.exports = Vector;

function Vector(e) {
    e.__proto__ = Vector.prototype;
    return e;
}

util.inherits(Vector, sup);

var _ = Vector.prototype;

_[',.'] = function (x) {
    return Vector(Array.prototype.concat.call(this, [x]));
};

_.differentiate = function (x) {
    return Vector(Array.prototype.map.call(this, function (c) {
        return c.differentiate(x);
    }));
};
_.cross = function (x) {
    if (this.length !== 3 || x.length !== 3) {
        throw('Cross product only defined for 3D vectors.');
    }
    /*
    i   j    k
    x   y    z
    a   b    c
    
    = (yc - zb, za - xc, xb - ya)
    */
    
    return new Vector([
        this[1].default(x[2])['-'](this[2].default(x[1])),
        this[2].default(x[0])['-'](this[0].default(x[2])),
        this[0].default(x[1])['-'](this[1].default(x[0]))
    ]);
};

// crossProduct is the '&times;' character
var crossProduct = String.fromCharCode(215);

_[crossProduct] = _.cross;
_.default = function (x) {
    var l = this.length;
    if (x instanceof Vector) {
        // Dot product
        if(l !== x.length) {
            throw('Vector Dimension mismatch.');
        }
        var i;
        var sum = Global.Zero;
        for (i = 0; i < l; i++) {
            sum = sum['+'](
                (this[i]).default(x[i])
            );
        }
        return sum;
    } else {
        // Scalar multiplication:
        return Vector(Array.prototype.map.call(this, function (c) {
            return c.default(x);
        }));
    }
};
_['*'] = _.default;
_['+'] = function (x, op) {
    var l = this.length;
    if(l !== x.length) {
        throw(new MathError('Vector Dimension mismatch.'));
    }
    var i;
    var n = new Array(l);
    for (i = 0; i < l; i++) {
        n[i] = this[i][op || '+'](x[i]);
    }
    return Vector(n);
};
_['-'] = function (x) {
    return this['+'](x, '-');
};
_['/'] = function (x) {
    if (x instanceof Vector) {
        throw('Vector division not defined');
    }
    return Vector(Array.prototype.map.call(this, function (c) {
        return c['/'](x);
    }));
    
};
_['^'] = function (x) {
    if(x instanceof Expression.Integer) {
        if(x.a === 0) {
            throw('Raised to zero power');
        }
        if(x.a === 1) {
            return this;
        }
        if (x.a === 2) {
            var S = Global.Zero;
            var i, l = this.length;
            for (i = 0; i < l; i++) {
                S = S['+'](this[i]['^'](x));
            }
            return S;
        } else {
            return this['^'](new Expression.Integer(x.a - 1))['*'](this);
        }
    } else if(x instanceof Expression.Rational){
        return this['^'](x.a)['^'](Global.One['/'](x.b));
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.Complex(this.value + x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        throw ('Unknown Type for Vector ^');
    }
    return this.default(this['^'](x['-'](Global.One)));
};

_.old_apply_operator = function(operator, e) {
    var l = this.length;
    var i;
    switch (operator) {
        case ',':
            //Array.prototype.push.apply(this, [e]);
            //Faster:
            //MODIFIES!!!!!!!!!
            this[l] = e;
            return this;
        case undefined:
        case '*':
            if(l !== e.length) {
                throw('Vector Dimension mismatch.');
            }
            var sum = M.Global.Zero;
            for (i = 0; i < l; i++) {
                sum = sum.apply('+', this[i].apply('*', e[i]));
            }
            return sum;
        case '+':
        case '-':
            if(l !== e.length) {
                throw('Vector Dimension mismatch.');
            }
            var n = new Array(l);
            for (i = 0; i < l; i++) {
                n[i] = this[i].apply(operator, e[i]);
            }
            return Vector(n);
        case '/':
        case '^':
            break;
        default:
            throw('Vector operation not allowed.');
    }
};

_.realimag = function(){
    var l = this.length;
    var _x = new Array(l);
    var _y = new Array(l);
    var i;
    for(i = 0; i < l; i++) {
        var ri = this[i].realimag();
        _x[i] = ri[0];
        _y[i] = ri[1];
    }
    return Expression.List.ComplexCartesian([
        Vector(_x),
        Vector(_y)
    ]);
};

_._s = function(Code, lang) {
    var l = this.length;
    var open = '[';
    var close = ']';
    if(lang === 'x-shader/x-fragment') {
        open = 'vec' + this.length + '(';
        close = ')';
    }
    var c = this[0]._s(Code, lang);
    var i;
    var t_s = [];
    for (i = 0; i < l; i++) {
        var c_i = this[i]._s(Code, lang);
        t_s.push(c_i.s);
        c = c.merge(c_i);
    }
    return c.update(open + t_s.join(',') + close, Infinity);
};
})()
},{"util":11,"../":8,"../../global":9}],28:[function(require,module,exports){
var util = require('util');
var sup  = require('../');

function TruthValue(v) {

}

module.exports = Statement;

util.inherits(TruthValue, sup);
util.inherits(Statement, sup);

var _ = TruthValue.prototype;

var True = TruthValue.True = new TruthValue();
var False = TruthValue.False = new TruthValue();

//Only difference: NOT operator
False['~'] = function () {
    return True;
};

// negation operator
_['~'] = function () {
    return False;
};

// disjunction
_.V = function (e) {
    return e === True ? e : this;
};

// conjunction
_['^'] = function (e) {
    return e === True ? this : e;
};


function Statement(x, y, operator) {
    this.a = x;
    this.b = y;

    this.operator = operator;
}

var _ = Statement.prototype;
_['='] = function () {
    
};
_['<'] = function () {
    // a < b < c
    // (a < b) = b
    // b < c
    
    // a < (b < c)
    // a < b .. (b < c) = b
    // (a < b) = a.
};
_.solve = function (vars) {
    // a = b
    // If b has an additive inverse?
    
    // a - b = 0
    var a_b = (this.a)['-'](this.b);
    /*
    Examples:
    (1,2,3) - (x,y,z) = 0 (solve for x,y,z)
    (1,2,3) - x = 0 (solve for x)
    */
    console.log(Object.getOwnPropertyNames(a_b));
    return a_b.roots(vars);
};

},{"util":11,"../":8}],34:[function(require,module,exports){
// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');

module.exports = Matrix;

function Matrix(e, r, c) {
    e.__proto__ = Matrix.prototype;

    e.rows = r;
    e.cols = c;

    if (r != c) {
        throw new Error('Matrix size mismatch')
    }

    return e;
}

util.inherits(Matrix, sup);

var _ = Matrix.prototype;

_.default = _['*'] = function (x) {
    if(x.constructor === Expression.Matrix) {
        // Broken
        // O(n^3)
        if (x.rows !== this.cols) {
            throw ('Matrix dimensions do not match.');
        }
        var result = [];
        // result[x.rows * x.cols - 1 ] = undefined;
        var i, j, k, r = 0;
        for (i = 0; i < this.rows; i++) {
            for (j = 0; j < x.cols; j++) {
                var sum = Global.Zero;
                for(k = 0; k < x.rows; k++) {
                    sum = sum['+'](x[k * x.cols + j]);
                }
                result[r++] = sum;
            }
        }
        return Expression.Matrix(result);
    } else {
        throw ('Unknown type');
    }
};

_.reduce = function (app) {
    var x, y;
    for(y = 0; y < this.rows; y++) {
        for(x = 0; x < y; x++) {
            // Make this[x,y] = 0
            var ma = this[x * this.cols + x];
            // 0 = this - (this/ma) * ma
            if(ma === Global.Zero) {
                throw ('Row swap!');
            }
            var tma = this[y * this.cols + x]['/'](ma);
            var i;
            for (i = x + 1; i < this.cols; i++) {
                this[y * this.cols + i] = this[y * this.cols + i]['-'](tma['*'](this[x * this.cols + i]));
            }
        }
    }
    return this;
};


},{"util":11,"../":8}],25:[function(require,module,exports){
// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');

/*
    This type is an attempt to avoid having to call .realimag() down the tree all the time.
    
    Maybe this is a bad idea, because it will end up having:
    
    f(x) = >
    [
        Re_f(x),
        Im_f(x)
        
    ]
    which requires two evaluations of f(x).

*/

module.exports = ComplexCartesian;

util.inherits(ComplexCartesian, sup);

function ComplexCartesian(x) {
    x.__proto__ = ComplexCartesian.prototype;
    return x;
}

var _ = ComplexCartesian.prototype;

_.realimag = function () {
    return this;
};
_.real = function () {
    return this[0];
};
_.imag = function () {
    return this[1];
};
_.conjugate = function () {
    return ComplexCartesian([
        this[0],
        this[1].apply('@-')
    ]);
};

_['@-'] = function (x) {
    return new ComplexCartesian([
        this[0]['@-'](),
        this[1]['@-']()
    ]);
};
_['*'] = function (x) {
    if (x instanceof ComplexCartesian) {
        // (a+bi) * (c+di) = ac + adi + bci - bd
        return new ComplexCartesian([
            this[0]['*'](x[0])['-'](this[1]['*'](x[1])),
            this[0]['*'](x[1])['+'](this[1]['*'](x[0]))
        ]);
    }
    if (x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
        return new ComplexCartesian([
            this[0]['*'](x),
            this[1]['*'](x)
        ]);
    }
};
_['^'] = function (x) {
    if(x instanceof Expression.Integer) {

        if(x instanceof Expression.Rational) {
            if(x.a === x.b) {
                return this;
            }
        }

        if(x instanceof Expression.Rational) {
            if(x.a === 0) {
                return Global.One;
            }
        }
        
        // Binomial expansion
        // (a+b)^N
        var n  = x.a;
        var k;
        var a = this[0];
        var b = this[1];
        var negone = new Expression.Integer(-1);
        var imag_part = Global.Zero;
        
        var real_part = a['^'](
            new Expression.Integer(n)
        );
        
        var ci = 1;
        
        for (k = 1;; k++) {
            var expr;
            if(k === n) {
                expr = (
                    b['^'](
                        new Expression.Integer(k)
                    )
                );
                
                if (ci === 0) {
                    real_part = real_part['+'](expr);
                } else if (ci === 1) {
                    imag_part = imag_part['+'](expr);
                } else if (ci === 2) {
                    real_part = real_part['-'](expr);
                } else if (ci === 3) {
                    imag_part = imag_part['-'](expr);
                    ci = -1;
                }
            
                
                break;
            }
            expr = a['^'](
                new Expression.Integer(n - k)
            )['*'](
                b['^'](
                    new Expression.Integer(k)
                )
            );
            if (ci === 0) {
                real_part = real_part['+'](expr);
            } else if (ci === 1) {
                imag_part = imag_part['+'](expr);
            } else if (ci === 2) {
                real_part = real_part['-'](expr);
            } else if (ci === 3) {
                imag_part = imag_part['-'](expr);
                ci = -1;
            }
            
            ci++;
        }
        return new ComplexCartesian([
            real_part,
            imag_part
        ]);
    }
    return new Expression.List([this, x], '^');
};
_['+'] = function (x) {
    if (x instanceof ComplexCartesian) {
        return new ComplexCartesian([
            this[0]
        ]);
    }
    if (x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
        return new ComplexCartesian([
            this[0]['+'](x),
            this[1]
        ]);
    }
    
};

_.differentiate = function (x) {
    return ComplexCartesian([
        this[0].differentiate(x),
        this[1].differentiate(x)
    ]);
};


// _.applyOld = function(o, x) {
//     //TODO: ensure this has an imaginary part. If it doesn't it is a huge waste of computation
//     if (x.constructor === this.constructor) {
//         switch(o) {
//             case '+':
//             case '-':
//                 return ComplexCartesian([
//                     this[0].apply(o, x[0]),
//                     this[1].apply(o, x[1])
//                 ]);
//             case undefined:
//                 //Function evaluation? NO. This is not a function. I think.
//             case '*':
//                 return ComplexCartesian([
//                     this[0].apply('*', x[0]).apply('-', this[1].apply('*', x[1])),
//                     this[0].apply('*', x[1]).apply('+', this[1].apply('*', x[0]))
//                 ]);
//             case '/':
//                 var cc_dd = x[0].apply('*', x[0]).apply('+', x[1].apply('*', x[1]));
//                 return ComplexCartesian([
//                     (this[0].apply('*',x[0]).apply('+',this[1].apply('*',x[1]))).apply('/', cc_dd),
//                     (this[1].apply('*',x[0]).apply('-',this[0].apply('*',x[1]))).apply('/', cc_dd)
//                 ]);
//             case '^':
//                 //The most confusing of them all:
//                 var half = new Expression.NumericalReal(0.5, 0);
//                 var hlm = half.apply('*',
//                     Global.log.apply(undefined,
//                         //The magnitude: if this was for a polar one it could be fast.
//                         this[0].apply('*',
//                             this[0]
//                         ).apply('+',
//                             this[1].apply('*',
//                                 this[1]
//                             )
//                         )
//                     )
//                 );
//                 var theta = Global.atan2.apply(undefined, Expression.Vector([this[1], this[0]]));
//                 var hmld_tc = hlm.apply('*', x[1]).apply('+', theta.apply('*', x[0]));
                
//                 var e_hmlc_td = Global.exp.apply(undefined,
//                     hlm.apply('*',
//                         b[0]
//                     ).apply('-',
//                         theta.apply('*',
//                             b[1]
//                         )
//                     )
//                 );
                

//                 var e_hmlc_td = Global.e.apply('^',
//                     hlm.apply('*',
//                         x[0]
//                     ).apply('-',
//                         theta.apply('*',
//                             x[1]
//                         )
//                     )
//                 );

//                 return ComplexCartesian([
//                     (e_hmlc_td.apply('*',Global.cos.apply(undefined, hmld_tc))),
//                     (e_hmlc_td.apply('*',Global.sin.apply(undefined, hmld_tc)))
//                 ]);
//             case '!':
//                 break;
//             default:
//         }
//     } else if (x.constructor === Expression.List.ComplexPolar){
//         switch (o) {
//             case '*':
//             case '/':
//                 //(x+yi)/A*e^(ik)
//                 var cc_dd = x[0].apply('*', x[0]);
//                 var b = x.realimag();
//                 //Clean this up? Sub?
//                 return ComplexCartesian([
//                     (this[0].apply('*',b[0]).apply('+',a[1].apply('*',b[1]))).apply('/', cc_dd),
//                     (this[1].apply('*',b[0]).apply('-',a[0].apply('*',b[1]))).apply('/', cc_dd)
//                 ]);
//             case '^':
//                 //http://www.wolframalpha.com/input/?i=Re%28%28x%2Byi%29%5E%28A*e%5E%28ik%29%29%29
//                 //(x+yi)^(A*e^(ik))
//             case '+':
//             case '-':
//                 return this.apply(o, x.realimag());
//         }
//     } else if (x.constructor === Expression.Complex) {
//         return this.apply(o, x.realimag());
//     } else if (x.constructor === Expression.Symbol.Real) {
//         console.error('Duplicated an x! This makes it difficult to solve complex equations, I think');
//         return this.apply(o, x.realimag());
//     } else if (x.constructor === Expression.List.Real) {
//         console.error('Duplicated an x! This makes it difficult to solve complex equations, I think');
//         return this.apply(o, x.realimag());
//     }
//     throw('CMPLX.LIST * ' + o);
// };

},{"util":11,"../":27}],24:[function(require,module,exports){
(function(){// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');
var Expression = require('../../');
var Global = require('../../../global')


module.exports = ListReal;

util.inherits(ListReal, sup);

function ListReal(x, operator) {
    x.__proto__ = ListReal.prototype;
    if(operator !== undefined) {
        x.operator = operator;
    }
    return x;
}

var _ = ListReal.prototype;

_.realimag = function (){
    return sup.ComplexCartesian([
        this,
        Global.Zero
    ]);
};
_.real = function (){
    return this;
};
_.imag = function (){
    return Global.Zero;
};
_.polar = function () {
    return sup.ComplexPolar([
        sup.Real([Global.abs, this]),
        sup.Real([Global.arg, this])
    ]);
};
_.abs = function (){
    return sup.Real([Global.abs, this]);
};
_.arg = function (){
    return sup.Real([Global.arg, this]);
};
_['+'] = function (x) {
    if(this === x) {
        return x['*'](new Expression.Integer(2));
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return this;
        }
    }
    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '+' && this[1] instanceof Expression.NumericalReal) {
            return sup.Real([this[0], this[1]['+'](x)], this.operator);
        }
        if(this.operator === '-' && this[1] instanceof Expression.NumericalReal) {
            return sup.Real([this[0], x['-'](this[1])], '+');
        }
        
        return sup.Real([this, x], '+');
    }
    
    if(x instanceof sup.Real || x instanceof Expression.Symbol.Real) {
        return sup.Real([this, x], '+');
    }
    return x['+'](this);
    
};
_['-'] = function (x) {
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return this;
        }
    }
    
    if (x === this) {
        return Global.Zero;
    }
    if (x instanceof sup.Real) {
        if (x.operator === '@-') {
            return sup.Real([this, x[0]], '+');
        }
        return sup.Real([this, x], '-');
    }
    if (x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
        return sup.Real([this, x], '-');
    }
    return this.realimag()['-'](x);
};
_['*'] = function (x) {
    
    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return Global.Zero;
        }
    }
    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
            return sup.Real([this[0]['*'](x), this[1]], this.operator);
        }
        return sup.Real([x, this], '*');
    }
    if(x instanceof sup.Real || x instanceof Expression.Symbol.Real) {
        if (this[0] instanceof Expression.Function) {
            
        }
        return sup.Real([this, x], '*');
    }
    return x['*'](this);
    
};
_['/'] = function (x) {

    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }

    if(x === this) {
        return Global.One;
    }

    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '*' || this.operator === '/') {
            return sup.Real([this[0]['/'](x), this[1]], this.operator);
        }
        return sup.Real([this, x], '/');
    }

    if(x instanceof sup.Real || x instanceof Expression.Symbol.Real) {
        return sup.Real([this, x], '/');
    }
    return this.realimag()['/'](x);
};
_['%'] = function (x) {
    return sup.Real([this, x], '%');
};
_['@-'] = function () {
    if(this.operator === '@-') {
        return this[0];
    }
    return sup.Real([this], '@-');
};
_['^'] = function (x) {
    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
            return sup.Real([this[0]['^'](x), this[1]['^'](x)], this.operator);
        }
    }
    return Expression.Symbol.Real.prototype['^'].call(this, x);
    
};

_.differentiate = function (x) {

    if (this.operator === '+' ||
        this.operator === '-' ||
        this.operator === '@-') {

        return this[0].differentiate(x)[this.operator](this[1] && this[1].differentiate(x));
    
    } else if (this.operator === '*' || this.operator === undefined) {

        if(this[0] instanceof Expression.Function) {

            var da = this[1].differentiate(x);
            if(da === Global.Zero) return da;

            return this[0].differentiate().default(this[1])['*'](da);
        }

        return this[0][this.operator](
            this[1].differentiate(x)
        )['+'](this[1][this.operator](
            this[0].differentiate(x)
        ));

    } else if (this.operator === '/') {

        return this[1]['*'](
            this[0].differentiate(x)
        )['-'](
            this[0]['*'](
                this[1].differentiate(x)
            )
        )[this.operator](
            this[1]['*'](this[1])
        );
    } else if (this.operator === '^') {

        var df = this[0].differentiate(x);
        var dg = this[1].differentiate(x);

        if (df === Global.Zero) {
            if (dg === Global.Zero) return dg;

            return dg.default(
                Global.log.default(this[0])
            ).default(this);
        }

        var fa = this[0]['^'](
            this[1]['-'](Global.One)
        );

        return fa.default(
            df.default(this[1])['+'](
                this[0]['*'](
                    Global.log.default(this[0])
                )['*'](
                    dg
                )
            )
        );
    }
};

_.roots = function (x) {
	console.log(sup);
};

_._s = function (Code, lang) {

    var language = Code.language;
    function paren(x) {
        if(lang === 'text/latex') {
            return '\\left(' + x + '\\right)'; 
        }
        return '(' + x + ')';
    }
    if (this.operator === undefined) {
        if (this[0] instanceof Expression.Function) {
            if(this[0] === Global.abs) {

                var c1 = this[1]._s(Code, lang);

                if(lang === 'text/latex') {
                    return c1.update('\\left|' + c1.s + '\\right|', Infinity);
                }
                var c0 = this[0]._s(Code, lang);
                return c1.update(c0.s + '(' + c1.s + ')', Infinity);
            }
            var c0 = this[0]._s(Code, lang);
            if (this[1] instanceof Expression.Vector) {
                var c1s = Array.prototype.map.call(this[1], function (c) {
                    return c._s(Code, lang);
                });
                var i;
                var t_s = c1s.map(function (e){
                    return e.s;
                });
                if(this[0] === Global.atan) {
                    t_s = t_s.reverse();
                }
                var c0_s = c0.s;
                for (i = 0; i < c1s.length; i++) {
                    c0.merge(c1s[i]);
                }
                return c0.update(c0_s + paren(t_s), language.operators.default.precedence);
            }
            var c1 = this[1]._s(Code, lang);
            return c0.merge(c1, c0.s + paren(c1.s), language.operators.default.precedence);
        } else {
            this.operator = '*';
        }
    }
    var p = language.operators[this.operator].precedence;
    var assoc = language.operators[this.operator] === 0;
    function _(x) {
        if(p > x.p || !assoc){
            return paren(x.s);
        }
        return x.s;
    }

    if(this.operator === '^') {

        if(lang === 'x-shader/x-fragment') {
            if(this[0] === Global.e) {
                var c1 = this[1]._s(Code, lang);
                return c1.update('exp(' + c1.s + ')');
            }
            if(this[1] instanceof Expression.Integer && this[1].a < 5 && this[1].a > -1) {
                var c0 = this[0]._s(Code, lang);
                var j = language.operators['*'].precedence;
                
                var pre = undefined;
                var cs;
                if(this[0] instanceof Expression.Symbol) {
                    cs = c0.s;
                } else {
                    
                    cs = c0.variable();
                    
                    pre = 'float ' + cs + ' = ' + c0.s + ';';
                
                }
                var s = cs;
                var i;
                for(i = 1; i < this[1].a; i++) {
                    s+= '*' + cs;
                }
                return c0.update('(' + s + ')', Infinity, pre);
            }
            if(this[1] instanceof Expression.Integer && this[1].a == -1) {
                var c0 = this[0]._s(Code, lang);
                // todo: precedence not necessary
                return c0.update('(1.0/(' + c0.s + '))');
            }
            if(this[1] instanceof Expression.Rational) {
                // a^2, 3, 4, 5, 6 
                // unsure it is gcd
                this[1] = this[1].reduce();
                var even = this[1].a % 2 ? false : true;
                if(even) {
                    var c1 = this[1]._s(Code, lang);
                    var c0 = this[0]._s(Code, lang);
                    
                    return c0.merge(c1, 'pow(' + c0.s + ',' + c1.s  + ')');
                } else {

                    // x^(a) = (x) * x^(a-1)
                    var c1 = this[1]['-'](Global.One)._s(Code, lang);
                    var c0 = this[0]._s(Code, lang);
                    
                    return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ',' + c1.s + '))');
                }
            }
            if (this[0] instanceof Expression.NumericalReal) {

                // Neg or pos.
                var c1 = this[1]['-'](Global.One)._s(Code, lang);
                var c0 = this[0]._s(Code, lang);
                
                return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
                
            }
            var c1 = this[1]['-'](Global.One)._s(Code, lang);
            var c0 = this[0]._s(Code, lang);
                
            // Needs a new function, dependent on power.
            return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
            
        } else if(lang === 'text/javascript') {
            if(this[0] === Global.e) {
                var c1 = this[1]._s(Code, lang);
                return c1.update('Math.exp(' + c1.s + ')');
            }

            var c1 = this[1]._s(Code, lang);
            var c0 = this[0]._s(Code, lang);

            if(this[1] instanceof Expression.Rational) {
                // a^2, 3, 4, 5, 6 
                var even = this[1].a % 2 ? false : true;

                if(even) {
                    return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
                } else {
                    return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
                }
            } else {
                
                // Needs a new function, dependent on power.
                return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
            }
            
        } else if (lang === 'text/latex'){
            var c0 = this[0]._s(Code, lang);
            var c1 = this[1]._s(Code, lang);
            return c0.merge(c1, _(c0) + '^' + '{' + c1.s + '}')
        }
    }

    var c0 = this[0]._s(Code, lang);

    if(this.operator[0] === '@') {
        return c0.update(this.operator[1] + _(c0), p);
    }

    var c1 = this[1]._s(Code, lang);
    
    if(lang === 'text/latex') {
        if(this.operator === '/') {
            return c0.merge(c1, '\\frac{' + c0.s + '}{' + c1.s + '}')
        }
        if(this.operator === '*') {
            return c0.merge(c1, _(c0) + _(c1), p);
        }
    } else if (lang === 'x-shader/x-fragment') {
        if(this.operator === '%') {
            return c0.merge(c1, 'mod(' + _(c0) + ',' + _(c1) + ')', p);
        }
    }

    return c0.merge(c1, _(c0) + this.operator + _(c1), p);
};


})()
},{"util":11,"../":27,"../../../global":9,"../../":8}],32:[function(require,module,exports){
(function(){var util = require('util'),
    sup  = require('../'),
    Global = require('../../../global');

var Expression = require('../../');

module.exports = Symbol_Real;

util.inherits(Symbol_Real, sup);

function Symbol_Real(str) {
    this.symbol = str;
}

var _ = Symbol_Real.prototype;

_.realimag = function() {
    return Expression.List.ComplexCartesian([this, Global.Zero]);
};
_.real = function() {
    return this;
};
_.imag = function() {
    return Global.Zero;
};
_.polar = function() {
    return Expression.List.ComplexPolar([
        Expression.List.Real([Global.abs, this]),
        Expression.List.Real([Global.arg, this])
    ]);
};
_.abs = function() {
    return Expression.List.Real([Global.abs, this]);
};
_.arg = function() {
    return Expression.List.Real([Global.arg, this]);
};

_['+'] = function (x) {
    if (x === Global.Zero) {
        return this;
    }

    if(x instanceof Expression.NumericalReal) {
        return new Expression.List.Real([this, x], '+');
    }
    if(x instanceof Expression.Symbol.Real) {
        return new Expression.List.Real([this, x], '+');
    }
    if(x instanceof Expression.Symbol) {
        return new Expression.List([this, x], '+');
    }
    return x['+'](this);
};
_['-'] = function (x) {
    if(this === x) {
        return Global.Zero;
    }
    if(x instanceof Expression.Symbol.Real) {
        return new Expression.List.Real([this, x], '-');
    }
    if(x instanceof Expression.List.Real) {
        if (x.operator === '@-') {
            return new Expression.List.Real([this, x[0]], '+');
        }
        return new Expression.List.Real([this, x], '-');
    }
    if(x instanceof Expression.Symbol) {
        return new Expression.List([this, x], '-');
    }
    
    return x['@-']()['+'](this);
};

_['@+'] = function (x) {
    return Expression.List.Real([this], '@+');
};

_['@-'] = function (x) {
    return Expression.List.Real([this], '@-');
};

_['*'] = function (x) {

    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return Global.Zero;
        }
    }
    if(x instanceof Expression.Symbol.Real) {
        return new Expression.List.Real([this, x], '*');
    }
    if(x instanceof Expression.List.Real) {
        return x['*'](this);
    }
    if(x instanceof Expression.Symbol) {
        return new Expression.List([this, x], '*');
    }
    if(x instanceof Expression.NumericalReal) {
        return new Expression.List.Real([x, this], '*');
    }
    if(x instanceof Expression.NumericalComplex) {
        return new Expression.List.Real([this, x], '*');
    }
    if(x instanceof Expression.List.ComplexCartesian) {
        return x['*'](this);
    }
    return x['*'](this);
};
_.apply = _['*'];
_['/'] = function (x) {

    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            throw('Division by zero');
        }
    }
    
    return Expression.List.Real([this, x], '/');
};
_['^'] = function (x) {
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return Global.One;
        }
    }
    
    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if (x instanceof Expression.Integer) {
        return Expression.List.Real([this, x], '^');
    } else if(x instanceof Expression.Rational) {
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return Expression.List.Real([this, x], '^');
        }
    }
    return Expression.List([this, x], '^');
};
_['%'] = function (x) {
    return Expression.List.Real([this, x], '%');
};
_.applyOld = function(operator, e) {
    throw("Real.apply");
    // if (operator === ',') {
    //     //Maybe this should be a new object type??? Vector?
    //     console.log('APPLY: ', this.constructor, this, e);
    //     return Expression.Vector([this, e]);
    // } else if (operator === '=') {
    //     return Expression.Equation([this, e], operator);
    // }
    // if (e === undefined) {
    //     //Unary:
    //     switch (operator) {
    //         case '!':
    //             //TODO: Can't simplify, so why bother! (return a list, since gamma maps all reals to reals?)
    //             return Global.Gamma.apply(undefined, this.apply('+', Global.One));
    //         case '@-':
    //             return Expression.List.Real([this], operator);
    //         default:
    //     }
    //     throw('Real Symbol('+this.symbol+') could not handle operator '+ operator);
    // } else {
    //     // Simplification:
    //     switch (e.constructor){
    //         case Expression.Symbol.Real:
    //         case Expression.List.Real:
    //             /*if(this.positive && e.positive) {
    //                 return Expression.List.Real([this, e], operator);
    //             }*/
    //             switch(operator) {
    //                 case '^':
    //                     //TODO: Bad idea? This will stay in this form until realimag() is called by user, and user only.
    //                     //return Expression.List([this, e], operator);
    //                     return Expression.List.ComplexPolar([
    //                         Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
    //                         Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
    //                     ]);
    //                 case undefined:
    //                     return Expression.List.Real([this, e], '*');
    //                 default:
    //                     return Expression.List.Real([this, e], operator);
    //             }
    //         case Expression.NumericalReal:
    //             switch(operator){
    //                 case '+':
    //                 case '-':
    //                     if(e.value === 0){
    //                         return this;
    //                     }
    //                     return Expression.List.Real([this, e], operator);
    //                     break;
    //                 case undefined:
    //                 case '*':
    //                     if(e.value === 1){
    //                         return this;
    //                     } else if(e.value === 0){
    //                         return Global.Zero;
    //                     }
    //                     return Expression.List.Real([this, e], '*');
    //                     break;
    //                 case '%':
    //                     return Expression.List.Real([this, e], '%');
    //                 case '^':
    //                     if(e.value === 1){
    //                         return this;
    //                     } else if(e.value === 0){
    //                         return Global.One;
    //                     }
    //                     if(false && opengl_TODO_hack() && e.value === ~~e.value){
    //                         return Expression.List.Real([this, e], operator);
    //                     }
    //                     return Expression.List.ComplexPolar([
    //                         Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
    //                         Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
    //                     ]);
                        
    //                     break;
    //                 case '/':
    //                     if(e.value === 1){
    //                         return this;
    //                     } else if(e.value === 0){
    //                         return Global.Infinity;
    //                     }
    //                     return Expression.List.Real([this, e], operator);
    //                     break;
    //             }
    //             break;
    //         case Expression.Complex:
    //             return this.realimag().apply(operator, e); // GO to above (will apply reals)
    //             break;
    //         case Expression.List.ComplexCartesian:
    //             //Maybe there is a way to swap the order? (e.g. a .real = true property for other things to check)
    //             //or instance of Expression.Real ?
    //             switch(operator) {
    //                 case '+':
    //                 case '-':
    //                     return Expression.List.ComplexCartesian([
    //                         this.apply(operator, e[0]),
    //                         e[1]
    //                     ]);
    //                 case undefined:
    //                     operator = '*';
    //                 case '*':
    //                     return Expression.List.ComplexCartesian([
    //                         this.apply(operator, e[0]),
    //                         this.apply(operator, e[1])
    //                     ]);
    //                 case '/':
    //                     var cc_dd = e[0].apply('*',e[0]).apply('+',e[1].apply('*',e[1]));
    //                     return Expression.List.ComplexCartesian([
    //                         (this.apply('*',e[0])).apply('/', cc_dd),
    //                         this.apply('*',e[1]).apply('/', cc_dd).apply('@-')
    //                     ]);
    //             }
    //         case Expression.List.ComplexPolar:
    //             //Maybe there is a way to swap the order?
    //             return this.polar().apply(operator, e);
    //     }
    //     throw('LIST FROM REAL SYMBOL! '+ operator, e.constructor);
    //     return Expression.List([this, e], operator);
    // }
};


})()
},{"util":11,"../../../global":9,"../":29,"../../":8}],33:[function(require,module,exports){
var util = require('util'),
    sup = require('../'),
    Expression = require('../../');

module.exports = SymbolicEFunction;

util.inherits(SymbolicEFunction, sup);

function SymbolicEFunction(expr, vars) {
    this.expr = expr;
    this.symbols = vars;
    
};
var _ = SymbolicEFunction.prototype;
_.default = function (x) {
    if (x.constructor !== Expression.Vector) {
        x = Expression.Vector([x]);
    }
    var expr = this.expr;
    var i, l = this.symbols.length;
    if (l !== x.length) {
        throw ('Invalid domain. Element of F^' + l + ' expected.');
    }
    for(i = 0; i < l; i++) {
        expr = expr.sub(this.symbols[i], x[i])
    }
    return expr;
};
},{"util":11,"../":30,"../../":8}],26:[function(require,module,exports){
// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util'),
    sup  = require('../'),
    Expression = require('../../');

module.exports = ComplexPolar;

util.inherits(ComplexPolar, sup);

function ComplexPolar (x){
    x.__proto__ = ComplexPolar.prototype;
    return x;
}
var _ = ComplexPolar.prototype;

_.polar = function(){
    return this;
};
_.realimag = function() {
    //TODO: Return Expression.List.ComplexCartesian
    return Expression.List.ComplexCartesian([
        this[0].apply('*', Global.cos.apply(undefined, this[1])),
        this[0].apply('*', Global.sin.apply(undefined, this[1]))
    ]);
};
_.real = function() {
    return this[0].apply('*', Global.cos.apply(undefined, this[1]));
};
_.imag = function() {
    return this[0].apply('*', Global.sin.apply(undefined, this[1]));
};
_.conjugate = function() {
    return ComplexPolar([
        this[0],
        this[1].apply('@-')
    ]);
};
_.differentiate = function(x){
    // d/dx a(x) * e^(ib(x))
    
    //TODO ensure below  f' + if g' part is realimag (f', fg')
    return Global.e
    .apply(
        '^',
        Global.i
        .apply('*',
            this[1]
        )
    )
    .apply('*',
        this[0].differentiate(x)
        .apply('+',
            Global.i
            .apply('*',
                this[0]
            )
            .apply('*',
                this[1].differentiate(x)
            )
        )
    );
};
// _.apply = function(o, x) {
//     if (x.constructor === this.constructor) {
//         switch (o) {
//             case undefined:
//             case '*':
//                 //Fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('*', x[0]),
//                     this[1].apply('+', x[1])
//                 ]);
//             case '/':
//                 //Also fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('/', x[0]),
//                     this[1].apply('-', x[1])
//                 ]);
//             case '+':
//             case '-':
//                 //Very slow, maybe we should switch to cartesian now?
            
//             case '^':
//                 //(Ae^(ik)) ^ (Be^(ij))
//                 //How slow is this?
//                 //Very fast for real numbers though
//             case '!':
//             default:
            
//         }
//     } else if (x.constructor === Expression.NumericalReal) {
//         switch (o) {
//             case undefined:
//             case '*':
//                 //Fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('*', x),
//                     this[1]
//                 ]);
//             case '/':
//                 //Also fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('/', x),
//                     this[1]
//                 ]);
//             case '+':
//             case '-':
//                 //Very slow, maybe we should switch to cartesian now?
            
//             case '^':
//                 //Fast:
//                 return Expression.List.ComplexPolar([
//                     this[0],
//                     this[1].apply('*', x)
//                 ]);
//             case '!':
//             default:
            
//         }
//     } else if (x.constructor === Expression.Complex) {
//         switch (o) {
//             case undefined:
//             case '*':
//                 //Fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('*', new Expression.NumericalReal(x._real)),
//                     this[1].apply('+', new Expression.NumericalReal(x._imag))
//                 ]);
//             case '/':
//                 //Also fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('/', new Expression.NumericalReal(x._real)),
//                     this[1].apply('-', new Expression.NumericalReal(x._imag))
//                 ]);
//             case '+':
//             case '-':
//                 //Very slow, maybe we should switch to cartesian now?
            
//             case '^':
//                 //(Ae^(ik)) ^ (Be^(ij))
//                 //How slow is this?
//                 //Very fast for real numbers though
//             case '!':
//             default:
            
//         }
//     }
    
// };
_.abs = function (){
    return this[0];
};
_.arg = function (){
    return this[1];
};

},{"util":11,"../../":8,"../":27}],35:[function(require,module,exports){
(function(){var util  = require('util'),
    sup   = require('../'),
    Global = require('../../global'),
    Expression = require('../');

module.exports = Infinitesimal;
util.inherits(Infinitesimal, sup);
function Infinitesimal(x) {
    this.x = x;
}
var _ = Infinitesimal.prototype;

_['+'] = function (x) {
    if(x instanceof Infinitesimal) {
        throw new Error('Infinitesimal addition');
    }
    return x;
};
_['/'] = function (x) {
    if(x instanceof Infinitesimal) {
        if(x.x instanceof Expression.Symbol) {
            return this.x.differentiate(x.x);
        }
        throw new Error('Confusing infitesimal division');
    }
    this.x = this.x['/'](x);
    return this;
};
_['*'] = function (x) {
    // d^2 = 0
    if(x instanceof Infinitesimal) {
        return Global.Zero;
    }
    this.x = this.x['*'](x);
};
_.s = function (lang) {
    if(lang !== 'text/latex') {
        throw new Error('Infinitesimal numbers cannot be exported to programming languages');
    }
    var c = this.x.s(lang);
    var p = language.precedence('default')
    if(p > c.p) {
        c.s = '\\left(' + c.s + '\\right)';
    }
    return c.update('d' + c.s, p);
};

})()
},{"util":11,"../":8,"../../global":9}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxub2RlX21vZHVsZXNcXHByb2Nlc3NcXGJyb3dzZXIuanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcaW5kZXguanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEVycm9yXFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXGdsb2JhbFxcaW5kZXguanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbm9kZV9tb2R1bGVzXFxicm93c2VyLXJlc29sdmVcXGJ1aWx0aW5cXHV0aWwuanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbm9kZV9tb2R1bGVzXFxicm93c2VyLXJlc29sdmVcXGJ1aWx0aW5cXGV2ZW50cy5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxncmFtbWFyXFxwYXJzZXIuanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxnbG9iYWxcXGRlZmF1bHRzLmpzIiwiQzpcXFVzZXJzXFxMQVBUT1BcXGdpdFxcamF2YXNjcmlwdC1jYXNcXGxpYlxcTGFuZ3VhZ2VcXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxMQVBUT1BcXGdpdFxcamF2YXNjcmlwdC1jYXNcXGxpYlxcTGFuZ3VhZ2VcXGRlZmF1bHQuanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxDb250ZXh0XFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxMQVBUT1BcXGdpdFxcamF2YXNjcmlwdC1jYXNcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1yZXNvbHZlXFxidWlsdGluXFxmcy5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxub2RlX21vZHVsZXNcXGJyb3dzZXItcmVzb2x2ZVxcYnVpbHRpblxccGF0aC5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXExhbmd1YWdlXFxDb2RlLmpzIiwiQzpcXFVzZXJzXFxMQVBUT1BcXGdpdFxcamF2YXNjcmlwdC1jYXNcXGxpYlxcTGFuZ3VhZ2VcXHN0cmluZ2lmeS5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXE51bWVyaWNhbENvbXBsZXguanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxOdW1lcmljYWxSZWFsLmpzIiwiQzpcXFVzZXJzXFxMQVBUT1BcXGdpdFxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcQ29uc3RhbnQuanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxSYXRpb25hbC5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXEludGVnZXIuanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxMYW5ndWFnZVxccGFyc2UuanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxMaXN0XFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXFN5bWJvbFxcaW5kZXguanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxGdW5jdGlvblxcaW5kZXguanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxWZWN0b3JcXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxMQVBUT1BcXGdpdFxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcU3RhdGVtZW50XFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXE1hdHJpeFxcaW5kZXguanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxMaXN0XFxDb21wbGV4Q2FydGVzaWFuXFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXExpc3RcXFJlYWxcXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxMQVBUT1BcXGdpdFxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcU3ltYm9sXFxSZWFsXFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcTEFQVE9QXFxnaXRcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXEZ1bmN0aW9uXFxTeW1ib2xpY1xcaW5kZXguanMiLCJDOlxcVXNlcnNcXExBUFRPUFxcZ2l0XFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxMaXN0XFxDb21wbGV4UG9sYXJcXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxMQVBUT1BcXGdpdFxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcSW5maW5pdGVzaW1hbFxcaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9WQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM3dCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNodEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7J3VzZSBzdHJpY3QnO1xuXG52YXIgTSA9IHJlcXVpcmUoJy4vbGliJyk7XG5pZiAocHJvY2Vzcy5lbnYuSlNDQVNfQ09WRVJBR0Upe1xuICB2YXIgZGlyID0gJy4vbGliLWNvdic7XG4gIE0gPSByZXF1aXJlKGRpcik7XG59XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBfTSA9IHdpbmRvdy5NO1xuICAgIHdpbmRvdy5NID0gTTtcbiAgICBNLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5NID0gX007XG4gICAgICAgIHJldHVybiBNO1xuICAgIH07XG59XG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IE07XG59XG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIoZnVuY3Rpb24oKXsvKmpzbGludCBub2RlOiB0cnVlICovXG5cbi8vIG5vdCBzdXJlIGlmIHRoaXMgaXMgcmVxdWlyZWQ6XG4vKmpzaGludCBzdWI6IHRydWUgKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBFeHByZXNzaW9uICA9IHJlcXVpcmUoJy4vRXhwcmVzc2lvbicpLFxuICAgIENvbnRleHQgICAgID0gcmVxdWlyZSgnLi9Db250ZXh0JyksXG4gICAgTWF0aEVycm9yICAgPSByZXF1aXJlKCcuL0Vycm9yJyksXG4gICAgbGFuZ3VhZ2UgICAgPSByZXF1aXJlKCcuL0xhbmd1YWdlL2RlZmF1bHQnKSxcbiAgICBDb2RlICAgICAgICA9IHJlcXVpcmUoJy4vTGFuZ3VhZ2UnKS5Db2RlLFxuICAgIEdsb2JhbCAgICAgID0gcmVxdWlyZSgnLi9nbG9iYWwnKTtcblxuLy8gRGVmaW5lIHNpbiwgY29zLCB0YW4sIGV0Yy5cbnZhciBkZWZhdWx0cyAgICA9IHJlcXVpcmUoJy4vZ2xvYmFsL2RlZmF1bHRzJyk7XG5kZWZhdWx0cy5hdHRhY2goR2xvYmFsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBNO1xuXG5mdW5jdGlvbiBNKGUsIGMpIHtcbiAgICByZXR1cm4gbGFuZ3VhZ2UucGFyc2UoZSwgYyB8fCBHbG9iYWwpO1xufVxuXG5NLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFtcbiAgICAnZnVuY3Rpb24gTShleHByZXNzaW9uLCBjb250ZXh0KSB7JyxcbiAgICAnICAgIC8qIScsXG4gICAgJyAgICAgKiAgTWF0aCBKYXZhU2NyaXB0IExpYnJhcnkgdjMuOS4xJyxcbiAgICAnICAgICAqICBodHRwczovL2dpdGh1Yi5jb20vYWFudHRob255L2phdmFzY3JpcHQtY2FzJyxcbiAgICAnICAgICAqICAnLFxuICAgICcgICAgICogIENvcHlyaWdodCAyMDEwIEFudGhvbnkgRm9zdGVyLiBBbGwgcmlnaHRzIHJlc2VydmVkLicsXG4gICAgJyAgICAgKi8nLFxuICAgICcgICAgW2F3ZXNvbWUgY29kZV0nLFxuICAgICd9J10uam9pbignXFxuJyk7XG59O1xuXG5NWydDb250ZXh0J10gICAgPSBDb250ZXh0O1xuTVsnRXhwcmVzc2lvbiddID0gRXhwcmVzc2lvbjtcbk1bJ0dsb2JhbCddICAgICA9IEdsb2JhbDtcbk1bJ0Vycm9yJ10gICAgICA9IE1hdGhFcnJvcjtcblxuRXhwcmVzc2lvbi5wcm90b3R5cGUucyA9IGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgQ29kZS5sYW5ndWFnZSA9IGxhbmd1YWdlO1xuICAgIENvZGUubmV3Q29udGV4dCgpO1xuICAgIHJldHVybiB0aGlzLl9zKENvZGUsIGxhbmcpO1xufTtcbkV4cHJlc3Npb24ucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzLnMoJ3RleHQvamF2YXNjcmlwdCcpLmNvbXBpbGUoeCk7XG59XG5cbnZhciBleHRlbnNpb25zID0ge307XG5cbk1bJ3JlZ2lzdGVyJ10gPSBmdW5jdGlvbiAobmFtZSwgaW5zdGFsbGVyKXtcbiAgICBpZihFeHByZXNzaW9uLnByb3RvdHlwZVtuYW1lXSkge1xuICAgICAgICB0aHJvdygnTWV0aG9kIC4nICsgbmFtZSArICcgaXMgYWxyZWFkeSBpbiB1c2UhJyk7XG4gICAgfVxuICAgIGV4dGVuc2lvbnNbbmFtZV0gPSBpbnN0YWxsZXI7XG59O1xuXG5NWydsb2FkJ10gPSBmdW5jdGlvbihuYW1lLCBjb25maWcpIHtcbiAgICBleHRlbnNpb25zW25hbWVdKE0sIEV4cHJlc3Npb24sIGNvbmZpZyk7XG4gICAgZGVsZXRlIGV4dGVuc2lvbnNbbmFtZV07XG59O1xuXG59KSgpIiwiZnVuY3Rpb24gTWF0aEVycm9yKHN0cikge1xuICAgIHRoaXMubWVzc2FnZSA9IHN0cjtcbn1cbk1hdGhFcnJvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTWF0aEVycm9yO1xuIiwidmFyIGNvbnRleHQgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb250ZXh0O1xuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuZXhwb3J0cy5pc0RhdGUgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nfTtcbmV4cG9ydHMuaXNSZWdFeHAgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSd9O1xuXG5cbmV4cG9ydHMucHJpbnQgPSBmdW5jdGlvbiAoKSB7fTtcbmV4cG9ydHMucHV0cyA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5kZWJ1ZyA9IGZ1bmN0aW9uKCkge307XG5cbmV4cG9ydHMuaW5zcGVjdCA9IGZ1bmN0aW9uKG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycykge1xuICB2YXIgc2VlbiA9IFtdO1xuXG4gIHZhciBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHtcbiAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3NcbiAgICB2YXIgc3R5bGVzID1cbiAgICAgICAgeyAnYm9sZCcgOiBbMSwgMjJdLFxuICAgICAgICAgICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgICAgICAgICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICAgICAgICAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgICAgICAgICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICAgICAgICAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICAgICAgICAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAgICAgICAgICdibHVlJyA6IFszNCwgMzldLFxuICAgICAgICAgICdjeWFuJyA6IFszNiwgMzldLFxuICAgICAgICAgICdncmVlbicgOiBbMzIsIDM5XSxcbiAgICAgICAgICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgICAgICAgICAncmVkJyA6IFszMSwgMzldLFxuICAgICAgICAgICd5ZWxsb3cnIDogWzMzLCAzOV0gfTtcblxuICAgIHZhciBzdHlsZSA9XG4gICAgICAgIHsgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICAgICAgICAgJ251bWJlcic6ICdibHVlJyxcbiAgICAgICAgICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAgICAgICAgICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICAgICAgICAgJ251bGwnOiAnYm9sZCcsXG4gICAgICAgICAgJ3N0cmluZyc6ICdncmVlbicsXG4gICAgICAgICAgJ2RhdGUnOiAnbWFnZW50YScsXG4gICAgICAgICAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgICAgICAgICAncmVnZXhwJzogJ3JlZCcgfVtzdHlsZVR5cGVdO1xuXG4gICAgaWYgKHN0eWxlKSB7XG4gICAgICByZXR1cm4gJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgICAnXFwwMzNbJyArIHN0eWxlc1tzdHlsZV1bMV0gKyAnbSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICB9O1xuICBpZiAoISBjb2xvcnMpIHtcbiAgICBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHsgcmV0dXJuIHN0cjsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gICAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAgIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUuaW5zcGVjdCA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgICAgdmFsdWUgIT09IGV4cG9ydHMgJiZcbiAgICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuXG4gICAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcblxuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG5cbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcblxuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gICAgfVxuICAgIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBzdHlsaXplKCdudWxsJywgJ251bGwnKTtcbiAgICB9XG5cbiAgICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gICAgdmFyIHZpc2libGVfa2V5cyA9IE9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICB2YXIga2V5cyA9IHNob3dIaWRkZW4gPyBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSkgOiB2aXNpYmxlX2tleXM7XG5cbiAgICAvLyBGdW5jdGlvbnMgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmIGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEYXRlcyB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzdHlsaXplKHZhbHVlLnRvVVRDU3RyaW5nKCksICdkYXRlJyk7XG4gICAgfVxuXG4gICAgdmFyIGJhc2UsIHR5cGUsIGJyYWNlcztcbiAgICAvLyBEZXRlcm1pbmUgdGhlIG9iamVjdCB0eXBlXG4gICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB0eXBlID0gJ0FycmF5JztcbiAgICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGUgPSAnT2JqZWN0JztcbiAgICAgIGJyYWNlcyA9IFsneycsICd9J107XG4gICAgfVxuXG4gICAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIGJhc2UgPSAoaXNSZWdFeHAodmFsdWUpKSA/ICcgJyArIHZhbHVlIDogJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgICB9IGVsc2Uge1xuICAgICAgYmFzZSA9ICcnO1xuICAgIH1cblxuICAgIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICBiYXNlID0gJyAnICsgdmFsdWUudG9VVENTdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICAgIH1cblxuICAgIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2Vlbi5wdXNoKHZhbHVlKTtcblxuICAgIHZhciBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBuYW1lLCBzdHI7XG4gICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXykge1xuICAgICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwU2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19sb29rdXBTZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodmlzaWJsZV9rZXlzLmluZGV4T2Yoa2V5KSA8IDApIHtcbiAgICAgICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgICAgIH1cbiAgICAgIGlmICghc3RyKSB7XG4gICAgICAgIGlmIChzZWVuLmluZGV4T2YodmFsdWVba2V5XSkgPCAwKSB7XG4gICAgICAgICAgaWYgKHJlY3Vyc2VUaW1lcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHZhbHVlW2tleV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgPSBmb3JtYXQodmFsdWVba2V5XSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodHlwZSA9PT0gJ0FycmF5JyAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgICAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgICAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgICAgICBuYW1lID0gc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICAgICAgbmFtZSA9IHN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbiAgICB9KTtcblxuICAgIHNlZW4ucG9wKCk7XG5cbiAgICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICAgIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgICAgbnVtTGluZXNFc3QrKztcbiAgICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICAgIHJldHVybiBwcmV2ICsgY3VyLmxlbmd0aCArIDE7XG4gICAgfSwgMCk7XG5cbiAgICBpZiAobGVuZ3RoID4gNTApIHtcbiAgICAgIG91dHB1dCA9IGJyYWNlc1swXSArXG4gICAgICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgIGJyYWNlc1sxXTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQgPSBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuICByZXR1cm4gZm9ybWF0KG9iaiwgKHR5cGVvZiBkZXB0aCA9PT0gJ3VuZGVmaW5lZCcgPyAyIDogZGVwdGgpKTtcbn07XG5cblxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gYXIgaW5zdGFuY2VvZiBBcnJheSB8fFxuICAgICAgICAgQXJyYXkuaXNBcnJheShhcikgfHxcbiAgICAgICAgIChhciAmJiBhciAhPT0gT2JqZWN0LnByb3RvdHlwZSAmJiBpc0FycmF5KGFyLl9fcHJvdG9fXykpO1xufVxuXG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiByZSBpbnN0YW5jZW9mIFJlZ0V4cCB8fFxuICAgICh0eXBlb2YgcmUgPT09ICdvYmplY3QnICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nKTtcbn1cblxuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICBpZiAoZCBpbnN0YW5jZW9mIERhdGUpIHJldHVybiB0cnVlO1xuICBpZiAodHlwZW9mIGQgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gIHZhciBwcm9wZXJ0aWVzID0gRGF0ZS5wcm90b3R5cGUgJiYgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMoRGF0ZS5wcm90b3R5cGUpO1xuICB2YXIgcHJvdG8gPSBkLl9fcHJvdG9fXyAmJiBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyhkLl9fcHJvdG9fXyk7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShwcm90bykgPT09IEpTT04uc3RyaW5naWZ5KHByb3BlcnRpZXMpO1xufVxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbiAobXNnKSB7fTtcblxuZXhwb3J0cy5wdW1wID0gbnVsbDtcblxudmFyIE9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSByZXMucHVzaChrZXkpO1xuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBPYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlLCBwcm9wZXJ0aWVzKSB7XG4gICAgLy8gZnJvbSBlczUtc2hpbVxuICAgIHZhciBvYmplY3Q7XG4gICAgaWYgKHByb3RvdHlwZSA9PT0gbnVsbCkge1xuICAgICAgICBvYmplY3QgPSB7ICdfX3Byb3RvX18nIDogbnVsbCB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm90b3R5cGUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICd0eXBlb2YgcHJvdG90eXBlWycgKyAodHlwZW9mIHByb3RvdHlwZSkgKyAnXSAhPSBcXCdvYmplY3RcXCcnXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBUeXBlID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgICAgICBvYmplY3QgPSBuZXcgVHlwZSgpO1xuICAgICAgICBvYmplY3QuX19wcm90b19fID0gcHJvdG90eXBlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHByb3BlcnRpZXMgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKG9iamVjdCwgcHJvcGVydGllcyk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5leHBvcnRzLmluaGVyaXRzID0gZnVuY3Rpb24oY3Rvciwgc3VwZXJDdG9yKSB7XG4gIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yO1xuICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdF9jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICB2YWx1ZTogY3RvcixcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9XG4gIH0pO1xufTtcblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKHR5cGVvZiBmICE9PSAnc3RyaW5nJykge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChleHBvcnRzLmluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOiByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvcih2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pe1xuICAgIGlmICh4ID09PSBudWxsIHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBleHBvcnRzLmluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe2lmICghcHJvY2Vzcy5FdmVudEVtaXR0ZXIpIHByb2Nlc3MuRXZlbnRFbWl0dGVyID0gZnVuY3Rpb24gKCkge307XG5cbnZhciBFdmVudEVtaXR0ZXIgPSBleHBvcnRzLkV2ZW50RW1pdHRlciA9IHByb2Nlc3MuRXZlbnRFbWl0dGVyO1xudmFyIGlzQXJyYXkgPSB0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJ1xuICAgID8gQXJyYXkuaXNBcnJheVxuICAgIDogZnVuY3Rpb24gKHhzKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nXG4gICAgfVxuO1xuZnVuY3Rpb24gaW5kZXhPZiAoeHMsIHgpIHtcbiAgICBpZiAoeHMuaW5kZXhPZikgcmV0dXJuIHhzLmluZGV4T2YoeCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoeCA9PT0geHNbaV0pIHJldHVybiBpO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW5cbi8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxuLy8gaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG4vL1xuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbnZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzID0gbjtcbn07XG5cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNBcnJheSh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSlcbiAgICB7XG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgYXJndW1lbnRzWzFdOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gZmFsc2U7XG4gIHZhciBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBpZiAoIWhhbmRsZXIpIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIGhhbmRsZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoaXNBcnJheShoYW5kbGVyKSkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIHZhciBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vLyBFdmVudEVtaXR0ZXIgaXMgZGVmaW5lZCBpbiBzcmMvbm9kZV9ldmVudHMuY2Ncbi8vIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCgpIGlzIGFsc28gZGVmaW5lZCB0aGVyZS5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhZGRMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT0gXCJuZXdMaXN0ZW5lcnNcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJzXCIuXG4gIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHtcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgICB2YXIgbTtcbiAgICAgIGlmICh0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbSA9IHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtID0gZGVmYXVsdE1heExpc3RlbmVycztcbiAgICAgIH1cblxuICAgICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYub24odHlwZSwgZnVuY3Rpb24gZygpIHtcbiAgICBzZWxmLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlbW92ZUxpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzQXJyYXkobGlzdCkpIHtcbiAgICB2YXIgaSA9IGluZGV4T2YobGlzdCwgbGlzdGVuZXIpO1xuICAgIGlmIChpIDwgMCkgcmV0dXJuIHRoaXM7XG4gICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgaWYgKGxpc3QubGVuZ3RoID09IDApXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9IGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSA9PT0gbGlzdGVuZXIpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAodHlwZSAmJiB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBudWxsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBbXTtcbiAgaWYgKCFpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgfVxuICByZXR1cm4gdGhpcy5fZXZlbnRzW3R5cGVdO1xufTtcblxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsIihmdW5jdGlvbihwcm9jZXNzKXsvKiBwYXJzZXIgZ2VuZXJhdGVkIGJ5IGppc29uIDAuNC4xNyAqL1xuLypcbiAgUmV0dXJucyBhIFBhcnNlciBvYmplY3Qgb2YgdGhlIGZvbGxvd2luZyBzdHJ1Y3R1cmU6XG5cbiAgUGFyc2VyOiB7XG4gICAgeXk6IHt9XG4gIH1cblxuICBQYXJzZXIucHJvdG90eXBlOiB7XG4gICAgeXk6IHt9LFxuICAgIHRyYWNlOiBmdW5jdGlvbigpLFxuICAgIHN5bWJvbHNfOiB7YXNzb2NpYXRpdmUgbGlzdDogbmFtZSA9PT4gbnVtYmVyfSxcbiAgICB0ZXJtaW5hbHNfOiB7YXNzb2NpYXRpdmUgbGlzdDogbnVtYmVyID09PiBuYW1lfSxcbiAgICBwcm9kdWN0aW9uc186IFsuLi5dLFxuICAgIHBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uIGFub255bW91cyh5eXRleHQsIHl5bGVuZywgeXlsaW5lbm8sIHl5LCB5eXN0YXRlLCAkJCwgXyQpLFxuICAgIHRhYmxlOiBbLi4uXSxcbiAgICBkZWZhdWx0QWN0aW9uczogey4uLn0sXG4gICAgcGFyc2VFcnJvcjogZnVuY3Rpb24oc3RyLCBoYXNoKSxcbiAgICBwYXJzZTogZnVuY3Rpb24oaW5wdXQpLFxuXG4gICAgbGV4ZXI6IHtcbiAgICAgICAgRU9GOiAxLFxuICAgICAgICBwYXJzZUVycm9yOiBmdW5jdGlvbihzdHIsIGhhc2gpLFxuICAgICAgICBzZXRJbnB1dDogZnVuY3Rpb24oaW5wdXQpLFxuICAgICAgICBpbnB1dDogZnVuY3Rpb24oKSxcbiAgICAgICAgdW5wdXQ6IGZ1bmN0aW9uKHN0ciksXG4gICAgICAgIG1vcmU6IGZ1bmN0aW9uKCksXG4gICAgICAgIGxlc3M6IGZ1bmN0aW9uKG4pLFxuICAgICAgICBwYXN0SW5wdXQ6IGZ1bmN0aW9uKCksXG4gICAgICAgIHVwY29taW5nSW5wdXQ6IGZ1bmN0aW9uKCksXG4gICAgICAgIHNob3dQb3NpdGlvbjogZnVuY3Rpb24oKSxcbiAgICAgICAgdGVzdF9tYXRjaDogZnVuY3Rpb24ocmVnZXhfbWF0Y2hfYXJyYXksIHJ1bGVfaW5kZXgpLFxuICAgICAgICBuZXh0OiBmdW5jdGlvbigpLFxuICAgICAgICBsZXg6IGZ1bmN0aW9uKCksXG4gICAgICAgIGJlZ2luOiBmdW5jdGlvbihjb25kaXRpb24pLFxuICAgICAgICBwb3BTdGF0ZTogZnVuY3Rpb24oKSxcbiAgICAgICAgX2N1cnJlbnRSdWxlczogZnVuY3Rpb24oKSxcbiAgICAgICAgdG9wU3RhdGU6IGZ1bmN0aW9uKCksXG4gICAgICAgIHB1c2hTdGF0ZTogZnVuY3Rpb24oY29uZGl0aW9uKSxcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICByYW5nZXM6IGJvb2xlYW4gICAgICAgICAgIChvcHRpb25hbDogdHJ1ZSA9PT4gdG9rZW4gbG9jYXRpb24gaW5mbyB3aWxsIGluY2x1ZGUgYSAucmFuZ2VbXSBtZW1iZXIpXG4gICAgICAgICAgICBmbGV4OiBib29sZWFuICAgICAgICAgICAgIChvcHRpb25hbDogdHJ1ZSA9PT4gZmxleC1saWtlIGxleGluZyBiZWhhdmlvdXIgd2hlcmUgdGhlIHJ1bGVzIGFyZSB0ZXN0ZWQgZXhoYXVzdGl2ZWx5IHRvIGZpbmQgdGhlIGxvbmdlc3QgbWF0Y2gpXG4gICAgICAgICAgICBiYWNrdHJhY2tfbGV4ZXI6IGJvb2xlYW4gIChvcHRpb25hbDogdHJ1ZSA9PT4gbGV4ZXIgcmVnZXhlcyBhcmUgdGVzdGVkIGluIG9yZGVyIGFuZCBmb3IgZWFjaCBtYXRjaGluZyByZWdleCB0aGUgYWN0aW9uIGNvZGUgaXMgaW52b2tlZDsgdGhlIGxleGVyIHRlcm1pbmF0ZXMgdGhlIHNjYW4gd2hlbiBhIHRva2VuIGlzIHJldHVybmVkIGJ5IHRoZSBhY3Rpb24gY29kZSlcbiAgICAgICAgfSxcblxuICAgICAgICBwZXJmb3JtQWN0aW9uOiBmdW5jdGlvbih5eSwgeXlfLCAkYXZvaWRpbmdfbmFtZV9jb2xsaXNpb25zLCBZWV9TVEFSVCksXG4gICAgICAgIHJ1bGVzOiBbLi4uXSxcbiAgICAgICAgY29uZGl0aW9uczoge2Fzc29jaWF0aXZlIGxpc3Q6IG5hbWUgPT0+IHNldH0sXG4gICAgfVxuICB9XG5cblxuICB0b2tlbiBsb2NhdGlvbiBpbmZvIChAJCwgXyQsIGV0Yy4pOiB7XG4gICAgZmlyc3RfbGluZTogbixcbiAgICBsYXN0X2xpbmU6IG4sXG4gICAgZmlyc3RfY29sdW1uOiBuLFxuICAgIGxhc3RfY29sdW1uOiBuLFxuICAgIHJhbmdlOiBbc3RhcnRfbnVtYmVyLCBlbmRfbnVtYmVyXSAgICAgICAod2hlcmUgdGhlIG51bWJlcnMgYXJlIGluZGV4ZXMgaW50byB0aGUgaW5wdXQgc3RyaW5nLCByZWd1bGFyIHplcm8tYmFzZWQpXG4gIH1cblxuXG4gIHRoZSBwYXJzZUVycm9yIGZ1bmN0aW9uIHJlY2VpdmVzIGEgJ2hhc2gnIG9iamVjdCB3aXRoIHRoZXNlIG1lbWJlcnMgZm9yIGxleGVyIGFuZCBwYXJzZXIgZXJyb3JzOiB7XG4gICAgdGV4dDogICAgICAgIChtYXRjaGVkIHRleHQpXG4gICAgdG9rZW46ICAgICAgICh0aGUgcHJvZHVjZWQgdGVybWluYWwgdG9rZW4sIGlmIGFueSlcbiAgICBsaW5lOiAgICAgICAgKHl5bGluZW5vKVxuICB9XG4gIHdoaWxlIHBhcnNlciAoZ3JhbW1hcikgZXJyb3JzIHdpbGwgYWxzbyBwcm92aWRlIHRoZXNlIG1lbWJlcnMsIGkuZS4gcGFyc2VyIGVycm9ycyBkZWxpdmVyIGEgc3VwZXJzZXQgb2YgYXR0cmlidXRlczoge1xuICAgIGxvYzogICAgICAgICAoeXlsbG9jKVxuICAgIGV4cGVjdGVkOiAgICAoc3RyaW5nIGRlc2NyaWJpbmcgdGhlIHNldCBvZiBleHBlY3RlZCB0b2tlbnMpXG4gICAgcmVjb3ZlcmFibGU6IChib29sZWFuOiBUUlVFIHdoZW4gdGhlIHBhcnNlciBoYXMgYSBlcnJvciByZWNvdmVyeSBydWxlIGF2YWlsYWJsZSBmb3IgdGhpcyBwYXJ0aWN1bGFyIGVycm9yKVxuICB9XG4qL1xudmFyIHBhcnNlciA9IChmdW5jdGlvbigpe1xudmFyIG89ZnVuY3Rpb24oayx2LG8sbCl7Zm9yKG89b3x8e30sbD1rLmxlbmd0aDtsLS07b1trW2xdXT12KTtyZXR1cm4gb30sJFYwPVsxLDhdLCRWMT1bMSw3XSwkVjI9WzEsNV0sJFYzPVsxLDZdLCRWND1bMSwxMl0sJFY1PVsxLDEzXSwkVjY9WzEsMTRdLCRWNz1bMSwxNV0sJFY4PVs1LDI1XSwkVjk9WzEsMTddLCRWYT1bMSwxOF0sJFZiPVsxLDE5XSwkVmM9WzEsMjBdLCRWZD1bMSwyMV0sJFZlPVsxLDIyXSwkVmY9WzEsMjNdLCRWZz1bMSwyNF0sJFZoPVsxLDI1XSwkVmk9WzEsMjZdLCRWaj1bMSwyN10sJFZrPVs1LDgsOSwxMCwxMSwxMiwxMywxNSwxNywxOCwxOSwyMCwyMSwyMiwyMywyNCwyNSwyNiwyNywyOCwyOSwzMCwzMiwzMywzNiwzNywzOCwzOV0sJFZsPVs1LDgsOSwxMCwxMSwxMiwxMywxNSwxOCwxOSwyMCwyMSwyMywyNSwyNiwyOF0sJFZtPVsyLDI2XSwkVm49WzUsOCw5LDEwLDExLDEyLDEzLDE1LDE4LDE5LDIwLDI1LDI2LDI4XSwkVm89WzE1LDE4XTtcbnZhciBwYXJzZXIgPSB7dHJhY2U6IGZ1bmN0aW9uIHRyYWNlKCkge1xuICAgICAgICBKaXNvbi5wcmludC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH0sXG55eToge30sXG5zeW1ib2xzXzoge1wiZXJyb3JcIjoyLFwiZXhwcmVzc2lvbnNcIjozLFwiU1wiOjQsXCJFT0ZcIjo1LFwiZVwiOjYsXCJzdG10XCI6NyxcIj1cIjo4LFwiIT1cIjo5LFwiPD1cIjoxMCxcIjxcIjoxMSxcIj5cIjoxMixcIj49XCI6MTMsXCJjc2xcIjoxNCxcIixcIjoxNSxcInZlY3RvclwiOjE2LFwiKFwiOjE3LFwiKVwiOjE4LFwiK1wiOjE5LFwiLVwiOjIwLFwiKlwiOjIxLFwiJVwiOjIyLFwiL1wiOjIzLFwiUE9XRVJ7XCI6MjQsXCJ9XCI6MjUsXCJfe1wiOjI2LFwiIVwiOjI3LFwiX1NJTkdMRVwiOjI4LFwiU1FSVHtcIjoyOSxcIkZSQUN7XCI6MzAsXCJ7XCI6MzEsXCJeU0lOR0xFQVwiOjMyLFwiXlNJTkdMRVBcIjozMyxcImlkZW50aWZpZXJcIjozNCxcIm51bWJlclwiOjM1LFwiSURFTlRJRklFUlwiOjM2LFwiTE9OR0lERU5USUZJRVJcIjozNyxcIkRFQ0lNQUxcIjozOCxcIklOVEVHRVJcIjozOSxcIiRhY2NlcHRcIjowLFwiJGVuZFwiOjF9LFxudGVybWluYWxzXzogezI6XCJlcnJvclwiLDU6XCJFT0ZcIiw4OlwiPVwiLDk6XCIhPVwiLDEwOlwiPD1cIiwxMTpcIjxcIiwxMjpcIj5cIiwxMzpcIj49XCIsMTU6XCIsXCIsMTc6XCIoXCIsMTg6XCIpXCIsMTk6XCIrXCIsMjA6XCItXCIsMjE6XCIqXCIsMjI6XCIlXCIsMjM6XCIvXCIsMjQ6XCJQT1dFUntcIiwyNTpcIn1cIiwyNjpcIl97XCIsMjc6XCIhXCIsMjg6XCJfU0lOR0xFXCIsMjk6XCJTUVJUe1wiLDMwOlwiRlJBQ3tcIiwzMTpcIntcIiwzMjpcIl5TSU5HTEVBXCIsMzM6XCJeU0lOR0xFUFwiLDM2OlwiSURFTlRJRklFUlwiLDM3OlwiTE9OR0lERU5USUZJRVJcIiwzODpcIkRFQ0lNQUxcIiwzOTpcIklOVEVHRVJcIn0sXG5wcm9kdWN0aW9uc186IFswLFszLDJdLFs0LDFdLFs0LDFdLFs3LDNdLFs3LDNdLFs3LDNdLFs3LDNdLFs3LDNdLFs3LDNdLFsxNCwzXSxbMTQsM10sWzE2LDNdLFs2LDNdLFs2LDNdLFs2LDNdLFs2LDNdLFs2LDNdLFs2LDRdLFs2LDRdLFs2LDJdLFs2LDJdLFs2LDNdLFs2LDZdLFs2LDJdLFs2LDJdLFs2LDJdLFs2LDJdLFs2LDNdLFs2LDFdLFs2LDFdLFs2LDFdLFszNCwxXSxbMzQsMV0sWzM1LDFdLFszNSwxXV0sXG5wZXJmb3JtQWN0aW9uOiBmdW5jdGlvbiBhbm9ueW1vdXMoeXl0ZXh0LCB5eWxlbmcsIHl5bGluZW5vLCB5eSwgeXlzdGF0ZSAvKiBhY3Rpb25bMV0gKi8sICQkIC8qIHZzdGFjayAqLywgXyQgLyogbHN0YWNrICovKSB7XG4vKiB0aGlzID09IHl5dmFsICovXG5cbnZhciAkMCA9ICQkLmxlbmd0aCAtIDE7XG5zd2l0Y2ggKHl5c3RhdGUpIHtcbmNhc2UgMTpcbiByZXR1cm4gJCRbJDAtMV07IFxuYnJlYWs7XG5jYXNlIDI6IGNhc2UgMzogY2FzZSAyOTogY2FzZSAzMDogY2FzZSAzMTpcbnRoaXMuJCA9ICQkWyQwXTtcbmJyZWFrO1xuY2FzZSA0OlxudGhpcy4kID0gWyc9JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgNTpcbnRoaXMuJCA9IFsnIT0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA2OlxudGhpcy4kID0gWyc8PScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDc6XG50aGlzLiQgPSBbJzwnLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA4OlxudGhpcy4kID0gWyc+JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgOTpcbnRoaXMuJCA9IFsnPj0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxMDpcbnRoaXMuJCA9IFsnLC4nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxMTpcbnRoaXMuJCA9IFsnLCcsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDEyOlxudGhpcy4kID0gJCRbJDAtMV07XG5icmVhaztcbmNhc2UgMTM6XG50aGlzLiQgPSBbJysnLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNDpcbnRoaXMuJCA9IFsnLScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE1OlxudGhpcy4kID0gWycqJywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMTY6XG50aGlzLiQgPSBbJyUnLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNzpcbnRoaXMuJCA9IFsnLycsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE4OlxudGhpcy4kID0gWydeJywgJCRbJDAtM10sICQkWyQwLTFdXTtcbmJyZWFrO1xuY2FzZSAxOTpcbnRoaXMuJCA9IFsnXycsICQkWyQwLTNdLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMjA6XG50aGlzLiQgPSBbJyEnLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMjE6XG50aGlzLiQgPSBbJ18nLCAkJFskMC0xXSwge3R5cGU6ICdTaW5nbGUnLCBwcmltaXRpdmU6IHl5dGV4dC5zdWJzdHJpbmcoMSl9XTtcbmJyZWFrO1xuY2FzZSAyMjpcbnRoaXMuJCA9IFsnc3FydCcsICQkWyQwLTFdXTtcbmJyZWFrO1xuY2FzZSAyMzpcbnRoaXMuJCA9IFsnZnJhYycsICQkWyQwLTRdLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMjQ6XG50aGlzLiQgPSBbJ14nLCAkJFskMC0xXSwgeXl0ZXh0LnN1YnN0cmluZygxKV07XG5icmVhaztcbmNhc2UgMjU6XG50aGlzLiQgPSBbJ14nLCAkJFskMC0xXSwge3R5cGU6ICdTaW5nbGUnLCBwcmltaXRpdmU6IHl5dGV4dC5zdWJzdHJpbmcoMSl9XTtcbmJyZWFrO1xuY2FzZSAyNjpcbnRoaXMuJCA9IFsnQC0nLCAkJFskMF1dXG5icmVhaztcbmNhc2UgMjc6XG50aGlzLiQgPSBbJ2RlZmF1bHQnLCAkJFskMC0xXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAyODpcbnRoaXMuJCA9ICQkWyQwLTFdXG5icmVhaztcbmNhc2UgMzI6XG50aGlzLiQgPSB5eXRleHQ7XG5icmVhaztcbmNhc2UgMzM6XG50aGlzLiQgPSB5eXRleHQuc3Vic3RyaW5nKDEpO1xuYnJlYWs7XG5jYXNlIDM0OiBjYXNlIDM1OlxudGhpcy4kID0ge3R5cGU6ICdOdW1iZXInLCBwcmltaXRpdmU6IHl5dGV4dH07XG5icmVhaztcbn1cbn0sXG50YWJsZTogW3szOjEsNDoyLDY6Myw3OjQsMTY6OSwxNzokVjAsMjA6JFYxLDI5OiRWMiwzMDokVjMsMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSx7MTpbM119LHs1OlsxLDE2XX0sbygkVjgsWzIsMl0sezE2OjksMzQ6MTAsMzU6MTEsNjoyOCw4OlsxLDI5XSw5OlsxLDMwXSwxMDpbMSwzMV0sMTE6WzEsMzJdLDEyOlsxLDMzXSwxMzpbMSwzNF0sMTc6JFYwLDE5OiRWOSwyMDokVmEsMjE6JFZiLDIyOiRWYywyMzokVmQsMjQ6JFZlLDI2OiRWZiwyNzokVmcsMjg6JFZoLDI5OiRWMiwzMDokVjMsMzI6JFZpLDMzOiRWaiwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9KSxvKCRWOCxbMiwzXSksezY6MzUsMTY6OSwxNzokVjAsMjA6JFYxLDI5OiRWMiwzMDokVjMsMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSx7NjozNiwxNjo5LDE3OiRWMCwyMDokVjEsMjk6JFYyLDMwOiRWMywzNDoxMCwzNToxMSwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9LHs2OjM3LDE2OjksMTc6JFYwLDIwOiRWMSwyOTokVjIsMzA6JFYzLDM0OjEwLDM1OjExLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30sezY6MzgsMTQ6MzksMTY6OSwxNzokVjAsMjA6JFYxLDI5OiRWMiwzMDokVjMsMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSxvKCRWayxbMiwyOV0pLG8oJFZrLFsyLDMwXSksbygkVmssWzIsMzFdKSxvKCRWayxbMiwzMl0pLG8oJFZrLFsyLDMzXSksbygkVmssWzIsMzRdKSxvKCRWayxbMiwzNV0pLHsxOlsyLDFdfSx7Njo0MCwxNjo5LDE3OiRWMCwyMDokVjEsMjk6JFYyLDMwOiRWMywzNDoxMCwzNToxMSwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9LHs2OjQxLDE2OjksMTc6JFYwLDIwOiRWMSwyOTokVjIsMzA6JFYzLDM0OjEwLDM1OjExLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30sezY6NDIsMTY6OSwxNzokVjAsMjA6JFYxLDI5OiRWMiwzMDokVjMsMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSx7Njo0MywxNjo5LDE3OiRWMCwyMDokVjEsMjk6JFYyLDMwOiRWMywzNDoxMCwzNToxMSwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9LHs2OjQ0LDE2OjksMTc6JFYwLDIwOiRWMSwyOTokVjIsMzA6JFYzLDM0OjEwLDM1OjExLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30sezY6NDUsMTY6OSwxNzokVjAsMjA6JFYxLDI5OiRWMiwzMDokVjMsMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSx7NDo0Niw2OjMsNzo0LDE2OjksMTc6JFYwLDIwOiRWMSwyOTokVjIsMzA6JFYzLDM0OjEwLDM1OjExLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30sbygkVmssWzIsMjBdKSxvKCRWayxbMiwyMV0pLG8oJFZrLFsyLDI0XSksbygkVmssWzIsMjVdKSxvKFs1LDgsOSwxMCwxMSwxMiwxMywxNSwxOCwxOSwyMCwyMSwyMiwyMywyNSwyNiwyNywyOCwyOSwzMF0sWzIsMjddLHsxNjo5LDM0OjEwLDM1OjExLDY6MjgsMTc6JFYwLDI0OiRWZSwzMjokVmksMzM6JFZqLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30pLHs2OjQ3LDE2OjksMTc6JFYwLDIwOiRWMSwyOTokVjIsMzA6JFYzLDM0OjEwLDM1OjExLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30sezY6NDgsMTY6OSwxNzokVjAsMjA6JFYxLDI5OiRWMiwzMDokVjMsMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSx7Njo0OSwxNjo5LDE3OiRWMCwyMDokVjEsMjk6JFYyLDMwOiRWMywzNDoxMCwzNToxMSwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9LHs2OjUwLDE2OjksMTc6JFYwLDIwOiRWMSwyOTokVjIsMzA6JFYzLDM0OjEwLDM1OjExLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30sezY6NTEsMTY6OSwxNzokVjAsMjA6JFYxLDI5OiRWMiwzMDokVjMsMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSx7Njo1MiwxNjo5LDE3OiRWMCwyMDokVjEsMjk6JFYyLDMwOiRWMywzNDoxMCwzNToxMSwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9LHs2OjI4LDE2OjksMTc6JFYwLDE5OiRWOSwyMDokVmEsMjE6JFZiLDIyOiRWYywyMzokVmQsMjQ6JFZlLDI1OlsxLDUzXSwyNjokVmYsMjc6JFZnLDI4OiRWaCwyOTokVjIsMzA6JFYzLDMyOiRWaSwzMzokVmosMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSx7NjoyOCwxNjo5LDE3OiRWMCwxOTokVjksMjA6JFZhLDIxOiRWYiwyMjokVmMsMjM6JFZkLDI0OiRWZSwyNTpbMSw1NF0sMjY6JFZmLDI3OiRWZywyODokVmgsMjk6JFYyLDMwOiRWMywzMjokVmksMzM6JFZqLDM0OjEwLDM1OjExLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30sbygkVmwsJFZtLHsxNjo5LDM0OjEwLDM1OjExLDY6MjgsMTc6JFYwLDIyOiRWYywyNDokVmUsMjc6JFZnLDI5OiRWMiwzMDokVjMsMzI6JFZpLDMzOiRWaiwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9KSx7NjoyOCwxNTpbMSw1Nl0sMTY6OSwxNzokVjAsMTg6WzEsNTVdLDE5OiRWOSwyMDokVmEsMjE6JFZiLDIyOiRWYywyMzokVmQsMjQ6JFZlLDI2OiRWZiwyNzokVmcsMjg6JFZoLDI5OiRWMiwzMDokVjMsMzI6JFZpLDMzOiRWaiwzNDoxMCwzNToxMSwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9LHsxNTpbMSw1OF0sMTg6WzEsNTddfSxvKCRWbixbMiwxM10sezE2OjksMzQ6MTAsMzU6MTEsNjoyOCwxNzokVjAsMjE6JFZiLDIyOiRWYywyMzokVmQsMjQ6JFZlLDI3OiRWZywyOTokVjIsMzA6JFYzLDMyOiRWaSwzMzokVmosMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSksbygkVm4sWzIsMTRdLHsxNjo5LDM0OjEwLDM1OjExLDY6MjgsMTc6JFYwLDIxOiRWbSwyMzokVm0sMjI6JFZjLDI0OiRWZSwyNzokVmcsMjk6JFYyLDMwOiRWMywzMjokVmksMzM6JFZqLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30pLG8oJFZsLFsyLDE1XSx7MTY6OSwzNDoxMCwzNToxMSw2OjI4LDE3OiRWMCwyMjokVmMsMjQ6JFZlLDI3OiRWZywyOTokVjIsMzA6JFYzLDMyOiRWaSwzMzokVmosMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSksbyhbNSw4LDksMTAsMTEsMTIsMTMsMTUsMTgsMTksMjAsMjEsMjMsMjUsMjYsMjcsMjgsMjldLFsyLDE2XSx7MTY6OSwzNDoxMCwzNToxMSw2OjI4LDE3OiRWMCwyMjokVmMsMjQ6JFZlLDMwOiRWMywzMjokVmksMzM6JFZqLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30pLG8oJFZsLFsyLDE3XSx7MTY6OSwzNDoxMCwzNToxMSw2OjI4LDE3OiRWMCwyMjokVmMsMjQ6JFZlLDI3OiRWZywyOTokVjIsMzA6JFYzLDMyOiRWaSwzMzokVmosMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSksezY6MjgsMTY6OSwxNzokVjAsMTk6JFY5LDIwOiRWYSwyMTokVmIsMjI6JFZjLDIzOiRWZCwyNDokVmUsMjU6WzEsNTldLDI2OiRWZiwyNzokVmcsMjg6JFZoLDI5OiRWMiwzMDokVjMsMzI6JFZpLDMzOiRWaiwzNDoxMCwzNToxMSwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9LHsyNTpbMSw2MF19LG8oJFY4LFsyLDRdLHsxNjo5LDM0OjEwLDM1OjExLDY6MjgsMTc6JFYwLDE5OiRWOSwyMDokVmEsMjE6JFZiLDIyOiRWYywyMzokVmQsMjQ6JFZlLDI2OiRWZiwyNzokVmcsMjg6JFZoLDI5OiRWMiwzMDokVjMsMzI6JFZpLDMzOiRWaiwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9KSxvKCRWOCxbMiw1XSx7MTY6OSwzNDoxMCwzNToxMSw2OjI4LDE3OiRWMCwxOTokVjksMjA6JFZhLDIxOiRWYiwyMjokVmMsMjM6JFZkLDI0OiRWZSwyNjokVmYsMjc6JFZnLDI4OiRWaCwyOTokVjIsMzA6JFYzLDMyOiRWaSwzMzokVmosMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSksbygkVjgsWzIsNl0sezE2OjksMzQ6MTAsMzU6MTEsNjoyOCwxNzokVjAsMTk6JFY5LDIwOiRWYSwyMTokVmIsMjI6JFZjLDIzOiRWZCwyNDokVmUsMjY6JFZmLDI3OiRWZywyODokVmgsMjk6JFYyLDMwOiRWMywzMjokVmksMzM6JFZqLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30pLG8oJFY4LFsyLDddLHsxNjo5LDM0OjEwLDM1OjExLDY6MjgsMTc6JFYwLDE5OiRWOSwyMDokVmEsMjE6JFZiLDIyOiRWYywyMzokVmQsMjQ6JFZlLDI2OiRWZiwyNzokVmcsMjg6JFZoLDI5OiRWMiwzMDokVjMsMzI6JFZpLDMzOiRWaiwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9KSxvKCRWOCxbMiw4XSx7MTY6OSwzNDoxMCwzNToxMSw2OjI4LDE3OiRWMCwxOTokVjksMjA6JFZhLDIxOiRWYiwyMjokVmMsMjM6JFZkLDI0OiRWZSwyNjokVmYsMjc6JFZnLDI4OiRWaCwyOTokVjIsMzA6JFYzLDMyOiRWaSwzMzokVmosMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSksbygkVjgsWzIsOV0sezE2OjksMzQ6MTAsMzU6MTEsNjoyOCwxNzokVjAsMTk6JFY5LDIwOiRWYSwyMTokVmIsMjI6JFZjLDIzOiRWZCwyNDokVmUsMjY6JFZmLDI3OiRWZywyODokVmgsMjk6JFYyLDMwOiRWMywzMjokVmksMzM6JFZqLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30pLG8oJFZrLFsyLDIyXSksezMxOlsxLDYxXX0sbygkVmssWzIsMjhdKSx7Njo2MiwxNjo5LDE3OiRWMCwyMDokVjEsMjk6JFYyLDMwOiRWMywzNDoxMCwzNToxMSwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9LG8oJFZrLFsyLDEyXSksezY6NjMsMTY6OSwxNzokVjAsMjA6JFYxLDI5OiRWMiwzMDokVjMsMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSxvKCRWayxbMiwxOF0pLG8oJFZrLFsyLDE5XSksezY6NjQsMTY6OSwxNzokVjAsMjA6JFYxLDI5OiRWMiwzMDokVjMsMzQ6MTAsMzU6MTEsMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSxvKCRWbyxbMiwxMV0sezE2OjksMzQ6MTAsMzU6MTEsNjoyOCwxNzokVjAsMTk6JFY5LDIwOiRWYSwyMTokVmIsMjI6JFZjLDIzOiRWZCwyNDokVmUsMjY6JFZmLDI3OiRWZywyODokVmgsMjk6JFYyLDMwOiRWMywzMjokVmksMzM6JFZqLDM2OiRWNCwzNzokVjUsMzg6JFY2LDM5OiRWN30pLG8oJFZvLFsyLDEwXSx7MTY6OSwzNDoxMCwzNToxMSw2OjI4LDE3OiRWMCwxOTokVjksMjA6JFZhLDIxOiRWYiwyMjokVmMsMjM6JFZkLDI0OiRWZSwyNjokVmYsMjc6JFZnLDI4OiRWaCwyOTokVjIsMzA6JFYzLDMyOiRWaSwzMzokVmosMzY6JFY0LDM3OiRWNSwzODokVjYsMzk6JFY3fSksezY6MjgsMTY6OSwxNzokVjAsMTk6JFY5LDIwOiRWYSwyMTokVmIsMjI6JFZjLDIzOiRWZCwyNDokVmUsMjU6WzEsNjVdLDI2OiRWZiwyNzokVmcsMjg6JFZoLDI5OiRWMiwzMDokVjMsMzI6JFZpLDMzOiRWaiwzNDoxMCwzNToxMSwzNjokVjQsMzc6JFY1LDM4OiRWNiwzOTokVjd9LG8oJFZrLFsyLDIzXSldLFxuZGVmYXVsdEFjdGlvbnM6IHsxNjpbMiwxXX0sXG5wYXJzZUVycm9yOiBmdW5jdGlvbiBwYXJzZUVycm9yKHN0ciwgaGFzaCkge1xuICAgIGlmIChoYXNoLnJlY292ZXJhYmxlKSB7XG4gICAgICAgIHRoaXMudHJhY2Uoc3RyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmdW5jdGlvbiBfcGFyc2VFcnJvciAobXNnLCBoYXNoKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtc2c7XG4gICAgICAgICAgICB0aGlzLmhhc2ggPSBoYXNoO1xuICAgICAgICB9XG4gICAgICAgIF9wYXJzZUVycm9yLnByb3RvdHlwZSA9IEVycm9yO1xuXG4gICAgICAgIHRocm93IG5ldyBfcGFyc2VFcnJvcihzdHIsIGhhc2gpO1xuICAgIH1cbn0sXG5wYXJzZTogZnVuY3Rpb24gcGFyc2UoaW5wdXQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsIHN0YWNrID0gWzBdLCB0c3RhY2sgPSBbXSwgdnN0YWNrID0gW251bGxdLCBsc3RhY2sgPSBbXSwgdGFibGUgPSB0aGlzLnRhYmxlLCB5eXRleHQgPSAnJywgeXlsaW5lbm8gPSAwLCB5eWxlbmcgPSAwLCByZWNvdmVyaW5nID0gMCwgVEVSUk9SID0gMiwgRU9GID0gMTtcbiAgICB2YXIgYXJncyA9IGxzdGFjay5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGxleGVyID0gT2JqZWN0LmNyZWF0ZSh0aGlzLmxleGVyKTtcbiAgICB2YXIgc2hhcmVkU3RhdGUgPSB7IHl5OiB7fSB9O1xuICAgIGZvciAodmFyIGsgaW4gdGhpcy55eSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMueXksIGspKSB7XG4gICAgICAgICAgICBzaGFyZWRTdGF0ZS55eVtrXSA9IHRoaXMueXlba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV4ZXIuc2V0SW5wdXQoaW5wdXQsIHNoYXJlZFN0YXRlLnl5KTtcbiAgICBzaGFyZWRTdGF0ZS55eS5sZXhlciA9IGxleGVyO1xuICAgIHNoYXJlZFN0YXRlLnl5LnBhcnNlciA9IHRoaXM7XG4gICAgaWYgKHR5cGVvZiBsZXhlci55eWxsb2MgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbGV4ZXIueXlsbG9jID0ge307XG4gICAgfVxuICAgIHZhciB5eWxvYyA9IGxleGVyLnl5bGxvYztcbiAgICBsc3RhY2sucHVzaCh5eWxvYyk7XG4gICAgdmFyIHJhbmdlcyA9IGxleGVyLm9wdGlvbnMgJiYgbGV4ZXIub3B0aW9ucy5yYW5nZXM7XG4gICAgaWYgKHR5cGVvZiBzaGFyZWRTdGF0ZS55eS5wYXJzZUVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucGFyc2VFcnJvciA9IHNoYXJlZFN0YXRlLnl5LnBhcnNlRXJyb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wYXJzZUVycm9yID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLnBhcnNlRXJyb3I7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvcFN0YWNrKG4pIHtcbiAgICAgICAgc3RhY2subGVuZ3RoID0gc3RhY2subGVuZ3RoIC0gMiAqIG47XG4gICAgICAgIHZzdGFjay5sZW5ndGggPSB2c3RhY2subGVuZ3RoIC0gbjtcbiAgICAgICAgbHN0YWNrLmxlbmd0aCA9IGxzdGFjay5sZW5ndGggLSBuO1xuICAgIH1cbiAgICBfdG9rZW5fc3RhY2s6XG4gICAgICAgIHZhciBsZXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdG9rZW47XG4gICAgICAgICAgICB0b2tlbiA9IGxleGVyLmxleCgpIHx8IEVPRjtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgdG9rZW4gPSBzZWxmLnN5bWJvbHNfW3Rva2VuXSB8fCB0b2tlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgfTtcbiAgICB2YXIgc3ltYm9sLCBwcmVFcnJvclN5bWJvbCwgc3RhdGUsIGFjdGlvbiwgYSwgciwgeXl2YWwgPSB7fSwgcCwgbGVuLCBuZXdTdGF0ZSwgZXhwZWN0ZWQ7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgc3RhdGUgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKHRoaXMuZGVmYXVsdEFjdGlvbnNbc3RhdGVdKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSB0aGlzLmRlZmF1bHRBY3Rpb25zW3N0YXRlXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzeW1ib2wgPT09IG51bGwgfHwgdHlwZW9mIHN5bWJvbCA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHN5bWJvbCA9IGxleCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWN0aW9uID0gdGFibGVbc3RhdGVdICYmIHRhYmxlW3N0YXRlXVtzeW1ib2xdO1xuICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYWN0aW9uID09PSAndW5kZWZpbmVkJyB8fCAhYWN0aW9uLmxlbmd0aCB8fCAhYWN0aW9uWzBdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVyclN0ciA9ICcnO1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChwIGluIHRhYmxlW3N0YXRlXSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50ZXJtaW5hbHNfW3BdICYmIHAgPiBURVJST1IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkLnB1c2goJ1xcJycgKyB0aGlzLnRlcm1pbmFsc19bcF0gKyAnXFwnJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxleGVyLnNob3dQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBlcnJTdHIgPSAnUGFyc2UgZXJyb3Igb24gbGluZSAnICsgKHl5bGluZW5vICsgMSkgKyAnOlxcbicgKyBsZXhlci5zaG93UG9zaXRpb24oKSArICdcXG5FeHBlY3RpbmcgJyArIGV4cGVjdGVkLmpvaW4oJywgJykgKyAnLCBnb3QgXFwnJyArICh0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wpICsgJ1xcJyc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyU3RyID0gJ1BhcnNlIGVycm9yIG9uIGxpbmUgJyArICh5eWxpbmVubyArIDEpICsgJzogVW5leHBlY3RlZCAnICsgKHN5bWJvbCA9PSBFT0YgPyAnZW5kIG9mIGlucHV0JyA6ICdcXCcnICsgKHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCkgKyAnXFwnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucGFyc2VFcnJvcihlcnJTdHIsIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogbGV4ZXIubWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgIHRva2VuOiB0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wsXG4gICAgICAgICAgICAgICAgICAgIGxpbmU6IGxleGVyLnl5bGluZW5vLFxuICAgICAgICAgICAgICAgICAgICBsb2M6IHl5bG9jLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGlvblswXSBpbnN0YW5jZW9mIEFycmF5ICYmIGFjdGlvbi5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlIEVycm9yOiBtdWx0aXBsZSBhY3Rpb25zIHBvc3NpYmxlIGF0IHN0YXRlOiAnICsgc3RhdGUgKyAnLCB0b2tlbjogJyArIHN5bWJvbCk7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChhY3Rpb25bMF0pIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgc3RhY2sucHVzaChzeW1ib2wpO1xuICAgICAgICAgICAgdnN0YWNrLnB1c2gobGV4ZXIueXl0ZXh0KTtcbiAgICAgICAgICAgIGxzdGFjay5wdXNoKGxleGVyLnl5bGxvYyk7XG4gICAgICAgICAgICBzdGFjay5wdXNoKGFjdGlvblsxXSk7XG4gICAgICAgICAgICBzeW1ib2wgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFwcmVFcnJvclN5bWJvbCkge1xuICAgICAgICAgICAgICAgIHl5bGVuZyA9IGxleGVyLnl5bGVuZztcbiAgICAgICAgICAgICAgICB5eXRleHQgPSBsZXhlci55eXRleHQ7XG4gICAgICAgICAgICAgICAgeXlsaW5lbm8gPSBsZXhlci55eWxpbmVubztcbiAgICAgICAgICAgICAgICB5eWxvYyA9IGxleGVyLnl5bGxvYztcbiAgICAgICAgICAgICAgICBpZiAocmVjb3ZlcmluZyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjb3ZlcmluZy0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3ltYm9sID0gcHJlRXJyb3JTeW1ib2w7XG4gICAgICAgICAgICAgICAgcHJlRXJyb3JTeW1ib2wgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGxlbiA9IHRoaXMucHJvZHVjdGlvbnNfW2FjdGlvblsxXV1bMV07XG4gICAgICAgICAgICB5eXZhbC4kID0gdnN0YWNrW3ZzdGFjay5sZW5ndGggLSBsZW5dO1xuICAgICAgICAgICAgeXl2YWwuXyQgPSB7XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5maXJzdF9saW5lLFxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5sYXN0X2xpbmUsXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIChsZW4gfHwgMSldLmZpcnN0X2NvbHVtbixcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChyYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB5eXZhbC5fJC5yYW5nZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5yYW5nZVswXSxcbiAgICAgICAgICAgICAgICAgICAgbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5yYW5nZVsxXVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByID0gdGhpcy5wZXJmb3JtQWN0aW9uLmFwcGx5KHl5dmFsLCBbXG4gICAgICAgICAgICAgICAgeXl0ZXh0LFxuICAgICAgICAgICAgICAgIHl5bGVuZyxcbiAgICAgICAgICAgICAgICB5eWxpbmVubyxcbiAgICAgICAgICAgICAgICBzaGFyZWRTdGF0ZS55eSxcbiAgICAgICAgICAgICAgICBhY3Rpb25bMV0sXG4gICAgICAgICAgICAgICAgdnN0YWNrLFxuICAgICAgICAgICAgICAgIGxzdGFja1xuICAgICAgICAgICAgXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxlbikge1xuICAgICAgICAgICAgICAgIHN0YWNrID0gc3RhY2suc2xpY2UoMCwgLTEgKiBsZW4gKiAyKTtcbiAgICAgICAgICAgICAgICB2c3RhY2sgPSB2c3RhY2suc2xpY2UoMCwgLTEgKiBsZW4pO1xuICAgICAgICAgICAgICAgIGxzdGFjayA9IGxzdGFjay5zbGljZSgwLCAtMSAqIGxlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGFjay5wdXNoKHRoaXMucHJvZHVjdGlvbnNfW2FjdGlvblsxXV1bMF0pO1xuICAgICAgICAgICAgdnN0YWNrLnB1c2goeXl2YWwuJCk7XG4gICAgICAgICAgICBsc3RhY2sucHVzaCh5eXZhbC5fJCk7XG4gICAgICAgICAgICBuZXdTdGF0ZSA9IHRhYmxlW3N0YWNrW3N0YWNrLmxlbmd0aCAtIDJdXVtzdGFja1tzdGFjay5sZW5ndGggLSAxXV07XG4gICAgICAgICAgICBzdGFjay5wdXNoKG5ld1N0YXRlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn19O1xuLyogZ2VuZXJhdGVkIGJ5IGppc29uLWxleCAwLjMuNCAqL1xudmFyIGxleGVyID0gKGZ1bmN0aW9uKCl7XG52YXIgbGV4ZXIgPSAoe1xuXG5FT0Y6MSxcblxucGFyc2VFcnJvcjpmdW5jdGlvbiBwYXJzZUVycm9yKHN0ciwgaGFzaCkge1xuICAgICAgICBpZiAodGhpcy55eS5wYXJzZXIpIHtcbiAgICAgICAgICAgIHRoaXMueXkucGFyc2VyLnBhcnNlRXJyb3Ioc3RyLCBoYXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzdHIpO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gcmVzZXRzIHRoZSBsZXhlciwgc2V0cyBuZXcgaW5wdXRcbnNldElucHV0OmZ1bmN0aW9uIChpbnB1dCwgeXkpIHtcbiAgICAgICAgdGhpcy55eSA9IHl5IHx8IHRoaXMueXkgfHwge307XG4gICAgICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG4gICAgICAgIHRoaXMuX21vcmUgPSB0aGlzLl9iYWNrdHJhY2sgPSB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy55eWxpbmVubyA9IHRoaXMueXlsZW5nID0gMDtcbiAgICAgICAgdGhpcy55eXRleHQgPSB0aGlzLm1hdGNoZWQgPSB0aGlzLm1hdGNoID0gJyc7XG4gICAgICAgIHRoaXMuY29uZGl0aW9uU3RhY2sgPSBbJ0lOSVRJQUwnXTtcbiAgICAgICAgdGhpcy55eWxsb2MgPSB7XG4gICAgICAgICAgICBmaXJzdF9saW5lOiAxLFxuICAgICAgICAgICAgZmlyc3RfY29sdW1uOiAwLFxuICAgICAgICAgICAgbGFzdF9saW5lOiAxLFxuICAgICAgICAgICAgbGFzdF9jb2x1bW46IDBcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLnJhbmdlID0gWzAsMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vZmZzZXQgPSAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4vLyBjb25zdW1lcyBhbmQgcmV0dXJucyBvbmUgY2hhciBmcm9tIHRoZSBpbnB1dFxuaW5wdXQ6ZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2ggPSB0aGlzLl9pbnB1dFswXTtcbiAgICAgICAgdGhpcy55eXRleHQgKz0gY2g7XG4gICAgICAgIHRoaXMueXlsZW5nKys7XG4gICAgICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgICAgIHRoaXMubWF0Y2ggKz0gY2g7XG4gICAgICAgIHRoaXMubWF0Y2hlZCArPSBjaDtcbiAgICAgICAgdmFyIGxpbmVzID0gY2gubWF0Y2goLyg/Olxcclxcbj98XFxuKS4qL2cpO1xuICAgICAgICBpZiAobGluZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsaW5lbm8rKztcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLmxhc3RfbGluZSsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MubGFzdF9jb2x1bW4rKztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2VbMV0rKztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2lucHV0ID0gdGhpcy5faW5wdXQuc2xpY2UoMSk7XG4gICAgICAgIHJldHVybiBjaDtcbiAgICB9LFxuXG4vLyB1bnNoaWZ0cyBvbmUgY2hhciAob3IgYSBzdHJpbmcpIGludG8gdGhlIGlucHV0XG51bnB1dDpmdW5jdGlvbiAoY2gpIHtcbiAgICAgICAgdmFyIGxlbiA9IGNoLmxlbmd0aDtcbiAgICAgICAgdmFyIGxpbmVzID0gY2guc3BsaXQoLyg/Olxcclxcbj98XFxuKS9nKTtcblxuICAgICAgICB0aGlzLl9pbnB1dCA9IGNoICsgdGhpcy5faW5wdXQ7XG4gICAgICAgIHRoaXMueXl0ZXh0ID0gdGhpcy55eXRleHQuc3Vic3RyKDAsIHRoaXMueXl0ZXh0Lmxlbmd0aCAtIGxlbik7XG4gICAgICAgIC8vdGhpcy55eWxlbmcgLT0gbGVuO1xuICAgICAgICB0aGlzLm9mZnNldCAtPSBsZW47XG4gICAgICAgIHZhciBvbGRMaW5lcyA9IHRoaXMubWF0Y2guc3BsaXQoLyg/Olxcclxcbj98XFxuKS9nKTtcbiAgICAgICAgdGhpcy5tYXRjaCA9IHRoaXMubWF0Y2guc3Vic3RyKDAsIHRoaXMubWF0Y2gubGVuZ3RoIC0gMSk7XG4gICAgICAgIHRoaXMubWF0Y2hlZCA9IHRoaXMubWF0Y2hlZC5zdWJzdHIoMCwgdGhpcy5tYXRjaGVkLmxlbmd0aCAtIDEpO1xuXG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGluZW5vIC09IGxpbmVzLmxlbmd0aCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHIgPSB0aGlzLnl5bGxvYy5yYW5nZTtcblxuICAgICAgICB0aGlzLnl5bGxvYyA9IHtcbiAgICAgICAgICAgIGZpcnN0X2xpbmU6IHRoaXMueXlsbG9jLmZpcnN0X2xpbmUsXG4gICAgICAgICAgICBsYXN0X2xpbmU6IHRoaXMueXlsaW5lbm8gKyAxLFxuICAgICAgICAgICAgZmlyc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4sXG4gICAgICAgICAgICBsYXN0X2NvbHVtbjogbGluZXMgP1xuICAgICAgICAgICAgICAgIChsaW5lcy5sZW5ndGggPT09IG9sZExpbmVzLmxlbmd0aCA/IHRoaXMueXlsbG9jLmZpcnN0X2NvbHVtbiA6IDApXG4gICAgICAgICAgICAgICAgICsgb2xkTGluZXNbb2xkTGluZXMubGVuZ3RoIC0gbGluZXMubGVuZ3RoXS5sZW5ndGggLSBsaW5lc1swXS5sZW5ndGggOlxuICAgICAgICAgICAgICB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4gLSBsZW5cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2UgPSBbclswXSwgclswXSArIHRoaXMueXlsZW5nIC0gbGVuXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnl5bGVuZyA9IHRoaXMueXl0ZXh0Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuLy8gV2hlbiBjYWxsZWQgZnJvbSBhY3Rpb24sIGNhY2hlcyBtYXRjaGVkIHRleHQgYW5kIGFwcGVuZHMgaXQgb24gbmV4dCBhY3Rpb25cbm1vcmU6ZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9tb3JlID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuLy8gV2hlbiBjYWxsZWQgZnJvbSBhY3Rpb24sIHNpZ25hbHMgdGhlIGxleGVyIHRoYXQgdGhpcyBydWxlIGZhaWxzIHRvIG1hdGNoIHRoZSBpbnB1dCwgc28gdGhlIG5leHQgbWF0Y2hpbmcgcnVsZSAocmVnZXgpIHNob3VsZCBiZSB0ZXN0ZWQgaW5zdGVhZC5cbnJlamVjdDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja3RyYWNrX2xleGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9iYWNrdHJhY2sgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFcnJvcignTGV4aWNhbCBlcnJvciBvbiBsaW5lICcgKyAodGhpcy55eWxpbmVubyArIDEpICsgJy4gWW91IGNhbiBvbmx5IGludm9rZSByZWplY3QoKSBpbiB0aGUgbGV4ZXIgd2hlbiB0aGUgbGV4ZXIgaXMgb2YgdGhlIGJhY2t0cmFja2luZyBwZXJzdWFzaW9uIChvcHRpb25zLmJhY2t0cmFja19sZXhlciA9IHRydWUpLlxcbicgKyB0aGlzLnNob3dQb3NpdGlvbigpLCB7XG4gICAgICAgICAgICAgICAgdGV4dDogXCJcIixcbiAgICAgICAgICAgICAgICB0b2tlbjogbnVsbCxcbiAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLnl5bGluZW5vXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbi8vIHJldGFpbiBmaXJzdCBuIGNoYXJhY3RlcnMgb2YgdGhlIG1hdGNoXG5sZXNzOmZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHRoaXMudW5wdXQodGhpcy5tYXRjaC5zbGljZShuKSk7XG4gICAgfSxcblxuLy8gZGlzcGxheXMgYWxyZWFkeSBtYXRjaGVkIGlucHV0LCBpLmUuIGZvciBlcnJvciBtZXNzYWdlc1xucGFzdElucHV0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhc3QgPSB0aGlzLm1hdGNoZWQuc3Vic3RyKDAsIHRoaXMubWF0Y2hlZC5sZW5ndGggLSB0aGlzLm1hdGNoLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiAocGFzdC5sZW5ndGggPiAyMCA/ICcuLi4nOicnKSArIHBhc3Quc3Vic3RyKC0yMCkucmVwbGFjZSgvXFxuL2csIFwiXCIpO1xuICAgIH0sXG5cbi8vIGRpc3BsYXlzIHVwY29taW5nIGlucHV0LCBpLmUuIGZvciBlcnJvciBtZXNzYWdlc1xudXBjb21pbmdJbnB1dDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuZXh0ID0gdGhpcy5tYXRjaDtcbiAgICAgICAgaWYgKG5leHQubGVuZ3RoIDwgMjApIHtcbiAgICAgICAgICAgIG5leHQgKz0gdGhpcy5faW5wdXQuc3Vic3RyKDAsIDIwLW5leHQubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKG5leHQuc3Vic3RyKDAsMjApICsgKG5leHQubGVuZ3RoID4gMjAgPyAnLi4uJyA6ICcnKSkucmVwbGFjZSgvXFxuL2csIFwiXCIpO1xuICAgIH0sXG5cbi8vIGRpc3BsYXlzIHRoZSBjaGFyYWN0ZXIgcG9zaXRpb24gd2hlcmUgdGhlIGxleGluZyBlcnJvciBvY2N1cnJlZCwgaS5lLiBmb3IgZXJyb3IgbWVzc2FnZXNcbnNob3dQb3NpdGlvbjpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwcmUgPSB0aGlzLnBhc3RJbnB1dCgpO1xuICAgICAgICB2YXIgYyA9IG5ldyBBcnJheShwcmUubGVuZ3RoICsgMSkuam9pbihcIi1cIik7XG4gICAgICAgIHJldHVybiBwcmUgKyB0aGlzLnVwY29taW5nSW5wdXQoKSArIFwiXFxuXCIgKyBjICsgXCJeXCI7XG4gICAgfSxcblxuLy8gdGVzdCB0aGUgbGV4ZWQgdG9rZW46IHJldHVybiBGQUxTRSB3aGVuIG5vdCBhIG1hdGNoLCBvdGhlcndpc2UgcmV0dXJuIHRva2VuXG50ZXN0X21hdGNoOmZ1bmN0aW9uIChtYXRjaCwgaW5kZXhlZF9ydWxlKSB7XG4gICAgICAgIHZhciB0b2tlbixcbiAgICAgICAgICAgIGxpbmVzLFxuICAgICAgICAgICAgYmFja3VwO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja3RyYWNrX2xleGVyKSB7XG4gICAgICAgICAgICAvLyBzYXZlIGNvbnRleHRcbiAgICAgICAgICAgIGJhY2t1cCA9IHtcbiAgICAgICAgICAgICAgICB5eWxpbmVubzogdGhpcy55eWxpbmVubyxcbiAgICAgICAgICAgICAgICB5eWxsb2M6IHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfbGluZTogdGhpcy55eWxsb2MuZmlyc3RfbGluZSxcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9saW5lOiB0aGlzLmxhc3RfbGluZSxcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4sXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeXl0ZXh0OiB0aGlzLnl5dGV4dCxcbiAgICAgICAgICAgICAgICBtYXRjaDogdGhpcy5tYXRjaCxcbiAgICAgICAgICAgICAgICBtYXRjaGVzOiB0aGlzLm1hdGNoZXMsXG4gICAgICAgICAgICAgICAgbWF0Y2hlZDogdGhpcy5tYXRjaGVkLFxuICAgICAgICAgICAgICAgIHl5bGVuZzogdGhpcy55eWxlbmcsXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiB0aGlzLm9mZnNldCxcbiAgICAgICAgICAgICAgICBfbW9yZTogdGhpcy5fbW9yZSxcbiAgICAgICAgICAgICAgICBfaW5wdXQ6IHRoaXMuX2lucHV0LFxuICAgICAgICAgICAgICAgIHl5OiB0aGlzLnl5LFxuICAgICAgICAgICAgICAgIGNvbmRpdGlvblN0YWNrOiB0aGlzLmNvbmRpdGlvblN0YWNrLnNsaWNlKDApLFxuICAgICAgICAgICAgICAgIGRvbmU6IHRoaXMuZG9uZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgYmFja3VwLnl5bGxvYy5yYW5nZSA9IHRoaXMueXlsbG9jLnJhbmdlLnNsaWNlKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGluZXMgPSBtYXRjaFswXS5tYXRjaCgvKD86XFxyXFxuP3xcXG4pLiovZyk7XG4gICAgICAgIGlmIChsaW5lcykge1xuICAgICAgICAgICAgdGhpcy55eWxpbmVubyArPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy55eWxsb2MgPSB7XG4gICAgICAgICAgICBmaXJzdF9saW5lOiB0aGlzLnl5bGxvYy5sYXN0X2xpbmUsXG4gICAgICAgICAgICBsYXN0X2xpbmU6IHRoaXMueXlsaW5lbm8gKyAxLFxuICAgICAgICAgICAgZmlyc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtbixcbiAgICAgICAgICAgIGxhc3RfY29sdW1uOiBsaW5lcyA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgbGluZXNbbGluZXMubGVuZ3RoIC0gMV0ubGVuZ3RoIC0gbGluZXNbbGluZXMubGVuZ3RoIC0gMV0ubWF0Y2goL1xccj9cXG4/LylbMF0ubGVuZ3RoIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtbiArIG1hdGNoWzBdLmxlbmd0aFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnl5dGV4dCArPSBtYXRjaFswXTtcbiAgICAgICAgdGhpcy5tYXRjaCArPSBtYXRjaFswXTtcbiAgICAgICAgdGhpcy5tYXRjaGVzID0gbWF0Y2g7XG4gICAgICAgIHRoaXMueXlsZW5nID0gdGhpcy55eXRleHQubGVuZ3RoO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2UgPSBbdGhpcy5vZmZzZXQsIHRoaXMub2Zmc2V0ICs9IHRoaXMueXlsZW5nXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tb3JlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2JhY2t0cmFjayA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pbnB1dCA9IHRoaXMuX2lucHV0LnNsaWNlKG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICAgIHRoaXMubWF0Y2hlZCArPSBtYXRjaFswXTtcbiAgICAgICAgdG9rZW4gPSB0aGlzLnBlcmZvcm1BY3Rpb24uY2FsbCh0aGlzLCB0aGlzLnl5LCB0aGlzLCBpbmRleGVkX3J1bGUsIHRoaXMuY29uZGl0aW9uU3RhY2tbdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxXSk7XG4gICAgICAgIGlmICh0aGlzLmRvbmUgJiYgdGhpcy5faW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0b2tlbikge1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JhY2t0cmFjaykge1xuICAgICAgICAgICAgLy8gcmVjb3ZlciBjb250ZXh0XG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIGJhY2t1cCkge1xuICAgICAgICAgICAgICAgIHRoaXNba10gPSBiYWNrdXBba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIHJ1bGUgYWN0aW9uIGNhbGxlZCByZWplY3QoKSBpbXBseWluZyB0aGUgbmV4dCBydWxlIHNob3VsZCBiZSB0ZXN0ZWQgaW5zdGVhZC5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuLy8gcmV0dXJuIG5leHQgbWF0Y2ggaW4gaW5wdXRcbm5leHQ6ZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5FT0Y7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9pbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b2tlbixcbiAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgdGVtcE1hdGNoLFxuICAgICAgICAgICAgaW5kZXg7XG4gICAgICAgIGlmICghdGhpcy5fbW9yZSkge1xuICAgICAgICAgICAgdGhpcy55eXRleHQgPSAnJztcbiAgICAgICAgICAgIHRoaXMubWF0Y2ggPSAnJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcnVsZXMgPSB0aGlzLl9jdXJyZW50UnVsZXMoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGVtcE1hdGNoID0gdGhpcy5faW5wdXQubWF0Y2godGhpcy5ydWxlc1tydWxlc1tpXV0pO1xuICAgICAgICAgICAgaWYgKHRlbXBNYXRjaCAmJiAoIW1hdGNoIHx8IHRlbXBNYXRjaFswXS5sZW5ndGggPiBtYXRjaFswXS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSB0ZW1wTWF0Y2g7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja3RyYWNrX2xleGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuID0gdGhpcy50ZXN0X21hdGNoKHRlbXBNYXRjaCwgcnVsZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG9rZW4gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYmFja3RyYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7IC8vIHJ1bGUgYWN0aW9uIGNhbGxlZCByZWplY3QoKSBpbXBseWluZyBhIHJ1bGUgTUlTbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlbHNlOiB0aGlzIGlzIGEgbGV4ZXIgcnVsZSB3aGljaCBjb25zdW1lcyBpbnB1dCB3aXRob3V0IHByb2R1Y2luZyBhIHRva2VuIChlLmcuIHdoaXRlc3BhY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMuZmxleCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICB0b2tlbiA9IHRoaXMudGVzdF9tYXRjaChtYXRjaCwgcnVsZXNbaW5kZXhdKTtcbiAgICAgICAgICAgIGlmICh0b2tlbiAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBlbHNlOiB0aGlzIGlzIGEgbGV4ZXIgcnVsZSB3aGljaCBjb25zdW1lcyBpbnB1dCB3aXRob3V0IHByb2R1Y2luZyBhIHRva2VuIChlLmcuIHdoaXRlc3BhY2UpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2lucHV0ID09PSBcIlwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5FT0Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUVycm9yKCdMZXhpY2FsIGVycm9yIG9uIGxpbmUgJyArICh0aGlzLnl5bGluZW5vICsgMSkgKyAnLiBVbnJlY29nbml6ZWQgdGV4dC5cXG4nICsgdGhpcy5zaG93UG9zaXRpb24oKSwge1xuICAgICAgICAgICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgdG9rZW46IG51bGwsXG4gICAgICAgICAgICAgICAgbGluZTogdGhpcy55eWxpbmVub1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyByZXR1cm4gbmV4dCBtYXRjaCB0aGF0IGhhcyBhIHRva2VuXG5sZXg6ZnVuY3Rpb24gbGV4KCkge1xuICAgICAgICB2YXIgciA9IHRoaXMubmV4dCgpO1xuICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIGFjdGl2YXRlcyBhIG5ldyBsZXhlciBjb25kaXRpb24gc3RhdGUgKHB1c2hlcyB0aGUgbmV3IGxleGVyIGNvbmRpdGlvbiBzdGF0ZSBvbnRvIHRoZSBjb25kaXRpb24gc3RhY2spXG5iZWdpbjpmdW5jdGlvbiBiZWdpbihjb25kaXRpb24pIHtcbiAgICAgICAgdGhpcy5jb25kaXRpb25TdGFjay5wdXNoKGNvbmRpdGlvbik7XG4gICAgfSxcblxuLy8gcG9wIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsZXhlciBjb25kaXRpb24gc3RhdGUgb2ZmIHRoZSBjb25kaXRpb24gc3RhY2tcbnBvcFN0YXRlOmZ1bmN0aW9uIHBvcFN0YXRlKCkge1xuICAgICAgICB2YXIgbiA9IHRoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMTtcbiAgICAgICAgaWYgKG4gPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFjay5wb3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvblN0YWNrWzBdO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gcHJvZHVjZSB0aGUgbGV4ZXIgcnVsZSBzZXQgd2hpY2ggaXMgYWN0aXZlIGZvciB0aGUgY3VycmVudGx5IGFjdGl2ZSBsZXhlciBjb25kaXRpb24gc3RhdGVcbl9jdXJyZW50UnVsZXM6ZnVuY3Rpb24gX2N1cnJlbnRSdWxlcygpIHtcbiAgICAgICAgaWYgKHRoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoICYmIHRoaXMuY29uZGl0aW9uU3RhY2tbdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uc1t0aGlzLmNvbmRpdGlvblN0YWNrW3RoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMV1dLnJ1bGVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uc1tcIklOSVRJQUxcIl0ucnVsZXM7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyByZXR1cm4gdGhlIGN1cnJlbnRseSBhY3RpdmUgbGV4ZXIgY29uZGl0aW9uIHN0YXRlOyB3aGVuIGFuIGluZGV4IGFyZ3VtZW50IGlzIHByb3ZpZGVkIGl0IHByb2R1Y2VzIHRoZSBOLXRoIHByZXZpb3VzIGNvbmRpdGlvbiBzdGF0ZSwgaWYgYXZhaWxhYmxlXG50b3BTdGF0ZTpmdW5jdGlvbiB0b3BTdGF0ZShuKSB7XG4gICAgICAgIG4gPSB0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAtIDEgLSBNYXRoLmFicyhuIHx8IDApO1xuICAgICAgICBpZiAobiA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFja1tuXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIklOSVRJQUxcIjtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIGFsaWFzIGZvciBiZWdpbihjb25kaXRpb24pXG5wdXNoU3RhdGU6ZnVuY3Rpb24gcHVzaFN0YXRlKGNvbmRpdGlvbikge1xuICAgICAgICB0aGlzLmJlZ2luKGNvbmRpdGlvbik7XG4gICAgfSxcblxuLy8gcmV0dXJuIHRoZSBudW1iZXIgb2Ygc3RhdGVzIGN1cnJlbnRseSBvbiB0aGUgc3RhY2tcbnN0YXRlU3RhY2tTaXplOmZ1bmN0aW9uIHN0YXRlU3RhY2tTaXplKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGg7XG4gICAgfSxcbm9wdGlvbnM6IHt9LFxucGVyZm9ybUFjdGlvbjogZnVuY3Rpb24gYW5vbnltb3VzKHl5LHl5XywkYXZvaWRpbmdfbmFtZV9jb2xsaXNpb25zLFlZX1NUQVJUKSB7XG52YXIgWVlTVEFURT1ZWV9TVEFSVDtcbnN3aXRjaCgkYXZvaWRpbmdfbmFtZV9jb2xsaXNpb25zKSB7XG5jYXNlIDA6Lyogc2tpcCB3aGl0ZXNwYWNlICovXG5icmVhaztcbmNhc2UgMTpyZXR1cm4gJ1RFWFQnXG5icmVhaztcbmNhc2UgMjpyZXR1cm4gMTdcbmJyZWFrO1xuY2FzZSAzOnJldHVybiAxOFxuYnJlYWs7XG5jYXNlIDQ6cmV0dXJuIDMwXG5icmVhaztcbmNhc2UgNTpyZXR1cm4gMjlcbmJyZWFrO1xuY2FzZSA2OnJldHVybiAyMVxuYnJlYWs7XG5jYXNlIDc6cmV0dXJuIDEwXG5icmVhaztcbmNhc2UgODpyZXR1cm4gMTNcbmJyZWFrO1xuY2FzZSA5OnJldHVybiAnTkUnXG5icmVhaztcbmNhc2UgMTA6cmV0dXJuIDM3XG5icmVhaztcbmNhc2UgMTE6cmV0dXJuIDM2XG5icmVhaztcbmNhc2UgMTI6cmV0dXJuIDM4XG5icmVhaztcbmNhc2UgMTM6cmV0dXJuIDM5XG5icmVhaztcbmNhc2UgMTQ6cmV0dXJuIDhcbmJyZWFrO1xuY2FzZSAxNTpyZXR1cm4gMjFcbmJyZWFrO1xuY2FzZSAxNjpyZXR1cm4gMjFcbmJyZWFrO1xuY2FzZSAxNzpyZXR1cm4gMjNcbmJyZWFrO1xuY2FzZSAxODpyZXR1cm4gMjBcbmJyZWFrO1xuY2FzZSAxOTpyZXR1cm4gMTlcbmJyZWFrO1xuY2FzZSAyMDpyZXR1cm4gMTBcbmJyZWFrO1xuY2FzZSAyMTpyZXR1cm4gMTNcbmJyZWFrO1xuY2FzZSAyMjpyZXR1cm4gMTFcbmJyZWFrO1xuY2FzZSAyMzpyZXR1cm4gMTJcbmJyZWFrO1xuY2FzZSAyNDpyZXR1cm4gOVxuYnJlYWs7XG5jYXNlIDI1OnJldHVybiAnJiYnXG5icmVhaztcbmNhc2UgMjY6cmV0dXJuIDI4XG5icmVhaztcbmNhc2UgMjc6cmV0dXJuIDMzXG5icmVhaztcbmNhc2UgMjg6cmV0dXJuIDMyXG5icmVhaztcbmNhc2UgMjk6cmV0dXJuIDI2XG5icmVhaztcbmNhc2UgMzA6cmV0dXJuIDI0XG5icmVhaztcbmNhc2UgMzE6cmV0dXJuIDI3XG5icmVhaztcbmNhc2UgMzI6cmV0dXJuIDIyXG5icmVhaztcbmNhc2UgMzM6cmV0dXJuIDIyXG5icmVhaztcbmNhc2UgMzQ6cmV0dXJuIDE1XG5icmVhaztcbmNhc2UgMzU6cmV0dXJuICc/J1xuYnJlYWs7XG5jYXNlIDM2OnJldHVybiAnOidcbmJyZWFrO1xuY2FzZSAzNzpyZXR1cm4gMTdcbmJyZWFrO1xuY2FzZSAzODpyZXR1cm4gMThcbmJyZWFrO1xuY2FzZSAzOTpyZXR1cm4gMzFcbmJyZWFrO1xuY2FzZSA0MDpyZXR1cm4gMjVcbmJyZWFrO1xuY2FzZSA0MTpyZXR1cm4gJ1snXG5icmVhaztcbmNhc2UgNDI6cmV0dXJuICddJ1xuYnJlYWs7XG5jYXNlIDQzOnJldHVybiA1XG5icmVhaztcbn1cbn0sXG5ydWxlczogWy9eKD86XFxzKykvLC9eKD86XFwkW15cXCRdKlxcJCkvLC9eKD86XFxcXGxlZnRcXCgpLywvXig/OlxcXFxyaWdodFxcKSkvLC9eKD86XFxcXGZyYWNcXHspLywvXig/OlxcXFxzcXJ0XFx7KS8sL14oPzpcXFxcY2RvW3RdKS8sL14oPzpcXFxcbFtlXSkvLC9eKD86XFxcXGdbZV0pLywvXig/OlxcXFxuW2VdKS8sL14oPzpcXFxcW2EtekEtWl0rKS8sL14oPzpbYS16QS1aXSkvLC9eKD86WzAtOV0rXFwuWzAtOV0qKS8sL14oPzpbMC05XSspLywvXig/Oj0pLywvXig/OlxcKikvLC9eKD86XFwuKS8sL14oPzpcXC8pLywvXig/Oi0pLywvXig/OlxcKykvLC9eKD86PD0pLywvXig/Oj49KS8sL14oPzo8KS8sL14oPzo+KS8sL14oPzohPSkvLC9eKD86JiYpLywvXig/Ol9bXlxcKFxce10pLywvXig/OlxcXlswLTldKS8sL14oPzpcXF5bXlxcKFxcezAtOV0pLywvXig/Ol9cXHspLywvXig/OlxcXlxceykvLC9eKD86ISkvLC9eKD86JSkvLC9eKD86XFxcXCUpLywvXig/OiwpLywvXig/OlxcPykvLC9eKD86OikvLC9eKD86XFwoKS8sL14oPzpcXCkpLywvXig/OlxceykvLC9eKD86XFx9KS8sL14oPzpcXFspLywvXig/OlxcXSkvLC9eKD86JCkvXSxcbmNvbmRpdGlvbnM6IHtcIklOSVRJQUxcIjp7XCJydWxlc1wiOlswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE2LDE3LDE4LDE5LDIwLDIxLDIyLDIzLDI0LDI1LDI2LDI3LDI4LDI5LDMwLDMxLDMyLDMzLDM0LDM1LDM2LDM3LDM4LDM5LDQwLDQxLDQyLDQzXSxcImluY2x1c2l2ZVwiOnRydWV9fVxufSk7XG5yZXR1cm4gbGV4ZXI7XG59KSgpO1xucGFyc2VyLmxleGVyID0gbGV4ZXI7XG5mdW5jdGlvbiBQYXJzZXIgKCkge1xuICB0aGlzLnl5ID0ge307XG59XG5QYXJzZXIucHJvdG90eXBlID0gcGFyc2VyO3BhcnNlci5QYXJzZXIgPSBQYXJzZXI7XG5yZXR1cm4gbmV3IFBhcnNlcjtcbn0pKCk7XG5cblxuaWYgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbmV4cG9ydHMucGFyc2VyID0gcGFyc2VyO1xuZXhwb3J0cy5QYXJzZXIgPSBwYXJzZXIuUGFyc2VyO1xuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcnNlci5wYXJzZS5hcHBseShwYXJzZXIsIGFyZ3VtZW50cyk7IH07XG5leHBvcnRzLm1haW4gPSBmdW5jdGlvbiBjb21tb25qc01haW4oYXJncykge1xuICAgIGlmICghYXJnc1sxXSkge1xuICAgICAgICBjb25zb2xlLmxvZygnVXNhZ2U6ICcrYXJnc1swXSsnIEZJTEUnKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbiAgICB2YXIgc291cmNlID0gcmVxdWlyZSgnZnMnKS5yZWFkRmlsZVN5bmMocmVxdWlyZSgncGF0aCcpLm5vcm1hbGl6ZShhcmdzWzFdKSwgXCJ1dGY4XCIpO1xuICAgIHJldHVybiBleHBvcnRzLnBhcnNlci5wYXJzZShzb3VyY2UpO1xufTtcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiByZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBleHBvcnRzLm1haW4ocHJvY2Vzcy5hcmd2LnNsaWNlKDEpKTtcbn1cbn1cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIoZnVuY3Rpb24oKXt2YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL0V4cHJlc3Npb24nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cy5hdHRhY2ggPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG5cblxuICAgIGZ1bmN0aW9uIERlcml2YXRpdmUod3J0KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4LmRpZmZlcmVudGlhdGUod3J0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG4gICAgICAgIFxuXG4gICAgZ2xvYmFsWydJbmZpbml0eSddID0gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChJbmZpbml0eSwgMCk7XG4gICAgZ2xvYmFsWydJbmZpbml0eSddLnRpdGxlID0gJ0luZmluaXR5JztcbiAgICBnbG9iYWxbJ0luZmluaXR5J10uZGVzY3JpcHRpb24gPSAnJztcbiAgICBnbG9iYWxbJ2luZnR5J10gPSBnbG9iYWwuSW5maW5pdHk7XG5cblxuICAgIGdsb2JhbFsnWmVybyddID0gbmV3IEV4cHJlc3Npb24uSW50ZWdlcigwKTtcbiAgICBnbG9iYWxbJ1plcm8nXS50aXRsZSA9ICdaZXJvJztcbiAgICBnbG9iYWxbJ1plcm8nXS5kZXNjcmlwdGlvbiA9ICdBZGRpdGl2ZSBJZGVudGl0eSc7XG4gICAgZ2xvYmFsWydaZXJvJ11bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBnbG9iYWwuWmVybztcbiAgICB9O1xuICAgIGdsb2JhbFsnWmVybyddWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9O1xuICAgIGdsb2JhbFsnWmVybyddWydALSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIGdsb2JhbFsnWmVybyddWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geFsnQC0nXSgpO1xuICAgIH07XG5cbiAgICBnbG9iYWxbJ09uZSddID0gbmV3IEV4cHJlc3Npb24uSW50ZWdlcigxKTtcbiAgICBnbG9iYWxbJ09uZSddLnRpdGxlID0gJ09uZSc7XG4gICAgZ2xvYmFsWydPbmUnXS5kZXNjcmlwdGlvbiA9ICdNdWx0aXBsaWNhdGl2ZSBJZGVudGl0eSc7XG4gICAgZ2xvYmFsWydPbmUnXVsnKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGdhbW1sbih4eCkge1xuICAgICAgICB2YXIgajtcbiAgICAgICAgdmFyIHgsIHRtcCwgeSwgc2VyO1xuICAgICAgICB2YXIgY29mID0gW1xuICAgICAgICAgICAgIDU3LjE1NjIzNTY2NTg2MjkyMzUsXG4gICAgICAgICAgICAtNTkuNTk3OTYwMzU1NDc1NDkxMixcbiAgICAgICAgICAgICAxNC4xMzYwOTc5NzQ3NDE3NDcxLFxuICAgICAgICAgICAgLTAuNDkxOTEzODE2MDk3NjIwMTk5LFxuICAgICAgICAgICAgIDAuMzM5OTQ2NDk5ODQ4MTE4ODg3ZS00LFxuICAgICAgICAgICAgIDAuNDY1MjM2Mjg5MjcwNDg1NzU2ZS00LFxuICAgICAgICAgICAgLTAuOTgzNzQ0NzUzMDQ4Nzk1NjQ2ZS00LFxuICAgICAgICAgICAgIDAuMTU4MDg4NzAzMjI0OTEyNDk0ZS0zLFxuICAgICAgICAgICAgLTAuMjEwMjY0NDQxNzI0MTA0ODgzZS0zLFxuICAgICAgICAgICAgIDAuMjE3NDM5NjE4MTE1MjEyNjQzZS0zLFxuICAgICAgICAgICAgLTAuMTY0MzE4MTA2NTM2NzYzODkwZS0zLFxuICAgICAgICAgICAgIDAuODQ0MTgyMjM5ODM4NTI3NDMzZS00LFxuICAgICAgICAgICAgLTAuMjYxOTA4Mzg0MDE1ODE0MDg3ZS00LFxuICAgICAgICAgICAgIDAuMzY4OTkxODI2NTk1MzE2MjM0ZS01XG4gICAgICAgIF07XG4gICAgICAgIGlmICh4eCA8PSAwKXtcbiAgICAgICAgICAgIHRocm93KG5ldyBFcnJvcignYmFkIGFyZyBpbiBnYW1tbG4nKSk7XG4gICAgICAgIH1cbiAgICAgICAgeSA9IHggPSB4eDtcbiAgICAgICAgdG1wID0geCArIDUuMjQyMTg3NTAwMDAwMDAwMDA7XG4gICAgICAgIHRtcCA9ICh4ICsgMC41KSAqIE1hdGgubG9nKHRtcCkgLSB0bXA7XG4gICAgICAgIHNlciA9IDAuOTk5OTk5OTk5OTk5OTk3MDkyO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgMTQ7IGorKyl7XG4gICAgICAgICAgICBzZXIgKz0gY29mW2pdIC8gKyt5O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0bXAgKyBNYXRoLmxvZygyLjUwNjYyODI3NDYzMTAwMDUgKiBzZXIgLyB4KTtcbiAgICB9XG5cblxuICAgIHZhciBDYXJ0U2luZSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWxcbiAgICAgICAgICAgICAgICB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWxcbiAgICAgICAgICAgICAgICB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTS5FeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbZ2xvYmFsLnNpbi5kZWZhdWx0KHgpLCBnbG9iYWwuWmVyb10pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyhuZXcgRXJyb3IoJ0NvbXBsZXggU2luZSBDYXJ0ZXNpYW4gZm9ybSBub3QgaW1wbGVtZW50ZWQgeWV0LicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZ2xvYmFsWydzaW4nXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguc2luKHgudmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLnNpbiwgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNpbiwgeF0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAvLyBzaW4oYStiaSkgPSBzaW4oYSljb3NoKGIpICsgaSBjb3MoYSlzaW5oKGIpXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHBfYiA9IE1hdGguZXhwKHguX2ltYWcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29zaF9iID0gKGV4cF9iICsgMSAvIGV4cF9iKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzaW5oX2IgPSAoZXhwX2IgLSAxIC8gZXhwX2IpIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXhOdW1lcmljYWwoTWF0aC5zaW4oeC5fcmVhbCkgKiBjb3NoX2IsIE1hdGguY29zKHguX3JlYWwpICogc2luaF9iKTtcbiAgICAgICAgICAgICovXG4gICAgICAgIH0sXG4gICAgICAgIHJlYWxpbWFnOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gQ2FydFNpbmU7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxzaW4nLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGguc2luJyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnc2luJyxcbiAgICAgICAgdGl0bGU6ICdTaW5lIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Ucmlnb25vbWV0cmljX2Z1bmN0aW9ucyNTaW5lLjJDX2Nvc2luZS4yQ19hbmRfdGFuZ2VudCcsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxzaW4gKFxcXFxwaSknXSxcbiAgICAgICAgcmVsYXRlZDogWydjb3MnLCAndGFuJ11cbiAgICB9KTtcbiAgICBnbG9iYWxbJ2NvcyddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5jb3MoeC52YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwuY29zLCB4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuY29zLCB4XSk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgZGVyaXZhdGl2ZTogZ2xvYmFsLnNpblsnQC0nXSgpLFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcY29zJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmNvcycsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ2NvcycsXG4gICAgICAgIHRpdGxlOiAnQ29zaW5lIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDb3NpbmUgRnVuY3Rpb24gZGVzYycsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxjb3MgKFxcXFxwaSknXSxcbiAgICAgICAgcmVsYXRlZDogWydzaW4nLCAndGFuJ11cbiAgICB9KTtcblxuICAgIGdsb2JhbC5zaW4uZGVyaXZhdGl2ZSA9IGdsb2JhbC5jb3M7XG5cbiAgICBnbG9iYWxbJ3NlYyddID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHMgPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCgpO1xuICAgICAgICB2YXIgeSA9IGdsb2JhbFsnT25lJ11bJy8nXShnbG9iYWxbJ2NvcyddLmRlZmF1bHQocykpO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24uU3ltYm9saWMoeSwgW3NdKTtcbiAgICB9KCkpO1xuXG4gICAgZ2xvYmFsWyd0YW4nXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGgudGFuKHgudmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLnRhbiwgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnRhbiwgeF0pO1xuICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIGRlcml2YXRpdmU6IGdsb2JhbC5zZWNbJ14nXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDIpKSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXHRhbicsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC50YW4nLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICd0YW4nLFxuICAgICAgICB0aXRsZTogJ1RhbmdlbnQgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RhbmdlbnQgRnVuY3Rpb24gZGVzYycsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFx0YW4oXFxcXHBpLzMpJywgJ1xcXFx0YW4gKFxcXFxwaS8yKSddLFxuICAgICAgICByZWxhdGVkOiBbJ3NpbicsICdjb3MnXVxuICAgIH0pO1xuXG4gICAgZ2xvYmFsWydjc2MnXSA9IGdsb2JhbFsnY29zZWMnXSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwoKTtcbiAgICAgICAgdmFyIHkgPSBnbG9iYWxbJ09uZSddWycvJ10oZ2xvYmFsWydzaW4nXS5kZWZhdWx0KHMpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uLlN5bWJvbGljKHksIFtzXSk7XG4gICAgfSgpKTtcblxuICAgIGdsb2JhbFsnbG9nJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4LCBhc3N1bXB0aW9ucykge1xuXG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyICYmIHguYSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuWmVybztcbiAgICAgICAgICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyICYmIHguYSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuSW5maW5pdHlbJ0AtJ10oKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmKHYgPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5sb2codikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoYXNzdW1wdGlvbnMgJiYgYXNzdW1wdGlvbnMucG9zaXRpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5sb2csIHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLmxvZywgeF0pO1xuICAgICAgICB9LFxuICAgICAgICByZWFsaW1hZzogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBDYXJ0TG9nO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcbG9nJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmxvZycsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ2xvZycsXG4gICAgICAgIHRpdGxlOiAnTmF0dXJhbCBMb2dhcml0aG0nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Jhc2UgZS4gU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTmF0dXJhbF9sb2dhcml0aG0nLFxuICAgICAgICBleGFtcGxlczogWydcXFxcbG9nICh5ZV4oMngpKSddLFxuICAgICAgICByZWxhdGVkOiBbJ2V4cCcsICdMb2cnXVxuICAgIH0pO1xuICAgIHZhciBIYWxmID0gbmV3IEV4cHJlc3Npb24uUmF0aW9uYWwoMSwgMik7XG4gICAgdmFyIENhcnRMb2cgPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgICAgICBnbG9iYWwubG9nLmRlZmF1bHQoeC5hYnMoKSksXG4gICAgICAgICAgICAgICAgeC5hcmcoKVxuICAgICAgICAgICAgXSlbJyonXShIYWxmKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIENhcnRMb2cuX19wcm90b19fID0gZ2xvYmFsLmxvZztcbiAgICBnbG9iYWxbJ2F0YW4yJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIGlmKCEgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlZlY3RvcikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAoJ2F0YW4gb25seSB0YWtlcyB2ZWN0b3IgYXJndW1lbnRzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4WzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgaWYoeFsxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLmF0YW4yKHhbMF0udmFsdWUsIHhbMV0udmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5hdGFuMiwgeF0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuYXRhbjIsIHhdKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHlfcmVhbGltYWc6IGZ1bmN0aW9uKG9wLCB4KSB7XG4gICAgICAgICAgICAvL1RPRE86IERBTkdFUiEgQXNzdW1pbmcgcmVhbCBudW1iZXJzLCBidXQgaXQgc2hvdWxkIGhhdmUgc29tZSBmYXN0IHdheSB0byBkbyB0aGlzLlxuICAgICAgICAgICAgcmV0dXJuIFtFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5hdGFuMiwgeF0pLCBNLmdsb2JhbC5aZXJvXTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXHRhbl57LTF9JyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmF0YW4yJyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnYXRhbicsXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRsZTogJ1R3byBhcmd1bWVudCBhcmN0YW5nZW50IGZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBcmN0YW4oeSwgeCkuIFdpbGwgZXF1YWwgYXJjdGFuKHkgLyB4KSBleGNlcHQgd2hlbiB4IGFuZCB5IGFyZSBib3RoIG5lZ2F0aXZlLiBTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BdGFuMidcbiAgICB9KTtcblxuICAgIGdsb2JhbFsnZmFjdG9yaWFsJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4gZ2xvYmFsLkdhbW1hLmRlZmF1bHQoeFsnKyddKGdsb2JhbC5PbmUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGZhY3RvcmlhbCdcbiAgICB9KTtcblxuICAgIGdsb2JhbFsnYXRhbiddID0gZ2xvYmFsLmF0YW4yO1xuXG4gICAgZ2xvYmFsWydHYW1tYSddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KXtcbiAgICAgICAgICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB4LmE7XG4gICAgICAgICAgICAgICAgaWYodiA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5Db21wbGV4SW5maW5pdHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKHYgPCAxNSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGkgPSAxOyBpIDwgdjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwICo9IGk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkludGVnZXIocCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLkdhbW1hLCB4XSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHgudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKHYgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5JbmZpbml0eTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodiA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoLU1hdGguUEkgLyAodiAqIE1hdGguc2luKE1hdGguUEkgKiB2KSAqIE1hdGguZXhwKGdhbW1sbigtdikpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguZXhwKGdhbW1sbih2KSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5HYW1tYSwgeF0pO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcR2FtbWEnLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogZ2FtbWxuLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB9LFxuICAgICAgICB0b1R5cGVkU3RyaW5nOiBmdW5jdGlvbihsYW5ndWFnZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzOiB0aGlzW2xhbmd1YWdlXSxcbiAgICAgICAgICAgICAgICB0OmphdmFzY3JpcHQuRnVuY3Rpb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGl0bGU6ICdHYW1tYSBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvR2FtbWFfZnVuY3Rpb24nLFxuICAgICAgICBleGFtcGxlczogWydcXFxcR2FtbWEgKHgpJywgJ3ghJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnTG9nJywgJ0xvZ0dhbW1hJ11cbiAgICB9KTtcblxuICAgIGdsb2JhbFsnUmUnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgcmV0dXJuIHgucmVhbCgpO1xuICAgICAgICB9LFxuICAgICAgICBhcHBseV9yZWFsaW1hZzogZnVuY3Rpb24ob3AsIHgpIHtcbiAgICAgICAgICAgIHJldHVybiBbeC5yZWFsKCksIGdsb2JhbC5aZXJvXTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXFJlJ1xuICAgIH0pO1xuXG4gICAgZ2xvYmFsWydJbSddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICByZXR1cm4geC5pbWFnKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGRpc3RyaWJ1dGVkX3VuZGVyX2RpZmZlcmVudGlhdGlvbjogdHJ1ZSxcbiAgICAgICAgYXBwbHlfcmVhbGltYWc6IGZ1bmN0aW9uKG9wLCB4KSB7XG4gICAgICAgICAgICByZXR1cm4gW3guaW1hZygpLCBnbG9iYWwuWmVyb107XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxJbSdcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIEZpbml0ZVNldChlbGVtZW50cykge1xuICAgICAgICB0aGlzLmVsZW1lbnRzID0gZWxlbWVudHMgfHwgW107XG4gICAgfVxuICAgIEZpbml0ZVNldC5wcm90b3R5cGUuaW50ZXJzZWN0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHguZWxlbWVudHMuaW5kZXhPZih0aGlzLmVsZW1lbnRzW2ldKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaCh0aGlzLmVsZW1lbnRzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEZpbml0ZVNldChyZXMpO1xuICAgIH07XG4gICAgRmluaXRlU2V0LnByb3RvdHlwZS5lbnVtZXJhdGUgPSBmdW5jdGlvbiAobiwgZm4pIHtcbiAgICAgICAgdGhpcy5lbGVtZW50cyA9IFtdO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzW2ldID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm4pIHtcbiAgICAgICAgICAgIHRoaXMubWFwKGZuKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRmluaXRlU2V0LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgZm9yKHZhciBpID0gMCwgbCA9IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzW2ldID0gbmV3IGZuKHRoaXMuZWxlbWVudHNbaV0sIGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgRmluaXRlU2V0LnByb3RvdHlwZS5zdWJzZXQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBmb3IodmFyIGkgPSAwLCBsID0gdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh4LmVsZW1lbnRzLmluZGV4T2YodGhpcy5lbGVtZW50c1tpXSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIEZpbml0ZVNldC5wcm90b3R5cGUucHN1YnNldCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiAodGhpcy5lbGVtZW50cy5sZW5ndGggPCB4LmVsZW1lbnRzLmxlbmd0aCkgJiYgdGhpcy5zdWJzZXQoeCk7XG4gICAgfTtcbiAgICBGaW5pdGVTZXQucHJvdG90eXBlLnN1cHNldCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4LnN1YnNldCh0aGlzKTtcbiAgICB9O1xuXG4gICAgRmluaXRlU2V0LnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIXRoaXMuZWxlbWVudHMubGVuZ3RoICE9PSB4LmVsZW1lbnRzLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGZvcih2YXIgaSA9IDAsIGwgPSB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudHNbaV0gIT09IHguZWxlbWVudHNbaV0pIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHV0aWwuaW5oZXJpdHMoTW9kdWxvR3JvdXAsIEZpbml0ZVNldCk7XG4gICAgZnVuY3Rpb24gTW9kdWxvR3JvdXAobiwgb3BlcmF0b3IpIHtcbiAgICAgICAgRmluaXRlU2V0LmNhbGwodGhpcyk7XG5cbiAgICAgICAgb3BlcmF0b3IgPSBvcGVyYXRvciB8fCAnZGVmYXVsdCc7XG5cbiAgICAgICAgZnVuY3Rpb24gRWxlbWVudChfLCBuKSB7XG4gICAgICAgICAgICB0aGlzLm4gPSBuO1xuICAgICAgICB9XG5cbiAgICAgICAgRWxlbWVudC5wcm90b3R5cGVbb3BlcmF0b3JdXG4gICAgICAgID0gRWxlbWVudC5wcm90b3R5cGUuZGVmYXVsdFxuICAgICAgICA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVsZW1lbnQoKHRoaXMubiArIHgubikgJSBuKTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW51bWVyYXRlKG4sIEVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMucHJvdG90eXBlID0gRWxlbWVudC5wcm90b3R5cGU7XG5cbiAgICB9O1xuXG4gICAgdXRpbC5pbmhlcml0cyhNdWx0aVZhbHVlLCBGaW5pdGVTZXQpO1xuXG4gICAgZnVuY3Rpb24gTXVsdGlWYWx1ZShlbGVtZW50cykge1xuICAgICAgICBGaW5pdGVTZXQuY2FsbCh0aGlzLCBlbGVtZW50cyk7XG4gICAgfVxuXG5cbiAgICBNdWx0aVZhbHVlLnByb3RvdHlwZS5kZWZhdWx0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdGhpcy5vcGVyYXRvcignZGVmYXVsdCcsIHgpO1xuICAgIH07XG5cbiAgICBNdWx0aVZhbHVlLnByb3RvdHlwZVsnKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdGhpcy5vcGVyYXRvcignKycsIHgpO1xuICAgIH07XG5cbiAgICBNdWx0aVZhbHVlLnByb3RvdHlwZVsnKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdGhpcy5vcGVyYXRvcignKicsIHgpO1xuICAgIH07XG5cbiAgICBNdWx0aVZhbHVlLnByb3RvdHlwZS5vcGVyYXRvciA9IGZ1bmN0aW9uIChvcGVyYXRvciwgeCkge1xuXG4gICAgICAgIGlmICh4IGluc3RhbmNlb2YgTXVsdGlWYWx1ZSkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IFtdO1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGogPSAwOyBqIDwgeC5lbGVtZW50cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbiA9IHRoaXMuZWxlbWVudHNbaV1bb3BlcmF0b3JdKGopO1xuICAgICAgICAgICAgICAgICAgICByZXMucHVzaChuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgTXVsdGlWYWx1ZShyZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFbb3BlcmF0b3JdKHgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiBxdWFkcmFudCh4KSB7XG4gICAgICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICByZXR1cm4geC52YWx1ZSA+IDAgPyAnKycgOiAnLSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJystJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgICAgICBpZiAoeC5vcGVyYXRvciA9PT0gJ14nKSB7XG4gICAgICAgICAgICAgICAgdmFyIHEwID0gcXVhZHJhbnQoeFswXSk7XG4gICAgICAgICAgICAgICAgdmFyIG4gPSB4WzFdLnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHEwID09PSAnKycpIHJldHVybiAnKyc7XG4gICAgICAgICAgICAgICAgaWYgKHEwID09PSAnLScgfHwgcTAgPT09ICcrLScpIHJldHVybiBuICUgMiA9PT0gMCA/ICcrJyA6ICctJztcblxuICAgICAgICAgICAgICAgIHJldHVybiAnKy0nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHEgPSBbXS5tYXAuY2FsbCh4LCBxdWFkcmFudCk7XG5cbiAgICAgICAgICAgIGlmIChxWzBdID09PSAnKy0nIHx8IHFbMV0gPT09ICcrLScpIHJldHVybiAnKy0nO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKHgub3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHFbMV0gPT09ICctJykgcVsxXSA9ICcrJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHFbMV0gPT09ICcrJykgcVsxXSA9ICctJztcblxuICAgICAgICAgICAgICAgIGNhc2UgJysnOiByZXR1cm4gcVswXSA9PT0gcVsxXSA/IHFbMF0gOiAnKy0nO1xuXG5cbiAgICAgICAgICAgICAgICBjYXNlICcvJzpcbiAgICAgICAgICAgICAgICBjYXNlICcqJzogcmV0dXJuIHFbMF0gPT09IHFbMV0gPyAnKycgOiAnLSc7XG5cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNQb3NpdGl2ZSh4KSB7XG4gICAgICAgIHZhciBzID0gcXVhZHJhbnQoeCk7XG4gICAgICAgIHJldHVybiBzID09PSAnKyc7XG4gICAgfVxuXG4gICAgZ2xvYmFsWydzcXJ0J10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG5cbiAgICAgICAgICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIHZhciBzcXJ0TWFnWCA9IE1hdGguc3FydCh2KVxuICAgICAgICAgICAgICAgIGlmKHYgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLlplcm8sIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoc3FydE1hZ1gpXG4gICAgICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChzcXJ0TWFnWCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgICAgICAgICAgICAgICAgICB4WzBdLFxuICAgICAgICAgICAgICAgICAgICB4WzFdWycvJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcigyKSlcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICAgICAgICAgIHZhciBwb3MgPSBpc1Bvc2l0aXZlKHgpO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgaXQgaXMgcG9zaXRpdmVcbiAgICAgICAgICAgICAgICBpZiAocG9zID09PSAnKycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwuc3FydCwgeF0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuc3FydCwgeF0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKTtcblxuICAgICAgICAgICAgdGhyb3coJ1NRUlQ6ID8/PycpO1xuICAgICAgICAgICAgc3dpdGNoICh4LmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkNvbXBsZXg6XG4gICAgICAgICAgICAgICAgICAgIC8vaHR0cDovL3d3dy5tYXRocHJvcHJlc3MuY29tL3N0YW4vYmlibGlvZ3JhcGh5L2NvbXBsZXhTcXVhcmVSb290LnBkZlxuICAgICAgICAgICAgICAgICAgICB2YXIgc2duX2I7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4Ll9pbWFnID09PSAwLjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KE1hdGguc3FydCh4Ll9yZWFsKSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZih4Ll9pbWFnPjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNnbl9iID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2duX2IgPSAtMS4wO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBzX2EyX2IyID0gTWF0aC5zcXJ0KHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IG9uZV9vbl9ydDIgKiBNYXRoLnNxcnQoc19hMl9iMiArIHguX3JlYWwpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcSA9IHNnbl9iICogb25lX29uX3J0MiAqIE1hdGguc3FydChzX2EyX2IyIC0geC5fcmVhbCk7XG4gICAgICAgICAgICAgICAgY2FzZSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWw6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5SZWFsTnVtZXJpY2FsKE1hdGguc3FydCh4KSk7XG4gICAgICAgICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3QuUmVhbDpcbiAgICAgICAgICAgICAgICBjYXNlIEV4cHJlc3Npb24uTGlzdDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHgub3BlcmF0b3IgPT09ICdeJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5hYnMuYXBwbHkodW5kZWZpbmVkLCB4WzBdLmFwcGx5KCdeJywgeFsxXS5hcHBseSgnLycsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoMiwwKSkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGx5X3JlYWxpbWFnOiBmdW5jdGlvbihvcCwgeCkge1xuICAgICAgICAgICAgLy9UT0RPOiBEQU5HRVIhIEFzc3VtaW5nIHJlYWwgbnVtYmVycywgYnV0IGl0IHNob3VsZCBoYXZlIHNvbWUgZmFzdCB3YXkgdG8gZG8gdGhpcy5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9Vc2VzIGV4cCwgYXRhbjIgYW5kIGxvZyBmdW5jdGlvbnMuIEEgcmVhbGx5IGJhZCBpZGVhLiAoc3F1YXJlIHJvb3RpbmcsIHRoZW4gc3F1YXJpbmcsIHRoZW4gYXRhbiwgYWxzbyBbZXhwKGxvZyldKVxuICAgICAgICAgICAgcmV0dXJuIHhbJ14nXShuZXcgRXhwcmVzc2lvbi5SYXRpb25hbCgxLCAyKSkucmVhbGltYWcoKTtcbiAgICAgICAgICAgIC8vdmFyIHJpID0geC5yZWFsaW1hZygpO1xuICAgICAgICAgICAgLy9yZXR1cm4gW0V4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKSwgTS5nbG9iYWwuWmVyb107XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxzcXJ0JyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLnNxcnQnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdzcXJ0JyxcbiAgICAgICAgdG9UeXBlZFN0cmluZzogZnVuY3Rpb24obGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgczogdGhpc1tsYW5ndWFnZV0sXG4gICAgICAgICAgICAgICAgdDpqYXZhc2NyaXB0LkZ1bmN0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRpdGxlOiAnU3FydCBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU3F1YXJlX1Jvb3QnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcc3FydCAoeF40KSddLFxuICAgICAgICByZWxhdGVkOiBbJ3BvdycsICdhYnMnLCAnbW9kJ11cbiAgICB9KTtcbiAgICBnbG9iYWxbJ2FicyddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgLy9Vc2luZyBhYnMgaXMgYmV0dGVyIChJIHRoaW5rKSBiZWNhdXNlIGl0IGZpbmRzIHRoZSBtZXRob2QgdGhyb3VnaCB0aGUgcHJvdG90eXBlIGNoYWluLFxuICAgICAgICAgICAgLy93aGljaCBpcyBnb2luZyB0byBiZSBmYXN0ZXIgdGhhbiBkb2luZyBhbiBpZiBsaXN0IC8gc3dpdGNoIGNhc2UgbGlzdC5cbiAgICAgICAgICAgIHJldHVybiB4LmFicygpO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcYWJzJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmFicycsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ2FicycsXG4gICAgICAgIHRpdGllOiAnQWJzb2x1dGUgVmFsdWUgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FicycsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxhYnMgKC0zKScsICdcXFxcYWJzIChpKzMpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnYXJnJywgJ3RhbiddXG4gICAgfSk7XG5cbiAgICAvLyBJdCBpcyBzZWxmLXJlZmVyZW50aWFsXG4gICAgZ2xvYmFsLmFicy5kZXJpdmF0aXZlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwoKTtcbiAgICAgICAgICAgIHZhciB5ID0gc1snLyddKHMuYWJzKCkpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uLlN5bWJvbGljKHksIFtzXSk7XG4gICAgfSgpKTtcbiAgICBnbG9iYWxbJ2FyZyddID0ge1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdBUkcgSVMgRk9SIFVTRVIgSU5QVVQgT05MWS4gVVNFIC5hcmcoKScpO1xuICAgICAgICAgICAgLy9Vc2luZyBhYnMgaXMgYmV0dGVyIChJIHRoaW5rKSBiZWNhdXNlIGl0IGZpbmRzIHRoZSBtZXRob2QgdGhyb3VnaCB0aGUgcHJvdG90eXBlIGNoYWluLFxuICAgICAgICAgICAgLy93aGljaCBpcyBnb2luZyB0byBiZSBmYXN0ZXIgdGhhbiBkb2luZyBhbiBpZiBsaXN0IC8gc3dpdGNoIGNhc2UgbGlzdC4gVE9ETzogQ2hlY2sgdGhlIHRydXRoZnVsbG5lcyBvZiB0aGlzIVxuICAgICAgICAgICAgcmV0dXJuIHguYXJnKCk7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxhcmcnLCAvL3RlbXBcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmFyZ19yZWFsJyxcbiAgICAgICAgdG9UeXBlZFN0cmluZzogZnVuY3Rpb24obGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgczogdGhpc1tsYW5ndWFnZV0sXG4gICAgICAgICAgICAgICAgdDpqYXZhc2NyaXB0LkZ1bmN0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRpdGllOiAnQXJnIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBcmcnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcYXJnICgtMyknLCAnXFxcXGFyZyAoMyknLCAnXFxcXGFyZygzKzJpKSddLFxuICAgICAgICByZWxhdGVkOiBbJ2FicyddXG4gICAgfVxuXG5cblxuICAgIGdsb2JhbFsnZSddID0gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLkUsIDApO1xuICAgIGdsb2JhbFsnZSddLnRpdGxlID0gJ2UnO1xuICAgIGdsb2JhbFsnZSddLmRlc2NyaXB0aW9uID0gJ1RoZSB0cmFuc2NlbmRlbnRhbCBudW1iZXIgdGhhdCBpcyB0aGUgYmFzZSBvZiB0aGUgbmF0dXJhbCBsb2dhcml0aG0sIGFwcHJveGltYXRlbHkgZXF1YWwgdG8gMi43MTgyOC4nO1xuICAgIGdsb2JhbC5lLnMgPSBmdW5jdGlvbiAobGFuZykge1xuICAgICAgICBpZihsYW5nID09PSAndGV4dC9qYXZhc2NyaXB0Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCdNYXRoLkUnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihsYW5nID09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCdlJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCcyLjcxODI4MTgyODQ1OTA0NScpO1xuICAgIH07XG5cblxuICAgIGdsb2JhbFsncGknXSA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5QSSwgMCk7XG4gICAgZ2xvYmFsWydwaSddLnRpdGxlID0gJ1BpJztcbiAgICBnbG9iYWxbJ3BpJ10uZGVzY3JpcHRpb24gPSAnJztcbiAgICBnbG9iYWwucGkucyA9IGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgICAgIGlmKGxhbmcgPT09ICd0ZXh0L2phdmFzY3JpcHQnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ01hdGguUEknKTtcbiAgICAgICAgfVxuICAgICAgICBpZihsYW5nID09PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnXFxcXHBpJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCczLjE0MTU5MjY1MzU4OTc5MycpO1xuICAgIH07XG4gICAgLy8gVGhlIHJlYWwgY2lyY2xlIGNvbnN0YW50OlxuICAgIGdsb2JhbC50YXUgPSBnbG9iYWxbJ3BpJ11bJyonXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDIpKTtcblxuXG4gICAgZ2xvYmFsLmxvZy5kZXJpdmF0aXZlID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24uU3ltYm9saWMoZ2xvYmFsLk9uZVsnLyddKG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKCkpKTtcblxuICAgIGdsb2JhbFsnaSddID0gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtnbG9iYWxbJ1plcm8nXSwgZ2xvYmFsWydPbmUnXV0pO1xuICAgIGdsb2JhbFsnaSddLnRpdGxlID0gJ0ltYWdpbmFyeSBVbml0JztcbiAgICBnbG9iYWxbJ2knXS5kZXNjcmlwdGlvbiA9ICdBIG51bWJlciB3aGljaCBzYXRpc2ZpZXMgdGhlIHByb3BlcnR5IDxtPmleMiA9IC0xPC9tPi4nO1xuICAgIGdsb2JhbFsnaSddLnJlYWxpbWFnID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIGdsb2JhbC5aZXJvLFxuICAgICAgICAgICAgZ2xvYmFsLk9uZVxuICAgICAgICBdKTtcbiAgICB9O1xuICAgIGdsb2JhbFsnaSddWycqW1RPRE9dJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBcbiAgICB9O1xuXG4gICAgZ2xvYmFsWydkJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbmZpbml0ZXNpbWFsKHgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBnbG9iYWwuZFsnLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW5maW5pdGVzaW1hbCkge1xuICAgICAgICAgICAgaWYoeC54IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gRGVyaXZhdGl2ZSBvcGVyYXRvclxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGVyaXZhdGl2ZSh4LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoeC54IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5WZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHgueCwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEZXJpdmF0aXZlKHgpO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uZnVzaW5nIGluZml0ZXNpbWFsIG9wZXJhdG9yIGRpdmlzaW9uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdygnRGl2aWRpbmcgZCBieSBzb21lIGxhcmdlIG51bWJlci4nKTtcbiAgICAgICAgXG4gICAgfTtcbiAgICBnbG9iYWxbJ3VuZGVmaW5lZCddID0ge1xuICAgICAgICBzOiBmdW5jdGlvbiAobGFuZyl7XG4gICAgICAgICAgICBpZiAobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ3VuZGVmaW5lZCcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJygxLjAvMC4wKScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBkaWZmZXJlbnRpYXRlOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICAnKic6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgICcrJzogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJy0nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJy8nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJ14nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJ0AtJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGdsb2JhbFsnc3VtJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICB0aHJvdygnU3VtIG5vdCBwcm9wZXJseSBjb25zdHJ1Y3RlZCB5ZXQuJyk7XG4gICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGdsb2JhbFsnc3VtJ11bJ18nXSA9IGZ1bmN0aW9uIChlcSkge1xuICAgICAgICAvLyBzdGFydDogXG4gICAgICAgIHZhciB0ID0gZXFbMF07XG4gICAgICAgIHZhciB2ID0gZXFbMV07XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5TdW0uUmVhbCh0LCB2KTtcbiAgICB9XG4gICAgXG59O1xufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5mdW5jdGlvbiBMYW5ndWFnZShwYXJzZXIsIENvbnN0cnVjdCwgbGFuZ3VhZ2UpIHtcbiAgICB0aGlzLmNmZyA9IHBhcnNlcjtcbiAgICB0aGlzLkNvbnN0cnVjdCA9IENvbnN0cnVjdDtcbiAgICB2YXIgb3BlcmF0b3JzID0gdGhpcy5vcGVyYXRvcnMgPSB7fSxcbiAgICAgICAgb3BQcmVjZWRlbmNlID0gMDtcbiAgICBmdW5jdGlvbiBvcCh2LCBhc3NvY2lhdGl2aXR5LCBhcml0eSkge1xuXG4gICAgfVxuICAgIGxhbmd1YWdlLmZvckVhY2goZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgZnVuY3Rpb24gZGVmb3Aoc3RyLCBvKSB7XG4gICAgICAgICAgICB2YXIgYXNzb2NpYXRpdml0eSA9IG9bMV0gfHwgMDtcbiAgICAgICAgICAgIHZhciBhcml0eSA9IChvWzJdID09PSB1bmRlZmluZWQpID8gMiA6IG9bMl07XG5cbiAgICAgICAgICAgIG9wZXJhdG9yc1tzdHJdID0gIHtcbiAgICAgICAgICAgICAgICBhc3NvY2lhdGl2aXR5OiBhc3NvY2lhdGl2aXR5LFxuICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IG9wUHJlY2VkZW5jZSsrLFxuICAgICAgICAgICAgICAgIGFyaXR5OiBhcml0eVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyID0gb1swXTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBkZWZvcChzdHIsIG8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyLmZvckVhY2goZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgICAgICAgICBkZWZvcChzLCBvKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbkxhbmd1YWdlLkNvZGUgPSByZXF1aXJlKCcuL0NvZGUnKTtcblxudmFyIF8gICAgICAgID0gTGFuZ3VhZ2UucHJvdG90eXBlO1xuXG5fLnBhcnNlICAgICAgPSByZXF1aXJlKCcuL3BhcnNlJyk7XG5fLnN0cmluZ2lmeSAgPSByZXF1aXJlKCcuL3N0cmluZ2lmeScpO1xuXG5fLnBvc3RmaXggPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgdmFyIG9wZXJhdG9yID0gdGhpcy5vcGVyYXRvcnNbc3RyXTtcbiAgICByZXR1cm4gIG9wZXJhdG9yLmFzc29jaWF0aXZpdHkgPT09IDAgJiYgXG4gICAgICAgICAgICBvcGVyYXRvci5hcml0eSA9PT0gMTtcbn07XG5cbl8udW5hcnkgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgdmFyIHVuYXJ5X3NlY29uZGFyeXMgPSBbJysnLCAnLScsICfCsSddO1xuICAgIHJldHVybiAodW5hcnlfc2Vjb25kYXJ5cy5pbmRleE9mKG8pICE9PSAtMSkgPyAoJ0AnICsgbykgOiBmYWxzZTtcbn07XG5cbl8uYXNzb2NpYXRpdmUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgcmV0dXJuIHRoaXMub3BlcmF0b3JzW3N0cl0uYXNzb2NpYXRpdml0eSA9PT0gMDtcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IExhbmd1YWdlO1xuIiwiKGZ1bmN0aW9uKCl7dmFyIExhbmd1YWdlID0gcmVxdWlyZSgnLi8nKTtcblxudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi9FeHByZXNzaW9uJyksXG4gICAgR2xvYmFsICAgICA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xuXG52YXIgY3Jvc3NQcm9kdWN0ID0gU3RyaW5nLmZyb21DaGFyQ29kZSgyMTUpOyAvLyAmdGltZXM7IGNoYXJhY3RlclxuXG4vLyBCdWlsdCBieSBKaXNvbjpcbnZhciBwYXJzZXIgPSByZXF1aXJlKCcuLi8uLi9ncmFtbWFyL3BhcnNlci5qcycpO1xuXG5wYXJzZXIucGFyc2VFcnJvciA9IGZ1bmN0aW9uIChzdHIsIGhhc2gpIHtcbiAgICAvLyB7XG4gICAgLy8gICAgIHRleHQ6IHRoaXMubGV4ZXIubWF0Y2gsXG4gICAgLy8gICAgIHRva2VuOiB0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wsXG4gICAgLy8gICAgIGxpbmU6IHRoaXMubGV4ZXIueXlsaW5lbm8sXG4gICAgLy8gICAgIGxvYzogeXlsb2MsXG4gICAgLy8gICAgIGV4cGVjdGVkOlxuICAgIC8vICAgICBleHBlY3RlZFxuICAgIC8vIH1cbiAgICB2YXIgZXIgPSBuZXcgU3ludGF4RXJyb3Ioc3RyKTtcbiAgICBlci5saW5lID0gaGFzaC5saW5lO1xuICAgIHRocm93IGVyO1xufTtcblxuXG52YXIgbGVmdCA9IC0xLCByaWdodCA9ICsxO1xudmFyIEwgPSBsZWZ0O1xudmFyIFIgPSByaWdodDtcblxuXG5cbnZhciBsYW5ndWFnZSA9IG1vZHVsZS5leHBvcnRzID0gbmV3IExhbmd1YWdlKHBhcnNlciwge1xuICAgICAgICBOdW1iZXI6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIGlmIChzdHIgPT09ICcxJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHIgPT09ICcwJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKC9eXFxkKyQvLnRlc3Qoc3RyKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKE51bWJlcihzdHIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgvXltcXGRdKlxcLltcXGRdKyQvLnRlc3Qoc3RyKSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWNpbWFsUGxhY2UgPSBzdHIuaW5kZXhPZignLicpO1xuICAgICAgICAgICAgICAgIC8vIDEyLjM0NSAtPiAxMjM0NSAvIDEwMDBcbiAgICAgICAgICAgICAgICAvLyAwMC41IC0+IDUvMTBcbiAgICAgICAgICAgICAgICB2YXIgZGVub21fcCA9IHN0ci5sZW5ndGggLSBkZWNpbWFsUGxhY2UgLSAxO1xuICAgICAgICAgICAgICAgIHZhciBkID0gTWF0aC5wb3coMTAsIGRlbm9tX3ApO1xuICAgICAgICAgICAgICAgIHZhciBuID0gTnVtYmVyKHN0ci5yZXBsYWNlKCcuJywgJycpKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uUmF0aW9uYWwobiwgZCkucmVkdWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChOdW1iZXIoc3RyKSk7XG4gICAgICAgIH0sXG4gICAgICAgIFN0cmluZzogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfSxcbiAgICAgICAgU2luZ2xlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAvLyBTaW5nbGUgbGF0ZXggY2hhcnMgZm9yIHheMywgeF55IGV0YyAoTk9UIHhee2FiY30pXG4gICAgICAgICAgICBpZiAoIWlzTmFOKHN0cikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uSW50ZWdlcihOdW1iZXIoc3RyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbChzdHIpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBbXG4gICAgWyc7J10sICAgICAgICAgIC8qTCAvIFIgbWFrZXMgbm8gZGlmZmVyZW5jZT8/PyE/PyE/ICovXG4gICAgWycsJ10sXG4gICAgW1snPScsICcrPScsICctPScsICcqPScsICcvPScsICclPScsICcmPScsICdePScsICd8PSddLFJdLFxuICAgIFtbJz8nLCc6J10sUiwyXSxcbiAgICBbWyfiiKgnXV0sXG4gICAgW1snJiYnXV0sXG4gICAgW1snfCddXSxcbiAgICBbWyc/Pz8/Pz8nXV0sLy9YT1JcbiAgICBbWycmJ11dLFxuICAgIFtbJz09JywgJ+KJoCcsICchPT0nLCAnPT09J11dLFxuICAgIFtbJzwnLCAnPD0nLCAnPicsICc+PSddLExdLFxuICAgIFtbJz4+JywgJzw8J11dLFxuICAgIFsnwrEnLCBSLCAyXSxcbiAgICBbWycrJ10sIHRydWVdLFxuICAgIFtbJy0nXSwgTF0sXG4gICAgW1sn4oirJywgJ+KIkSddLCBSLCAxXSxcbiAgICBbWyclJ11dLFxuICAgIFtbJyonXV0sXG4gICAgW2Nyb3NzUHJvZHVjdCwgUl0sXG4gICAgW1snQCsnLCAnQC0nLCAnQMKxJ10sIFIsIDFdLCAvL3VuYXJ5IHBsdXMvbWludXNcbiAgICBbWyfCrCddLCBMLCAxXSxcbiAgICBbJ2RlZmF1bHQnLCAwLCAyXSwgLy9JIGNoYW5nZWQgdGhpcyB0byBSIGZvciA1c2luKHQpXG4gICAgWyfiiJgnLCAwLCAyXSxcbiAgICBbWycvJ11dLFxuICAgIFtbJ14nXV0sLy9lKip4XG4gICAgWychJywgTCwgMV0sXG4gICAgW1snfiddLCBSLCAxXSwgLy9iaXR3aXNlIG5lZ2F0aW9uXG4gICAgW1snKysnLCAnKysnLCAnLicsICctPiddLEwsMV0sXG4gICAgW1snOjonXV0sXG4gICAgW1snXyddLCBMLCAyXSxcbiAgICBbJ3ZhcicsIFIsIDFdLFxuICAgIFsnYnJlYWsnLCBSLCAwXSxcbiAgICBbJ3Rocm93JywgUiwgMV0sXG4gICAgWydcXCcnLCBMLCAxXSxcbiAgICBbJ1xcdTIyMUEnLCBSLCAxXSwgLy8gU3FydFxuICAgIFsnIycsIFIsIDFdIC8qYW5vbnltb3VzIGZ1bmN0aW9uKi9cbl0pO1xuXG4vKlxuIExhbmd1YWdlIHNwZWMgY29sdW1ucyBpbiBvcmRlciBvZiBfaW5jcmVhc2luZyBwcmVjZWRlbmNlXzpcbiAqIG9wZXJhdG9yIHN0cmluZyByZXByZXNlbnRhdGlvbihzKS4gVGhlc2UgYXJlIGRpZmZlcmVudCBvcGVyYXRvcnMsIGJ1dCBzaGFyZSBhbGwgcHJvcGVydGllcy5cbiAqIEFzc29jaWF0aXZpdHlcbiAqIE9wZXJhbmQgY291bnQgKE11c3QgYmUgYSBmaXhlZCBudW1iZXIpIFxuICogKFRPRE8/PykgY29tbXV0ZSBncm91cD8gLSBvciBzaG91bGQgdGhpcyBiZSBkZXJpdmVkP1xuICogKFRPRE8/KSBhc3NvY2lhdGl2ZT8gY29tbXV0YXRpdmU/ICAtIFNob3VsZCBiZSBjYWxjdWxhdGVkP1xuICogKFRPRE8/KSBJZGVudGl0eT9cbiovXG5cbi8vIHZhciBtYXRoZW1hdGljYSA9IG5ldyBMYW5ndWFnZShbXG4vLyAgICAgWyc7J10sXG4vLyAgICAgWycsJ10sXG4vLyAgICAgW1snPScsICcrPSddXVxuLy8gXSk7XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCAgICA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBHbG9iYWwgID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGV4dDtcblxudXRpbC5pbmhlcml0cyhDb250ZXh0LCB7cHJvdG90eXBlOiBHbG9iYWx9KTtcblxuZnVuY3Rpb24gQ29udGV4dCgpIHtcblxufVxuXG5Db250ZXh0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNwbGljZSgwKTtcbn07XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbmZ1bmN0aW9uIEV4cHJlc3Npb24oKSB7XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRXhwcmVzc2lvbjtcblxuRXhwcmVzc2lvbi5MaXN0ICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9MaXN0Jyk7XG5FeHByZXNzaW9uLkxpc3QuUmVhbCAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0xpc3QvUmVhbCcpO1xuRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4gID0gcmVxdWlyZSgnLi9MaXN0L0NvbXBsZXhDYXJ0ZXNpYW4nKTtcbkV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIgICAgICA9IHJlcXVpcmUoJy4vTGlzdC9Db21wbGV4UG9sYXInKTtcbkV4cHJlc3Npb24uQ29uc3RhbnQgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vQ29uc3RhbnQnKTtcbkV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCAgICAgICA9IHJlcXVpcmUoJy4vTnVtZXJpY2FsQ29tcGxleCcpO1xuRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsICAgICAgICAgID0gcmVxdWlyZSgnLi9OdW1lcmljYWxSZWFsJyk7XG5FeHByZXNzaW9uLlJhdGlvbmFsICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL1JhdGlvbmFsJyk7XG5FeHByZXNzaW9uLkludGVnZXIgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0ludGVnZXInKTtcbkV4cHJlc3Npb24uU3ltYm9sICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vU3ltYm9sJyk7XG5FeHByZXNzaW9uLlN5bWJvbC5SZWFsICAgICAgICAgICAgPSByZXF1aXJlKCcuL1N5bWJvbC9SZWFsJyk7XG5FeHByZXNzaW9uLlN0YXRlbWVudCAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL1N0YXRlbWVudCcpO1xuRXhwcmVzc2lvbi5WZWN0b3IgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9WZWN0b3InKTtcbkV4cHJlc3Npb24uTWF0cml4ICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vTWF0cml4Jyk7XG5FeHByZXNzaW9uLkZ1bmN0aW9uICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0Z1bmN0aW9uJyk7XG5FeHByZXNzaW9uLkZ1bmN0aW9uLlN5bWJvbGljICAgICAgPSByZXF1aXJlKCcuL0Z1bmN0aW9uL1N5bWJvbGljJyk7XG5FeHByZXNzaW9uLkluZmluaXRlc2ltYWwgICAgICAgICAgPSByZXF1aXJlKCcuL0luZmluaXRlc2ltYWwnKTtcblxudmFyIF8gPSBFeHByZXNzaW9uLnByb3RvdHlwZTtcblxuXy50b1N0cmluZyA9IG51bGw7XG5fLnZhbHVlT2YgPSBudWxsO1xuXG5fLmltYWdlVVJMID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnaHR0cDovL2xhdGV4LmNvZGVjb2dzLmNvbS9naWYubGF0ZXg/JyArXG4gICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnMoJ3RleHQvbGF0ZXgnKS5zKTtcbn07XG5cbl8ucmVuZGVyTGFUZVggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uuc3JjID0gdGhpcy5pbWFnZVVSTCgpO1xuICAgIHJldHVybiBpbWFnZTtcbn07XG5cbi8vIHN1YnN0dXRpb24gZGVmYXVsdDpcbl8uc3ViID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy8gbGltaXQgZGVmYXVsdFxuXy5saW0gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiB0aGlzLnN1Yih4LCB5KTtcbn07XG5cbl9bJywnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3RhdGVtZW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db25kaXRpb25hbCh4LCB0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzLCB4XSk7XG59O1xuXG5cblsnPScsICchPScsICc+JywgJz49JywgJzwnLCAnPD0nXS5mb3JFYWNoKGZ1bmN0aW9uIChvcGVyYXRvcikge1xuICAgIF9bb3BlcmF0b3JdID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLlN0YXRlbWVudCh0aGlzLCB4LCBvcGVyYXRvcik7XG4gICAgfTtcbn0pO1xuXG5cblxuLy8gY3Jvc3NQcm9kdWN0IGlzIHRoZSAnJnRpbWVzOycgY2hhcmFjdGVyXG52YXIgY3Jvc3NQcm9kdWN0ID0gU3RyaW5nLmZyb21DaGFyQ29kZSgyMTUpO1xuXG5fW2Nyb3NzUHJvZHVjdF0gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzWycqJ10oeCk7XG59O1xuXG5cbi8vIFRoZSBkZWZhdWx0IG9wZXJhdG9yIG9jY3VycyB3aGVuIHR3byBleHByZXNzaW9ucyBhcmUgYWRqYWNlbnQgdG8gZWFjaG90aGVyOiBTIC0+IGUgZS5cbi8vIERlcGVuZGluZyBvbiB0aGUgdHlwZSwgaXQgdXN1YWxseSByZXByZXNlbnRzIGFzc29jaWF0aXZlIG11bHRpcGxpY2F0aW9uLlxuLy8gU2VlIGJlbG93IGZvciB0aGUgZGVmYXVsdCAnKicgb3BlcmF0b3IgaW1wbGVtZW50YXRpb24uXG5fLmRlZmF1bHQgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzWycqJ10oeCk7XG59O1xuXG5bJy8nLCAnKycsICctJywgJ0AtJywgJ14nLCAnJSddLmZvckVhY2goZnVuY3Rpb24gKG9wZXJhdG9yKSB7XG4gICAgX1tvcGVyYXRvcl0gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbiAgICB9O1xufSk7XG5cblxuXG5cbi8vIFRoaXMgbWF5IGxvb2sgbGlrZSB3ZSBhcmUgYXNzdW1pbmcgdGhhdCB4IGlzIGEgbnVtYmVyLFxuLy8gYnV0IHJlYWxseSB0aGUgaW1wb3J0YW50IGFzc3VtcHRpb24gaXMgc2ltcGx5XG4vLyB0aGF0IGl0IGlzIGZpbml0ZS5cbi8vIFRodXMgaW5maW5pdGllcyBhbmQgaW5kZXRlcm1pbmF0ZXMgc2hvdWxkIEFMV0FZU1xuLy8gb3ZlcnJpZGUgdGhpcyBvcGVyYXRvclxuXG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuT25lKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcqJyk7XG59O1xuXG5cblxuXG5cblxuXG5cblxuXG5cbn0pKCkiLCIvLyBub3RoaW5nIHRvIHNlZSBoZXJlLi4uIG5vIGZpbGUgbWV0aG9kcyBmb3IgdGhlIGJyb3dzZXJcbiIsIihmdW5jdGlvbihwcm9jZXNzKXtmdW5jdGlvbiBmaWx0ZXIgKHhzLCBmbikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmbih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGg7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFJlZ2V4IHRvIHNwbGl0IGEgZmlsZW5hbWUgaW50byBbKiwgZGlyLCBiYXNlbmFtZSwgZXh0XVxuLy8gcG9zaXggdmVyc2lvblxudmFyIHNwbGl0UGF0aFJlID0gL14oLitcXC8oPyEkKXxcXC8pPygoPzouKz8pPyhcXC5bXi5dKik/KSQvO1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbnZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbmZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgdmFyIHBhdGggPSAoaSA+PSAwKVxuICAgICAgPyBhcmd1bWVudHNbaV1cbiAgICAgIDogcHJvY2Vzcy5jd2QoKTtcblxuICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJyB8fCAhcGF0aCkge1xuICAgIGNvbnRpbnVlO1xuICB9XG5cbiAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG59XG5cbi8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbi8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4vLyBOb3JtYWxpemUgdGhlIHBhdGhcbnJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbnZhciBpc0Fic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJyxcbiAgICB0cmFpbGluZ1NsYXNoID0gcGF0aC5zbGljZSgtMSkgPT09ICcvJztcblxuLy8gTm9ybWFsaXplIHRoZSBwYXRoXG5wYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG4gIFxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICByZXR1cm4gcCAmJiB0eXBlb2YgcCA9PT0gJ3N0cmluZyc7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGRpciA9IHNwbGl0UGF0aFJlLmV4ZWMocGF0aClbMV0gfHwgJyc7XG4gIHZhciBpc1dpbmRvd3MgPSBmYWxzZTtcbiAgaWYgKCFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lXG4gICAgcmV0dXJuICcuJztcbiAgfSBlbHNlIGlmIChkaXIubGVuZ3RoID09PSAxIHx8XG4gICAgICAoaXNXaW5kb3dzICYmIGRpci5sZW5ndGggPD0gMyAmJiBkaXIuY2hhckF0KDEpID09PSAnOicpKSB7XG4gICAgLy8gSXQgaXMganVzdCBhIHNsYXNoIG9yIGEgZHJpdmUgbGV0dGVyIHdpdGggYSBzbGFzaFxuICAgIHJldHVybiBkaXI7XG4gIH0gZWxzZSB7XG4gICAgLy8gSXQgaXMgYSBmdWxsIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgcmV0dXJuIGRpci5zdWJzdHJpbmcoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzJdIHx8ICcnO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMocGF0aClbM10gfHwgJyc7XG59O1xuXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiKGZ1bmN0aW9uKCl7Ly8gc3RvcCBqc2hpbnQgZnJvbSBjb21wbGFpbmcgYWJvdXQgRnVuY3Rpb24gKHdoaWNoIGl0IGNhbGxzIGV2YWwpXG4vKmpzaGludCAtVzA2MSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvZGU7XG5cbmZ1bmN0aW9uIENvZGUocywgcHJlKXtcbiAgICB0aGlzLnByZSA9IFtdIHx8IHByZTtcbiAgICB0aGlzLnMgPSAnJyB8fCBzO1xuICAgIHRoaXMudmFycyA9IDA7XG4gICAgdGhpcy5wID0gSW5maW5pdHk7XG59XG5cbnZhciBfID0gQ29kZS5wcm90b3R5cGU7XG5cbi8qXG4gICAgVGhpcyB1c2VzIGEgZ2xvYmFsIHN0YXRlLlxuXG4gICAgUGVyaGFwcyB0aGVyZSBpcyBhIG5pY2VyIHdheSwgYnV0IHRoaXMgd2lsbCB3b3JrLlxuKi9cbkNvZGUubmV3Q29udGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICBDb2RlLmNvbnRleHRWYXJpYWJsZUNvdW50ID0gMDtcbn07XG5cbkNvZGUubmV3Q29udGV4dCgpO1xuXG4vLyBGb3IgZmFzdGVyIGV2YWx1YXRpb24gbXVsdGlwbGUgc3RhdG1lbnRzLiBGb3IgZXhhbXBsZSAoeCszKV4yIHdpbGwgZmlyc3QgY2FsY3VsYXRlIHgrMywgYW5kIHNvIG9uLlxuXy52YXJpYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ3QnICsgKENvZGUuY29udGV4dFZhcmlhYmxlQ291bnQrKykudG9TdHJpbmcoMzYpO1xufTtcblxuXy5tZXJnZSA9IGZ1bmN0aW9uIChvLCBzdHIsIHAsIHByZSkge1xuICAgIHRoaXMucyA9IHN0cjtcbiAgICBpZiAocHJlKSB7XG4gICAgICAgIHRoaXMucHJlLnB1c2gocHJlKTtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgdGhpcy5wcmUucHVzaC5hcHBseSh0aGlzLnByZSwgby5wcmUpO1xuICAgIHRoaXMudmFycyArPSBvLnZhcnM7XG4gICAgdGhpcy5wID0gcDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbl8udXBkYXRlID0gZnVuY3Rpb24gKHN0ciwgcCwgcHJlKSB7XG4gICAgdGhpcy5wID0gcDtcbiAgICBpZihwcmUpIHtcbiAgICAgICAgdGhpcy5wcmUucHVzaChwcmUpO1xuICAgIH1cbiAgICB0aGlzLnMgPSBzdHI7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBKYXZhc2NyaXB0IGNvbXBsaWF0aW9uXG5fLmNvbXBpbGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBGdW5jdGlvbih4LCB0aGlzLnByZS5qb2luKCdcXG4nKSArICdyZXR1cm4gJyArIHRoaXMucyk7XG59O1xuXG5fLmdsc2xGdW5jdGlvbiA9IGZ1bmN0aW9uICh0eXBlLCBuYW1lLCBwYXJhbWV0ZXJzKSB7XG4gICAgcmV0dXJuIHR5cGUgKyAnICcgKyBuYW1lICsgJygnICsgcGFyYW1ldGVycyArICcpe1xcbicgKyB0aGlzLnByZS5qb2luKCdcXG4nKSArICdyZXR1cm4gJyArIHRoaXMucyArICc7XFxufVxcbic7XG59O1xuXG5cbn0pKCkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0cmluZ2lmeShleHByLCBsYW5nKSB7XG4gICAgcmV0dXJuIGV4cHIucyhsYW5nKTtcbn07XG4iLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi9Db25zdGFudCcpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE51bWVyaWNhbENvbXBsZXg7XG5cbnV0aWwuaW5oZXJpdHMoTnVtZXJpY2FsQ29tcGxleCwgc3VwKTtcblxuZnVuY3Rpb24gTnVtZXJpY2FsQ29tcGxleChyZWFsLCBpbWFnKSB7XG4gICAgdGhpcy5fcmVhbCA9IHJlYWw7XG4gICAgdGhpcy5faW1hZyA9IGltYWc7XG59XG5cbnZhciBfID0gTnVtZXJpY2FsQ29tcGxleC5wcm90b3R5cGU7XG5cbl8ucmVhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMuX3JlYWwpO1xufTtcblxuXy5pbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcy5faW1hZyk7XG59O1xuXG5fLnJlYWxpbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh0aGlzLl9yZWFsKSxcbiAgICAgICAgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh0aGlzLl9pbWFnKVxuICAgIF0pO1xufTtcblxuXy5jb25qdWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsLCAtdGhpcy5faW1hZyk7XG59O1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCl7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyB4Ll9yZWFsLCB0aGlzLl9pbWFnICsgeC5faW1hZyk7XG4gICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyB4LnZhbHVlLCB0aGlzLl9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbENvbXBsZXggKycpO1xuICAgIH1cbn07XG5cbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4WydALSddKCk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpe1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC0geC5fcmVhbCwgdGhpcy5faW1hZyAtIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLSB4LnZhbHVlLCB0aGlzLl9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxDb21wbGV4IC0nKTtcbiAgICB9XG59O1xuXG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuX2ltYWcgPT09IDApIHtcbiAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3Ipe1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICogeC5fcmVhbCAtIHRoaXMuX2ltYWcgKiB4Ll9pbWFnLCB0aGlzLl9yZWFsICogeC5faW1hZyArIHRoaXMuX2ltYWcgKiB4Ll9yZWFsKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICogeC52YWx1ZSwgdGhpcy5faW1hZyAqIHgudmFsdWUpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsQ29tcGxleCAqJyk7XG4gICAgfVxufTtcblxuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLl9pbWFnID09PSAwICYmIHRoaXMuX3JlYWwgPT09IDApIHtcbiAgICAgICAgLy8gVE9ETzogUHJvdmlkZWQgeCAhPSAwXG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgXG4gICAgaWYoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcil7XG4gICAgICAgIHZhciBjY19kZCA9IHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWc7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KCh0aGlzLl9yZWFsICogeC5fcmVhbCArIHRoaXMuX2ltYWcgKiB4Ll9pbWFnKS9jY19kZCwgKHRoaXMuX2ltYWcgKiB4Ll9yZWFsIC0gdGhpcy5fcmVhbCAqIHguX2ltYWcpIC8gY2NfZGQpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLyB4LnZhbHVlLCB0aGlzLl9pbWFnIC8geC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKClbJy8nXSh4KTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuIHRoaXMucG9sYXIoKVsnLyddKHgpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxDb21wbGV4IC8nKTtcbiAgICB9XG59O1xuXG5fWychJ10gPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gR2xvYmFsLkdhbW1hLmFwcGx5KHRoaXMpO1xufTtcblxuLy8gKGZ1bmN0aW9uKCl7XG4vLyAgICAgcmV0dXJuO1xuLy8gICAgIHZhciBvbmVfb25fcnQyID0gMS9NYXRoLnNxcnQoMik7XG4vLyAgICAgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4LnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKG9wZXJhdG9yLCB4KSB7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3Ipe1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybzsgLy8gQ29udHJhZGljdHMgeF4wID0gMVxuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4LmFwcGx5KCdALScpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMSAmJiB0aGlzLl9pbWFnID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIC8vTm90ZTogVGhlcmUgaXMgbm90IG1lYW50IHRvIGJlIGEgYnJlYWsgaGVyZS5cbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybzsgLy9Db250cmFkaWNzIHgvMCA9IEluZmluaXR5XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICB9XG4vLyAgICAgICAgIGlmIChvcGVyYXRvciA9PT0gJywnKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXMsIHhdKTtcbi8vICAgICAgICAgfSBlbHNlIGlmICh4ID09PSB1bmRlZmluZWQpIHtcbi8vICAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICBcbi8vICAgICAgICAgICAgICAgICBjYXNlICdAKyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ0AtJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoLXRoaXMuX3JlYWwsIC10aGlzLl9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICdcXHUyMjFBJzpcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3coJ09MRCBTUVJULiBOZXcgb25lIGlzIGEgZnVuY3Rpb24sIG5vdCBvcGVyYXRvci4nKVxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleChwLCBxKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcrKyc6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLS0nOlxuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKCdQb3N0Zml4ICcgK29wZXJhdG9yICsgJyBvcGVyYXRvciBhcHBsaWVkIHRvIHZhbHVlIHRoYXQgaXMgbm90IGEgcmVmZXJlbmNlLicpKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcrPSc6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLT0nOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJyo9Jzpcbi8vICAgICAgICAgICAgICAgICBjYXNlICcvPSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KG5ldyBSZWZlcmVuY2VFcnJvcignTGVmdCBzaWRlIG9mIGFzc2lnbm1lbnQgaXMgbm90IGEgcmVmZXJlbmNlLicpKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5HYW1tYS5hcHBseSh1bmRlZmluZWQsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIDEsIHRoaXMuX2ltYWcpKTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbi8vICAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAqIHgudmFsdWUsIHRoaXMuX2ltYWcgKiB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIHgudmFsdWUsIHRoaXMuX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC0geC52YWx1ZSwgdGhpcy5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLyB4LnZhbHVlLCB0aGlzLl9pbWFnIC8geC52YWx1ZSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gdGhpcy5fcmVhbDtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGIgPSB0aGlzLl9pbWFnO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHgudmFsdWU7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGhsbSA9IDAuNSAqIE1hdGgubG9nKGEqYSArIGIqYik7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IE1hdGguYXRhbjIoYiwgYSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBobWxkX3RjID0gdGhldGEgKiBjO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgZV9obWxjX3RkID0gTWF0aC5leHAoaGxtICogYyk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguY29zKGhtbGRfdGMpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLnNpbihobWxkX3RjKSlcbi8vICAgICAgICAgICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3IpIHtcbi8vICAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICAgICAgLy8gKGErYmkpKGMrZGkpID0gKGFjLWJkKSArIChhZCtiYylpIFxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICogeC5fcmVhbCAtIHRoaXMuX2ltYWcgKiB4Ll9pbWFnLCB0aGlzLl9yZWFsICogeC5faW1hZyArIHRoaXMuX2ltYWcgKiB4Ll9yZWFsKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIHguX3JlYWwsIHRoaXMuX2ltYWcgKyB4Ll9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAtIHguX3JlYWwsIHRoaXMuX2ltYWcgLSB4Ll9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICAgICAgLy8gIChhK2JpKS8oYytkaSkgXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vPSBbKGErYmkpKGMtZGkpXS9bKGMrZGkpKGMtZGkpXVxuLy8gICAgICAgICAgICAgICAgICAgICAvLz0gWyhhK2JpKShjLWRpKV0vW2NjICsgZGRdXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vPSBbYWMgLWRhaSArYmNpICsgYmRdL1tjYytkZF1cbi8vICAgICAgICAgICAgICAgICAgICAgLy89IFthYyArIGJkICsgKGJjIC0gZGEpXS9bY2MrZGRdXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBjY19kZCA9IHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KCh0aGlzLl9yZWFsICogeC5fcmVhbCArIHRoaXMuX2ltYWcgKiB4Ll9pbWFnKS9jY19kZCwgKHRoaXMuX2ltYWcgKiB4Ll9yZWFsIC0gdGhpcy5fcmVhbCp4Ll9pbWFnKS9jY19kZCk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gdGhpcy5fcmVhbDtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGIgPSB0aGlzLl9pbWFnO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHguX3JlYWw7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBkID0geC5faW1hZztcblxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaGxtID0gMC41ICogTWF0aC5sb2coYSphICsgYipiKTtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMihiLCBhKTtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGhtbGRfdGMgPSBobG0gKiBkICsgdGhldGEgKiBjO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgZV9obWxjX3RkID0gTWF0aC5leHAoaGxtICogYyAtIHRoZXRhICogZCk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguY29zKGhtbGRfdGMpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLnNpbihobWxkX3RjKSlcbi8vICAgICAgICAgICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9sYXIoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgfVxuLy8gICAgICAgICBjb25zb2xlLmVycm9yKCdjbXBseCAuICcgKyBvcGVyYXRvciArICcgPT4gRS5MaXN0PycpO1xuLy8gICAgICAgICAvKlxuLy8gICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwLjAgJiYgdGhpcy5faW1hZyA9PT0gMC4wKXtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgICovXG4gICAgICAgIFxuICAgICAgICBcbi8vICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgfVxuICAgIFxuLy8gfSgpKTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuL051bWVyaWNhbENvbXBsZXgnKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi8nKTtcbm1vZHVsZS5leHBvcnRzID0gTnVtZXJpY2FsUmVhbDtcblxudXRpbC5pbmhlcml0cyhOdW1lcmljYWxSZWFsLCBzdXApO1xuXG5mdW5jdGlvbiBOdW1lcmljYWxSZWFsKGUpIHtcbiAgICB0aGlzLnZhbHVlID0gZTtcbn1cblxudmFyIF8gPSBOdW1lcmljYWxSZWFsLnByb3RvdHlwZTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KF8sIFwiX3JlYWxcIiwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG59KTtcbl8uX2ltYWcgPSAwO1xuXG5fLnJlYWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLmltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gR2xvYmFsLlplcm87XG59O1xuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXMsXG4gICAgICAgIEdsb2JhbC5aZXJvXG4gICAgXSk7XG59O1xuXy5jb25qdWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSArIHgudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKyddKHRoaXMpO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKC10aGlzLnZhbHVlKTtcbn07XG5cbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgLSB4LnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJ0AtJ10oKVsnKyddKHRoaXMpO1xufTtcblxuXG5fWyclJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHZhciBub25yZWFsID0gJ1RoZSBtb2R1bGFyIGFyaXRobWV0aWMgb3BlcmF0b3IgXFwnJVxcJyBpcyBub3QgZGVmaW5lZCBmb3Igbm9uLXJlYWwgbnVtYmVycy4nO1xuICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICUgeC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHRocm93KCdOb3Qgc3VyZSBhYm91dCB0aGlzLi4uJyk7XG4gICAgICAgIC8vIE5vdCBzdXJlIGFib3V0IHRoaXNcbiAgICAgICAgLy8gcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKG5vbnJlYWwpKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3Iobm9ucmVhbCkpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyAgICBcbiAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcihub25yZWFsKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbFJlYWwgJScpO1xuICAgIH1cbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKiB4LnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbn07XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIGlmKHgudmFsdWUgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93KCdEaXZpc2lvbiBieSB6ZXJvIG5vdCBhbGxvd2VkIScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlIC8geC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgdmFyIGNjX2RkID0geC5fcmVhbCAqIHguX3JlYWwgKyB4Ll9pbWFnICogeC5faW1hZztcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgoKHRoaXMudmFsdWUgKiB4Ll9yZWFsKS9jY19kZCwgKC10aGlzLnZhbHVlICogeC5faW1hZykgLyBjY19kZCk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyBhLyh4K3lpKSA9IGEvKHgreWkpICh4LXlpKS8oeC15aSkgPSBhKHgteWkpIC8gKHheMiArIHleMilcbiAgICAgICAgdmFyIHhfY29uaiA9IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIHhbMF0sXG4gICAgICAgICAgICB4WzFdWydALSddKClcbiAgICAgICAgXSk7XG4gICAgICAgIHZhciB0d28gPSBOdW1lcmljYWxSZWFsKDIpO1xuICAgICAgICByZXR1cm4geF9jb25qWycqJ10odGhpcylbJy8nXShcbiAgICAgICAgICAgICh4WzBdWydeJ10pKHR3bylcbiAgICAgICAgICAgIFsnKyddIChcbiAgICAgICAgICAgICAgICAoeFsxXVsnXiddKSh0d28pXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgLy8gfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4gICAgICAgIFxuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgLy8gVE9ETzogZ2l2ZW4geCAhPSAwXG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIC8vIFRPRE86IGdpdmVuIHggIT0gMFxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0KSB7ICAgXG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVbmtub3duIHR5cGU6ICcsIHRoaXMsIHgpO1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsUmVhbCAvJyk7XG4gICAgfVxufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gMSkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICB9XG4gICAgaWYoeCA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgfVxuICAgIGlmKHggPT09IEdsb2JhbC5PbmUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbChNYXRoLnBvdyh0aGlzLnZhbHVlLCB4LmEpKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKE1hdGgucG93KHRoaXMudmFsdWUsIHgudmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBUaGlzIHdpbGwgcHJvZHVjZSB1Z2x5IGRlY2ltYWxzLiBNYXliZSB3ZSBzaG91bGQgZXhwcmVzcyBpdCBpbiBwb2xhciBmb3JtPyFcbiAgICAgICAgLy8gICAgICA8LSBJIHRoaW5rIG5vLCBiZWNhdXNlIHdoeSBlbHNlIHN0YXJ0IHdpdGggYSBudW1lcmljYWwuIEltcGxlbWVudCBhIHJhdGlvbmFsL2ludGVnZXIgdHlwZVxuICAgICAgICB2YXIgciA9IE1hdGgucG93KC10aGlzLnZhbHVlLCB4LnZhbHVlKTtcbiAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5QSSAqIHgudmFsdWU7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgICAgICAgICBuZXcgTnVtZXJpY2FsUmVhbChyKSxcbiAgICAgICAgICAgIG5ldyBOdW1lcmljYWxSZWFsKHRoZXRhKVxuICAgICAgICBdKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICB2YXIgYSA9IHRoaXMudmFsdWU7XG4gICAgICAgIHZhciBjID0geC5fcmVhbDtcbiAgICAgICAgdmFyIGQgPSB4Ll9pbWFnO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdCYWQgaW1wbGVtZW50YXRpb24gKCBudW0gXiBjb21wbGV4KScpO1xuICAgICAgICB2YXIgaGxtID0gMC41ICogTWF0aC5sb2coYSphKTtcbiAgICAgICAgdmFyIGhtbGRfdGMgPSBobG0gKiBkO1xuICAgICAgICB2YXIgZV9obWxjX3RkID0gTWF0aC5leHAoaGxtICogYyk7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KFxuICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguY29zKGhtbGRfdGMpKSxcbiAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLnNpbihobWxkX3RjKSlcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnXicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJ14nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBjb25zb2xlLmVycm9yICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxSZWFsIF4nLCB4LCB4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCk7XG4gICAgfVxufTtcbl9bJz4nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID4geC52YWx1ZSA/IEV4cHJlc3Npb24uVHJ1ZSA6IEV4cHJlc3Npb24uRmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyc+J10uY2FsbCh0aGlzLCB4KTtcbn07XG5fWyc8J10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA8IHgudmFsdWUgPyBFeHByZXNzaW9uLlRydWUgOiBFeHByZXNzaW9uLkZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnPCddLmNhbGwodGhpcywgeCk7XG59O1xuX1snPD0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlIDw9IHgudmFsdWUgPyBFeHByZXNzaW9uLlRydWUgOiBFeHByZXNzaW9uLkZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnPD0nXS5jYWxsKHRoaXMsIHgpO1xufTtcbl9bJz49J10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA+PSB4LnZhbHVlID8gRXhwcmVzc2lvbi5UcnVlIDogRXhwcmVzc2lvbi5GYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3R5cGVbJz49J10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICB2YXIgbnVtID0gdGhpcy52YWx1ZS50b0V4cG9uZW50aWFsKCk7XG4gICAgICAgIGlmKG51bS5pbmRleE9mKCcuJykgPT09IC0xKXtcbiAgICAgICAgICAgIG51bSA9IG51bS5yZXBsYWNlKCdlJywnLmUnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IENvZGUobnVtKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2RlKHRoaXMudmFsdWUudG9TdHJpbmcoKSk7XG59O1xuLy8gXy5hcHBseU9sZCA9IGZ1bmN0aW9uKG9wZXJhdG9yLCB4KSB7XG4vLyAgICAgc3dpdGNoIChvcGVyYXRvcil7XG4vLyAgICAgICAgIGNhc2UgJywnOlxuLy8gICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzLCB4XSk7XG4vLyAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybzsgLy8gQ29udHJhZGljdHMgeF4wID0gMVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB4O1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB4LmFwcGx5KCdALScpO1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDEpe1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB4O1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgLy9Ob3RlOiBUaGVyZSBpcyBub3QgbWVhbnQgdG8gYmUgYSBicmVhayBoZXJlLlxuLy8gICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybzsgLy9Db250cmFkaWNzIHgvMCA9IEluZmluaXR5XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgfVxuLy8gICAgIGlmKHggPT09IHVuZGVmaW5lZCl7XG4vLyAgICAgICAgIC8vVW5hcnlcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnQCsnOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuLy8gICAgICAgICAgICAgY2FzZSAnQC0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCgtdGhpcy52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctLSc6XG4vLyAgICAgICAgICAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcignUG9zdGZpeCAnICtvcGVyYXRvciArICcgb3BlcmF0b3IgYXBwbGllZCB0byB2YWx1ZSB0aGF0IGlzIG5vdCBhIHJlZmVyZW5jZS4nKSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrPSc6XG4vLyAgICAgICAgICAgICBjYXNlICctPSc6XG4vLyAgICAgICAgICAgICBjYXNlICcqPSc6XG4vLyAgICAgICAgICAgICBjYXNlICcvPSc6XG4vLyAgICAgICAgICAgICAgICAgdGhyb3cobmV3IFJlZmVyZW5jZUVycm9yKCdMZWZ0IHNpZGUgb2YgYXNzaWdubWVudCBpcyBub3QgYSByZWZlcmVuY2UuJykpO1xuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5HYW1tYS5hcHBseSh1bmRlZmluZWQsIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKyAxKSk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcil7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKiB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICsgeC52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAtIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgLyB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbChNYXRoLnBvdyh0aGlzLnZhbHVlLCB4LnZhbHVlKSk7XG4vLyAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVGhpcyB3aWxsIHByb2R1Y2UgdWdseSBkZWNpbWFscy4gTWF5YmUgd2Ugc2hvdWxkIGV4cHJlc3MgaXQgaW4gcG9sYXIgZm9ybT8hXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciByID0gTWF0aC5wb3coLXRoaXMudmFsdWUsIHgudmFsdWUpXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IE1hdGguUEkgKiB4LnZhbHVlO1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleChyKk1hdGguY29zKHRoZXRhKSwgcipNYXRoLnNpbih0aGV0YSkpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5Db21wbGV4KSB7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgodGhpcy52YWx1ZSAqIHguX3JlYWwsIHRoaXMudmFsdWUgKiB4Ll9pbWFnKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgKyB4Ll9yZWFsLCB4Ll9pbWFnKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgLSB4Ll9yZWFsLCAteC5faW1hZyk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSB4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnO1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KCh0aGlzLnZhbHVlICogeC5fcmVhbCkvY2NfZGQsICgtdGhpcy52YWx1ZSp4Ll9pbWFnKS9jY19kZCk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMudmFsdWU7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGMgPSB4Ll9yZWFsO1xuLy8gICAgICAgICAgICAgICAgIHZhciBkID0geC5faW1hZztcbi8vICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdCYWQgaW1wbGVtZW50YXRpb24gKCBudW0gXiBjb21wbGV4KScpO1xuLy8gICAgICAgICAgICAgICAgIHZhciBobG0gPSAwLjUgKiBNYXRoLmxvZyhhKmEpO1xuLy8gICAgICAgICAgICAgICAgIHZhciBobWxkX3RjID0gaGxtICogZDtcbi8vICAgICAgICAgICAgICAgICB2YXIgZV9obWxjX3RkID0gTWF0aC5leHAoaGxtICogYyk7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgoXG4vLyAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLmNvcyhobWxkX3RjKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLnNpbihobWxkX3RjKSlcbi8vICAgICAgICAgICAgICAgICApO1xuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMF0uYXBwbHkob3BlcmF0b3IsIHRoaXMpLFxuLy8gICAgICAgICAgICAgICAgICAgICB4WzFdXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgeFswXS5hcHBseShvcGVyYXRvciwgdGhpcyksXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMV0uYXBwbHkob3BlcmF0b3IsIHRoaXMpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2luZWZmZWNpZW50OiBOUiBeIENMJyk7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvLyhhK2JpKStBZV4oaWspXG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgICAgICAvLyBvciA/IHJldHVybiB0aGlzLmFwcGx5KG9wZXJhdG9yLCB4LnJlYWxpbWFnKCkpOyAvL0p1bXAgdXAgdG8gYWJvdmUgKy1cbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB4WzBdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKSxcbi8vICAgICAgICAgICAgICAgICAgICAgeFsxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB4WzBdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKSxcbi8vICAgICAgICAgICAgICAgICAgICAgeFsxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuLy8gICAgICAgICBzd2l0Y2gob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KCdOKDApIF4geCcpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbCgtdGhpcy52YWx1ZSkpLmFwcGx5KCdeJywgeCksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWwucGkuYXBwbHkoJyonLCB4KVxuLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbi8vICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdygnTigwKSBeIHgnKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFsobmV3IE51bWVyaWNhbFJlYWwoLXRoaXMudmFsdWUpKSwgeF0sICdeJyksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWwucGkuYXBwbHkoJyonLCB4KVxuLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4vLyAgICAgdGhyb3coJz8/IC0gcmVhbCcpO1xuLy8gICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyB9O1xuXG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4vJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29uc3RhbnQ7XG5cbnV0aWwuaW5oZXJpdHMoQ29uc3RhbnQsIHN1cCk7XG5cbmZ1bmN0aW9uIENvbnN0YW50KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignRXhwcmVzc2lvbi5Db25zdGFudCBjcmVhdGVkIGRpcmVjdGx5Jyk7XG59XG5cbnZhciBfID0gQ29uc3RhbnQucHJvdG90eXBlO1xuXG5fLnNpbXBsaWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gR2xvYmFsLlplcm87XG59O1xuXG5fLmFwcGx5ID0gZnVuY3Rpb24gKHgpe1xuICAgIHJldHVybiB0aGlzWycqJ10oeCk7XG59O1xuXG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4vTnVtZXJpY2FsUmVhbCcpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJhdGlvbmFsO1xuXG51dGlsLmluaGVyaXRzKFJhdGlvbmFsLCBzdXApO1xuXG5mdW5jdGlvbiBSYXRpb25hbChhLCBiKSB7XG4gICAgdGhpcy5hID0gYTtcbiAgICB0aGlzLmIgPSBiO1xufVxuXG52YXIgXyA9IFJhdGlvbmFsLnByb3RvdHlwZTtcblxuXG5fLl9fZGVmaW5lR2V0dGVyX18oXCJ2YWx1ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYSAvIHRoaXMuYjtcbn0pO1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIFJhdGlvbmFsKXtcbiAgICAgICAgLypcbiAgICAgICAgICAgIGEgICBjICAgICBhZCAgIGNiICAgIGFkICsgYmNcbiAgICAgICAgICAgIC0gKyAtICA9ICAtLSArIC0tID0gIC0tLS0tLS1cbiAgICAgICAgICAgIGIgICBkICAgICBiZCAgIGJkICAgICAgYiBkXG4gICAgICAgICovXG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwodGhpcy5hICogeC5iICsgdGhpcy5iICogeC5hLCB0aGlzLmIgKiB4LmIpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMudmFsdWUgKyB4Ll9yZWFsLCB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gY29tbXV0ZVxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1N3YXBwZWQgb3BlcmF0b3Igb3JkZXIgZm9yICsgd2l0aCBSYXRpb25hbCcpO1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgICAgIC8vIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBSYXRpb25hbCArJyk7XG4gICAgfVxuICAgIFxuICAgIFxufTtcblxuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHhbJ0AtJ10oKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIFJhdGlvbmFsKXtcbiAgICAgICAgLypcbiAgICAgICAgICAgIGEgICBjICAgICBhZCAgIGNiICAgIGFkICsgYmNcbiAgICAgICAgICAgIC0gKyAtICA9ICAtLSArIC0tID0gIC0tLS0tLS1cbiAgICAgICAgICAgIGIgICBkICAgICBiZCAgIGJkICAgICAgYiBkXG4gICAgICAgICovXG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwodGhpcy5hICogeC5iIC0gdGhpcy5iICogeC5hLCB0aGlzLmIgKiB4LmIpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMudmFsdWUgLSB4Ll9yZWFsLCB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gY29tbXV0ZVxuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdTd2FwcGVkIG9wZXJhdG9yIG9yZGVyIGZvciAtIHdpdGggUmF0aW9uYWwnKTtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgICAgICAvLyB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgUmF0aW9uYWwgKycpO1xuICAgIH1cbn07XG5cbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgUmF0aW9uYWwpe1xuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKHRoaXMuYSAqIHguYSwgdGhpcy5iICogeC5iKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3R5cGVbJyonXS5jYWxsKHRoaXMsIHgpO1xufTtcblxuXG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIFJhdGlvbmFsKXtcbiAgICAgICAgaWYgKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3coJ0RpdmlzaW9uIEJ5IFplcm8gaXMgbm90IGRlZmluZWQgZm9yIFJhdGlvbmFsIG51bWJlcnMhJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbCh0aGlzLmEgKiB4LmIsIHRoaXMuYiAqIHguYSkucmVkdWNlKCk7XG4gICAgfVxuICAgIHJldHVybiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwucHJvdG90eXBlWycvJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgfVxuICAgIGlmKHggPT09IEdsb2JhbC5PbmUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmKHRoaXMuYSA9PT0gdGhpcy5iKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwoXG4gICAgICAgICAgICBNYXRoLnBvdyh0aGlzLmEsIHguYSksXG4gICAgICAgICAgICBNYXRoLnBvdyh0aGlzLmIsIHguYSlcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBSYXRpb25hbCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIGYgPSB4LnJlZHVjZSgpO1xuICAgICAgICBpZihmLmEgJSAyID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnBvdyhNYXRoLnBvdyh0aGlzLmEsIGYuYSksIDEgLyBmLmIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwucHJvdG90eXBlWydeJ10uY2FsbChcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICB4XG4gICAgICAgICk7XG4gICAgICAgIFxuICAgIH1cblxuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIFxufTtcblxuXy5yZWR1Y2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gbXV0YWJsZS5cbiAgICBmdW5jdGlvbiBnY2QoYSwgYikge1xuICAgICAgICBpZihiID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2NkKGIsIGEgJSBiKTtcbiAgICB9XG4gICAgdmFyIGcgPSBnY2QodGhpcy5iLCB0aGlzLmEpO1xuICAgIHRoaXMuYSAvPSBnO1xuICAgIHRoaXMuYiAvPSBnO1xuICAgIGlmKHRoaXMuYiA9PT0gMSkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uSW50ZWdlcih0aGlzLmEpO1xuICAgIH1cbiAgICBpZih0aGlzLmIgPCAwKSB7XG4gICAgICAgIHRoaXMuYSA9IC10aGlzLmE7XG4gICAgICAgIHRoaXMuYiA9IC10aGlzLmI7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xufTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCA9IHJlcXVpcmUoJy4vUmF0aW9uYWwnKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlZ2VyO1xuXG51dGlsLmluaGVyaXRzKEludGVnZXIsIHN1cCk7XG5cbmZ1bmN0aW9uIEludGVnZXIoeCkge1xuICAgIHRoaXMuYSA9IHg7XG59XG5cbnZhciBfID0gSW50ZWdlci5wcm90b3R5cGU7XG5cbl8uYiA9IDE7XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlcih0aGlzLmEgKyB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKyddKHRoaXMpO1xufTtcblxuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAtIHguYSk7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyctJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgaWYodGhpcy5hICUgeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hIC8geC5hKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IHN1cCh0aGlzLmEsIHguYSk7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWycvJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBJbnRlZ2VyKC10aGlzLmEpO1xufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAqIHguYSk7XG4gICAgfVxuICAgIHJldHVybiB4WycqJ10odGhpcyk7XG59O1xuXG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIoTWF0aC5wb3codGhpcy5hLCB4LmEpKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHN1cCkge1xuICAgICAgICB2YXIgZiA9IHgucmVkdWNlKCk7XG4gICAgICAgIGlmKGYuYSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGgucG93KE1hdGgucG93KHRoaXMuYSwgZi5hKSwgMSAvIGYuYikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbC5wcm90b3R5cGVbJ14nXS5jYWxsKFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICBpZih0aGlzLmEgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW1xuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgXSwgJ14nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnXiddLmNhbGwoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHhcbiAgICApO1xuICAgIFxufTtcblxuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hICUgeC5hKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHN1cCkge1xuICAgICAgICByZXR1cm4gbmV3IHN1cCgpOy8vIEB0b2RvOiAhXG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcyAlIHgudmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfVxufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSh0aGlzLmEudG9TdHJpbmcoKSArICcuMCcpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvZGUodGhpcy5hLnRvU3RyaW5nKCkpO1xufTtcbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL0V4cHJlc3Npb24nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocywgYmFzZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAocyA9PT0gJycgfHwgcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcyA9IHMucmVwbGFjZSgvIC9nLCAnJyk7XG4gICAgXG4gICAgdmFyIHJvb3QgPSBPYmplY3QuY3JlYXRlKHt9KTtcbiAgICB2YXIgY29udGV4dCA9IHJvb3Q7XG4gICAgXG4gICAgdmFyIGZyZWUgPSB7fTtcbiAgICB2YXIgYm91bmQgPSB7fTtcbiAgICBcbiAgICBmdW5jdGlvbiBkb3duKHZhcnMpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IGNvbnRleHQ7XG4gICAgICAgIGNvbnRleHQgPSBPYmplY3QuY3JlYXRlKGNvbnRleHQpO1xuICAgICAgICBjb250ZXh0LiRwYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgaW4gdmFycykge1xuICAgICAgICAgICAgaWYgKHZhcnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0W2ldID0gdmFyc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiB1cChlbnRpdHkpIHtcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQuJHBhcmVudDtcbiAgICAgICAgcmV0dXJuIGVudGl0eTtcbiAgICB9XG4gICAgLypcbiAgICAgICAgRXZhbHVhdGUgQVNUIHRyZWUgKHRvcC1kb3duKVxuICAgICAgICBcbiAgICAgICAgRXhhbXBsZXM6XG4gICAgICAgICAgICAqIHk9eF4yXG4gICAgICAgICAgICAgICAgWyc9JywgeSwgWydeJywgeCwgMl1dXG4gICAgXG4gICAgKi9cbiAgICB2YXIgbG9vc2UgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBldmFsdWF0ZShhc3QpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhc3QgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB2YXIgc3ltYm9sO1xuICAgICAgICAgICAgaWYgKChzeW1ib2wgPSBjb250ZXh0W2FzdF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN5bWJvbDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKHN5bWJvbCA9IGJhc2VbYXN0XSkpIHtcbiAgICAgICAgICAgICAgICBib3VuZFthc3RdID0gc3ltYm9sO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcmVlW2FzdF0gPSBzeW1ib2wgPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbChhc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm9vdFthc3RdID0gc3ltYm9sO1xuICAgICAgICAgICAgcmV0dXJuIHN5bWJvbDtcbiAgICAgICAgfSBlbHNlIGlmIChhc3QucHJpbWl0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5Db25zdHJ1Y3RbYXN0LnR5cGVdKGFzdC5wcmltaXRpdmUpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhc3QgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBhc3QxID0gZXZhbHVhdGUoYXN0WzFdKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGFzdC5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGFzdFswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdmcmFjJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzdFswXSA9ICcvJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdfJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IGJpbmQgdW5kZXJuZWF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFzdFsxXSA9PT0gJ3N1bScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGltaXQgPSBhc3RbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpbWl0WzBdID09PSAnPScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZHVtbXkgdmFyaWFibGU6IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKGxpbWl0WzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvd2VyIGxpbWl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gZXZhbHVhdGUobGltaXRbMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3VtbWluYXRvciA9IG5ldyBFeHByZXNzaW9uLlN1bS5SZWFsKHgsIGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1taW5hdG9yLnZhcnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWluYXRvci52YXJzW3guc3ltYm9sXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdW1taW5hdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXN0WzBdID09PSAnZGVmYXVsdCcgJiYgYXN0MS52YXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvd24oYXN0MS52YXJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBhc3QxW2FzdFswXV0oZXZhbHVhdGUoYXN0WzJdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgcmVzdWx0LnZhcnM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1cChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXN0MVthc3RbMF1dKGV2YWx1YXRlKGFzdFsyXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFzdC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGFzdFswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdzcXJ0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuc3FydC5kZWZhdWx0KGV2YWx1YXRlKGFzdFsxXSkpO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICchJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuZmFjdG9yaWFsLmRlZmF1bHQoZXZhbHVhdGUoYXN0WzFdKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBldmFsdWF0ZShhc3RbMV0pW2FzdFswXV0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhc3QubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWx1YXRlKGFzdFsxXSlbYXN0WzBdXShldmFsdWF0ZShhc3RbMV0pLCBldmFsdWF0ZShhc3RbMl0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXN0O1xuICAgIH1cbiAgICBcbiAgICBcbiAgICAvLyBQYXJzZSB1c2luZyBjb250ZXh0IGZyZWUgZ3JhbW1hciAoW2dyYXBoXS9ncmFtbWFyL2NhbGN1bGF0b3Iuamlzb24pXG4gICAgdmFyIGFzdCA9IHRoaXMuY2ZnLnBhcnNlKHMpO1xuICAgIHZhciByZXN1bHQgPSBldmFsdWF0ZShhc3QpO1xuICAgIHJlc3VsdC5fYXN0ID0gYXN0O1xuICAgIGlmIChyb290ICE9PSBjb250ZXh0KSB7XG4gICAgICAgIHRocm93KCdDb250ZXh0IHN0aWxsIG9wZW4nKTtcbiAgICB9XG4gICAgXG4gICAgcmVzdWx0LnVuYm91bmQgPSBmcmVlO1xuICAgIHJlc3VsdC5ib3VuZCA9IGJvdW5kO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5cblxufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdDtcblxudXRpbC5pbmhlcml0cyhMaXN0LCBzdXApO1xuXG4vKlxuICAgIEV4cHJlc3Npb24uTGlzdCBzaG91bGQgYmUgYXZvaWRlZCB3aGVuZXZlciBFeHByZXNzaW9uLkxpc3QuUmVhbCBjYW5cbiAgICBiZSB1c2VkLiBIb3dldmVyLCBrbm93aW5nIHdoZW4gdG8gdXNlIFJlYWwgaXMgYW4gaW1wb3NzaWJsZSAoPykgdGFzayxcbiAgICBzbyBzb21ldGltZXMgdGhpcyB3aWxsIGhhdmUgdG8gZG8gYXMgYSBmYWxsYmFjay5cbiovXG5mdW5jdGlvbiBMaXN0KGUsIG9wZXJhdG9yKSB7XG4gICAgZS5fX3Byb3RvX18gPSBFeHByZXNzaW9uLkxpc3QucHJvdG90eXBlO1xuICAgIGUub3BlcmF0b3IgPSBvcGVyYXRvcjtcbiAgICByZXR1cm4gZTtcbn1cblxuTGlzdC5wcm90b3R5cGUuX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuICAgIGlmKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwucHJvdG90eXBlLl9zLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIHRocm93KG5ldyBFcnJvcignVXNlIHJlYWwoKSwgaW1hZygpLCBvciBhYnMoKSwgb3IgYXJnKCkgZmlyc3QuJykpO1xufTtcblxuTGlzdC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB2YXIgYSA9IHRoaXNbMF0uc3ViKHgsIHkpO1xuICAgIHZhciBiID0gdGhpc1sxXSAmJiB0aGlzWzFdLnN1Yih4LCB5KTtcblxuICAgIHJldHVybiBhW3RoaXMub3BlcmF0b3IgfHwgJ2RlZmF1bHQnXShiKTtcbn07XG5cbkxpc3QucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgdmFyIGVsZW1lbnRzID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXMsIGYpO1xuICAgIHJldHVybiBlbGVtZW50c1swXVt0aGlzLm9wZXJhdG9yIHx8ICdkZWZhdWx0J10uYXBwbHkodGhpcywgZWxlbWVudHMuc2xpY2UoMSkpO1xufTsiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBzdXAgID0gcmVxdWlyZSgnLi4vJyksXG4gICAgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sO1xuXG51dGlsLmluaGVyaXRzKFN5bWJvbCwgc3VwKTtcblxuZnVuY3Rpb24gU3ltYm9sKHN0cikge1xuICAgIHRoaXMuc3ltYm9sID0gc3RyO1xufVxuXG52YXIgXyA9IFN5bWJvbC5wcm90b3R5cGU7XG5cbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXMgPT09IHggPyBHbG9iYWwuT25lIDogR2xvYmFsLlplcm87XG59O1xuXy5pbnRlZ3JhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzID09PSB4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKDAuNSwgMCkgWycqJ10gKHggWydeJ10gKG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoMiwwKSkpO1xuICAgIH1cbiAgICByZXR1cm4gKHRoaXMpIFsnKiddICh4KTtcbn07XG5fLnN1YiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgLy8gVE9ETzogRW5zdXJlIGl0IGlzIHJlYWwgKGZvciBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKVxuICAgIHJldHVybiB0aGlzID09PSB4ID8geSA6IHRoaXM7XG59O1xuXG5fLl9zID0gZnVuY3Rpb24gKENvZGUsIHgpIHtcbiAgICByZXR1cm4gbmV3IENvZGUodGhpcy5zeW1ib2wgfHwgJ3hfe2ZyZWV9Jyk7XG59O1xufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRUZ1bmN0aW9uO1xuXG51dGlsLmluaGVyaXRzKEVGdW5jdGlvbiwgc3VwKTtcblxuZnVuY3Rpb24gRUZ1bmN0aW9uIChwKSB7XG4gICAgdGhpcy5kZWZhdWx0ID0gcC5kZWZhdWx0O1xuICAgIHRoaXNbJ3RleHQvbGF0ZXgnXSA9IChwWyd0ZXh0L2xhdGV4J10pO1xuICAgIHRoaXNbJ3gtc2hhZGVyL3gtZnJhZ21lbnQnXSA9IChwWyd4LXNoYWRlci94LWZyYWdtZW50J10pO1xuICAgIHRoaXNbJ3RleHQvamF2YXNjcmlwdCddID0gKHBbJ3RleHQvamF2YXNjcmlwdCddKTtcbiAgICB0aGlzLmRlcml2YXRpdmUgPSBwLmRlcml2YXRpdmU7XG4gICAgdGhpcy5yZWFsaW1hZyA9IHAucmVhbGltYWc7XG59O1xuXG52YXIgXyA9IEVGdW5jdGlvbi5wcm90b3R5cGU7XG5cbi8vIEBhYnN0cmFjdFxuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuO1xufTtcblxuLy8gQGFic3RyYWN0XG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuZGVyaXZhdGl2ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXJpdmF0aXZlO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0VGdW5jdGlvbiBoYXMgbm8gZGVyaXZhdGl2ZSBkZWZpbmVkLicpO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYgKHRoaXNbbGFuZ10pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKHRoaXNbbGFuZ10pO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBjb21waWxlIGZ1bmN0aW9uIGludG8gJyArIGxhbmcpO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgYSA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbCgpO1xuICAgIHJldHVybiBuZXcgRUZ1bmN0aW9uLlN5bWJvbGljKHRoaXMuZGVmYXVsdChhKVsnKyddKHgpLCBbYV0pO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgdmFyIGEgPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2woKTtcbiAgICByZXR1cm4gbmV3IEVGdW5jdGlvbi5TeW1ib2xpYyh0aGlzLmRlZmF1bHQoYSlbJ0AtJ10oKSwgW2FdKTtcbn07XG5cbiIsIihmdW5jdGlvbigpey8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEV4cHJlc3Npb24gID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yO1xuXG5mdW5jdGlvbiBWZWN0b3IoZSkge1xuICAgIGUuX19wcm90b19fID0gVmVjdG9yLnByb3RvdHlwZTtcbiAgICByZXR1cm4gZTtcbn1cblxudXRpbC5pbmhlcml0cyhWZWN0b3IsIHN1cCk7XG5cbnZhciBfID0gVmVjdG9yLnByb3RvdHlwZTtcblxuX1snLC4nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIFZlY3RvcihBcnJheS5wcm90b3R5cGUuY29uY2F0LmNhbGwodGhpcywgW3hdKSk7XG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBWZWN0b3IoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXMsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHJldHVybiBjLmRpZmZlcmVudGlhdGUoeCk7XG4gICAgfSkpO1xufTtcbl8uY3Jvc3MgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLmxlbmd0aCAhPT0gMyB8fCB4Lmxlbmd0aCAhPT0gMykge1xuICAgICAgICB0aHJvdygnQ3Jvc3MgcHJvZHVjdCBvbmx5IGRlZmluZWQgZm9yIDNEIHZlY3RvcnMuJyk7XG4gICAgfVxuICAgIC8qXG4gICAgaSAgIGogICAga1xuICAgIHggICB5ICAgIHpcbiAgICBhICAgYiAgICBjXG4gICAgXG4gICAgPSAoeWMgLSB6YiwgemEgLSB4YywgeGIgLSB5YSlcbiAgICAqL1xuICAgIFxuICAgIHJldHVybiBuZXcgVmVjdG9yKFtcbiAgICAgICAgdGhpc1sxXS5kZWZhdWx0KHhbMl0pWyctJ10odGhpc1syXS5kZWZhdWx0KHhbMV0pKSxcbiAgICAgICAgdGhpc1syXS5kZWZhdWx0KHhbMF0pWyctJ10odGhpc1swXS5kZWZhdWx0KHhbMl0pKSxcbiAgICAgICAgdGhpc1swXS5kZWZhdWx0KHhbMV0pWyctJ10odGhpc1sxXS5kZWZhdWx0KHhbMF0pKVxuICAgIF0pO1xufTtcblxuLy8gY3Jvc3NQcm9kdWN0IGlzIHRoZSAnJnRpbWVzOycgY2hhcmFjdGVyXG52YXIgY3Jvc3NQcm9kdWN0ID0gU3RyaW5nLmZyb21DaGFyQ29kZSgyMTUpO1xuXG5fW2Nyb3NzUHJvZHVjdF0gPSBfLmNyb3NzO1xuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIGlmICh4IGluc3RhbmNlb2YgVmVjdG9yKSB7XG4gICAgICAgIC8vIERvdCBwcm9kdWN0XG4gICAgICAgIGlmKGwgIT09IHgubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdygnVmVjdG9yIERpbWVuc2lvbiBtaXNtYXRjaC4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIHN1bSA9IEdsb2JhbC5aZXJvO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBzdW0gPSBzdW1bJysnXShcbiAgICAgICAgICAgICAgICAodGhpc1tpXSkuZGVmYXVsdCh4W2ldKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNjYWxhciBtdWx0aXBsaWNhdGlvbjpcbiAgICAgICAgcmV0dXJuIFZlY3RvcihBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodGhpcywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmRlZmF1bHQoeCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG59O1xuX1snKiddID0gXy5kZWZhdWx0O1xuX1snKyddID0gZnVuY3Rpb24gKHgsIG9wKSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICBpZihsICE9PSB4Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyhuZXcgTWF0aEVycm9yKCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpKTtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgdmFyIG4gPSBuZXcgQXJyYXkobCk7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBuW2ldID0gdGhpc1tpXVtvcCB8fCAnKyddKHhbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gVmVjdG9yKG4pO1xufTtcbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXNbJysnXSh4LCAnLScpO1xufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBWZWN0b3IpIHtcbiAgICAgICAgdGhyb3coJ1ZlY3RvciBkaXZpc2lvbiBub3QgZGVmaW5lZCcpO1xuICAgIH1cbiAgICByZXR1cm4gVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5jdGlvbiAoYykge1xuICAgICAgICByZXR1cm4gY1snLyddKHgpO1xuICAgIH0pKTtcbiAgICBcbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdygnUmFpc2VkIHRvIHplcm8gcG93ZXInKTtcbiAgICAgICAgfVxuICAgICAgICBpZih4LmEgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4LmEgPT09IDIpIHtcbiAgICAgICAgICAgIHZhciBTID0gR2xvYmFsLlplcm87XG4gICAgICAgICAgICB2YXIgaSwgbCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIFMgPSBTWycrJ10odGhpc1tpXVsnXiddKHgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBTO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ14nXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKHguYSAtIDEpKVsnKiddKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKXtcbiAgICAgICAgcmV0dXJuIHRoaXNbJ14nXSh4LmEpWydeJ10oR2xvYmFsLk9uZVsnLyddKHguYikpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgKyB4Ll9yZWFsLCB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gY29tbXV0ZVxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgVmVjdG9yIF4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGVmYXVsdCh0aGlzWydeJ10oeFsnLSddKEdsb2JhbC5PbmUpKSk7XG59O1xuXG5fLm9sZF9hcHBseV9vcGVyYXRvciA9IGZ1bmN0aW9uKG9wZXJhdG9yLCBlKSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB2YXIgaTtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICAgIGNhc2UgJywnOlxuICAgICAgICAgICAgLy9BcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgICAgICAgLy9GYXN0ZXI6XG4gICAgICAgICAgICAvL01PRElGSUVTISEhISEhISEhXG4gICAgICAgICAgICB0aGlzW2xdID0gZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgY2FzZSAnKic6XG4gICAgICAgICAgICBpZihsICE9PSBlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93KCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN1bSA9IE0uR2xvYmFsLlplcm87XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3VtID0gc3VtLmFwcGx5KCcrJywgdGhpc1tpXS5hcHBseSgnKicsIGVbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdW07XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAgIGlmKGwgIT09IGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3coJ1ZlY3RvciBEaW1lbnNpb24gbWlzbWF0Y2guJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbiA9IG5ldyBBcnJheShsKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBuW2ldID0gdGhpc1tpXS5hcHBseShvcGVyYXRvciwgZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVmVjdG9yKG4pO1xuICAgICAgICBjYXNlICcvJzpcbiAgICAgICAgY2FzZSAnXic6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93KCdWZWN0b3Igb3BlcmF0aW9uIG5vdCBhbGxvd2VkLicpO1xuICAgIH1cbn07XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgdmFyIF94ID0gbmV3IEFycmF5KGwpO1xuICAgIHZhciBfeSA9IG5ldyBBcnJheShsKTtcbiAgICB2YXIgaTtcbiAgICBmb3IoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIHJpID0gdGhpc1tpXS5yZWFsaW1hZygpO1xuICAgICAgICBfeFtpXSA9IHJpWzBdO1xuICAgICAgICBfeVtpXSA9IHJpWzFdO1xuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICBWZWN0b3IoX3gpLFxuICAgICAgICBWZWN0b3IoX3kpXG4gICAgXSk7XG59O1xuXG5fLl9zID0gZnVuY3Rpb24oQ29kZSwgbGFuZykge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgdmFyIG9wZW4gPSAnWyc7XG4gICAgdmFyIGNsb3NlID0gJ10nO1xuICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICBvcGVuID0gJ3ZlYycgKyB0aGlzLmxlbmd0aCArICcoJztcbiAgICAgICAgY2xvc2UgPSAnKSc7XG4gICAgfVxuICAgIHZhciBjID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICB2YXIgaTtcbiAgICB2YXIgdF9zID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIgY19pID0gdGhpc1tpXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgdF9zLnB1c2goY19pLnMpO1xuICAgICAgICBjID0gYy5tZXJnZShjX2kpO1xuICAgIH1cbiAgICByZXR1cm4gYy51cGRhdGUob3BlbiArIHRfcy5qb2luKCcsJykgKyBjbG9zZSwgSW5maW5pdHkpO1xufTtcbn0pKCkiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG5cbmZ1bmN0aW9uIFRydXRoVmFsdWUodikge1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVtZW50O1xuXG51dGlsLmluaGVyaXRzKFRydXRoVmFsdWUsIHN1cCk7XG51dGlsLmluaGVyaXRzKFN0YXRlbWVudCwgc3VwKTtcblxudmFyIF8gPSBUcnV0aFZhbHVlLnByb3RvdHlwZTtcblxudmFyIFRydWUgPSBUcnV0aFZhbHVlLlRydWUgPSBuZXcgVHJ1dGhWYWx1ZSgpO1xudmFyIEZhbHNlID0gVHJ1dGhWYWx1ZS5GYWxzZSA9IG5ldyBUcnV0aFZhbHVlKCk7XG5cbi8vT25seSBkaWZmZXJlbmNlOiBOT1Qgb3BlcmF0b3JcbkZhbHNlWyd+J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFRydWU7XG59O1xuXG4vLyBuZWdhdGlvbiBvcGVyYXRvclxuX1snfiddID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBGYWxzZTtcbn07XG5cbi8vIGRpc2p1bmN0aW9uXG5fLlYgPSBmdW5jdGlvbiAoZSkge1xuICAgIHJldHVybiBlID09PSBUcnVlID8gZSA6IHRoaXM7XG59O1xuXG4vLyBjb25qdW5jdGlvblxuX1snXiddID0gZnVuY3Rpb24gKGUpIHtcbiAgICByZXR1cm4gZSA9PT0gVHJ1ZSA/IHRoaXMgOiBlO1xufTtcblxuXG5mdW5jdGlvbiBTdGF0ZW1lbnQoeCwgeSwgb3BlcmF0b3IpIHtcbiAgICB0aGlzLmEgPSB4O1xuICAgIHRoaXMuYiA9IHk7XG5cbiAgICB0aGlzLm9wZXJhdG9yID0gb3BlcmF0b3I7XG59XG5cbnZhciBfID0gU3RhdGVtZW50LnByb3RvdHlwZTtcbl9bJz0nXSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcbn07XG5fWyc8J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gYSA8IGIgPCBjXG4gICAgLy8gKGEgPCBiKSA9IGJcbiAgICAvLyBiIDwgY1xuICAgIFxuICAgIC8vIGEgPCAoYiA8IGMpXG4gICAgLy8gYSA8IGIgLi4gKGIgPCBjKSA9IGJcbiAgICAvLyAoYSA8IGIpID0gYS5cbn07XG5fLnNvbHZlID0gZnVuY3Rpb24gKHZhcnMpIHtcbiAgICAvLyBhID0gYlxuICAgIC8vIElmIGIgaGFzIGFuIGFkZGl0aXZlIGludmVyc2U/XG4gICAgXG4gICAgLy8gYSAtIGIgPSAwXG4gICAgdmFyIGFfYiA9ICh0aGlzLmEpWyctJ10odGhpcy5iKTtcbiAgICAvKlxuICAgIEV4YW1wbGVzOlxuICAgICgxLDIsMykgLSAoeCx5LHopID0gMCAoc29sdmUgZm9yIHgseSx6KVxuICAgICgxLDIsMykgLSB4ID0gMCAoc29sdmUgZm9yIHgpXG4gICAgKi9cbiAgICBjb25zb2xlLmxvZyhPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhhX2IpKTtcbiAgICByZXR1cm4gYV9iLnJvb3RzKHZhcnMpO1xufTtcbiIsIi8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdHJpeDtcblxuZnVuY3Rpb24gTWF0cml4KGUsIHIsIGMpIHtcbiAgICBlLl9fcHJvdG9fXyA9IE1hdHJpeC5wcm90b3R5cGU7XG5cbiAgICBlLnJvd3MgPSByO1xuICAgIGUuY29scyA9IGM7XG5cbiAgICBpZiAociAhPSBjKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWF0cml4IHNpemUgbWlzbWF0Y2gnKVxuICAgIH1cblxuICAgIHJldHVybiBlO1xufVxuXG51dGlsLmluaGVyaXRzKE1hdHJpeCwgc3VwKTtcblxudmFyIF8gPSBNYXRyaXgucHJvdG90eXBlO1xuXG5fLmRlZmF1bHQgPSBfWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTWF0cml4KSB7XG4gICAgICAgIC8vIEJyb2tlblxuICAgICAgICAvLyBPKG5eMylcbiAgICAgICAgaWYgKHgucm93cyAhPT0gdGhpcy5jb2xzKSB7XG4gICAgICAgICAgICB0aHJvdyAoJ01hdHJpeCBkaW1lbnNpb25zIGRvIG5vdCBtYXRjaC4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIC8vIHJlc3VsdFt4LnJvd3MgKiB4LmNvbHMgLSAxIF0gPSB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBpLCBqLCBrLCByID0gMDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMucm93czsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgeC5jb2xzOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc3VtID0gR2xvYmFsLlplcm87XG4gICAgICAgICAgICAgICAgZm9yKGsgPSAwOyBrIDwgeC5yb3dzOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtID0gc3VtWycrJ10oeFtrICogeC5jb2xzICsgal0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRbcisrXSA9IHN1bTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5NYXRyaXgocmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gdHlwZScpO1xuICAgIH1cbn07XG5cbl8ucmVkdWNlID0gZnVuY3Rpb24gKGFwcCkge1xuICAgIHZhciB4LCB5O1xuICAgIGZvcih5ID0gMDsgeSA8IHRoaXMucm93czsgeSsrKSB7XG4gICAgICAgIGZvcih4ID0gMDsgeCA8IHk7IHgrKykge1xuICAgICAgICAgICAgLy8gTWFrZSB0aGlzW3gseV0gPSAwXG4gICAgICAgICAgICB2YXIgbWEgPSB0aGlzW3ggKiB0aGlzLmNvbHMgKyB4XTtcbiAgICAgICAgICAgIC8vIDAgPSB0aGlzIC0gKHRoaXMvbWEpICogbWFcbiAgICAgICAgICAgIGlmKG1hID09PSBHbG9iYWwuWmVybykge1xuICAgICAgICAgICAgICAgIHRocm93ICgnUm93IHN3YXAhJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdG1hID0gdGhpc1t5ICogdGhpcy5jb2xzICsgeF1bJy8nXShtYSk7XG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgIGZvciAoaSA9IHggKyAxOyBpIDwgdGhpcy5jb2xzOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzW3kgKiB0aGlzLmNvbHMgKyBpXSA9IHRoaXNbeSAqIHRoaXMuY29scyArIGldWyctJ10odG1hWycqJ10odGhpc1t4ICogdGhpcy5jb2xzICsgaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbiIsIi8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xuXG4vKlxuICAgIFRoaXMgdHlwZSBpcyBhbiBhdHRlbXB0IHRvIGF2b2lkIGhhdmluZyB0byBjYWxsIC5yZWFsaW1hZygpIGRvd24gdGhlIHRyZWUgYWxsIHRoZSB0aW1lLlxuICAgIFxuICAgIE1heWJlIHRoaXMgaXMgYSBiYWQgaWRlYSwgYmVjYXVzZSBpdCB3aWxsIGVuZCB1cCBoYXZpbmc6XG4gICAgXG4gICAgZih4KSA9ID5cbiAgICBbXG4gICAgICAgIFJlX2YoeCksXG4gICAgICAgIEltX2YoeClcbiAgICAgICAgXG4gICAgXVxuICAgIHdoaWNoIHJlcXVpcmVzIHR3byBldmFsdWF0aW9ucyBvZiBmKHgpLlxuXG4qL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZXhDYXJ0ZXNpYW47XG5cbnV0aWwuaW5oZXJpdHMoQ29tcGxleENhcnRlc2lhbiwgc3VwKTtcblxuZnVuY3Rpb24gQ29tcGxleENhcnRlc2lhbih4KSB7XG4gICAgeC5fX3Byb3RvX18gPSBDb21wbGV4Q2FydGVzaWFuLnByb3RvdHlwZTtcbiAgICByZXR1cm4geDtcbn1cblxudmFyIF8gPSBDb21wbGV4Q2FydGVzaWFuLnByb3RvdHlwZTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLnJlYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXNbMF07XG59O1xuXy5pbWFnID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzWzFdO1xufTtcbl8uY29uanVnYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXSxcbiAgICAgICAgdGhpc1sxXS5hcHBseSgnQC0nKVxuICAgIF0pO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIG5ldyBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXVsnQC0nXSgpLFxuICAgICAgICB0aGlzWzFdWydALSddKClcbiAgICBdKTtcbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyAoYStiaSkgKiAoYytkaSkgPSBhYyArIGFkaSArIGJjaSAtIGJkXG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdWycqJ10oeFswXSlbJy0nXSh0aGlzWzFdWycqJ10oeFsxXSkpLFxuICAgICAgICAgICAgdGhpc1swXVsnKiddKHhbMV0pWycrJ10odGhpc1sxXVsnKiddKHhbMF0pKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdWycqJ10oeCksXG4gICAgICAgICAgICB0aGlzWzFdWycqJ10oeClcbiAgICAgICAgXSk7XG4gICAgfVxufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuXG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBCaW5vbWlhbCBleHBhbnNpb25cbiAgICAgICAgLy8gKGErYileTlxuICAgICAgICB2YXIgbiAgPSB4LmE7XG4gICAgICAgIHZhciBrO1xuICAgICAgICB2YXIgYSA9IHRoaXNbMF07XG4gICAgICAgIHZhciBiID0gdGhpc1sxXTtcbiAgICAgICAgdmFyIG5lZ29uZSA9IG5ldyBFeHByZXNzaW9uLkludGVnZXIoLTEpO1xuICAgICAgICB2YXIgaW1hZ19wYXJ0ID0gR2xvYmFsLlplcm87XG4gICAgICAgIFxuICAgICAgICB2YXIgcmVhbF9wYXJ0ID0gYVsnXiddKFxuICAgICAgICAgICAgbmV3IEV4cHJlc3Npb24uSW50ZWdlcihuKVxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNpID0gMTtcbiAgICAgICAgXG4gICAgICAgIGZvciAoayA9IDE7OyBrKyspIHtcbiAgICAgICAgICAgIHZhciBleHByO1xuICAgICAgICAgICAgaWYoayA9PT0gbikge1xuICAgICAgICAgICAgICAgIGV4cHIgPSAoXG4gICAgICAgICAgICAgICAgICAgIGJbJ14nXShcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFeHByZXNzaW9uLkludGVnZXIoaylcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGNpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWxfcGFydCA9IHJlYWxfcGFydFsnKyddKGV4cHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ19wYXJ0ID0gaW1hZ19wYXJ0WycrJ10oZXhwcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdfcGFydCA9IGltYWdfcGFydFsnLSddKGV4cHIpO1xuICAgICAgICAgICAgICAgICAgICBjaSA9IC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwciA9IGFbJ14nXShcbiAgICAgICAgICAgICAgICBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKG4gLSBrKVxuICAgICAgICAgICAgKVsnKiddKFxuICAgICAgICAgICAgICAgIGJbJ14nXShcbiAgICAgICAgICAgICAgICAgICAgbmV3IEV4cHJlc3Npb24uSW50ZWdlcihrKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoY2kgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJysnXShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDEpIHtcbiAgICAgICAgICAgICAgICBpbWFnX3BhcnQgPSBpbWFnX3BhcnRbJysnXShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDIpIHtcbiAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDMpIHtcbiAgICAgICAgICAgICAgICBpbWFnX3BhcnQgPSBpbWFnX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgICAgICBjaSA9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICByZWFsX3BhcnQsXG4gICAgICAgICAgICBpbWFnX3BhcnRcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbn07XG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgdGhpc1swXVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdWycrJ10oeCksXG4gICAgICAgICAgICB0aGlzWzFdXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBcbn07XG5cbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeCksXG4gICAgICAgIHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KVxuICAgIF0pO1xufTtcblxuXG4vLyBfLmFwcGx5T2xkID0gZnVuY3Rpb24obywgeCkge1xuLy8gICAgIC8vVE9ETzogZW5zdXJlIHRoaXMgaGFzIGFuIGltYWdpbmFyeSBwYXJ0LiBJZiBpdCBkb2Vzbid0IGl0IGlzIGEgaHVnZSB3YXN0ZSBvZiBjb21wdXRhdGlvblxuLy8gICAgIGlmICh4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKSB7XG4vLyAgICAgICAgIHN3aXRjaChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseShvLCB4WzBdKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseShvLCB4WzFdKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgLy9GdW5jdGlvbiBldmFsdWF0aW9uPyBOTy4gVGhpcyBpcyBub3QgYSBmdW5jdGlvbi4gSSB0aGluay5cbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIHhbMF0pLmFwcGx5KCctJywgdGhpc1sxXS5hcHBseSgnKicsIHhbMV0pKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIHhbMV0pLmFwcGx5KCcrJywgdGhpc1sxXS5hcHBseSgnKicsIHhbMF0pKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0geFswXS5hcHBseSgnKicsIHhbMF0pLmFwcGx5KCcrJywgeFsxXS5hcHBseSgnKicsIHhbMV0pKTtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgICh0aGlzWzBdLmFwcGx5KCcqJyx4WzBdKS5hcHBseSgnKycsdGhpc1sxXS5hcHBseSgnKicseFsxXSkpKS5hcHBseSgnLycsIGNjX2RkKSxcbi8vICAgICAgICAgICAgICAgICAgICAgKHRoaXNbMV0uYXBwbHkoJyonLHhbMF0pLmFwcGx5KCctJyx0aGlzWzBdLmFwcGx5KCcqJyx4WzFdKSkpLmFwcGx5KCcvJywgY2NfZGQpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvL1RoZSBtb3N0IGNvbmZ1c2luZyBvZiB0aGVtIGFsbDpcbi8vICAgICAgICAgICAgICAgICB2YXIgaGFsZiA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoMC41LCAwKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaGxtID0gaGFsZi5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgIEdsb2JhbC5sb2cuYXBwbHkodW5kZWZpbmVkLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgLy9UaGUgbWFnbml0dWRlOiBpZiB0aGlzIHdhcyBmb3IgYSBwb2xhciBvbmUgaXQgY291bGQgYmUgZmFzdC5cbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF1cbi8vICAgICAgICAgICAgICAgICAgICAgICAgICkuYXBwbHkoJysnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWzFdXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBHbG9iYWwuYXRhbjIuYXBwbHkodW5kZWZpbmVkLCBFeHByZXNzaW9uLlZlY3RvcihbdGhpc1sxXSwgdGhpc1swXV0pKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaG1sZF90YyA9IGhsbS5hcHBseSgnKicsIHhbMV0pLmFwcGx5KCcrJywgdGhldGEuYXBwbHkoJyonLCB4WzBdKSk7XG4gICAgICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IEdsb2JhbC5leHAuYXBwbHkodW5kZWZpbmVkLFxuLy8gICAgICAgICAgICAgICAgICAgICBobG0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgYlswXVxuLy8gICAgICAgICAgICAgICAgICAgICApLmFwcGx5KCctJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoZXRhLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiWzFdXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFxuXG4vLyAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IEdsb2JhbC5lLmFwcGx5KCdeJyxcbi8vICAgICAgICAgICAgICAgICAgICAgaGxtLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHhbMF1cbi8vICAgICAgICAgICAgICAgICAgICAgKS5hcHBseSgnLScsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGV0YS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFsxXVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgKTtcblxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZC5hcHBseSgnKicsR2xvYmFsLmNvcy5hcHBseSh1bmRlZmluZWQsIGhtbGRfdGMpKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQuYXBwbHkoJyonLEdsb2JhbC5zaW4uYXBwbHkodW5kZWZpbmVkLCBobWxkX3RjKSkpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpe1xuLy8gICAgICAgICBzd2l0Y2ggKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy8oeCt5aSkvQSplXihpaylcbi8vICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSB4WzBdLmFwcGx5KCcqJywgeFswXSk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGIgPSB4LnJlYWxpbWFnKCk7XG4vLyAgICAgICAgICAgICAgICAgLy9DbGVhbiB0aGlzIHVwPyBTdWI/XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICAodGhpc1swXS5hcHBseSgnKicsYlswXSkuYXBwbHkoJysnLGFbMV0uYXBwbHkoJyonLGJbMV0pKSkuYXBwbHkoJy8nLCBjY19kZCksXG4vLyAgICAgICAgICAgICAgICAgICAgICh0aGlzWzFdLmFwcGx5KCcqJyxiWzBdKS5hcHBseSgnLScsYVswXS5hcHBseSgnKicsYlsxXSkpKS5hcHBseSgnLycsIGNjX2RkKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy9odHRwOi8vd3d3LndvbGZyYW1hbHBoYS5jb20vaW5wdXQvP2k9UmUlMjglMjh4JTJCeWklMjklNUUlMjhBKmUlNUUlMjhpayUyOSUyOSUyOVxuLy8gICAgICAgICAgICAgICAgIC8vKHgreWkpXihBKmVeKGlrKSlcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5Db21wbGV4KSB7XG4vLyAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5KG8sIHgucmVhbGltYWcoKSk7XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0R1cGxpY2F0ZWQgYW4geCEgVGhpcyBtYWtlcyBpdCBkaWZmaWN1bHQgdG8gc29sdmUgY29tcGxleCBlcXVhdGlvbnMsIEkgdGhpbmsnKTtcbi8vICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0R1cGxpY2F0ZWQgYW4geCEgVGhpcyBtYWtlcyBpdCBkaWZmaWN1bHQgdG8gc29sdmUgY29tcGxleCBlcXVhdGlvbnMsIEkgdGhpbmsnKTtcbi8vICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICB9XG4vLyAgICAgdGhyb3coJ0NNUExYLkxJU1QgKiAnICsgbyk7XG4vLyB9O1xuIiwiKGZ1bmN0aW9uKCl7Ly8gc3RvcCBqc2hpbnQgZnJvbSBjb21wbGFpbmcgYWJvdXQgX19wcm90b19fXG4vKmpzaGludCAtVzEwMyAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLy4uLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dsb2JhbCcpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0UmVhbDtcblxudXRpbC5pbmhlcml0cyhMaXN0UmVhbCwgc3VwKTtcblxuZnVuY3Rpb24gTGlzdFJlYWwoeCwgb3BlcmF0b3IpIHtcbiAgICB4Ll9fcHJvdG9fXyA9IExpc3RSZWFsLnByb3RvdHlwZTtcbiAgICBpZihvcGVyYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHgub3BlcmF0b3IgPSBvcGVyYXRvcjtcbiAgICB9XG4gICAgcmV0dXJuIHg7XG59XG5cbnZhciBfID0gTGlzdFJlYWwucHJvdG90eXBlO1xuXG5fLnJlYWxpbWFnID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHN1cC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpcyxcbiAgICAgICAgR2xvYmFsLlplcm9cbiAgICBdKTtcbn07XG5fLnJlYWwgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLmltYWcgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gR2xvYmFsLlplcm87XG59O1xuXy5wb2xhciA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gc3VwLkNvbXBsZXhQb2xhcihbXG4gICAgICAgIHN1cC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSksXG4gICAgICAgIHN1cC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSlcbiAgICBdKTtcbn07XG5fLmFicyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBzdXAuUmVhbChbR2xvYmFsLmFicywgdGhpc10pO1xufTtcbl8uYXJnID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHN1cC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSk7XG59O1xuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzID09PSB4KSB7XG4gICAgICAgIHJldHVybiB4WycqJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcigyKSk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKycgJiYgdGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdLCB0aGlzWzFdWycrJ10oeCldLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnLScgJiYgdGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdLCB4WyctJ10odGhpc1sxXSldLCAnKycpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICBcbiAgICBpZih4IGluc3RhbmNlb2Ygc3VwLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJysnXSh0aGlzKTtcbiAgICBcbn07XG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKHggPT09IHRoaXMpIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIHN1cC5SZWFsKSB7XG4gICAgICAgIGlmICh4Lm9wZXJhdG9yID09PSAnQC0nKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhbMF1dLCAnKycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKClbJy0nXSh4KTtcbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIFxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSAnLycgJiYgdGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdWycqJ10oeCksIHRoaXNbMV1dLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3gsIHRoaXNdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2Ygc3VwLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgaWYgKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnKicpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKiddKHRoaXMpO1xuICAgIFxufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZih4ID09PSB0aGlzKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyonIHx8IHRoaXMub3BlcmF0b3IgPT09ICcvJykge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdWycvJ10oeCksIHRoaXNbMV1dLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH1cblxuICAgIGlmKHggaW5zdGFuY2VvZiBzdXAuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpWycvJ10oeCk7XG59O1xuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnJScpO1xufTtcbl9bJ0AtJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJ0AtJykge1xuICAgICAgICByZXR1cm4gdGhpc1swXTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzXSwgJ0AtJyk7XG59O1xuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSAnLycgJiYgdGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdWydeJ10oeCksIHRoaXNbMV1bJ14nXSh4KV0sIHRoaXMub3BlcmF0b3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsLnByb3RvdHlwZVsnXiddLmNhbGwodGhpcywgeCk7XG4gICAgXG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuXG4gICAgaWYgKHRoaXMub3BlcmF0b3IgPT09ICcrJyB8fFxuICAgICAgICB0aGlzLm9wZXJhdG9yID09PSAnLScgfHxcbiAgICAgICAgdGhpcy5vcGVyYXRvciA9PT0gJ0AtJykge1xuXG4gICAgICAgIHJldHVybiB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeClbdGhpcy5vcGVyYXRvcl0odGhpc1sxXSAmJiB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeCkpO1xuICAgIFxuICAgIH0gZWxzZSBpZiAodGhpcy5vcGVyYXRvciA9PT0gJyonIHx8IHRoaXMub3BlcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgIGlmKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkZ1bmN0aW9uKSB7XG5cbiAgICAgICAgICAgIHZhciBkYSA9IHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KTtcbiAgICAgICAgICAgIGlmKGRhID09PSBHbG9iYWwuWmVybykgcmV0dXJuIGRhO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpc1swXS5kaWZmZXJlbnRpYXRlKCkuZGVmYXVsdCh0aGlzWzFdKVsnKiddKGRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzWzBdW3RoaXMub3BlcmF0b3JdKFxuICAgICAgICAgICAgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgIClbJysnXSh0aGlzWzFdW3RoaXMub3BlcmF0b3JdKFxuICAgICAgICAgICAgdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgICkpO1xuXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wZXJhdG9yID09PSAnLycpIHtcblxuICAgICAgICByZXR1cm4gdGhpc1sxXVsnKiddKFxuICAgICAgICAgICAgdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgIClbJy0nXShcbiAgICAgICAgICAgIHRoaXNbMF1bJyonXShcbiAgICAgICAgICAgICAgICB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgICAgIClcbiAgICAgICAgKVt0aGlzLm9wZXJhdG9yXShcbiAgICAgICAgICAgIHRoaXNbMV1bJyonXSh0aGlzWzFdKVxuICAgICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcGVyYXRvciA9PT0gJ14nKSB7XG5cbiAgICAgICAgdmFyIGRmID0gdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpO1xuICAgICAgICB2YXIgZGcgPSB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeCk7XG5cbiAgICAgICAgaWYgKGRmID09PSBHbG9iYWwuWmVybykge1xuICAgICAgICAgICAgaWYgKGRnID09PSBHbG9iYWwuWmVybykgcmV0dXJuIGRnO1xuXG4gICAgICAgICAgICByZXR1cm4gZGcuZGVmYXVsdChcbiAgICAgICAgICAgICAgICBHbG9iYWwubG9nLmRlZmF1bHQodGhpc1swXSlcbiAgICAgICAgICAgICkuZGVmYXVsdCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmYSA9IHRoaXNbMF1bJ14nXShcbiAgICAgICAgICAgIHRoaXNbMV1bJy0nXShHbG9iYWwuT25lKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBmYS5kZWZhdWx0KFxuICAgICAgICAgICAgZGYuZGVmYXVsdCh0aGlzWzFdKVsnKyddKFxuICAgICAgICAgICAgICAgIHRoaXNbMF1bJyonXShcbiAgICAgICAgICAgICAgICAgICAgR2xvYmFsLmxvZy5kZWZhdWx0KHRoaXNbMF0pXG4gICAgICAgICAgICAgICAgKVsnKiddKFxuICAgICAgICAgICAgICAgICAgICBkZ1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICB9XG59O1xuXG5fLnJvb3RzID0gZnVuY3Rpb24gKHgpIHtcblx0Y29uc29sZS5sb2coc3VwKTtcbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuXG4gICAgdmFyIGxhbmd1YWdlID0gQ29kZS5sYW5ndWFnZTtcbiAgICBmdW5jdGlvbiBwYXJlbih4KSB7XG4gICAgICAgIGlmKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICAgICAgcmV0dXJuICdcXFxcbGVmdCgnICsgeCArICdcXFxccmlnaHQpJzsgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcoJyArIHggKyAnKSc7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wZXJhdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBpZih0aGlzWzBdID09PSBHbG9iYWwuYWJzKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuXG4gICAgICAgICAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMS51cGRhdGUoJ1xcXFxsZWZ0fCcgKyBjMS5zICsgJ1xcXFxyaWdodHwnLCBJbmZpbml0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMxLnVwZGF0ZShjMC5zICsgJygnICsgYzEucyArICcpJywgSW5maW5pdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIGlmICh0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5WZWN0b3IpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzFzID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXNbMV0sIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgICAgIHZhciB0X3MgPSBjMXMubWFwKGZ1bmN0aW9uIChlKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGUucztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZih0aGlzWzBdID09PSBHbG9iYWwuYXRhbikge1xuICAgICAgICAgICAgICAgICAgICB0X3MgPSB0X3MucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYzBfcyA9IGMwLnM7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGMxcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjMC5tZXJnZShjMXNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYzAudXBkYXRlKGMwX3MgKyBwYXJlbih0X3MpLCBsYW5ndWFnZS5vcGVyYXRvcnMuZGVmYXVsdC5wcmVjZWRlbmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsIGMwLnMgKyBwYXJlbihjMS5zKSwgbGFuZ3VhZ2Uub3BlcmF0b3JzLmRlZmF1bHQucHJlY2VkZW5jZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9wZXJhdG9yID0gJyonO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBwID0gbGFuZ3VhZ2Uub3BlcmF0b3JzW3RoaXMub3BlcmF0b3JdLnByZWNlZGVuY2U7XG4gICAgdmFyIGFzc29jID0gbGFuZ3VhZ2Uub3BlcmF0b3JzW3RoaXMub3BlcmF0b3JdID09PSAwO1xuICAgIGZ1bmN0aW9uIF8oeCkge1xuICAgICAgICBpZihwID4geC5wIHx8ICFhc3NvYyl7XG4gICAgICAgICAgICByZXR1cm4gcGFyZW4oeC5zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geC5zO1xuICAgIH1cblxuICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICdeJykge1xuXG4gICAgICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICAgICAgaWYodGhpc1swXSA9PT0gR2xvYmFsLmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjMS51cGRhdGUoJ2V4cCgnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyICYmIHRoaXNbMV0uYSA8IDUgJiYgdGhpc1sxXS5hID4gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHZhciBqID0gbGFuZ3VhZ2Uub3BlcmF0b3JzWycqJ10ucHJlY2VkZW5jZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgcHJlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhciBjcztcbiAgICAgICAgICAgICAgICBpZih0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgICAgICAgICAgICAgY3MgPSBjMC5zO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjcyA9IGMwLnZhcmlhYmxlKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBwcmUgPSAnZmxvYXQgJyArIGNzICsgJyA9ICcgKyBjMC5zICsgJzsnO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcyA9IGNzO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgICAgIGZvcihpID0gMTsgaSA8IHRoaXNbMV0uYTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHMrPSAnKicgKyBjcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMwLnVwZGF0ZSgnKCcgKyBzICsgJyknLCBJbmZpbml0eSwgcHJlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIgJiYgdGhpc1sxXS5hID09IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAvLyB0b2RvOiBwcmVjZWRlbmNlIG5vdCBuZWNlc3NhcnlcbiAgICAgICAgICAgICAgICByZXR1cm4gYzAudXBkYXRlKCcoMS4wLygnICsgYzAucyArICcpKScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICAvLyBhXjIsIDMsIDQsIDUsIDYgXG4gICAgICAgICAgICAgICAgLy8gdW5zdXJlIGl0IGlzIGdjZFxuICAgICAgICAgICAgICAgIHRoaXNbMV0gPSB0aGlzWzFdLnJlZHVjZSgpO1xuICAgICAgICAgICAgICAgIHZhciBldmVuID0gdGhpc1sxXS5hICUgMiA/IGZhbHNlIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZihldmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdwb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICArICcpJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB4XihhKSA9ICh4KSAqIHheKGEtMSlcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXVsnLSddKEdsb2JhbC5PbmUpLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnKCgnICsgYzAucyArICcpICogcG93KCcgKyBjMC5zICsgJywnICsgYzEucyArICcpKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBOZWcgb3IgcG9zLlxuICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV1bJy0nXShHbG9iYWwuT25lKS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJygoJyArIGMwLnMgKyAnKSAqIHBvdygnICsgYzAucyArICcsJytjMS5zKycpKScpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXVsnLSddKEdsb2JhbC5PbmUpLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5lZWRzIGEgbmV3IGZ1bmN0aW9uLCBkZXBlbmRlbnQgb24gcG93ZXIuXG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICcoKCcgKyBjMC5zICsgJykgKiBwb3coJyArIGMwLnMgKyAnLCcrYzEucysnKSknKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2UgaWYobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IEdsb2JhbC5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYzEudXBkYXRlKCdNYXRoLmV4cCgnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuXG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICAgICAgICAgIC8vIGFeMiwgMywgNCwgNSwgNiBcbiAgICAgICAgICAgICAgICB2YXIgZXZlbiA9IHRoaXNbMV0uYSAlIDIgPyBmYWxzZSA6IHRydWU7XG5cbiAgICAgICAgICAgICAgICBpZihldmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ01hdGgucG93KCcgKyBjMC5zICsgJywnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnTWF0aC5wb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIE5lZWRzIGEgbmV3IGZ1bmN0aW9uLCBkZXBlbmRlbnQgb24gcG93ZXIuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnTWF0aC5wb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2UgaWYgKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jyl7XG4gICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgXyhjMCkgKyAnXicgKyAneycgKyBjMS5zICsgJ30nKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcblxuICAgIGlmKHRoaXMub3BlcmF0b3JbMF0gPT09ICdAJykge1xuICAgICAgICByZXR1cm4gYzAudXBkYXRlKHRoaXMub3BlcmF0b3JbMV0gKyBfKGMwKSwgcCk7XG4gICAgfVxuXG4gICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICBcbiAgICBpZihsYW5nID09PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJy8nKSB7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdcXFxcZnJhY3snICsgYzAucyArICd9eycgKyBjMS5zICsgJ30nKVxuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJykge1xuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCBfKGMwKSArIF8oYzEpLCBwKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICclJykge1xuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnbW9kKCcgKyBfKGMwKSArICcsJyArIF8oYzEpICsgJyknLCBwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjMC5tZXJnZShjMSwgXyhjMCkgKyB0aGlzLm9wZXJhdG9yICsgXyhjMSksIHApO1xufTtcblxuXG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dsb2JhbCcpO1xuXG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbF9SZWFsO1xuXG51dGlsLmluaGVyaXRzKFN5bWJvbF9SZWFsLCBzdXApO1xuXG5mdW5jdGlvbiBTeW1ib2xfUmVhbChzdHIpIHtcbiAgICB0aGlzLnN5bWJvbCA9IHN0cjtcbn1cblxudmFyIF8gPSBTeW1ib2xfUmVhbC5wcm90b3R5cGU7XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW3RoaXMsIEdsb2JhbC5aZXJvXSk7XG59O1xuXy5yZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5pbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xufTtcbl8ucG9sYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSksXG4gICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSlcbiAgICBdKTtcbn07XG5fLmFicyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFicywgdGhpc10pO1xufTtcbl8uYXJnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSk7XG59O1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4ID09PSBHbG9iYWwuWmVybykge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJysnXSh0aGlzKTtcbn07XG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMgPT09IHgpIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy0nKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIGlmICh4Lm9wZXJhdG9yID09PSAnQC0nKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4WzBdXSwgJysnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy0nKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy0nKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHhbJ0AtJ10oKVsnKyddKHRoaXMpO1xufTtcblxuX1snQCsnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzXSwgJ0ArJyk7XG59O1xuXG5fWydALSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXNdLCAnQC0nKTtcbn07XG5cbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcqJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4geFsnKiddKHRoaXMpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3gsIHRoaXNdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbn07XG5fLmFwcGx5ID0gX1snKiddO1xuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93KCdEaXZpc2lvbiBieSB6ZXJvJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIHZhciBmID0geC5yZWR1Y2UoKTtcbiAgICAgICAgaWYoZi5hICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJ14nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbn07XG5fWyclJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG59O1xuXy5hcHBseU9sZCA9IGZ1bmN0aW9uKG9wZXJhdG9yLCBlKSB7XG4gICAgdGhyb3coXCJSZWFsLmFwcGx5XCIpO1xuICAgIC8vIGlmIChvcGVyYXRvciA9PT0gJywnKSB7XG4gICAgLy8gICAgIC8vTWF5YmUgdGhpcyBzaG91bGQgYmUgYSBuZXcgb2JqZWN0IHR5cGU/Pz8gVmVjdG9yP1xuICAgIC8vICAgICBjb25zb2xlLmxvZygnQVBQTFk6ICcsIHRoaXMuY29uc3RydWN0b3IsIHRoaXMsIGUpO1xuICAgIC8vICAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXMsIGVdKTtcbiAgICAvLyB9IGVsc2UgaWYgKG9wZXJhdG9yID09PSAnPScpIHtcbiAgICAvLyAgICAgcmV0dXJuIEV4cHJlc3Npb24uRXF1YXRpb24oW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gfVxuICAgIC8vIGlmIChlID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyAgICAgLy9VbmFyeTpcbiAgICAvLyAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgIC8vICAgICAgICAgY2FzZSAnISc6XG4gICAgLy8gICAgICAgICAgICAgLy9UT0RPOiBDYW4ndCBzaW1wbGlmeSwgc28gd2h5IGJvdGhlciEgKHJldHVybiBhIGxpc3QsIHNpbmNlIGdhbW1hIG1hcHMgYWxsIHJlYWxzIHRvIHJlYWxzPylcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLkdhbW1hLmFwcGx5KHVuZGVmaW5lZCwgdGhpcy5hcHBseSgnKycsIEdsb2JhbC5PbmUpKTtcbiAgICAvLyAgICAgICAgIGNhc2UgJ0AtJzpcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXNdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICBkZWZhdWx0OlxuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHRocm93KCdSZWFsIFN5bWJvbCgnK3RoaXMuc3ltYm9sKycpIGNvdWxkIG5vdCBoYW5kbGUgb3BlcmF0b3IgJysgb3BlcmF0b3IpO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICAgIC8vIFNpbXBsaWZpY2F0aW9uOlxuICAgIC8vICAgICBzd2l0Y2ggKGUuY29uc3RydWN0b3Ipe1xuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsOlxuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3QuUmVhbDpcbiAgICAvLyAgICAgICAgICAgICAvKmlmKHRoaXMucG9zaXRpdmUgJiYgZS5wb3NpdGl2ZSkge1xuICAgIC8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgfSovXG4gICAgLy8gICAgICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKSB7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJ14nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBCYWQgaWRlYT8gVGhpcyB3aWxsIHN0YXkgaW4gdGhpcyBmb3JtIHVudGlsIHJlYWxpbWFnKCkgaXMgY2FsbGVkIGJ5IHVzZXIsIGFuZCB1c2VyIG9ubHkuXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAvL3JldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0V4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSksIGVdLCdeJyksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2UsIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSldLCcqJylcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sICcqJyk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWw6XG4gICAgLy8gICAgICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnKyc6XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZS52YWx1ZSA9PT0gMCl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJyonOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZS52YWx1ZSA9PT0gMSl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoZS52YWx1ZSA9PT0gMCl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgJyonKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICclJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sICclJyk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJ14nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZS52YWx1ZSA9PT0gMSl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoZS52YWx1ZSA9PT0gMCl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihmYWxzZSAmJiBvcGVuZ2xfVE9ET19oYWNrKCkgJiYgZS52YWx1ZSA9PT0gfn5lLnZhbHVlKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0V4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSksIGVdLCdeJyksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2UsIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSldLCcqJylcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnLyc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihlLnZhbHVlID09PSAxKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihlLnZhbHVlID09PSAwKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLkluZmluaXR5O1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkNvbXBsZXg6XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgZSk7IC8vIEdPIHRvIGFib3ZlICh3aWxsIGFwcGx5IHJlYWxzKVxuICAgIC8vICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbjpcbiAgICAvLyAgICAgICAgICAgICAvL01heWJlIHRoZXJlIGlzIGEgd2F5IHRvIHN3YXAgdGhlIG9yZGVyPyAoZS5nLiBhIC5yZWFsID0gdHJ1ZSBwcm9wZXJ0eSBmb3Igb3RoZXIgdGhpbmdzIHRvIGNoZWNrKVxuICAgIC8vICAgICAgICAgICAgIC8vb3IgaW5zdGFuY2Ugb2YgRXhwcmVzc2lvbi5SZWFsID9cbiAgICAvLyAgICAgICAgICAgICBzd2l0Y2gob3BlcmF0b3IpIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnKyc6XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5KG9wZXJhdG9yLCBlWzBdKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBlWzFdXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnKic6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHkob3BlcmF0b3IsIGVbMF0pLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHkob3BlcmF0b3IsIGVbMV0pXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnLyc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSBlWzBdLmFwcGx5KCcqJyxlWzBdKS5hcHBseSgnKycsZVsxXS5hcHBseSgnKicsZVsxXSkpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAodGhpcy5hcHBseSgnKicsZVswXSkpLmFwcGx5KCcvJywgY2NfZGQpLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHkoJyonLGVbMV0pLmFwcGx5KCcvJywgY2NfZGQpLmFwcGx5KCdALScpXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXI6XG4gICAgLy8gICAgICAgICAgICAgLy9NYXliZSB0aGVyZSBpcyBhIHdheSB0byBzd2FwIHRoZSBvcmRlcj9cbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5wb2xhcigpLmFwcGx5KG9wZXJhdG9yLCBlKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICB0aHJvdygnTElTVCBGUk9NIFJFQUwgU1lNQk9MISAnKyBvcGVyYXRvciwgZS5jb25zdHJ1Y3Rvcik7XG4gICAgLy8gICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gfVxufTtcblxuXG59KSgpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwID0gcmVxdWlyZSgnLi4vJyksXG4gICAgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbGljRUZ1bmN0aW9uO1xuXG51dGlsLmluaGVyaXRzKFN5bWJvbGljRUZ1bmN0aW9uLCBzdXApO1xuXG5mdW5jdGlvbiBTeW1ib2xpY0VGdW5jdGlvbihleHByLCB2YXJzKSB7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgICB0aGlzLnN5bWJvbHMgPSB2YXJzO1xuICAgIFxufTtcbnZhciBfID0gU3ltYm9saWNFRnVuY3Rpb24ucHJvdG90eXBlO1xuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeC5jb25zdHJ1Y3RvciAhPT0gRXhwcmVzc2lvbi5WZWN0b3IpIHtcbiAgICAgICAgeCA9IEV4cHJlc3Npb24uVmVjdG9yKFt4XSk7XG4gICAgfVxuICAgIHZhciBleHByID0gdGhpcy5leHByO1xuICAgIHZhciBpLCBsID0gdGhpcy5zeW1ib2xzLmxlbmd0aDtcbiAgICBpZiAobCAhPT0geC5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgKCdJbnZhbGlkIGRvbWFpbi4gRWxlbWVudCBvZiBGXicgKyBsICsgJyBleHBlY3RlZC4nKTtcbiAgICB9XG4gICAgZm9yKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGV4cHIgPSBleHByLnN1Yih0aGlzLnN5bWJvbHNbaV0sIHhbaV0pXG4gICAgfVxuICAgIHJldHVybiBleHByO1xufTsiLCIvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGxleFBvbGFyO1xuXG51dGlsLmluaGVyaXRzKENvbXBsZXhQb2xhciwgc3VwKTtcblxuZnVuY3Rpb24gQ29tcGxleFBvbGFyICh4KXtcbiAgICB4Ll9fcHJvdG9fXyA9IENvbXBsZXhQb2xhci5wcm90b3R5cGU7XG4gICAgcmV0dXJuIHg7XG59XG52YXIgXyA9IENvbXBsZXhQb2xhci5wcm90b3R5cGU7XG5cbl8ucG9sYXIgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzO1xufTtcbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpIHtcbiAgICAvL1RPRE86IFJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhblxuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCBHbG9iYWwuY29zLmFwcGx5KHVuZGVmaW5lZCwgdGhpc1sxXSkpLFxuICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgR2xvYmFsLnNpbi5hcHBseSh1bmRlZmluZWQsIHRoaXNbMV0pKVxuICAgIF0pO1xufTtcbl8ucmVhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzWzBdLmFwcGx5KCcqJywgR2xvYmFsLmNvcy5hcHBseSh1bmRlZmluZWQsIHRoaXNbMV0pKTtcbn07XG5fLmltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpc1swXS5hcHBseSgnKicsIEdsb2JhbC5zaW4uYXBwbHkodW5kZWZpbmVkLCB0aGlzWzFdKSk7XG59O1xuXy5jb25qdWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQ29tcGxleFBvbGFyKFtcbiAgICAgICAgdGhpc1swXSxcbiAgICAgICAgdGhpc1sxXS5hcHBseSgnQC0nKVxuICAgIF0pO1xufTtcbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uKHgpe1xuICAgIC8vIGQvZHggYSh4KSAqIGVeKGliKHgpKVxuICAgIFxuICAgIC8vVE9ETyBlbnN1cmUgYmVsb3cgIGYnICsgaWYgZycgcGFydCBpcyByZWFsaW1hZyAoZicsIGZnJylcbiAgICByZXR1cm4gR2xvYmFsLmVcbiAgICAuYXBwbHkoXG4gICAgICAgICdeJyxcbiAgICAgICAgR2xvYmFsLmlcbiAgICAgICAgLmFwcGx5KCcqJyxcbiAgICAgICAgICAgIHRoaXNbMV1cbiAgICAgICAgKVxuICAgIClcbiAgICAuYXBwbHkoJyonLFxuICAgICAgICB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgLmFwcGx5KCcrJyxcbiAgICAgICAgICAgIEdsb2JhbC5pXG4gICAgICAgICAgICAuYXBwbHkoJyonLFxuICAgICAgICAgICAgICAgIHRoaXNbMF1cbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hcHBseSgnKicsXG4gICAgICAgICAgICAgICAgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgICAgICApXG4gICAgICAgIClcbiAgICApO1xufTtcbi8vIF8uYXBwbHkgPSBmdW5jdGlvbihvLCB4KSB7XG4vLyAgICAgaWYgKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3IpIHtcbi8vICAgICAgICAgc3dpdGNoIChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIC8vRmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIHhbMF0pLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcrJywgeFsxXSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIC8vQWxzbyBmYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcvJywgeFswXSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJy0nLCB4WzFdKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAvL1Zlcnkgc2xvdywgbWF5YmUgd2Ugc2hvdWxkIHN3aXRjaCB0byBjYXJ0ZXNpYW4gbm93P1xuICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvLyhBZV4oaWspKSBeIChCZV4oaWopKVxuLy8gICAgICAgICAgICAgICAgIC8vSG93IHNsb3cgaXMgdGhpcz9cbi8vICAgICAgICAgICAgICAgICAvL1ZlcnkgZmFzdCBmb3IgcmVhbCBudW1iZXJzIHRob3VnaFxuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuLy8gICAgICAgICBzd2l0Y2ggKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgLy9GYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgeCksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIC8vQWxzbyBmYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcvJywgeCksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgLy9WZXJ5IHNsb3csIG1heWJlIHdlIHNob3VsZCBzd2l0Y2ggdG8gY2FydGVzaWFuIG5vdz9cbiAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy9GYXN0OlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnKicsIHgpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5Db21wbGV4KSB7XG4vLyAgICAgICAgIHN3aXRjaCAobykge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICAvL0Zhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHguX3JlYWwpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnKycsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoeC5faW1hZykpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICAvL0Fsc28gZmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnLycsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoeC5fcmVhbCkpLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCctJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh4Ll9pbWFnKSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgLy9WZXJ5IHNsb3csIG1heWJlIHdlIHNob3VsZCBzd2l0Y2ggdG8gY2FydGVzaWFuIG5vdz9cbiAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy8oQWVeKGlrKSkgXiAoQmVeKGlqKSlcbi8vICAgICAgICAgICAgICAgICAvL0hvdyBzbG93IGlzIHRoaXM/XG4vLyAgICAgICAgICAgICAgICAgLy9WZXJ5IGZhc3QgZm9yIHJlYWwgbnVtYmVycyB0aG91Z2hcbi8vICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfVxuICAgIFxuLy8gfTtcbl8uYWJzID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHRoaXNbMF07XG59O1xuXy5hcmcgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gdGhpc1sxXTtcbn07XG4iLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCAgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi9nbG9iYWwnKSxcbiAgICBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5maW5pdGVzaW1hbDtcbnV0aWwuaW5oZXJpdHMoSW5maW5pdGVzaW1hbCwgc3VwKTtcbmZ1bmN0aW9uIEluZmluaXRlc2ltYWwoeCkge1xuICAgIHRoaXMueCA9IHg7XG59XG52YXIgXyA9IEluZmluaXRlc2ltYWwucHJvdG90eXBlO1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBJbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGVzaW1hbCBhZGRpdGlvbicpO1xuICAgIH1cbiAgICByZXR1cm4geDtcbn07XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBJbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgIGlmKHgueCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54LmRpZmZlcmVudGlhdGUoeC54KTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmZ1c2luZyBpbmZpdGVzaW1hbCBkaXZpc2lvbicpO1xuICAgIH1cbiAgICB0aGlzLnggPSB0aGlzLnhbJy8nXSh4KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIC8vIGReMiA9IDBcbiAgICBpZih4IGluc3RhbmNlb2YgSW5maW5pdGVzaW1hbCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIHRoaXMueCA9IHRoaXMueFsnKiddKHgpO1xufTtcbl8ucyA9IGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgaWYobGFuZyAhPT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGVzaW1hbCBudW1iZXJzIGNhbm5vdCBiZSBleHBvcnRlZCB0byBwcm9ncmFtbWluZyBsYW5ndWFnZXMnKTtcbiAgICB9XG4gICAgdmFyIGMgPSB0aGlzLngucyhsYW5nKTtcbiAgICB2YXIgcCA9IGxhbmd1YWdlLnByZWNlZGVuY2UoJ2RlZmF1bHQnKVxuICAgIGlmKHAgPiBjLnApIHtcbiAgICAgICAgYy5zID0gJ1xcXFxsZWZ0KCcgKyBjLnMgKyAnXFxcXHJpZ2h0KSc7XG4gICAgfVxuICAgIHJldHVybiBjLnVwZGF0ZSgnZCcgKyBjLnMsIHApO1xufTtcblxufSkoKSJdfQ==
;