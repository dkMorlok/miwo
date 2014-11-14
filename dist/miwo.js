(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
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
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
var Application, ComponentManager, ComponentSelector, ControllerFactory, CookieManager, EntityManager, FlashNotificator, InjectorExtension, LatteCompiler, LatteFactory, MiwoExtension, ProxyManager, RequestFactory, RequestManager, Router, StoreManager, TemplateFactory, TemplateLoader, Translator, ZIndexManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

InjectorExtension = require('./di/InjectorExtension');

Application = require('./app/Application');

Router = require('./app/Router');

RequestFactory = require('./app/RequestFactory');

FlashNotificator = require('./app/FlashNotificator');

ControllerFactory = require('./app/ControllerFactory');

TemplateFactory = require('./templates/TemplateFactory');

TemplateLoader = require('./templates/TemplateLoader');

LatteFactory = require('./latte/LatteFactory');

LatteCompiler = require('./latte/LatteCompiler');

RequestManager = require('./http/RequestManager');

CookieManager = require('./http/CookieManager');

ComponentManager = require('./component/ComponentManager');

ComponentSelector = require('./component/ComponentSelector');

ZIndexManager = require('./component/ZIndexManager');

StoreManager = require('./data/StoreManager');

ProxyManager = require('./data/ProxyManager');

EntityManager = require('./data/EntityManager');

Translator = require('./locale/Translator');

MiwoExtension = (function(_super) {
  __extends(MiwoExtension, _super);

  function MiwoExtension() {
    return MiwoExtension.__super__.constructor.apply(this, arguments);
  }

  MiwoExtension.prototype.init = function() {
    this.setConfig({
      app: {
        namespace: 'App',
        flash: null,
        controllers: {},
        run: []
      },
      templates: {
        baseUrl: '<%baseUrl%>',
        dir: '/dist/templates'
      },
      http: {
        params: {},
        plugins: {
          redirect: require('./http/plugins').RedirectPlugin,
          failure: require('./http/plugins').FailurePlugin,
          error: require('./http/plugins').ErrorPlugin
        }
      },
      cookie: {
        document: null
      },
      data: {
        stores: {},
        entities: {}
      },
      latte: {
        macros: {
          core: require('./latte/CoreMacroSet'),
          component: require('./latte/ComponentMacroSet')
        }
      },
      di: {
        services: {}
      }
    });
  };

  MiwoExtension.prototype.build = function(injector) {
    var name, namespace, service, _ref;
    namespace = window[this.config.app.namespace];
    if (!namespace) {
      namespace = {};
      window[this.config.app.namespace] = namespace;
    }
    if (!namespace.entity) {
      namespace.entity = {};
    }
    if (!namespace.store) {
      namespace.store = {};
    }
    if (!namespace.components) {
      namespace.components = {};
    }
    if (!namespace.controllers) {
      namespace.controllers = {};
    }
    _ref = this.config.di.services;
    for (name in _ref) {
      service = _ref[name];
      injector.setGlobal(name, service);
    }
    injector.define('application', Application, (function(_this) {
      return function(service) {
        return service.runControllers = _this.config.app.run;
      };
    })(this));
    injector.define('flash', FlashNotificator, (function(_this) {
      return function(service) {
        return service.renderer = _this.config.app.flash;
      };
    })(this));
    injector.define('miwo.controllerFactory', ControllerFactory, (function(_this) {
      return function(service) {
        var controller, _ref1;
        service.namespace = _this.config.app.namespace;
        _ref1 = _this.config.app.controllers;
        for (name in _ref1) {
          controller = _ref1[name];
          service.register(name, controller);
        }
      };
    })(this));
    injector.define('miwo.router', Router);
    injector.define('miwo.requestFactory', RequestFactory);
    injector.define('translator', Translator, (function(_this) {
      return function(service) {};
    })(this));
    injector.define('templateFactory', TemplateFactory, (function(_this) {
      return function(service) {};
    })(this));
    injector.define('templateLoader', TemplateLoader, (function(_this) {
      return function(service) {
        service.baseUrl = _this.config.templates.baseUrl;
        service.templatesDir = _this.config.templates.dir;
      };
    })(this));
    injector.define('latteFactory', LatteFactory, (function(_this) {
      return function(service) {};
    })(this));
    injector.define('latteCompiler', LatteCompiler, (function(_this) {
      return function(service) {
        var macroSet, macroSetClass, _ref1;
        _ref1 = _this.config.latte.macros;
        for (name in _ref1) {
          macroSetClass = _ref1[name];
          macroSet = new macroSetClass();
          macroSet.install(service);
        }
      };
    })(this));
    injector.define('http', RequestManager, (function(_this) {
      return function(service) {
        var plugin, _ref1;
        service.params = _this.config.http.params;
        _ref1 = _this.config.http.plugins;
        for (name in _ref1) {
          plugin = _ref1[name];
          service.register(name, new plugin());
        }
      };
    })(this));
    injector.define('cookie', CookieManager, (function(_this) {
      return function(service) {
        if (_this.config.cookie.document) {
          service.document = _this.config.cookie.document;
        }
      };
    })(this));
    injector.define('componentMgr', ComponentManager);
    injector.define('componentSelector', ComponentSelector);
    injector.define('zIndexMgr', ZIndexManager);
    injector.define('storeMgr', StoreManager, (function(_this) {
      return function(service) {
        var store, _ref1, _results;
        _ref1 = _this.config.data.stores;
        _results = [];
        for (name in _ref1) {
          store = _ref1[name];
          service.define(name, store);
          _results.push(namespace.store[name.capitalize()] = store);
        }
        return _results;
      };
    })(this));
    injector.define('entityMgr', EntityManager, (function(_this) {
      return function(service) {
        var entity, _ref1, _results;
        _ref1 = _this.config.data.entities;
        _results = [];
        for (name in _ref1) {
          entity = _ref1[name];
          service.define(name, entity);
          _results.push(namespace.entity[name.capitalize()] = entity);
        }
        return _results;
      };
    })(this));
    injector.define('proxyMgr', ProxyManager, (function(_this) {
      return function(service) {
        var entity, _ref1, _results;
        _ref1 = _this.config.data.entities;
        _results = [];
        for (name in _ref1) {
          entity = _ref1[name];
          if (entity.proxy) {
            service.define(name, entity.proxy);
            _results.push(entity.proxy = name);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
    })(this));
  };

  return MiwoExtension;

})(InjectorExtension);

module.exports = MiwoExtension;


},{"./app/Application":3,"./app/ControllerFactory":5,"./app/FlashNotificator":7,"./app/RequestFactory":9,"./app/Router":10,"./component/ComponentManager":15,"./component/ComponentSelector":16,"./component/ZIndexManager":18,"./data/EntityManager":27,"./data/ProxyManager":31,"./data/StoreManager":36,"./di/InjectorExtension":42,"./http/CookieManager":46,"./http/RequestManager":49,"./http/plugins":51,"./latte/ComponentMacroSet":53,"./latte/CoreMacroSet":54,"./latte/LatteCompiler":56,"./latte/LatteFactory":57,"./locale/Translator":65,"./templates/TemplateFactory":68,"./templates/TemplateLoader":69}],3:[function(require,module,exports){
var Application, EventManager, MiwoObject,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

EventManager = require('./EventManager');

Application = (function(_super) {
  __extends(Application, _super);

  Application.inject = ['injector', 'miwo.controllerFactory'];

  Application.prototype.injector = null;

  Application.prototype.eventMgr = null;

  Application.prototype.componentMgr = null;

  Application.prototype.controllerFactory = null;

  Application.prototype.viewport = null;

  Application.prototype.rendered = false;

  Application.prototype.controllers = null;

  Application.prototype.runControllers = null;

  function Application(config) {
    this.controllers = {};
    this.eventMgr = new EventManager();
    Application.__super__.constructor.call(this, config);
    return;
  }

  Application.prototype.setInjector = function(injector) {
    this.injector = injector;
    if (!injector.has('viewport')) {
      throw new Error("Missing 'viewport' service. Viewport is required to render your application");
    }
  };

  Application.prototype.run = function(render) {
    var name, _i, _len, _ref;
    if (render == null) {
      render = null;
    }
    _ref = this.runControllers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      this.getController(name).startup();
    }
    if (render) {
      this.render(render);
    }
  };

  Application.prototype.render = function(target) {
    var controller, name, viewport, _ref, _ref1;
    if (target == null) {
      target = null;
    }
    if (!this.rendered) {
      this.rendered = true;
      viewport = this.getViewport();
      _ref = this.controllers;
      for (name in _ref) {
        controller = _ref[name];
        controller.beforeRender();
      }
      viewport.render(target || miwo.body);
      _ref1 = this.controllers;
      for (name in _ref1) {
        controller = _ref1[name];
        controller.afterRender();
      }
      window.onhashchange = this.executeRequestByHash.bind(this);
      this.executeRequestByHash();
    }
  };

  Application.prototype.getController = function(name) {
    if (!this.controllers[name]) {
      this.controllers[name] = this.controllerFactory.create(name);
      this.controllers[name].application = this;
    }
    return this.controllers[name];
  };

  Application.prototype.control = function(target, events) {
    if (Type.isString(target)) {
      this.eventMgr.control(target, events);
    } else {
      target.on(events);
    }
  };

  Application.prototype.getViewport = function() {
    return this.injector.get('viewport');
  };

  Application.prototype.getRouter = function() {
    return this.injector.get('miwo.router');
  };

  Application.prototype.execute = function(request) {
    this.getController(request.controller).execute(request);
  };

  Application.prototype.forward = function(request) {
    setTimeout((function(_this) {
      return function() {
        return _this.execute(request);
      };
    })(this));
  };

  Application.prototype.redirect = function(request) {
    document.location.hash = this.getRouter().constructHash(request);
  };

  Application.prototype.executeRequestByHash = function() {
    var constructedHash, hash, request;
    hash = document.location.hash.substr(1).toLowerCase();
    if (!hash) {
      return;
    }
    request = this.getRouter().constructRequest(hash);
    constructedHash = this.getRouter().constructHash(request);
    if (this.autoCanonicalize && constructedHash !== hash) {
      document.location.hash = constructedHash;
      return;
    }
    this.execute(request);
  };

  return Application;

})(MiwoObject);

module.exports = Application;


},{"../core/Object":22,"./EventManager":6}],4:[function(require,module,exports){
var Controller,
  __slice = [].slice;

Controller = (function() {
  function Controller() {}

  Controller.prototype.injector = null;

  Controller.prototype.application = null;

  Controller.prototype.request = null;

  Controller.service = function(prop, service) {
    if (service == null) {
      service = null;
    }
    Object.defineProperty(this.prototype, prop, {
      get: function() {
        return this.injector.get(service || prop);
      }
    });
  };

  Controller.prototype.startup = function() {};

  Controller.prototype.beforeRender = function() {};

  Controller.prototype.afterRender = function() {};

  Controller.prototype.control = function(target, events) {
    this.application.control(target, this.boundEvents(events));
  };

  Controller.prototype.getViewport = function() {
    return this.application.getViewport();
  };

  Controller.prototype.setInjector = function(injector) {
    this.injector = injector;
  };

  Controller.prototype.boundEvents = function(events) {
    var callback, name;
    for (name in events) {
      callback = events[name];
      events[name] = this.boundEvent(callback);
    }
    return events;
  };

  Controller.prototype.boundEvent = function(callback) {
    return (function(_this) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (Type.isString(callback)) {
          return _this[callback].apply(_this, args);
        } else {
          return callback.apply(_this, args);
        }
      };
    })(this);
  };

  Controller.prototype.forward = function(code, params) {
    this.request.executed = true;
    this.application.forward(this.createRequest(code, params));
  };

  Controller.prototype.redirect = function(code, params) {
    this.request.executed = true;
    this.application.redirect(this.createRequest(code, params));
  };

  Controller.prototype.createRequest = function(code, params) {
    return this.injector.get('miwo.requestFactory').create(code, params, {
      name: this.name,
      action: this.action
    });
  };

  Controller.prototype.execute = function(request) {
    this.request = request;
  };

  return Controller;

})();

module.exports = Controller;


},{}],5:[function(require,module,exports){
var Controller, ControllerFactory;

Controller = require('./Controller');

ControllerFactory = (function() {
  ControllerFactory.inject = ['injector'];

  ControllerFactory.prototype.injector = null;

  ControllerFactory.prototype.namespace = 'App';

  ControllerFactory.prototype.controllers = null;

  function ControllerFactory() {
    this.controllers = {};
  }

  ControllerFactory.prototype.register = function(name, klass) {
    this.controllers[name] = klass;
    return this;
  };

  ControllerFactory.prototype.create = function(name) {
    var controller, e, klass, klassName;
    klassName = this.formatClassName(name);
    try {
      klass = eval(klassName);
    } catch (_error) {
      e = _error;
      throw new Error("Controller class " + klassName + " is bad defined");
    }
    if (typeof klass !== 'function') {
      throw new Error("Controller class " + klassName + " is not constructor");
    }
    controller = this.injector.createInstance(klass);
    controller.setInjector(this.injector);
    if (!(controller instanceof Controller)) {
      throw new Error("Controller " + klassName + " is not instance of Controller");
    }
    return controller;
  };

  ControllerFactory.prototype.formatClassName = function(name) {
    if (this.controllers[name]) {
      return this.controllers[name];
    } else {
      return this.namespace + '.controllers.' + name.capitalize() + 'Controller';
    }
  };

  return ControllerFactory;

})();

module.exports = ControllerFactory;


},{"./Controller":4}],6:[function(require,module,exports){
var EventManager, MiwoObject,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

EventManager = (function(_super) {
  __extends(EventManager, _super);

  EventManager.prototype.selectors = null;

  function EventManager() {
    EventManager.__super__.constructor.call(this);
    this.selectors = [];
    miwo.componentMgr.on("register", this.bound("onRegister"));
    miwo.componentMgr.on("unregister", this.bound("onUnregister"));
    return;
  }

  EventManager.prototype.control = function(selector, events) {
    this.selectors.push({
      selector: selector,
      events: events
    });
  };

  EventManager.prototype.onRegister = function(component) {
    var event, item, name, _i, _len, _ref, _ref1;
    _ref = this.selectors;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      if (component.is(item.selector)) {
        _ref1 = item.events;
        for (name in _ref1) {
          event = _ref1[name];
          component.on(name, event);
        }
      }
    }
  };

  EventManager.prototype.onUnregister = function(component) {
    var event, item, name, _i, _len, _ref, _ref1;
    _ref = this.selectors;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      if (component.is(item.selector)) {
        _ref1 = item.events;
        for (name in _ref1) {
          event = _ref1[name];
          component.un(name, event);
        }
      }
    }
  };

  EventManager.prototype.doDestroy = function() {
    miwo.componentMgr.un("register", this.bound("onRegister"));
    miwo.componentMgr.un("unregister", this.bound("onUnregister"));
  };

  return EventManager;

})(MiwoObject);

module.exports = EventManager;


},{"../core/Object":22}],7:[function(require,module,exports){
var FlashNotificator;

FlashNotificator = (function() {
  FlashNotificator.prototype.renderer = null;

  function FlashNotificator() {
    this.renderer = function(message, type) {
      if (console) {
        console.log('FLASH:', message, type);
      }
    };
  }

  FlashNotificator.prototype.error = function(message) {
    this.message(message, 'error');
  };

  FlashNotificator.prototype.info = function(message) {
    this.message(message, 'info');
  };

  FlashNotificator.prototype.warning = function(message) {
    this.message(message, 'warning');
  };

  FlashNotificator.prototype.message = function(message, type) {
    if (!this.renderer) {
      return;
    }
    this.renderer(message, type);
  };

  return FlashNotificator;

})();

module.exports = FlashNotificator;


},{}],8:[function(require,module,exports){
var Request;

Request = (function() {
  Request.prototype.isRequest = true;

  Request.prototype.controller = null;

  Request.prototype.action = null;

  Request.prototype.params = null;

  function Request(controller, action, params) {
    this.controller = controller;
    this.action = action;
    if (params == null) {
      params = {};
    }
    this.params = Object.merge({}, params);
  }

  return Request;

})();

module.exports = Request;


},{}],9:[function(require,module,exports){
var Request, RequestFactory;

Request = require('./Request');

RequestFactory = (function() {
  function RequestFactory() {}

  RequestFactory.prototype.codeRe = /(([a-zA-Z]+)\:)?([a-z][a-zA-Z]+)/;

  RequestFactory.prototype.create = function(code, params, defaults) {
    var action, controller, parts;
    parts = code.match(this.codeRe);
    if (!parts) {
      throw new Error("Bad redirect CODE");
    }
    controller = parts[2] !== void 0 ? parts[2] : defaults.name;
    action = parts[3] !== 'this' ? defaults.action : parts[3];
    return new Request(controller, action, params);
  };

  return RequestFactory;

})();

module.exports = RequestFactory;


},{"./Request":8}],10:[function(require,module,exports){
var MiwoObject, Request, Router,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Request = require('./Request');

MiwoObject = require('../core/Object');

Router = (function(_super) {
  __extends(Router, _super);

  function Router() {
    return Router.__super__.constructor.apply(this, arguments);
  }

  Router.prototype.controller = "default";

  Router.prototype.action = "default";

  Router.prototype.constructRequest = function(hash) {
    var action, controller, match, params;
    match = hash.match(/^(([a-zA-Z]*)(\:([a-z][a-zA-Z]+))?(\?(.*))?)?$/);
    controller = match[2] || this.controller;
    action = match[4] || this.action;
    params = (match[6] ? match[6].parseQueryString() : {});
    return new Request(controller, action, params);
  };

  Router.prototype.constructHash = function(request) {
    var hash, query;
    hash = request.controller;
    if ((request.action && request.action !== this.action) || (request.params && Object.getLength(request.params) > 0)) {
      hash += ":" + request.action;
      if (request.params) {
        query = Object.toQueryString(request.params);
        if (query) {
          hash += "?" + query;
        }
      }
    }
    return hash;
  };

  return Router;

})(MiwoObject);

module.exports = Router;


},{"../core/Object":22,"./Request":8}],11:[function(require,module,exports){
module.exports = {
  Application: require('./Application'),
  Controller: require('./Controller'),
  Router: require('./Router'),
  Request: require('./Request'),
  RequestFactory: require('./RequestFactory'),
  FlashNotificator: require('./FlashNotificator'),
  EventManager: require('./EventManager')
};


},{"./Application":3,"./Controller":4,"./EventManager":6,"./FlashNotificator":7,"./Request":8,"./RequestFactory":9,"./Router":10}],12:[function(require,module,exports){
var Configurator, InjectorFactory, MiwoExtension;

InjectorFactory = require('../di/InjectorFactory');

MiwoExtension = require('../MiwoExtension');

Configurator = (function() {
  Configurator.prototype.miwo = null;

  Configurator.prototype.injectorFactory = null;

  function Configurator(miwo) {
    this.miwo = miwo;
    this.injectorFactory = new InjectorFactory();
  }

  Configurator.prototype.createInjector = function() {
    var injector;
    injector = this.injectorFactory.createInjector();
    this.miwo.setInjector(injector);
    return injector;
  };

  Configurator.prototype.setExtension = function(name, extension) {
    this.injectorFactory.setExtension(name, extension);
  };

  Configurator.prototype.setConfig = function(config) {
    this.injectorFactory.setConfig(config);
  };

  return Configurator;

})();

module.exports = Configurator;


},{"../MiwoExtension":2,"../di/InjectorFactory":43}],13:[function(require,module,exports){
var Configurator, Miwo;

Configurator = require('./Configurator');

Miwo = (function() {
  Miwo.service = function(name, service) {
    Object.defineProperty(this.prototype, name, {
      configurable: true,
      get: function() {
        return this.service(service || name);
      }
    });
  };

  Miwo.prototype.body = null;

  Miwo.prototype.baseUrl = '';

  Miwo.prototype.http = Miwo.service('http');

  Miwo.prototype.cookie = Miwo.service('cookie');

  Miwo.prototype.flash = Miwo.service('flash');

  Miwo.prototype.zIndexMgr = Miwo.service('zIndexMgr');

  Miwo.prototype.storeMgr = Miwo.service('storeMgr');

  Miwo.prototype.proxyMgr = Miwo.service('proxyMgr');

  Miwo.prototype.entityMgr = Miwo.service('entityMgr');

  Miwo.prototype.componentMgr = Miwo.service('componentMgr');

  Miwo.prototype.componentSelector = Miwo.service('componentSelector');

  Miwo.prototype.windowMgr = Miwo.service('windowMgr');

  Miwo.prototype.application = Miwo.service('application');

  Miwo.prototype.translator = Miwo.service('translator');

  Miwo.prototype.injector = null;

  Miwo.prototype.extensions = null;

  function Miwo() {
    this.ready((function(_this) {
      return function() {
        return _this.body = document.getElementsByTagName('body')[0];
      };
    })(this));
    this.extensions = {};
  }

  Miwo.prototype.ready = function(callback) {
    window.on('domready', callback);
  };

  Miwo.prototype.tr = function(key) {
    return this.translator.get(key);
  };

  Miwo.prototype.get = function(id) {
    return this.componentMgr.get(id);
  };

  Miwo.prototype.select = function(selector) {
    return this.componentSelector.select(selector);
  };

  Miwo.prototype.selectAll = function(selector) {
    return this.componentSelector.selectAll(selector);
  };

  Miwo.prototype.service = function(name) {
    return this.injector.get(name);
  };

  Miwo.prototype.store = function(name) {
    return this.storeMgr.get(name);
  };

  Miwo.prototype.proxy = function(name) {
    return this.proxyMgr.get(name);
  };

  Miwo.prototype.registerExtension = function(name, extension) {
    this.extensions[name] = extension;
  };

  Miwo.prototype.createConfigurator = function() {
    var configurator, extension, name, _ref;
    configurator = new Configurator(this);
    _ref = this.extensions;
    for (name in _ref) {
      extension = _ref[name];
      configurator.setExtension(name, new extension());
    }
    return configurator;
  };

  Miwo.prototype.setInjector = function(injector) {
    var name, service, _ref;
    this.injector = injector;
    this.baseUrl = injector.params.baseUrl;
    _ref = injector.globals;
    for (name in _ref) {
      service = _ref[name];
      Miwo.service(name, service);
    }
  };

  Miwo.prototype.init = function(onInit) {
    var configurator, injector;
    configurator = this.createConfigurator();
    if (onInit) {
      onInit(configurator);
    }
    injector = configurator.createInjector();
    return injector;
  };

  return Miwo;

})();

module.exports = new Miwo;


},{"./Configurator":12}],14:[function(require,module,exports){
var Component, MiwoObject,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

Component = (function(_super) {
  __extends(Component, _super);

  Component.prototype.isComponent = true;

  Component.prototype.xtype = 'component';

  Component.prototype.id = null;

  Component.prototype.name = null;

  Component.prototype.width = null;

  Component.prototype.height = null;

  Component.prototype.top = null;

  Component.prototype.left = null;

  Component.prototype.right = null;

  Component.prototype.bottom = null;

  Component.prototype.padding = null;

  Component.prototype.margin = null;

  Component.prototype.html = null;

  Component.prototype.styles = null;

  Component.prototype.cls = null;

  Component.prototype.baseCls = "";

  Component.prototype.componentCls = "";

  Component.prototype.container = null;

  Component.prototype.el = "div";

  Component.prototype.contentEl = null;

  Component.prototype.parentEl = null;

  Component.prototype.focusEl = null;

  Component.prototype.rendered = false;

  Component.prototype.rendering = false;

  Component.prototype.autoFocus = false;

  Component.prototype.zIndex = null;

  Component.prototype.zIndexManage = false;

  Component.prototype.focusOnToFront = true;

  Component.prototype.focus = false;

  Component.prototype.visible = true;

  Component.prototype.renderTo = null;

  Component.prototype.template = null;

  Component.prototype.scrollable = false;

  Component.prototype.autoCenter = false;

  Component.prototype.disabled = false;

  Component.prototype._isGeneratedId = false;

  Component.prototype.zIndexMgr = null;

  Component.prototype.componentMgr = null;

  function Component(config) {
    this.beforeInit();
    if (!this.calledBeforeInit) {
      throw new Error("In component " + this + " you forgot call super::beforeInit()");
    }
    Component.__super__.constructor.call(this, config);
    this.doInit();
    if (!this.calledDoInit) {
      throw new Error("In component " + this + " you forgot call super::doInit()");
    }
    miwo.componentMgr.register(this);
    if (this.zIndexManage) {
      miwo.zIndexMgr.register(this);
    }
    this.afterInit();
    if (!this.calledAfterInit) {
      throw new Error("In component " + this + " you forgot call super::afterInit()");
    }
    return;
  }

  Component.prototype.beforeInit = function() {
    this.calledBeforeInit = true;
  };

  Component.prototype.doInit = function() {
    this.calledDoInit = true;
    if (!this.name) {
      this.name = miwo.componentMgr.uniqueName(this.xtype);
    }
    if (!this.id) {
      this.id = miwo.componentMgr.uniqueId();
      this._isGeneratedId = true;
    }
    this.el = this.createElement(this.el);
    if (this.contentEl) {
      this.contentEl = this.createElement(this.contentEl);
      this.contentEl.inject(this.el);
      this.contentEl.addClass("miwo-ct");
    }
    this.focusEl = this.el;
  };

  Component.prototype.afterInit = function() {
    var parent;
    this.calledAfterInit = true;
    if (this.component) {
      parent = this.component;
      delete this.component;
      parent.addComponent(this);
    }
  };

  Component.prototype.createElement = function(options) {
    var tag;
    if (Type.isString(options)) {
      return new Element(options);
    } else {
      tag = options.tag || "div";
      delete options.tag;
      return new Element(tag, options);
    }
  };

  Component.prototype.setId = function(id) {
    this._isGeneratedId = false;
    this.id = id;
    this.el.set("id", id);
  };

  Component.prototype.getName = function() {
    return this.name;
  };

  Component.prototype.getBaseCls = function(suffix) {
    return this.baseCls + (suffix ? "-" + suffix : "");
  };

  Component.prototype.getContentEl = function() {
    return this.contentEl || this.el;
  };

  Component.prototype.getFocusEl = function() {
    return this.focusEl;
  };

  Component.prototype.setParentEl = function(el, position) {
    this.parentEl = (position === "after" || position === "before" ? el.getParent() : el);
    this.el.inject(el, position);
  };

  Component.prototype.getParentEl = function() {
    return this.parentEl;
  };

  Component.prototype.getElement = function(selector) {
    return this.el.getElement(selector);
  };

  Component.prototype.getElements = function(selector) {
    return this.el.getElements(selector);
  };

  Component.prototype.setZIndex = function(zIndex) {
    this.el.setStyle("z-index", zIndex);
    return zIndex + 10;
  };

  Component.prototype.getZIndex = function() {
    return parseInt(this.el.getStyle("z-index"), 10);
  };

  Component.prototype.toFront = function() {
    this.getZIndexManager().bringToFront(this);
  };

  Component.prototype.toBack = function() {
    this.getZIndexManager().sendToBack(this);
  };

  Component.prototype.getZIndexManager = function() {
    if (!this.zIndexMgr) {
      throw new Error("Component " + this.name + " is not managed with zIndexManager");
    }
    return this.zIndexMgr;
  };

  Component.prototype.setDisabled = function(disabled) {
    this.disabled = disabled;
    this.emit("disabled", this, disabled);
  };

  Component.prototype.setFocus = function() {
    this.focus = true;
    this.getFocusEl().setFocus();
  };

  Component.prototype.isFocusable = function() {
    return this.focusEl && this.rendered && this.isVisible();
  };

  Component.prototype.isScrollable = function() {
    if (this.scrollable === null) {
      return this.height || (this.top !== null && this.bottom !== null);
    } else {
      return this.scrollable;
    }
  };

  Component.prototype.isXtype = function(xtype) {
    return this.xtype === xtype;
  };

  Component.prototype.setParent = function(parent, name) {
    if (parent === null && this.container === null && name !== null) {
      this.name = name;
      return this;
    } else if (parent === this.container && name === null) {
      return this;
    }
    if (this.container !== null && parent !== null) {
      throw new Error("Component '" + this.name + "' already has a parent '" + this.container.name + "' and you try set new parent '" + parent.name + "'.");
    }
    if (name) {
      this.name = name;
    }
    if (parent !== null) {
      this.container = parent;
      this.attachedContainer(this.container);
    } else {
      this.detachedContainer(this.container);
      this.container = null;
    }
    return this;
  };

  Component.prototype.getParent = function() {
    return this.container;
  };

  Component.prototype.up = function(selector) {
    return miwo.componentSelector.selectParent(this, selector);
  };

  Component.prototype.is = function(selector) {
    return miwo.componentSelector.is(this, selector);
  };

  Component.prototype.nextSibling = function() {
    return this.getParent().nextSiblingOf(this);
  };

  Component.prototype.previousSibling = function() {
    return this.getParent().previousSiblingOf(this);
  };

  Component.prototype.attachedContainer = function(parent) {};

  Component.prototype.detachedContainer = function(parent) {};

  Component.prototype.hasTemplate = function() {
    return this.template !== null;
  };

  Component.prototype.getTemplate = function() {
    if (this.template && Type.isString(this.template)) {
      this.template = this.createTemplate(this.template);
    }
    return this.template;
  };

  Component.prototype.createTemplate = function(source) {
    var template;
    template = miwo.service('templateFactory').createTemplate();
    template.setSource(source);
    template.setTarget(this.getContentEl());
    template.set("me", this);
    template.set("component", this);
    return template;
  };

  Component.prototype.update = function() {};

  Component.prototype.resetRendered = function(dispose) {
    this.rendered = false;
    this.parentEl = null;
    if (dispose) {
      this.el.empty();
      this.el.dispose();
    }
  };

  Component.prototype.render = function(el, position) {
    var contentEl;
    if (!el && this.renderTo) {
      el = this.renderTo;
    }
    if (this.rendered) {
      return;
    }
    if (position === 'replace') {
      this.el.replaces($(el));
      this.parentEl = this.el.getParent();
    } else {
      if (el && !this.parentEl) {
        this.setParentEl(el, position);
      }
    }
    this.beforeRender();
    if (!this.calledBeforeRender) {
      throw new Error("In component " + this + " you forgot call super::beforeRender()");
    }
    contentEl = this.getElement('[miwo-reference="contentEl"]');
    if (contentEl) {
      this.contentEl = contentEl;
    }
    this.rendering = true;
    this.emit("render", this, this.el);
    this.doRender();
    this.getElements("[miwo-reference]").each((function(_this) {
      return function(el) {
        _this[el.getAttribute("miwo-reference")] = el;
        el.removeAttribute("miwo-reference");
      };
    })(this));
    this.rendered = true;
    this.rendering = false;
    this.calledAfterRender = false;
    this.afterRender();
    if (!this.calledAfterRender) {
      throw new Error("In component " + this + " you forgot call super::afterRender()");
    }
    this.emit("rendered", this, this.getContentEl());
  };

  Component.prototype.replace = function(target) {
    target = target || $(this.id);
    if (target) {
      this.render(target, 'replace');
    }
  };

  Component.prototype.redraw = function() {
    this.resetRendered();
    this.render();
  };

  Component.prototype.beforeRender = function() {
    var el;
    this.calledBeforeRender = true;
    el = this.el;
    el.setVisible(this.visible);
    el.set("miwo-name", this.name);
    el.store("component", this);
    if (!this._isGeneratedId) {
      el.set("id", this.id);
    }
    if (this.cls) {
      el.addClass(this.cls);
    }
    if (this.baseCls) {
      el.addClass(this.baseCls);
    }
    if (this.componentCls) {
      el.addClass(this.componentCls);
    }
    if (this.styles !== null) {
      el.setStyles(this.styles);
    }
    if (this.width !== null) {
      el.setStyle("width", this.width);
    }
    if (this.height !== null) {
      el.setStyle("height", this.height);
    }
    if (this.top !== null) {
      el.setStyle("top", this.top);
    }
    if (this.bottom !== null) {
      el.setStyle("bottom", this.bottom);
    }
    if (this.left !== null) {
      el.setStyle("left", this.left);
    }
    if (this.right !== null) {
      el.setStyle("right", this.right);
    }
    if (this.zIndex !== null) {
      el.setStyle("zIndex", this.zIndex);
    }
    if (this.padding !== null) {
      el.setStyle("padding", this.padding);
    }
    if (this.margin !== null) {
      el.setStyle("margin", this.margin);
    }
    this.componentMgr.beforeRender(this);
  };

  Component.prototype.doRender = function() {
    if (this.template) {
      this.getTemplate().render();
    } else if (this.html) {
      this.getContentEl().set("html", this.html);
    }
    this.getElements("[miwo-reference]").each((function(_this) {
      return function(el) {
        _this[el.getAttribute("miwo-reference")] = el;
        el.removeAttribute("miwo-reference");
      };
    })(this));
  };

  Component.prototype.afterRender = function() {
    this.calledAfterRender = true;
    this.getElements("[miwo-events]").each((function(_this) {
      return function(el) {
        var event, events, parts, _i, _len;
        events = el.getAttribute("miwo-events").split(",");
        for (_i = 0, _len = events.length; _i < _len; _i++) {
          event = events[_i];
          parts = event.split(":", 2);
          if (!_this[parts[1]]) {
            throw new Error("[Component::afterRender] In component " + _this.name + " is undefined callback '" + parts[1] + "' for event '" + parts[0] + "'");
          }
          el.on(parts[0], _this.bound(parts[1]));
        }
        el.removeAttribute("miwo-events");
      };
    })(this));
    this.componentMgr.afterRender(this);
  };

  Component.prototype.setVisible = function(visible) {
    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  };

  Component.prototype.isVisible = function() {
    return this.visible;
  };

  Component.prototype.setSize = function(width, height) {
    if (Type.isObject(width)) {
      height = width.height;
      width = width.width;
    }
    if (height !== void 0 && height !== null) {
      this.height = height;
      this.el.setStyle("height", height);
    }
    if (width !== void 0 && width !== null) {
      this.width = width;
      this.el.setStyle("width", width);
    }
    this.emit("resize", this);
  };

  Component.prototype.getSize = function() {
    return;
    return {
      width: this.el.getWidth(),
      height: this.el.getHeight()
    };
  };

  Component.prototype.setPosition = function(pos) {
    var dsize, size;
    dsize = document.getSize();
    size = this.el.getSize();
    pos.x = Math.max(10, Math.min(pos.x, dsize.x - size.x - 10));
    this.top = pos.y;
    this.left = pos.x;
    this.el.setStyle("top", this.top);
    this.el.setStyle("left", this.left);
  };

  Component.prototype.show = function() {
    if (this.visible) {
      return;
    }
    this.emit("show", this);
    this.render();
    this.doShow();
    this.parentShown(this);
    this.emit("shown", this);
    return this;
  };

  Component.prototype.showAt = function(pos) {
    this.show();
    this.setPosition(pos);
  };

  Component.prototype.doShow = function() {
    var el;
    el = this.el;
    if (this.top !== null) {
      el.setStyle("top", this.top);
    }
    if (this.bottom !== null) {
      el.setStyle("bottom", this.bottom);
    }
    if (this.left !== null) {
      el.setStyle("left", this.left);
    }
    if (this.right !== null) {
      el.setStyle("right", this.right);
    }
    el.show();
    this.visible = true;
    if ((!this.top || !this.left) && this.autoCenter) {
      this.center();
    }
  };

  Component.prototype.parentShown = function(parent) {
    this.emit("parentshown", parent);
  };

  Component.prototype.hide = function() {
    if (!this.visible) {
      return;
    }
    this.emit("hide", this);
    this.doHide();
    this.emit("hiden", this);
    return this;
  };

  Component.prototype.doHide = function() {
    this.visible = false;
    this.el.hide();
  };

  Component.prototype.center = function() {
    if (!this.left) {
      this.el.setStyle("left", (this.parentEl.getWidth() - this.el.getWidth()) / 2);
    }
    if (!this.top) {
      this.el.setStyle("top", (this.parentEl.getHeight() - this.el.getHeight()) / 2);
    }
  };

  Component.prototype.setActive = function(active, newActive) {
    if (active) {
      this.emit("activated", this);
    } else {
      this.emit("deactivated", this);
    }
  };

  Component.prototype.beforeDestroy = function() {
    this.emit("destroy", this);
    if (this.container) {
      this.container.removeComponent(this.name);
    }
    if (this.zIndexManage) {
      miwo.zIndexMgr.unregister(this);
    }
    miwo.componentMgr.unregister(this);
  };

  Component.prototype.doDestroy = function() {
    var _ref;
    if (((_ref = this.template) != null ? _ref.destroy : void 0) != null) {
      this.template.destroy();
    }
    this.el.eliminate("component");
    this.el.destroy();
  };

  Component.prototype.afterDestroy = function() {
    this.emit("destroyed", this);
  };

  return Component;

})(MiwoObject);

module.exports = Component;


},{"../core/Object":22}],15:[function(require,module,exports){
var ComponentManager, MiwoObject,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

ComponentManager = (function(_super) {
  __extends(ComponentManager, _super);

  ComponentManager.prototype.list = null;

  ComponentManager.prototype.names = null;

  ComponentManager.prototype.id = 1;

  function ComponentManager() {
    ComponentManager.__super__.constructor.call(this);
    this.list = {};
    this.names = {};
    return;
  }

  ComponentManager.prototype.uniqueId = function() {
    this.id++;
    return "c" + this.id;
  };

  ComponentManager.prototype.uniqueName = function(group) {
    if (!this.names[group]) {
      this.names[group] = 0;
    }
    this.names[group]++;
    return group + this.names[group];
  };

  ComponentManager.prototype.register = function(comp) {
    if (comp.componentMgr) {
      throw new Error("Component " + comp + " with id " + comp.id + " already exists.");
    }
    comp.componentMgr = this;
    this.list[comp.id] = comp;
    this.emit("register", comp);
  };

  ComponentManager.prototype.unregister = function(comp) {
    if (this.list[comp.id]) {
      delete this.list[comp.id];
      delete comp.componentMgr;
      this.emit("unregister", comp);
    }
  };

  ComponentManager.prototype.beforeRender = function(component) {
    this.emit("beforerender", component);
  };

  ComponentManager.prototype.afterRender = function(component) {
    this.emit("afterrender", component);
  };

  ComponentManager.prototype.get = function(id) {
    return (this.list[id] ? this.list[id] : null);
  };

  return ComponentManager;

})(MiwoObject);

module.exports = ComponentManager;


},{"../core/Object":22}],16:[function(require,module,exports){
var ComponentSelector;

ComponentSelector = (function() {
  function ComponentSelector() {}

  ComponentSelector.prototype.selectParent = function(component, selector) {
    component = this.getParent();
    while (component) {
      if (component.is(selector)) {
        break;
      }
      component = component.getParent();
    }
    return component;
  };

  ComponentSelector.prototype.is = function(component, selector) {
    if (selector.test(/^\#([\w\-]+)/)) {
      return selector.replace(/\#/, "") === component.id;
    } else if (selector) {
      return component.isXtype(selector);
    } else {
      return false;
    }
  };

  ComponentSelector.prototype.select = function(selector, component) {
    if (component == null) {
      component = null;
    }
    throw new Error("Not implemented");
  };

  ComponentSelector.prototype.selectAll = function(selector, component) {
    if (component == null) {
      component = null;
    }
    throw new Error("Not implemented");
  };

  return ComponentSelector;

})();

module.exports = ComponentSelector;


},{}],17:[function(require,module,exports){
var Collection, Component, Container, layout,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

layout = require('../layout');

Component = require('./Component');

Collection = require('../utils/Collection');

Container = (function(_super) {
  __extends(Container, _super);

  function Container() {
    return Container.__super__.constructor.apply(this, arguments);
  }

  Container.prototype.isContainer = true;

  Container.prototype.xtype = 'container';

  Container.prototype.layout = 'auto';

  Container.prototype.components = null;

  Container.prototype.doInit = function() {
    Container.__super__.doInit.call(this);
    this.components = new Collection();
  };

  Container.prototype.addComponent = function(name, component) {
    var error, obj;
    if (!Type.isString(name)) {
      component = name;
      name = component.name;
    }
    if (!name || !name.test(/^[a-zA-Z0-9]+$/)) {
      throw new Error("Component name must be non-empty alphanumeric string, '" + name + "' given.");
    }
    if (this.components.has(name)) {
      throw new Error("Component with name '" + name + "' already exists.");
    }
    obj = this;
    while (true) {
      if (obj === component) {
        throw new Error("Circular reference detected while adding component '" + name + "'.");
      }
      obj = obj.getParent();
      if (obj === null) {
        break;
      }
    }
    this.validateChildComponent(component);
    this.emit("add", this, component);
    try {
      this.components.set(name, component);
      component.setParent(this, name);
    } catch (_error) {
      error = _error;
      this.components.remove(name);
      throw error;
    }
    this.addedComponent(component);
    this.addedComponentDeep(component);
    this.emit("added", this, component);
    if (this.rendered) {
      this.renderComponent(component);
    }
    return component;
  };

  Container.prototype.addedComponent = function(component) {};

  Container.prototype.addedComponentDeep = function(component) {
    if (this.container) {
      this.container.addedComponentDeep(component);
    }
  };

  Container.prototype.removeComponent = function(name) {
    var component;
    if (!this.components.has(name)) {
      throw new Error("Component named '" + name + "' is not located in this container.");
    }
    component = this.components.get(name);
    this.emit("remove", this, component);
    component.setParent(null);
    this.components.remove(name);
    this.removedComponent(component);
    this.removedComponentDeep(component);
    this.emit("removed", this, component);
  };

  Container.prototype.removedComponent = function(component) {};

  Container.prototype.removedComponentDeep = function(component) {
    var parent;
    parent = this.getParent();
    if (parent) {
      parent.removedComponentDeep(component);
    }
  };

  Container.prototype.getComponent = function(name, need) {
    var ext, pos;
    if (need == null) {
      need = true;
    }
    if (!name) {
      throw new Error("Component or subcomponent name must not be empty string.");
    }
    ext = null;
    pos = name.indexOf("-");
    if (pos > 0) {
      ext = name.substring(pos + 1);
      name = name.substring(0, pos);
    }
    if (name === "parent") {
      if (!ext) {
        return this.component;
      } else {
        return this.component.getComponent(ext, need);
      }
    }
    if (this.components.has(name)) {
      if (!ext) {
        return this.components.get(name);
      } else {
        return this.components.get(name).getComponent(ext, need);
      }
    } else if (need) {
      throw new Error("Component with name '" + name + "' does not exist.");
    }
  };

  Container.prototype.hasComponents = function() {
    return this.components.length > 0;
  };

  Container.prototype.getComponents = function() {
    return this.components;
  };

  Container.prototype.findComponents = function(deep, filters, components) {
    if (deep == null) {
      deep = false;
    }
    if (filters == null) {
      filters = {};
    }
    if (components == null) {
      components = [];
    }
    this.components.each(function(component) {
      var filtered, matched, name, value;
      matched = false;
      for (name in filters) {
        value = filters[name];
        filtered = true;
        if (component[name] === value) {
          matched = true;
          break;
        }
      }
      if (!filtered || matched) {
        matched = true;
        components.push(component);
      }
      if (component.isContainer && deep) {
        component.findComponents(deep, filters, components);
      }
    });
    return components;
  };

  Container.prototype.validateChildComponent = function(child) {};

  Container.prototype.firstChild = function() {
    return this.components.getFirst();
  };

  Container.prototype.lastChild = function() {
    return this.components.getLast();
  };

  Container.prototype.nextSiblingOf = function(component) {
    var index;
    index = this.components.indexOf(component);
    return (index + 1 < this.components.length ? this.components.getAt(index + 1) : null);
  };

  Container.prototype.previousSiblingOf = function(component) {
    var index;
    index = this.components.indexOf(component);
    return (index > 0 ? this.components.getAt(index - 1) : null);
  };

  Container.prototype.select = function(selector) {
    if (selector == null) {
      selector = "*";
    }
    return miwo.componentSelector.select(selector, this);
  };

  Container.prototype.selectAll = function(selector) {
    if (selector == null) {
      selector = "*";
    }
    return miwo.componentSelector.selectAll(selector, this);
  };

  Container.prototype.child = function(selector) {
    if (selector == null) {
      selector = "*";
    }
    return this.select("> " + selector);
  };

  Container.prototype.down = function(selector) {
    return this.select(selector);
  };

  Container.prototype.get = function(name, need) {
    return this.getComponent(name, need);
  };

  Container.prototype.add = function(name, component) {
    return this.addComponent(name, component);
  };

  Container.prototype.remove = function(name) {
    return this.removeComponent(name);
  };

  Container.prototype.setFocus = function() {
    Container.__super__.setFocus.call(this);
    this.focusedParent(this);
  };

  Container.prototype.focusedParent = function(parent) {
    this.components.each(function(component) {
      if (component.autoFocus) {
        component.setFocus();
      } else if (component.isContainer) {
        component.focusedParent(parent);
      }
    });
  };

  Container.prototype.update = function() {
    if (this.layout && this.layout instanceof layout.Layout) {
      this.layout.update();
    }
  };

  Container.prototype.hasLayout = function() {
    return this.layout !== null;
  };

  Container.prototype.setLayout = function(object) {
    if (object == null) {
      object = null;
    }
    if (this.layout && this.layout instanceof layout.Layout && !object) {
      this.layout.setContainer(null);
      this.layout = null;
    }
    if (object) {
      this.layout = object;
      this.layout.setContainer(this);
      this.layout.initLayout();
    }
  };

  Container.prototype.getLayout = function() {
    if (Type.isString(this.layout)) {
      this.setLayout(layout.createLayout(this.layout));
    }
    return this.layout;
  };

  Container.prototype.resetRendered = function(dispose) {
    Container.__super__.resetRendered.apply(this, arguments);
    this.components.each(function(component) {
      return component.resetRendered(dispose);
    });
  };

  Container.prototype.doRender = function() {
    Container.__super__.doRender.call(this);
    this.renderContainer();
    this.components.each((function(_this) {
      return function(component) {
        if (!component.rendered) {
          return _this.renderComponent(component);
        }
      };
    })(this));
    if (this.layout) {
      this.getLayout().render();
    }
  };

  Container.prototype.renderContainer = function() {
    var component, el, parent, skipElement, topComponentEls, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    topComponentEls = [];
    _ref = this.getElements("[miwo-component]");
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      skipElement = false;
      if (topComponentEls.contains(el)) {
        skipElement = true;
      } else {
        _ref1 = el.getParents('[miwo-component]');
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          parent = _ref1[_j];
          if (topComponentEls.contains(parent)) {
            skipElement = true;
            continue;
          }
        }
      }
      if (!skipElement) {
        topComponentEls.push(el);
      }
    }
    for (_k = 0, _len2 = topComponentEls.length; _k < _len2; _k++) {
      el = topComponentEls[_k];
      component = this.get(el.getAttribute("miwo-component"), true);
      el.removeAttribute('miwo-component');
      component.el = el;
      component.parentEl = this.getContentEl();
      component.render();
    }
  };

  Container.prototype.renderComponent = function(component) {
    component.render(this.getContentEl());
  };

  Container.prototype.parentShown = function(parent) {
    Container.__super__.parentShown.call(this, parent);
    this.components.each(function(component) {
      component.parentShown(parent);
    });
  };

  Container.prototype.removeAllComponents = function() {
    this.components.each((function(_this) {
      return function(component, name) {
        _this.removeComponent(name);
        component.destroy();
      };
    })(this));
  };

  Container.prototype.doDestroy = function() {
    this.removeAllComponents();
    if (this.hasLayout()) {
      this.setLayout(null);
    }
    return Container.__super__.doDestroy.call(this);
  };

  return Container;

})(Component);

module.exports = Container;


},{"../layout":64,"../utils/Collection":70,"./Component":14}],18:[function(require,module,exports){
var MiwoObject, Overlay, ZIndexManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

Overlay = require('../utils/Overlay');

ZIndexManager = (function(_super) {
  __extends(ZIndexManager, _super);

  ZIndexManager.prototype.zIndexBase = 10000;

  ZIndexManager.prototype.zIndex = 0;

  ZIndexManager.prototype.list = {};

  ZIndexManager.prototype.stack = [];

  ZIndexManager.prototype.front = null;

  ZIndexManager.prototype.overlay = null;

  function ZIndexManager() {
    ZIndexManager.__super__.constructor.call(this);
    this.zIndex = this.zIndexBase;
  }

  ZIndexManager.prototype.register = function(comp) {
    if (comp.zIndexMgr) {
      comp.zIndexMgr.unregister(comp);
    }
    comp.zIndexMgr = this;
    this.list[comp.id] = comp;
    this.stack.push(comp);
    comp.on("hide", this.bound("onComponentHide"));
  };

  ZIndexManager.prototype.unregister = function(comp) {
    if (this.list[comp.id]) {
      comp.un("hide", this.bound("onComponentHide"));
      delete this.list[comp.id];
      this.stack.erase(comp);
      delete comp.zIndexMgr;
      if (this.front === comp) {
        this.activateLast();
      }
    }
  };

  ZIndexManager.prototype.get = function(id) {
    return (id.isComponent ? id : this.list[id]);
  };

  ZIndexManager.prototype.getActive = function() {
    return this.front;
  };

  ZIndexManager.prototype.onComponentHide = function() {
    this.activateLast();
  };

  ZIndexManager.prototype.actualize = function() {
    this.zIndex = this.setZIndexies(this.zIndexBase);
  };

  ZIndexManager.prototype.setZIndexies = function(zIndex) {
    var comp, _i, _len, _ref;
    _ref = this.stack;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      comp = _ref[_i];
      zIndex = comp.setZIndex(zIndex);
    }
    this.activateLast();
    return zIndex;
  };

  ZIndexManager.prototype.setActiveChild = function(comp, oldFront) {
    if (comp !== this.front) {
      if (this.front && !this.front.destroying) {
        this.front.setActive(false, comp);
      }
      this.front = comp;
      if (comp && comp !== oldFront) {
        if (comp.focusOnToFront) {
          comp.setFocus();
        }
        comp.setActive(true);
        if (comp.modal) {
          this.showOverlay(comp);
        }
      }
    }
  };

  ZIndexManager.prototype.activateLast = function() {
    var comp, index;
    index = this.stack.length - 1;
    while (index >= 0 && !this.stack[index].isVisible()) {
      index--;
    }
    if (index >= 0) {
      comp = this.stack[index];
      this.setActiveChild(comp, this.front);
      if (comp.modal) {
        return;
      }
    } else {
      if (this.front) {
        this.front.setActive(false);
      }
      this.front = null;
    }
    while (index >= 0) {
      comp = this.stack[index];
      if (comp.isVisible() && comp.modal) {
        this.showOverlay(comp);
        return;
      }
      index--;
    }
    this.hideOverlay();
  };

  ZIndexManager.prototype.showOverlay = function(comp) {
    if (!this.overlay) {
      this.overlay = new Overlay(miwo.body);
      this.overlay.on('click', (function(_this) {
        return function() {
          if (_this.front) {
            _this.front.setFocus(true);
            if (_this.front.onOverlayClick) {
              _this.front.onOverlayClick();
            }
          }
        };
      })(this));
    }
    this.overlay.setZIndex(comp.getZIndex() - 1);
    this.overlay.open();
  };

  ZIndexManager.prototype.hideOverlay = function() {
    if (this.overlay) {
      this.overlay.close();
    }
  };

  ZIndexManager.prototype.bringToFront = function(comp) {
    var changed;
    changed = false;
    comp = this.get(comp);
    if (comp !== this.front) {
      this.stack.erase(comp);
      this.stack.push(comp);
      this.actualize();
      this.front = comp;
      changed = true;
    }
    if (changed && comp.modal) {
      this.showOverlay(comp);
    }
    return changed;
  };

  ZIndexManager.prototype.sendToBack = function(comp) {
    comp = this.get(comp);
    this.stack.erase(comp);
    this.stack.unshift(comp);
    this.actualize();
    return comp;
  };

  ZIndexManager.prototype.doDestroy = function() {
    var id;
    if (this.overlay) {
      this.overlay.destroy();
      delete this.overlay;
    }
    for (id in this.list) {
      this.unregister(this.get(id));
    }
    delete this.front;
    delete this.stack;
    delete this.list;
    ZIndexManager.__super__.doDestroy.call(this);
  };

  return ZIndexManager;

})(MiwoObject);

module.exports = ZIndexManager;


},{"../core/Object":22,"../utils/Overlay":72}],19:[function(require,module,exports){
module.exports = {
  Component: require('./Component'),
  Container: require('./Container')
};


},{"./Component":14,"./Container":17}],20:[function(require,module,exports){
var EventShortcuts;

Element.Properties.cls = {
  get: function() {
    return this.get("class");
  },
  set: function(v) {
    return this.set("class", v);
  },
  erase: function() {
    this.erase("class");
  }
};

Element.Properties.parent = {
  get: function() {
    return this.getParent();
  },
  set: function(p) {
    if (p) {
      this.inject(p);
    }
  }
};

Element.Properties.children = {
  get: function() {
    return this.getChildren();
  },
  set: function(value) {
    this.adopt(value);
  }
};

Element.Properties.location = {
  set: function(l) {
    if (l[0] !== null) {
      this.setStyle("top", l[0]);
    }
    if (l[1] !== null) {
      this.setStyle("right", l[1]);
    }
    if (l[2] !== null) {
      this.setStyle("bottom", l[2]);
    }
    if (l[3] !== null) {
      this.setStyle("left", l[3]);
    }
  }
};

Element.Properties.on = {
  set: function(o) {
    this.addEvents(o);
  }
};

Element.implement({
  isDisplayed: function() {
    return this.getStyle('display') !== 'none';
  },
  isVisible: function() {
    var h, w;
    w = this.offsetWidth;
    h = this.offsetHeight;
    if (w === 0 && h === 0) {
      return false;
    } else if (w > 0 && h > 0) {
      return true;
    } else {
      return this.style.display !== 'none';
    }
  },
  toggle: function() {
    return this[this.isDisplayed() ? 'hide' : 'show']();
  },
  hide: function() {
    var d, e;
    try {
      d = this.getStyle('display');
    } catch (_error) {
      e = _error;
    }
    if (d === 'none') {
      return this;
    }
    return this.store('element:_originalDisplay', d || '').setStyle('display', 'none');
  },
  show: function(display) {
    if (!display && this.isDisplayed()) {
      return this;
    }
    display = display || this.retrieve('element:_originalDisplay') || 'block';
    return this.setStyle('display', display === 'none' ? 'block' : display);
  },
  setVisible: function(visible) {
    this[(visible ? "show" : "hide")]();
  },
  toggleClass: function(cls, toggled) {
    if (toggled === true || toggled === false) {
      if (toggled === true) {
        if (!this.hasClass(cls)) {
          this.addClass(cls);
        }
      } else {
        if (this.hasClass(cls)) {
          this.removeClass(cls);
        }
      }
    } else {
      if (this.hasClass(cls)) {
        this.removeClass(cls);
      } else {
        this.addClass(cls);
      }
    }
    return this;
  },
  swapClass: function(remove, add) {
    return this.removeClass(remove).addClass(add);
  },
  getIndex: function(query) {
    return this.getAllPrevious(query).length;
  },
  setFocus: function(tabIndex) {
    this.setAttribute("tabIndex", tabIndex || 0);
    this.focus();
  },
  setClass: function(cls, enabled) {
    if (enabled) {
      if (!this.hasClass(cls)) {
        this.addClass(cls);
      }
    } else {
      if (this.hasClass(cls)) {
        this.removeClass(cls);
      }
    }
  }
});

EventShortcuts = {
  emit: function(type, args, delay) {
    return this.fireEvent(type, args, delay);
  },
  on: function(type, fn) {
    if (Type.isString(type)) {
      return this.addEvent(type, fn);
    } else {
      return this.addEvents(type);
    }
  },
  un: function(type, fn) {
    if (Type.isString(type)) {
      return this.removeEvent(type, fn);
    } else {
      return this.removeEvents(type);
    }
  }
};

Object.append(window, EventShortcuts);

Object.append(document, EventShortcuts);

Request.implement(EventShortcuts);

Events.implement(EventShortcuts);

Element.implement(EventShortcuts);

Function.prototype.getter = function(prop, getter) {
  Object.defineProperty(this.prototype, prop, {
    get: getter,
    configurable: true
  });
};

Function.prototype.setter = function(prop, setter) {
  Object.defineProperty(this.prototype, prop, {
    set: setter,
    configurable: true
  });
};

Function.prototype.property = function(prop, def) {
  Object.defineProperty(this.prototype, prop, def);
};


},{}],21:[function(require,module,exports){
var Events, NativeEvents,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

NativeEvents = require('events');

Events = (function(_super) {
  __extends(Events, _super);

  Events.prototype.managedListeners = null;

  Events.prototype.managedRelays = null;

  Events.prototype.bounds = null;

  function Events() {
    this.managedListeners = [];
    this.managedRelays = [];
    this.bounds = {};
  }

  Events.prototype.bound = function(name) {
    if (!this.bounds[name]) {
      if (!this[name]) {
        throw new Error("Method " + name + " is undefined in object " + this);
      }
      this.bounds[name] = this[name].bind(this);
    }
    return this.bounds[name];
  };

  Events.prototype.addListener = function(name, listener) {
    if (Type.isString(listener)) {
      listener = this.bound(listener);
    }
    Events.__super__.addListener.call(this, name, listener);
  };

  Events.prototype.addListeners = function(listeners) {
    var listener, name;
    for (name in listeners) {
      listener = listeners[name];
      this.addListener(name, listener);
    }
  };

  Events.prototype.removeListener = function(name, listener) {
    if (Type.isString(listener)) {
      listener = this.bound(listener);
    }
    Events.__super__.removeListener.call(this, name, listener);
  };

  Events.prototype.removeListeners = function(name) {
    this.removeAllListeners(name);
  };

  Events.prototype.on = function(name, listener) {
    if (Type.isObject(name)) {
      this.addListeners(name);
    } else {
      this.addListener(name, listener);
    }
  };

  Events.prototype.un = function(name, listener) {
    var l, n;
    if (listener) {
      this.removeListener(name, listener);
    } else {
      if (Type.isObject(name)) {
        for (n in name) {
          l = name[n];
          this.removeListener(n, l);
        }
      } else {
        this.removeListeners(name);
      }
    }
  };

  Events.prototype.addManagedListener = function(object, name, listener) {
    if (Type.isString(listener)) {
      listener = this.bound(listener);
    }
    object.on(name, listener);
    this.managedListeners.push({
      object: object,
      name: name,
      listener: listener
    });
  };

  Events.prototype.addManagedListeners = function(object, listeners) {
    var l, n;
    for (n in listeners) {
      l = listeners[n];
      this.addManagedListener(object, n, l);
    }
  };

  Events.prototype.removeManagedListeners = function(object, name, listener) {
    var m, toRemove, _i, _j, _len, _len1, _ref;
    toRemove = [];
    _ref = this.managedListeners;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      m = _ref[_i];
      if (Type.isString(listener)) {
        listener = this.bound(listener);
      }
      if ((!object || m.object === object) && (!name || m.name === name) && (!listener || m.listener === listener)) {
        toRemove.push(m);
      }
    }
    for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
      m = toRemove[_j];
      m.object.un(m.name, m.listener);
      this.managedListeners.erase(m);
    }
  };

  Events.prototype.mon = function(object, name, listener) {
    if (listener) {
      this.addManagedListener(object, name, listener);
    } else {
      this.addManagedListeners(object, name);
    }
  };

  Events.prototype.mun = function(object, name, listener) {
    this.removeManagedListeners(object, name, listener);
  };

  Events.prototype.munon = function(old, obj, name, listener) {
    if (old === obj) {
      return;
    }
    if (old) {
      this.mun(old, name, listener);
    }
    if (obj) {
      this.mon(obj, name, listener);
    }
  };

  Events.prototype._destroyManagedListeners = function() {
    this.removeManagedListeners();
  };

  Events.prototype.relayEvents = function(object, events, prefix) {
    var event, listeners, _i, _len;
    listeners = {};
    prefix = prefix || '';
    for (_i = 0, _len = events.length; _i < _len; _i++) {
      event = events[_i];
      listeners[event] = this.createRelay(event, prefix);
      object.addListener(event, listeners[event]);
    }
    return {
      target: object,
      destroy: function() {
        return object.removeListeners(listeners);
      }
    };
  };

  Events.prototype.createRelay = function(event, prefix) {
    return (function(_this) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        args.unshift(prefix + event);
        return _this.emit.apply(_this, args);
      };
    })(this);
  };

  Events.prototype.addRelay = function(object, events, prefix) {
    var relay;
    relay = this.relayEvents(object, events, prefix);
    this.managedRelays.push({
      object: object,
      relay: relay
    });
  };

  Events.prototype.removeRelay = function(object) {
    var relay, toRemove, _i, _j, _len, _len1, _ref;
    toRemove = [];
    _ref = this.managedRelays;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      relay = _ref[_i];
      if (!object || relay.object === object) {
        toRemove.push(relay);
      }
    }
    for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
      relay = toRemove[_j];
      relay.relay.destroy();
      this.managedRelays.erase(relay);
    }
  };

  Events.prototype.relay = function(object, events, prefix) {
    this.addRelay(object, events, prefix);
  };

  Events.prototype.unrelay = function(object) {
    this.removeRelay(object);
  };

  Events.prototype._destroyManagedRelays = function() {
    this.removeRelay();
  };

  return Events;

})(NativeEvents);

module.exports = Events;


},{"events":1}],22:[function(require,module,exports){
var Events, MiwoObject,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Events = require('./Events');

MiwoObject = (function(_super) {
  __extends(MiwoObject, _super);

  MiwoObject.prototype.isObject = true;

  MiwoObject.prototype.isDestroyed = false;

  MiwoObject.prototype.destroying = false;

  function MiwoObject(config) {
    MiwoObject.__super__.constructor.call(this);
    this.setConfig(config);
    return;
  }

  MiwoObject.prototype.setConfig = function(config) {
    var k, v;
    if (!config) {
      return;
    }
    for (k in config) {
      v = config[k];
      this[k] = v;
    }
  };

  MiwoObject.prototype.set = function(name, value) {
    this[name] = value;
    return this;
  };

  MiwoObject.prototype.destroy = function() {
    if (this.isDestroyed) {
      return;
    }
    this.destroying = true;
    if (this.beforeDestroy) {
      this.beforeDestroy();
    }
    this._callDestroy();
    if (this.doDestroy) {
      this.doDestroy();
    }
    this.destroying = false;
    this.isDestroyed = true;
    if (this.afterDestroy) {
      this.afterDestroy();
    }
  };

  MiwoObject.prototype._callDestroy = function() {
    var method, name;
    for (name in this) {
      method = this[name];
      if (name.indexOf("_destroy") === 0) {
        method.call(this);
      }
    }
  };

  MiwoObject.prototype.toString = function() {
    return this.constructor.name;
  };

  return MiwoObject;

})(Events);

MiwoObject.addMethod = function(name, method) {
  this.prototype[name] = method;
};

module.exports = MiwoObject;


},{"./Events":21}],23:[function(require,module,exports){
var __slice = [].slice;

Type.extend({

  /**
  	  Returns true if the passed value is empty.
  	  The value is deemed to be empty if it is
  	  null
  	  undefined
  	  an empty array
  	  a zero length string (Unless the allowBlank parameter is true)
  	  @param {Mixed} v The value to test
  	  @param {Boolean} allowBlank (optional) true to allow empty strings (defaults to false)
  	  @return {Boolean}
   */
  isEmpty: function(v, allowBlank) {
    return v === null || v === undefined || (Type.isArray(v) && !v.length) || (!allowBlank ? v === "" : false);
  },

  /**
  	  Returns true if the passed value is a JavaScript array, otherwise false.
  	  @param {Mixed} v The value to test
  	  @return {Boolean}
   */
  isArray: function(v) {
    return Object.prototype.toString.call(v) === "[object Array]";
  },

  /**
  	  Returns true if the passed object is a JavaScript date object, otherwise false.
  	  @param {Object} v The object to test
  	  @return {Boolean}
   */
  isDate: function(v) {
    return Object.prototype.toString.call(v) === "[object Date]";
  },

  /**
  	  Returns true if the passed value is a JavaScript Object, otherwise false.
  	  @param {Mixed} v The value to test
  	  @return {Boolean}
   */
  isObject: function(v) {
    return !!v && Object.prototype.toString.call(v) === "[object Object]";
  },

  /**
  	  Returns true if the passed value is a JavaScript 'primitive', a string, number or boolean.
  	  @param {Mixed} v The value to test
  	  @return {Boolean}
   */
  isPrimitive: function(v) {
    return Type.isString(v) || Type.isNumber(v) || Type.isBoolean(v);
  },

  /**
  	  Returns true if the passed value is a number.
  	  @param {Mixed} v The value to test
  	  @return {Boolean}
   */
  isNumber: function(v) {
    return typeof v === "number";
  },

  /**
  	  Returns true if the passed value is a integer
  	  @param {Mixed} n The value to test
  	  @return {Boolean}
   */
  isInteger: function(n) {
    return Type.isNumber(n) && (n % 1 === 0);
  },

  /**
  	  Returns true if the passed value is a float
  	  @param {Mixed} n The value to test
  	  @return {Boolean}
   */
  isFloat: function(n) {
    return Type.isNumber(n) && (/\./.test(n.toString()));
  },

  /**
  	  Returns true if the passed value is a string.
  	  @param {Mixed} v The value to test
  	  @return {Boolean}
   */
  isString: function(v) {
    return typeof v === "string";
  },

  /**
  	  Returns true if the passed value is a boolean.
  	  @param {Mixed} v The value to test
  	  @return {Boolean}
   */
  isBoolean: function(v) {
    return typeof v === "boolean";
  },

  /**
  	  Returns tree if node is iterable
  	  @return {Boolean}
   */
  isIterable: function(j) {
    var i, k;
    i = typeof j;
    k = false;
    if (j && i !== "string") {
      if (i === "function") {
        k = j instanceof NodeList || j instanceof HTMLCollection;
      } else {
        k = true;
      }
    }
    if (k) {
      return j.length !== undefined;
    } else {
      return false;
    }
  },

  /**
  	  Returns true if the passed value is a function.
  	  @param {Mixed} f The value to test
  	  @return {Boolean}
   */
  isFucntion: function(f) {
    return typeof f === "function";
  },
  isInstance: function(o) {
    return this.isObject(o) && o.constructor.name !== 'Object';
  }
});

Object.expand = function() {
  var args, key, obj, original, val, _i, _len;
  original = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  for (_i = 0, _len = args.length; _i < _len; _i++) {
    obj = args[_i];
    if (!obj) {
      continue;
    }
    for (key in obj) {
      val = obj[key];
      if (original[key] === void 0 || original[key] === null) {
        original[key] = obj[key];
      }
    }
  }
  return original;
};

Array.implement({
  insert: function(index, item) {
    this.splice(index, 0, item);
  },
  destroy: function() {
    var item, _i, _len;
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      item = this[_i];
      if (item.destroy) {
        item.destroy();
      }
    }
  }
});


/**
script: array-sortby.js
version: 1.3.0
description: Array.sortBy is a prototype function to sort arrays of objects by a given key.
license: MIT-style
download: http://mootools.net/forge/p/array_sortby
source: http://github.com/eneko/Array.sortBy
 */

(function() {
  var comparer, keyPaths, saveKeyPath, valueOf;
  keyPaths = [];
  saveKeyPath = function(path) {
    keyPaths.push({
      sign: (path[0] === "+" || path[0] === "-" ? parseInt(path.shift() + 1, 0) : 1),
      path: path
    });
  };
  valueOf = function(object, path) {
    var p, ptr, _i, _len;
    ptr = object;
    for (_i = 0, _len = path.length; _i < _len; _i++) {
      p = path[_i];
      ptr = ptr[p];
    }
    return ptr;
  };
  comparer = function(a, b) {
    var aVal, bVal, item, _i, _len;
    for (_i = 0, _len = keyPaths.length; _i < _len; _i++) {
      item = keyPaths[_i];
      aVal = valueOf(a, item.path);
      bVal = valueOf(b, item.path);
      if (aVal > bVal) {
        return item.sign;
      }
      if (aVal < bVal) {
        return -item.sign;
      }
    }
  };
  Array.implement("sortBy", function() {
    var arg, args, _i, _len;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    keyPaths.empty();
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      if (typeOf(arg) === 'array') {
        saveKeyPath(arg);
      } else {
        saveKeyPath(arg.match(/[+-]|[^.]+/g));
      }
    }
    return this.sort(comparer);
  });
})();


},{}],24:[function(require,module,exports){
module.exports = {
  Events: require('./Events'),
  Object: require('./Object')
};


},{"./Events":21,"./Object":22}],25:[function(require,module,exports){
var BaseManager;

BaseManager = (function() {
  BaseManager.prototype.types = null;

  BaseManager.prototype.items = null;

  function BaseManager() {
    this.types = {};
    this.items = {};
  }

  BaseManager.prototype.define = function(name, klass) {
    if (!Type.isFunction(klass)) {
      throw new Error("Bad defined type '" + name + "' in '" + this + "'. Class is not function");
    }
    this.types[name] = klass;
    return this;
  };

  BaseManager.prototype.register = function(name, object) {
    this.items[name] = object;
    return this;
  };

  BaseManager.prototype.unregister = function(name) {
    delete this.items[name];
    return this;
  };

  BaseManager.prototype.has = function(name) {
    return this.items[name] !== void 0;
  };

  BaseManager.prototype.get = function(name) {
    if (!this.items[name]) {
      this.register(name, this.create(name));
    }
    return this.items[name];
  };

  BaseManager.prototype.create = function(name, config) {
    if (!this.types[name]) {
      throw new Error("Undefined type '" + name + "' in " + this);
    }
    return new this.types[name](config);
  };

  BaseManager.prototype.toString = function() {
    return this.constructor.name;
  };

  return BaseManager;

})();

module.exports = BaseManager;


},{}],26:[function(require,module,exports){
var Entity, EntityManager, Record, Store,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Record = require('./Record');

Store = require('./Store');

EntityManager = require('./EntityManager');

Entity = (function(_super) {
  __extends(Entity, _super);

  function Entity() {
    return Entity.__super__.constructor.apply(this, arguments);
  }

  Entity.prototype.collections = null;

  Entity.prototype.entities = null;

  Entity.collection = function(name, config) {
    var ownerName, relatedPrototype;
    if (this.prototype[name]) {
      throw new Error("Property " + name + " is already defined. Please use other collection name");
    }
    if (!this.prototype._collections) {
      this.prototype._collections = {};
    }
    this.prototype._collections[name] = config;
    Object.defineProperty(this.prototype, name, {
      get: function() {
        return this.getCollection(name);
      }
    });
    ownerName = this.prototype.constructor.name;
    relatedPrototype = config.type.prototype;
    if (!relatedPrototype._entities) {
      relatedPrototype._entities = {};
    }
    relatedPrototype._entities[ownerName] = {
      type: this.prototype.constructor
    };
    relatedPrototype['get' + ownerName.capitalize()] = function(callback) {
      this.getEntity(ownerName, callback);
    };
  };

  Entity.prototype.setup = function(data) {
    var collection, config, name, values, _ref, _ref1;
    Entity.__super__.setup.call(this, data);
    if (this._collections) {
      this.collections = {};
      _ref = this._collections;
      for (name in _ref) {
        config = _ref[name];
        this.collections[name] = new Store({
          entity: config.type
        });
      }
      _ref1 = this.collections;
      for (name in _ref1) {
        collection = _ref1[name];
        values = data[name] || [];
        collection.loadData(values);
      }
    }
  };

  Entity.prototype.copy = function(source) {
    Entity.__super__.copy.call(this, source);
  };

  Entity.prototype.getCollection = function(name) {
    return this.collections[name];
  };

  Entity.prototype.getEntity = function(name, callback) {
    if (!this.entities) {
      this.entities = {};
    }
    if (!this.entities[name]) {
      this.entities[name] = new this._entities[name].type();
    }
    this.entities[name].load(this.get(name + 'Id'), callback);
  };

  Entity.prototype.save = function(callback) {
    EntityManager.save(this, callback);
  };

  return Entity;

})(Record);

module.exports = Entity;


},{"./EntityManager":27,"./Record":32,"./Store":34}],27:[function(require,module,exports){
var BaseManager, Entity, EntityManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseManager = require('./BaseManager');

Entity = require('./Entity');

EntityManager = (function(_super) {
  __extends(EntityManager, _super);

  function EntityManager() {
    return EntityManager.__super__.constructor.apply(this, arguments);
  }

  EntityManager.prototype.proxyKlass = null;

  EntityManager.prototype.setProxy = function(proxyKlass) {
    this.proxyKlass = proxyKlass;
    return this;
  };

  EntityManager.prototype.get = function(name) {
    return this.items[name];
  };

  EntityManager.prototype.load = function(entity, id, callback) {};

  EntityManager.prototype.save = function(entity, callback) {};

  EntityManager.prototype.create = function(name, config) {
    var entity;
    if (Type.isString(name)) {
      entity = EntityManager.__super__.create.call(this, name, config);
    } else if (Type.isFunction(name)) {
      entity = new name(config);
    } else {
      throw new Error("Cant create entity, parameter name must by string or function, you put: " + (typeof name));
    }
    return entity;
  };

  EntityManager.prototype.createEntityClass = function(config) {
    var field, klass, obj, _ref;
    klass = (function(_super1) {
      __extends(_Class, _super1);

      function _Class() {
        return _Class.__super__.constructor.apply(this, arguments);
      }

      _Class.prototype.idProperty = config.idProperty;

      return _Class;

    })(Entity);
    _ref = config.fields;
    for (field in _ref) {
      obj = _ref[field];
      klass.field(field, obj);
    }
    return klass;
  };

  return EntityManager;

})(BaseManager);

module.exports = EntityManager;


},{"./BaseManager":25,"./Entity":26}],28:[function(require,module,exports){
var Filter;

Filter = (function() {
  Filter.prototype.name = null;

  Filter.prototype.type = "string";

  Filter.prototype.operation = "=";

  Filter.prototype.value = null;

  Filter.prototype.params = null;

  function Filter(config) {
    if (config == null) {
      config = {};
    }
    Object.expand(this, config);
    if (this.operation === "in" || this.operation === "!in") {
      this.value = this.value.split(",");
    }
    return;
  }

  Filter.prototype.match = function(record) {
    var val;
    if (this.type === "callback") {
      return this.operation(record, this.value);
    } else if (this.type === "string") {
      val = record.get(this.name);
      switch (this.operation) {
        case "=":
          return val === this.value;
        case "!=":
          return val !== this.value;
        case "in":
          return this.value.indexOf(val) >= 0;
        case "!in":
          return this.value.indexOf(val) < 0;
        case "!empty":
          return !!val;
        case "empty":
          return !val;
      }
      return false;
    }
    return null;
  };

  Filter.prototype.toData = function() {
    return {
      name: this.name,
      value: this.value,
      type: this.type,
      operation: this.operation,
      params: JSON.encode(this.params)
    };
  };

  return Filter;

})();

module.exports = Filter;


},{}],29:[function(require,module,exports){
var MiwoObject, Operation, Record,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

Record = require('./Record');

Operation = (function(_super) {
  __extends(Operation, _super);


  /**
  	  @cfg {String} async
  	  Execute this operation asynchronously. Defaults by proxy settings
   */

  Operation.prototype.async = undefined;


  /**
  	  @cfg {String} action
  	  The action being performed by this Operation. Should be one of 'create', 'read', 'update' or 'destroy'.
   */

  Operation.prototype.action = undefined;


  /**
  	  @cfg {Miwo.data.Filter[]} filters
  	  Optional array of filter objects. Only applies to 'read' actions.
   */

  Operation.prototype.filters = undefined;


  /**
  	  @cfg {Miwo.data.Sorter[]} sorters
  	  Optional array of sorter objects. Only applies to 'read' actions.
   */

  Operation.prototype.sorters = undefined;


  /**
  	  @cfg {Number} start
  	  The start index (offset), used in paging when running a 'read' action.
   */

  Operation.prototype.offset = undefined;


  /**
  	  @cfg {Number} limit
  	  The number of records to load. Used on 'read' actions when paging is being used.
   */

  Operation.prototype.limit = undefined;


  /**
  	  @cfg {Object} params
  	  Parameters to pass along with the request when performing the operation.
   */

  Operation.prototype.params = undefined;


  /**
  	  @cfg {Function} callback
  	  Function to execute when operation completed.
  	  @cfg {Ext.data.Model[]} callback.records Array of records.
  	  @cfg {Ext.data.Operation} callback.operation The Operation itself.
  	  @cfg {Boolean} callback.success True when operation completed successfully.
   */

  Operation.prototype.callback = undefined;


  /**
  	  @property {Boolean} started
  	  The start status of this Operation. Use {@link #isStarted}.
  	  @readonly
  	  @private
   */

  Operation.prototype.started = false;


  /**
  	  @property {Boolean} running
  	  The run status of this Operation. Use {@link #isRunning}.
  	  @readonly
  	  @private
   */

  Operation.prototype.running = false;


  /**
  	  @property {Boolean} complete
  	  The completion status of this Operation. Use {@link #isComplete}.
  	  @readonly
  	  @private
   */

  Operation.prototype.complete = false;


  /**
  	  @property {Boolean} success
  	  Whether the Operation was successful or not. This starts as undefined and is set to true
  	  or false by the Proxy that is executing the Operation. It is also set to false by {@link #setException}. Use
  	  {@link #wasSuccessful} to query success status.
  	  @readonly
  	  @private
   */

  Operation.prototype.success = undefined;


  /**
  	  @property {Boolean} exception
  	  The exception status of this Operation. Use {@link #hasException} and see {@link #getError}.
  	  @readonly
  	  @private
   */

  Operation.prototype.exception = false;


  /**
  	  @property {String/Object} error
  	  The error object passed when {@link #setException} was called. This could be any object or primitive.
  	  @private
   */

  Operation.prototype.error = undefined;


  /**
  	  @property {String/Object} error
  	  Error code
  	  @private
   */

  Operation.prototype.code = undefined;


  /**
  	  @cfg {Miwo.data.Record[]} records
   */

  Operation.prototype.records = undefined;


  /**
  	  @property {Object} response
   */

  Operation.prototype.response = undefined;


  /**
  	  @cfg {function} recordFactory
   */

  Operation.prototype.createRecord = undefined;

  function Operation(config) {
    Operation.__super__.constructor.call(this, config);
    if (config.recordFactory) {
      this.createRecord = config.recordFactory;
    } else {
      this.createRecord = function(values) {
        return new Record(values);
      };
    }
    return;
  }


  /**
  	  Set records facotry callback
  	  @param {Function} callback
   */

  Operation.prototype.setRecordFactory = function(callback) {
    this.createRecord = callback;
  };


  /**
  	  Returns response from server (JSON object)
  	  @return {Object}
   */

  Operation.prototype.getResponse = function() {
    return this.response;
  };


  /**
  	  Returns operations records
  	  @return {Miwo.data.Record[]}
   */

  Operation.prototype.getRecords = function() {
    return this.records;
  };


  /**
  	  Returns first record in record set
  	  @return {Miwo.data.Record}
   */

  Operation.prototype.getRecord = function() {
    return (this.records && this.records.length > 0 ? this.records[0] : null);
  };


  /**
  	  Marks the Operation as completed.
   */

  Operation.prototype.setCompleted = function() {
    this.complete = true;
    this.running = false;
  };


  /**
  	  Marks the Operation as successful.
   */

  Operation.prototype.setSuccessful = function() {
    this.success = true;
  };


  /**
  	  Marks the Operation as having experienced an exception. Can be supplied with an option error message/object.
  	  @param {String/Object} error (optional) error string/object
   */

  Operation.prototype.setException = function(error, code) {
    this.exception = true;
    this.success = false;
    this.running = false;
    this.error = error;
    this.code = code;
  };


  /**
  	  Returns true if this Operation encountered an exception (see also {@link #getError})
  	  @return {Boolean} True if there was an exception
   */

  Operation.prototype.hasException = function() {
    return this.exception === true;
  };


  /**
  	  Returns the error string or object that was set using {@link #setException}
  	  @return {String/Object} The error object
   */

  Operation.prototype.getError = function() {
    return this.error;
  };


  /**
  	  Returns code
  	  @return {String/Object} The response code
   */

  Operation.prototype.getCode = function() {
    return this.code;
  };


  /**
  	  Returns true if the Operation has been started. Note that the Operation may have started AND completed, see
  	  {@link #isRunning} to test if the Operation is currently running.
  	  @return {Boolean} True if the Operation has started
   */

  Operation.prototype.isStarted = function() {
    return this.started === true;
  };


  /**
  	  Returns true if the Operation has been started but has not yet completed.
  	  @return {Boolean} True if the Operation is currently running
   */

  Operation.prototype.isRunning = function() {
    return this.running === true;
  };


  /**
  	  Returns true if the Operation has been completed
  	  @return {Boolean} True if the Operation is complete
   */

  Operation.prototype.isComplete = function() {
    return this.complete === true;
  };


  /**
  	  Returns true if the Operation has completed and was successful
  	  @return {Boolean} True if successful
   */

  Operation.prototype.wasSuccessful = function() {
    return this.isComplete() && this.success === true;
  };

  return Operation;

})(MiwoObject);

module.exports = Operation;


},{"../core/Object":22,"./Record":32}],30:[function(require,module,exports){
var MiwoObject, Operation, Proxy,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

Operation = require('./Operation');

Proxy = (function(_super) {
  __extends(Proxy, _super);

  Proxy.prototype.isProxy = true;

  Proxy.prototype.name = void 0;

  Proxy.prototype.headers = null;

  Proxy.prototype.secure = true;

  Proxy.prototype.defaults = null;

  Proxy.prototype.api = null;

  function Proxy(config) {
    this.defaults = {
      timeout: 0,
      async: true
    };
    this.api = {
      create: void 0,
      read: void 0,
      update: void 0,
      destroy: void 0
    };
    if (config.url) {
      this.api.read = this.url;
      delete config.url;
    }
    Proxy.__super__.constructor.call(this, config);
    return;
  }

  Proxy.prototype.setAsync = function(async) {
    this.defaults.async = async;
  };

  Proxy.prototype.execute = function(operations, config) {
    if (operations.destroy) {
      this.executeOperations('destroy', operations.destroy, config);
    }
    if (operations.create) {
      this.executeOperations('create', operations.create, config);
    }
    if (operations.update) {
      this.executeOperations('update', operations.update, config);
    }
  };

  Proxy.prototype.executeOperations = function(action, operations, config) {
    var opc;
    opc = Object.append({}, config);
    Object.append(opc, {
      records: operations.records
    });
    this[action](opc, operations.callback);
  };

  Proxy.prototype.read = function(config, callback) {
    this.doRequest(this.createOperation('read', config), callback);
  };

  Proxy.prototype.create = function(config, callback) {
    this.doRequest(this.createOperation('create', config), callback);
  };

  Proxy.prototype.update = function(config, callback) {
    this.doRequest(this.createOperation('update', config), callback);
  };

  Proxy.prototype.destroy = function(config, callback) {
    this.doRequest(this.createOperation('destroy', config), callback);
  };

  Proxy.prototype.createOperation = function(action, config) {
    var op;
    op = new Operation(config);
    op.action = action;
    return op;
  };

  Proxy.prototype.doRequest = function(operation, callback) {
    var options, request;
    request = miwo.http.createRequest();
    options = Object.merge({}, this.defaults);
    options.method = "POST";
    options.headers = this.headers;
    options.url = this.api[operation.action];
    options.data = this.createRequestData(operation);
    options.onComplete = function() {
      operation.setCompleted();
    };
    options.onRequest = function() {
      operation.running = true;
    };
    options.onSuccess = (function(_this) {
      return function(response) {
        _this.proccessResponse(true, operation, request, response, callback);
      };
    })(this);
    options.onFailure = (function(_this) {
      return function() {
        _this.proccessResponse(false, operation, request, null, callback);
      };
    })(this);
    if (operation.async !== void 0) {
      options.async = operation.async;
    }
    operation.started = true;
    request.setOptions(options);
    request.send();
  };

  Proxy.prototype.createRequestData = function(operation) {
    var data;
    data = {};
    data.action = operation.action;
    switch (operation.action) {
      case "create":
        data.data = this.createOperationData(operation, 'create');
        break;
      case "destroy":
        data.data = this.createOperationData(operation, 'destroy');
        break;
      case "update":
        data.data = this.createOperationData(operation, 'update');
        break;
      case "read":
        if (operation.filters) {
          data.filters = this.createItemsData(operation.filters);
        }
        if (operation.sorters) {
          data.sorters = this.createItemsData(operation.sorters);
        }
        if (operation.offset) {
          data.offset = operation.offset;
        }
        if (operation.limit) {
          data.limit = operation.limit;
        }
        if (operation.params) {
          Object.expand(data, operation.params);
        }
    }
    return data;
  };

  Proxy.prototype.createItemsData = function(items) {
    var data, item, _i, _len;
    data = [];
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      data.push(item.toData());
    }
    return data;
  };

  Proxy.prototype.createOperationData = function(operation, mode) {
    var changes, data, record, _i, _len, _ref;
    if (!operation.getRecords()) {
      throw new Error("operation has no records");
    }
    data = [];
    _ref = operation.getRecords();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      record = _ref[_i];
      if (mode === 'create') {
        data.push(record.getValues());
      } else if (mode === 'update') {
        changes = record.getChanges();
        changes[record.idProperty] = record.getId();
        data.push(changes);
      } else if (mode === 'destroy') {
        data.push(record.getId());
      }
    }
    return JSON.encode(data);
  };

  Proxy.prototype.proccessResponse = function(success, operation, request, response, callback) {
    var xhr;
    if (!success) {
      xhr = request.xhr;
      operation.setException(xhr.responseText, xhr.status);
    } else {
      if (!response.success) {
        operation.setException(response.error, response.code);
      } else {
        operation.setSuccessful();
        operation.response = response;
        this.commitOperation(operation, response.records);
      }
    }
    callback(operation);
  };

  Proxy.prototype.commitOperation = function(operation, records) {
    var data, index, record, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref;
    switch (operation.action) {
      case "create":
        for (index = _i = 0, _len = records.length; _i < _len; index = ++_i) {
          data = records[index];
          record = operation.records[index];
          record.set(data);
          record.commit();
        }
        break;
      case "update":
        for (_j = 0, _len1 = records.length; _j < _len1; _j++) {
          data = records[_j];
          _ref = operation.records;
          for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
            record = _ref[_k];
            if (record.getId() === data.id) {
              record.set(data);
              record.commit();
              break;
            }
          }
        }
        break;
      case "read":
        operation.records = [];
        for (_l = 0, _len3 = records.length; _l < _len3; _l++) {
          data = records[_l];
          record = operation.createRecord(data);
          operation.records.push(record);
        }
    }
  };

  return Proxy;

})(MiwoObject);

module.exports = Proxy;


},{"../core/Object":22,"./Operation":29}],31:[function(require,module,exports){
var BaseManager, Proxy, ProxyManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseManager = require('./BaseManager');

Proxy = require('./Proxy');

ProxyManager = (function(_super) {
  __extends(ProxyManager, _super);

  function ProxyManager() {
    return ProxyManager.__super__.constructor.apply(this, arguments);
  }

  ProxyManager.prototype.define = function(name, klass) {
    if (!Type.isFunction(klass) && !Type.isObject(klass)) {
      throw new Error("Bad defined type '" + name + "' in '" + this + "'. Parameter should by function or object");
    }
    this.types[name] = klass;
    return this;
  };

  ProxyManager.prototype.create = function(name) {
    if (!this.types[name]) {
      throw new Error("Undefined type '" + name + "' in " + this);
    }
    return this.createProxy(this.types[name]);
  };

  ProxyManager.prototype.createProxy = function(config) {
    var proxy;
    if (Type.isFunction(config)) {
      proxy = new config();
    }
    if (Type.isObject(config)) {
      proxy = new Proxy(config);
    }
    if (!proxy.isProxy) {
      throw new Error("Created proxy is not instance of Miwo.data.Proxy");
    }
    return proxy;
  };

  return ProxyManager;

})(BaseManager);

module.exports = ProxyManager;


},{"./BaseManager":25,"./Proxy":30}],32:[function(require,module,exports){
var Events, Record, Types,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Events = require('../core/Events');

Types = require('./Types');

Record = (function(_super) {
  __extends(Record, _super);

  Record.prototype.isRecord = true;

  Record.prototype.idProperty = "id";

  Record.prototype._phantom = false;

  Record.prototype._editing = false;

  Record.prototype._dirty = false;

  Record.prototype._data = null;

  Record.prototype._modified = null;

  Record.prototype._stores = null;

  Record.prototype._store = null;

  Record.prototype._raw = null;

  Record.prototype.fields = null;

  Record.prototype._singleProp = {};

  Record.getter('phantom', function() {
    return this._phantom;
  });

  Record.field = function(name, config) {
    if (this.prototype[name]) {
      throw new Error("Property " + name + " is already used. Please use other field name");
    }
    if (!this.prototype._fields) {
      this.prototype._fields = {};
    }
    this.prototype._fields[name] = config;
    Object.defineProperty(this.prototype, name, {
      get: function() {
        return this.get(name);
      },
      set: function(value) {
        return this.set(name, value);
      }
    });
  };

  function Record(data, source) {
    if (data == null) {
      data = {};
    }
    if (source == null) {
      source = null;
    }
    this._data = {};
    this._stores = [];
    this._raw = data;
    this.fields = {};
    if (!source) {
      this.setup(data);
    } else {
      this.copy(source);
    }
    this._modified = {};
    this._dirty = false;
    this._phantom = !(this.getId() || this.getId() === 0);
    this.init();
    return;
  }

  Record.prototype.init = function() {};

  Record.prototype.setup = function(data) {
    var field, name, type, value, _ref, _ref1;
    _ref = this._fields;
    for (name in _ref) {
      field = _ref[name];
      type = field.type || "string";
      if (!Types[type]) {
        throw new Error("Record::initialize(): undefined type " + type);
      }
      this.fields[name] = Object.merge({}, Types[type], {
        name: name,
        def: (field.def !== void 0 ? field.def : null),
        nullable: (field.nullable !== void 0 ? field.nullable : null),
        persist: (field.persist !== void 0 ? field.persist : true)
      });
    }
    _ref1 = this.fields;
    for (name in _ref1) {
      field = _ref1[name];
      value = data[name];
      if (value === void 0) {
        value = field.def;
      }
      if (field.convert) {
        value = field.convert(value, this);
      }
      if (value !== void 0) {
        this._data[name] = value;
        this.onValueChanged(name, value, null);
      }
    }
  };

  Record.prototype.copy = function(source) {
    this.fields = source.fields;
    this._data = source.data;
  };


  /**
  	  Creates a copy (clone) of this Record instance.
  	  @return {Miwo.data.Record}
   */

  Record.prototype.clone = function(newId) {
    var source;
    source = Object.merge({}, {
      fields: this.fields,
      data: this._data
    });
    source.data[this.idProperty] = newId;
    return new this.constructor(this._raw, source);
  };


  /**
  	  Get value from record
  	  @param name
  	  @returns {mixed}
   */

  Record.prototype.get = function(name) {
    var getter;
    getter = "get" + name.capitalize();
    if (this[getter]) {
      return this[getter]();
    } else {
      return this._data[name];
    }
  };


  /**
  	  Sets the given field to the given value, marks the instance as dirty
  	  @param {String/Object} fieldName The field to set, or an object containing key/value pairs
  	  @param {Object} newValue The value to set
  	  @return {String[]} The array of modified field names or null if nothing was modified.
   */

  Record.prototype.set = function(fieldName, newValue) {
    var currentValue, field, idChanged, modifiedFieldNames, name, newId, oldId, single, value, values;
    single = Type.isString(fieldName);
    if (single) {
      values = this._singleProp;
      values[fieldName] = newValue;
    } else {
      values = fieldName;
    }
    for (name in values) {
      value = values[name];
      if (!this.fields[name]) {
        continue;
      }
      field = this.fields[name];
      if (field.convert) {
        value = field.convert(value, this);
      }
      currentValue = this._data[name];
      if (this.isEqual(currentValue, value)) {
        continue;
      }
      this._data[name] = value;
      this.onValueChanged(name, value, currentValue);
      (modifiedFieldNames || (modifiedFieldNames = [])).push(name);
      if (field.persist) {
        if (this._modified[name]) {
          if (this.isEqual(this._modified[name], value)) {
            delete this._modified[name];
            this._dirty = Object.getLength(this._modified) > 0;
          }
        } else {
          this._dirty = true;
          this._modified[name] = currentValue;
        }
      }
      if (name === this.idProperty) {
        idChanged = true;
        oldId = currentValue;
        newId = value;
      }
    }
    if (single) {
      delete values[fieldName];
    }
    if (idChanged) {
      this.emit("idchanged", this, oldId, newId);
    }
    if (!this._editing && modifiedFieldNames) {
      this.afterEdit(modifiedFieldNames);
    }
    return modifiedFieldNames || null;
  };

  Record.prototype.getId = function() {
    return this._data[this.idProperty];
  };

  Record.prototype.setId = function(id) {
    this.set(this.idProperty, id);
    this._phantom = !(id || id === 0);
  };

  Record.prototype.updating = function(callback) {
    var editing;
    editing = this._editing;
    if (!editing) {
      this.beginEdit();
    }
    callback(this._data);
    if (!editing) {
      this.endEdit();
    }
  };


  /**
  	  Gets all values for each field in this model and returns an object containing the current data.
  	  @return {Object} An object hash containing all the values in this model
   */

  Record.prototype.getValues = function() {
    var field, name, values, _ref;
    values = {};
    _ref = this.fields;
    for (name in _ref) {
      field = _ref[name];
      values[name] = this.get(name);
    }
    return values;
  };

  Record.prototype.beginEdit = function() {
    var key, value, _ref, _ref1;
    if (!this._editing) {
      this._editing = true;
      this._dirtySaved = this._dirty;
      this._dataSaved = {};
      this._modifiedSaved = {};
      _ref = this._data;
      for (key in _ref) {
        value = _ref[key];
        this._dataSaved[key] = value;
      }
      _ref1 = this._modified;
      for (key in _ref1) {
        value = _ref1[key];
        this._modifiedSaved[key] = value;
      }
    }
  };

  Record.prototype.cancelEdit = function() {
    if (this._editing) {
      this._editing = false;
      this._dirty = this._dirtySaved;
      this._data = this._dataSaved;
      this._modified = this._modifiedSaved;
      delete this._dirtySaved;
      delete this._dataSaved;
      delete this._modifiedSaved;
    }
  };

  Record.prototype.endEdit = function(silent, modifiedFieldNames) {
    var changed, data;
    if (silent == null) {
      silent = true;
    }
    if (this._editing) {
      this._editing = false;
      data = this._dataSaved;
      delete this._modifiedSaved;
      delete this._dataSaved;
      delete this._dirtySaved;
      if (!silent) {
        if (!modifiedFieldNames) {
          modifiedFieldNames = this.getModifiedFieldNames(data);
        }
        changed = this._dirty || modifiedFieldNames.length > 0;
        if (changed) {
          this.afterEdit(modifiedFieldNames);
        }
      }
    }
  };

  Record.prototype.getModifiedFieldNames = function(values) {
    var key, modified, value, _ref;
    modified = [];
    _ref = this._data;
    for (key in _ref) {
      value = _ref[key];
      if (!this.isEqual(value, values[key])) {
        modified.push(key);
      }
    }
    return modified;
  };

  Record.prototype.getChanges = function() {
    var changes, name, value, _ref;
    changes = {};
    _ref = this._modified;
    for (name in _ref) {
      value = _ref[name];
      changes[name] = this.get(name);
    }
    return changes;
  };

  Record.prototype.isModified = function(fieldName) {
    return this._modified.hasOwnProperty(fieldName);
  };

  Record.prototype.isEqual = function(a, b) {
    var x;
    if (Type.isObject(a) && Type.isObject(b)) {
      if (Object.getLength(a) !== Object.getLength(b)) {
        return false;
      } else {
        for (x in a) {
          if (b[x] !== a[x]) {
            return false;
          }
        }
        return true;
      }
    } else if (Type.isDate(a) && Type.isDate(b)) {
      return a.getTime() === b.getTime();
    } else {
      return a === b;
    }
  };

  Record.prototype.setDirty = function() {
    var field, name, _ref;
    this._dirty = true;
    _ref = this.fields;
    for (name in _ref) {
      field = _ref[name];
      if (field.persist) {
        this._modified[name] = this.get(name);
      }
    }
  };

  Record.prototype.reject = function(silent) {
    var name, value, _ref;
    if (silent == null) {
      silent = false;
    }
    _ref = this._modified;
    for (name in _ref) {
      value = _ref[name];
      this._data[name] = value;
    }
    this._dirty = false;
    this._editing = false;
    this._modified = {};
    if (!silent) {
      this.afterReject();
    }
  };

  Record.prototype.commit = function(silent) {
    if (silent == null) {
      silent = false;
    }
    this._phantom = this._dirty = this._editing = false;
    this._modified = {};
    if (!silent) {
      this.afterCommit();
    }
  };


  /**
  	  Tells this model instance that it has been added to a store.
  	  @param {Ext.data.Store} store The store to which this model has been added.
   */

  Record.prototype.joinStore = function(store) {
    this._stores.include(store);
    this._store = this._stores[0];
  };


  /**
  	  Tells this model instance that it has been removed from the store.
  	  @param {Ext.data.Store} store The store from which this model has been removed.
   */

  Record.prototype.unjoinStore = function(store) {
    this._stores.erase(store);
    this._store = this._stores[0] || null;
  };

  Record.prototype.isStored = function() {
    return this._store !== null;
  };

  Record.prototype.isPhantom = function() {
    return this._phantom;
  };


  /**
  	  @private
  	  If this Model instance has been {@link #join joined} to a {@link Ext.data.Store store}, the store's
  	  afterEdit method is called
  	  @param {String[]} modifiedFieldNames Array of field names changed during edit.
   */

  Record.prototype.afterEdit = function(modifiedFieldNames) {
    this.emit("edit", this, modifiedFieldNames);
    this.callStore("afterEdit", this, modifiedFieldNames);
  };

  Record.prototype.afterReject = function() {
    this.callStore("afterReject", this);
  };

  Record.prototype.afterCommit = function() {
    this.callStore("afterCommit", this);
  };

  Record.prototype.callStore = function() {
    var args, fn, store, _i, _len, _ref;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    _ref = this._stores;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      store = _ref[_i];
      if (store[fn]) {
        store[fn].apply(store, args);
      }
    }
  };

  Record.prototype.onValueChanged = function(name, value, oldvalue) {};

  return Record;

})(Events);

module.exports = Record;


},{"../core/Events":21,"./Types":38}],33:[function(require,module,exports){
var Sorter;

Sorter = (function() {
  Sorter.prototype.name = null;

  Sorter.prototype.dir = null;

  function Sorter(config) {
    if (config == null) {
      config = {};
    }
    Object.expand(this, config);
  }

  Sorter.prototype.compare = function(a, b) {
    var aVal, bVal, sign;
    if (Type.isFunction(this.dir)) {
      return this.dir(a, b);
    } else {
      aVal = a.get(this.name);
      bVal = b.get(this.name);
      sign = (this.dir === "desc" ? -1 : 1);
      if (Type.isDate(aVal) && Type.isDate(bVal)) {
        if (aVal - bVal > 0) {
          return sign;
        }
        if (aVal - bVal < 0) {
          return -sign;
        }
      } else {
        if (aVal > bVal) {
          return sign;
        }
        if (aVal < bVal) {
          return -sign;
        }
      }
      return null;
    }
  };

  Sorter.prototype.toData = function() {
    return {
      name: this.name,
      dir: this.dir
    };
  };

  return Sorter;

})();

module.exports = Sorter;


},{}],34:[function(require,module,exports){
var MiwoObject, Store, StoreFilters, StoreSorters,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

StoreFilters = require('./StoreFilters');

StoreSorters = require('./StoreSorters');

Store = (function(_super) {
  __extends(Store, _super);

  Store.prototype.isStore = true;

  Store.prototype.name = null;

  Store.prototype.entity = null;

  Store.prototype.fields = null;

  Store.prototype.idProperty = 'id';

  Store.prototype.data = null;

  Store.prototype.newRecords = null;

  Store.prototype.removedRecords = null;

  Store.prototype.updatedRecords = null;

  Store.prototype.autoLoad = false;

  Store.prototype.autoSync = false;

  Store.prototype.autoSyncReload = false;

  Store.prototype.autoSyncSuspended = false;

  Store.prototype.remoteFilter = false;

  Store.prototype.remoteSort = false;

  Store.prototype.proxy = null;

  Store.prototype.storeFilters = null;

  Store.prototype.filteredData = null;

  Store.prototype.filterOnLoad = true;

  Store.prototype.filterOnEdit = true;

  Store.prototype.filtered = false;

  Store.prototype.filter = null;

  Store.getter('filters', function() {
    return this.getFilters();
  });

  Store.prototype.storeSorters = null;

  Store.prototype.sortOnLoad = true;

  Store.prototype.sortOnEdit = true;

  Store.prototype.sort = null;

  Store.getter('sorters', function() {
    return this.getSorters();
  });

  Store.prototype.pageSize = null;

  Store.prototype.loading = false;

  Store.prototype.loaded = false;

  Store.prototype.totalCount = 0;

  Store.prototype.page = 1;

  Store.prototype.params = null;

  function Store(config) {
    var data, proxyMgr;
    if (config == null) {
      config = {};
    }
    Store.__super__.constructor.call(this, config);
    this.newRecords = [];
    this.removedRecords = [];
    this.updatedRecords = [];
    if (config.entity) {
      this.entity = config.entity;
    }
    if (!this.entity && this.fields) {
      this.entity = miwo.entityMgr.createEntityClass({
        fields: this.fields,
        idProperty: this.idProperty
      });
      delete this.fields;
      delete this.idProperty;
    }
    if (!this.entity) {
      throw new Error("Unspecified entity or fields for store " + this);
    }
    if (this.proxy) {
      proxyMgr = miwo.proxyMgr;
      if (Type.isString(this.proxy)) {
        this.proxy = proxyMgr.get(this.proxy);
      } else if (Type.isObject(this.proxy)) {
        this.proxy = proxyMgr.createProxy(this.proxy);
      }
    } else if (this.entity.proxy) {
      proxyMgr = miwo.proxyMgr;
      if (Type.isString(this.entity.proxy)) {
        this.proxy = proxyMgr.get(this.entity.proxy);
      } else if (Type.isObject(this.entity.proxy)) {
        this.proxy = proxyMgr.createProxy(this.entity.proxy);
      }
    }
    if (this.name) {
      if (!miwo.storeMgr.has(this.name)) {
        miwo.storeMgr.register(this.name, this);
      }
    }
    if (this.sort) {
      this.getSorters().set(this.sort);
    }
    if (this.filter) {
      this.getFilters().set(this.filter);
    }
    if (this.data) {
      data = this.data;
      this.data = [];
      this.setData(data);
    } else {
      this.data = [];
    }
    if (this.autoLoad) {
      this.load();
    }
  }

  Store.prototype.getAll = function() {
    return this.data;
  };

  Store.prototype.getLast = function() {
    return this.data.getLast();
  };

  Store.prototype.getFirst = function() {
    return this.data[0];
  };

  Store.prototype.getCount = function() {
    return this.data.length;
  };

  Store.prototype.getAt = function(index) {
    if (index < this.data.length) {
      return this.data[index];
    } else {
      return null;
    }
  };

  Store.prototype.getById = function(id) {
    var rec, _i, _len, _ref;
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      if (rec.id == id) {
        return rec;
      }
    }
    return null;
  };

  Store.prototype.attachRecord = function(rec) {
    rec.joinStore(this);
  };

  Store.prototype.detachRecord = function(rec) {
    rec.unjoinStore(this);
  };

  Store.prototype.isLoading = function() {
    return this.loading;
  };

  Store.prototype.isFiltered = function() {
    return this.filtered;
  };

  Store.prototype.getTotalCount = function() {
    return this.totalCount;
  };

  Store.prototype.getModifiedRecords = function() {
    return [].concat(this.getNewRecords(), this.getUpdatedRecords());
  };

  Store.prototype.getNewRecords = function() {
    return this.newRecords;
  };

  Store.prototype.getRemovedRecords = function() {
    return this.removedRecords;
  };

  Store.prototype.getUpdatedRecords = function() {
    return this.updatedRecords;
  };

  Store.prototype.getRecords = function() {
    if (this.filtered) {
      return this.filteredData;
    } else {
      return this.data;
    }
  };

  Store.prototype.each = function(callback) {
    this.data.each(callback);
  };

  Store.prototype.loadRecords = function(recs, clear) {
    var rec, _i, _len;
    if (clear == null) {
      clear = false;
    }
    if (clear) {
      this.clear();
    }
    for (_i = 0, _len = recs.length; _i < _len; _i++) {
      rec = recs[_i];
      this.data.push(rec);
      this.attachRecord(rec);
    }
    if (this.sortOnLoad && !this.remoteSort && this.storeSorters && this.storeSorters.has()) {
      this.storeSorters.apply(true);
    }
    if (this.filterOnLoad && !this.remoteFilter && this.storeFilters && this.storeFilters.has()) {
      this.storeFilters.apply(true);
    }
    this.emit('datachanged', this);
  };

  Store.prototype.setData = function(data, clear) {
    var records, values, _i, _len;
    records = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      values = data[_i];
      records.push(this.createRecord(values));
    }
    this.loadRecords(records, clear);
  };

  Store.prototype.createRecord = function(values) {
    return miwo.entityMgr.create(this.entity, values);
  };

  Store.prototype.setProxy = function(proxy) {
    this.proxy = proxy;
  };

  Store.prototype.getProxy = function() {
    return this.proxy;
  };

  Store.prototype.indexOf = function(find, findInFiltered) {
    var index, rec, source, _i, _len;
    source = !findInFiltered || findInFiltered && !this.filtered ? this.data : this.filteredData;
    for (index = _i = 0, _len = source.length; _i < _len; index = ++_i) {
      rec = source[index];
      if (rec === find) {
        return index;
      }
    }
    return null;
  };

  Store.prototype.indexOfId = function(id) {
    var index, rec, _i, _len, _ref;
    _ref = this.data;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      rec = _ref[index];
      if (rec.getId() === id) {
        return index;
      }
    }
    return null;
  };

  Store.prototype.findAtBy = function(callback) {
    var index, rec, _i, _len, _ref;
    _ref = this.data;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      rec = _ref[index];
      if (callback(rec, index)) {
        return index;
      }
    }
    return null;
  };

  Store.prototype.findAtRecord = function(fieldName, value, op, startIndex) {
    return this.findAtBy(this.createFinderCallback(fieldName, value, op, startIndex));
  };

  Store.prototype.findAtExact = function(fieldName, value, startIndex) {
    return this.findAtRecord(fieldName, value, "===", startIndex);
  };

  Store.prototype.findBy = function(callback) {
    var rec, _i, _len, _ref;
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      if (callback(rec)) {
        return rec;
      }
    }
    return null;
  };

  Store.prototype.findRecord = function(fieldName, value, op, startIndex) {
    return this.findBy(this.createFinderCallback(fieldName, value, op, startIndex));
  };

  Store.prototype.findExact = function(fieldName, value, startIndex) {
    return this.findRecord(fieldName, value, "===", startIndex);
  };

  Store.prototype.findAllBy = function(callback) {
    var find, rec, _i, _len, _ref;
    find = [];
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      if (callback(rec)) {
        find.push(rec);
      }
    }
    return find;
  };

  Store.prototype.findAllAt = function(index, count) {
    var find, i, indexTo, rec, _i, _len, _ref;
    if (count == null) {
      count = 1;
    }
    indexTo = index + count;
    find = [];
    _ref = this.data;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      rec = _ref[i];
      if (i >= index && i < indexTo) {
        find.push(rec);
      }
    }
    return find;
  };

  Store.prototype.findRecords = function(fieldName, value, op, startIndex) {
    return this.findAllBy(this.createFinderCallback(fieldName, value, op, startIndex));
  };

  Store.prototype.createFinderCallback = function(fieldName, value, op, startIndex) {
    if (op == null) {
      op = "?";
    }
    if (startIndex == null) {
      startIndex = null;
    }
    return (function(_this) {
      return function(rec, index) {
        var recval;
        if (startIndex === null || index >= startIndex) {
          recval = rec.get(fieldName);
          switch (op) {
            case "===":
              if (recval === value) {
                return true;
              }
              break;
            case "==":
              if (recval === value) {
                return true;
              }
              break;
            case "=":
              if (recval.toString().test(value)) {
                return true;
              }
              break;
            case "?":
              if (recval.toString().test(value, "i")) {
                return true;
              }
              break;
            default:
              throw new Error("Unknown operator " + op);
          }
        }
        return false;
      };
    })(this);
  };

  Store.prototype.add = function(recs) {
    var added, rec, _i, _len;
    recs = Array.from(recs);
    added = false;
    if (recs.length === 0) {
      return;
    }
    for (_i = 0, _len = recs.length; _i < _len; _i++) {
      rec = recs[_i];
      added = true;
      this.data.push(rec);
      this.newRecords.push(rec);
      this.removedRecords.erase(rec);
      if (this.filtered && this.getFilters().match(rec)) {
        this.filteredData.push(rec);
      }
      this.attachRecord(rec);
      this.emit('add', this, rec);
    }
    if (added) {
      this.emit('datachanged', this);
    }
  };

  Store.prototype.insert = function(index, recs, reversed) {
    var i, pos, rec, _i, _len;
    recs = Array.from(recs);
    if (recs.length === 0) {
      return;
    }
    for (i = _i = 0, _len = recs.length; _i < _len; i = ++_i) {
      rec = recs[i];
      pos = (reversed ? 0 : index + i);
      this.data.insert(pos, rec);
      this.newRecords.push(rec);
      this.removedRecords.erase(rec);
      if (this.filtered && this.getFilters().match(rec)) {
        this.filteredData.push(rec);
      }
      this.attachRecord(rec);
      this.emit('add', this, rec, pos);
    }
    this.emit("datachanged", this);
  };


  /**
  	  (Local sort only) Inserts the passed Record into the Store at the index where it
  	  should go based on the current sort information.
  	  @param {Miwo.data.Record} record
   */

  Store.prototype.addSorted = function(record) {
    var index;
    index = this.storeSorters ? this.storeSorters.getIndex(record) : this.data.length;
    this.insert(index, record);
    return record;
  };

  Store.prototype.addData = function(values) {
    var data, records, _i, _len;
    if (Type.isArray(values)) {
      records = [];
      for (_i = 0, _len = values.length; _i < _len; _i++) {
        data = values[_i];
        records.push(this.createRecord(data));
      }
      this.add(records);
    } else {
      this.add(this.createRecord(values));
    }
    return this;
  };

  Store.prototype.removeBy = function(callback) {
    this.remove(this.findAllBy(callback));
  };

  Store.prototype.removeRecord = function(field, value) {
    this.removeBy(function(rec) {
      return rec.get(field) === value;
    });
  };

  Store.prototype.removeById = function(id) {
    this.remove(this.getById(id));
  };

  Store.prototype.removeAt = function(index, count) {
    this.remove(this.findAllAt(index, count));
  };

  Store.prototype.removeAll = function(silent) {
    if (this.data.length > 0) {
      this.clear();
      this.emit("datachanged", this);
      if (!silent) {
        this.emit("removeall", this);
      }
    }
  };

  Store.prototype.remove = function(recs) {
    var changed, index, rec, _i, _len, _ref;
    changed = false;
    _ref = Array.from(recs);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      rec.unjoinStore(this);
      index = this.indexOf(rec);
      this.data.erase(rec);
      this.newRecords.erase(rec);
      this.updatedRecords.erase(rec);
      this.removedRecords.include(rec);
      this.emit('remove', this, rec, index);
      if (this.filtered && this.getFilters().match(rec)) {
        this.filteredData.erase(rec);
      }
      changed = true;
    }
    if (changed) {
      this.emit("datachanged", this);
    }
  };

  Store.prototype.clear = function() {
    var rec, _i, _len, _ref;
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      rec.unjoinStore(this);
    }
    if (this.filtered) {
      this.filteredData.empty();
    }
    this.data.empty();
  };

  Store.prototype.load = function(options) {
    if (options == null) {
      options = {};
    }
    if (this.loading) {
      return;
    }
    if (!this.proxy) {
      throw new Error("Cant load data, proxy is missing in store");
    }
    options.params = Object.merge({}, this.params, options.params);
    options.offset = (options.offset !== undefined ? options.offset : (options.page ? options.page - 1 : 0) * this.pageSize);
    options.limit = options.limit || this.pageSize;
    options.filters = this.storeFilters ? this.storeFilters.getAll() : null;
    options.sorters = this.storeSorters ? this.storeSorters.getAll() : null;
    options.addRecords = options.addRecords || false;
    options.recordFactory = this.bound("createRecord");
    this.emit("beforeload", this, options);
    this.page = (this.pageSize ? Math.max(1, Math.ceil(options.offset / this.pageSize) + 1) : 1);
    this.loading = true;
    this.proxy.read(options, this.bound("onProxyLoad"));
  };

  Store.prototype.loadonce = function(options) {
    if (this.loaded) {
      return;
    }
    this.load(options);
  };

  Store.prototype.reload = function() {
    this.load({
      page: this.page
    });
  };

  Store.prototype.onProxyLoad = function(operation) {
    var records, response, successful;
    response = operation.getResponse();
    records = operation.getRecords();
    successful = operation.wasSuccessful();
    if (response) {
      this.totalCount = response.total;
    }
    if (successful) {
      this.loadRecords(records, true);
    }
    this.loading = false;
    this.loaded = true;
    this.emit("load", this, records, successful);
  };

  Store.prototype.loadPage = function(page) {
    if (!this.pageSize) {
      return;
    }
    this.page = Math.max(1, Math.min(page, Math.ceil(this.totalCount / this.pageSize)));
    this.load({
      page: this.page
    });
  };

  Store.prototype.prevPage = function() {
    if (!this.pageSize) {
      return;
    }
    this.page = Math.max(1, this.page - 1);
    this.load({
      page: this.page
    });
  };

  Store.prototype.nextPage = function() {
    if (!this.pageSize) {
      return;
    }
    this.page = Math.min(this.page + 1, Math.ceil(this.totalCount / this.pageSize));
    this.load({
      page: this.page
    });
  };

  Store.prototype.resumeAutoSync = function() {
    this.autoSyncSuspended = true;
  };

  Store.prototype.suspendAutoSync = function() {
    this.autoSyncSuspended = false;
  };

  Store.prototype.sync = function(options) {
    var needsSync, operations, toCreate, toDestroy, toUpdate;
    if (options == null) {
      options = {};
    }
    if (!this.proxy) {
      return;
    }
    toCreate = this.getNewRecords();
    toUpdate = this.getUpdatedRecords();
    toDestroy = this.getRemovedRecords();
    operations = {};
    needsSync = false;
    if (toCreate.length > 0) {
      operations.create = {
        records: toCreate,
        callback: this.createProxyCallback("onProxyCreateCallback", options)
      };
      needsSync = true;
    }
    if (toUpdate.length > 0) {
      operations.update = {
        records: toUpdate,
        callback: this.createProxyCallback("onProxyUpdateCallback", options)
      };
      needsSync = true;
    }
    if (toDestroy.length > 0) {
      operations.destroy = {
        records: toDestroy,
        callback: this.createProxyCallback("onProxyDestroyCallback", options)
      };
      needsSync = true;
    }
    if (needsSync) {
      operations.sync = true;
      this.emit("beforesync", operations);
      if (operations.sync) {
        this.proxy.execute(operations, {
          recordFactory: this.bound("createRecord")
        });
        this.emit("sync", this);
      }
    }
  };

  Store.prototype.createProxyCallback = function(name, options) {
    return (function(_this) {
      return function(op) {
        if (op.wasSuccessful()) {
          _this.emit("success", _this, op);
          _this[name]();
          if (options.success) {
            return options.success(_this, op);
          }
        } else {
          _this.emit("failure", _this, op);
          if (options.failure) {
            return options.failure(_this, op);
          }
        }
      };
    })(this);
  };

  Store.prototype.onProxyCreateCallback = function() {
    this.newRecords.empty();
    this.onProxyCallback();
    this.emit("created", this);
  };

  Store.prototype.onProxyUpdateCallback = function() {
    this.updatedRecords.empty();
    this.onProxyCallback();
    this.emit("updated", this);
  };

  Store.prototype.onProxyDestroyCallback = function() {
    this.removedRecords.empty();
    this.onProxyCallback();
    this.emit("destroyed", this);
  };

  Store.prototype.onProxyCallback = function() {
    this.emit("synced", this);
    if (this.autoSyncReload) {
      this.reload();
    }
  };

  Store.prototype.getSorters = function() {
    if (!this.storeSorters) {
      this.storeSorters = new StoreSorters(this);
    }
    return this.storeSorters;
  };

  Store.prototype.getFilters = function() {
    if (!this.storeFilters) {
      this.storeFilters = new StoreFilters(this);
    }
    return this.storeFilters;
  };

  Store.prototype.afterEdit = function(record, modifiedFieldNames) {
    var name, shouldSync, _i, _len;
    this.updatedRecords.include(record);
    if (this.proxy && this.autoSync && !this.autoSyncSuspended) {
      for (_i = 0, _len = modifiedFieldNames.length; _i < _len; _i++) {
        name = modifiedFieldNames[_i];
        if (record.fields[name].persist) {
          shouldSync = true;
          break;
        }
      }
      if (shouldSync) {
        this.sync();
      }
    }
    if (this.sortOnEdit && !this.remoteSort && this.storeSorters && this.storeSorters.has()) {
      this.storeSorters.apply(true);
    }
    if (this.filterOnEdit && !this.remoteFilter && this.storeFilters && this.storeFilters.has()) {
      this.storeFilters.apply(true);
    }
    this.emit("update", this, record, "edit", modifiedFieldNames);
  };

  Store.prototype.afterReject = function(record) {
    this.emit("update", this, record, "reject", null);
  };

  Store.prototype.afterCommit = function(record) {
    this.emit("update", this, record, "commit", null);
  };

  return Store;

})(MiwoObject);

module.exports = Store;


},{"../core/Object":22,"./StoreFilters":35,"./StoreSorters":37}],35:[function(require,module,exports){
var Filter, StoreFilters;

Filter = require('./Filter');

StoreFilters = (function() {
  StoreFilters.prototype.filters = null;

  StoreFilters.prototype.store = null;

  function StoreFilters(store) {
    this.store = store;
    this.filters = [];
  }

  StoreFilters.prototype.getAll = function() {
    return this.filters;
  };

  StoreFilters.prototype.clear = function() {
    this.filters.empty();
  };

  StoreFilters.prototype.append = function(filter) {
    this.filters.push(filter);
  };

  StoreFilters.prototype.has = function() {
    return this.filters.length > 0;
  };

  StoreFilters.prototype.add = function(name, value, type, operation, params) {
    var filter, _i, _len;
    if (Type.isArray(name)) {
      for (_i = 0, _len = name.length; _i < _len; _i++) {
        filter = name[_i];
        this.add(filter);
      }
    } else {
      if (Type.isInstance(name)) {
        this.append(name);
      } else if (Type.isObject(name)) {
        this.append(new Filter(name));
      } else {
        this.append(new Filter({
          name: name,
          value: value,
          type: type,
          operation: operation,
          params: params
        }));
      }
    }
    return this;
  };

  StoreFilters.prototype.filter = function(name, value, type, operation, params) {
    this.clear();
    if (name) {
      this.add(name, value, type, operation, params);
    }
    this.apply();
    return this;
  };

  StoreFilters.prototype.apply = function(silent) {
    var rec, _i, _len, _ref;
    if (this.store.remoteFilter) {
      this.store.load();
    } else {
      this.store.filtered = this.filters.length > 0;
      this.store.filteredData = [];
      _ref = this.store.data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rec = _ref[_i];
        if (this.match(rec)) {
          this.store.filteredData.push(rec);
        }
      }
      if (!silent) {
        this.store.emit("refresh", this.store);
      }
    }
    this.store.emit("filter", this.store, this.filters);
    return this;
  };

  StoreFilters.prototype.match = function(record) {
    var filter, _i, _len, _ref;
    _ref = this.filters;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      filter = _ref[_i];
      if (filter.match(record) === false) {
        return false;
      }
    }
    return true;
  };

  return StoreFilters;

})();

module.exports = StoreFilters;


},{"./Filter":28}],36:[function(require,module,exports){
var BaseManager, Store, StoreManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseManager = require('./BaseManager');

Store = require('./Store');

StoreManager = (function(_super) {
  __extends(StoreManager, _super);

  function StoreManager() {
    return StoreManager.__super__.constructor.apply(this, arguments);
  }

  StoreManager.prototype.create = function(name) {
    var store;
    store = StoreManager.__super__.create.call(this, name);
    if (!store.isStore) {
      throw new Error("Created store is not instance of Miwo.data.Store");
    }
    return store;
  };

  return StoreManager;

})(BaseManager);

module.exports = StoreManager;


},{"./BaseManager":25,"./Store":34}],37:[function(require,module,exports){
var Sorter, StoreSorters;

Sorter = require('./Sorter');

StoreSorters = (function() {
  StoreSorters.prototype.sorters = null;

  StoreSorters.prototype.store = null;

  function StoreSorters(store) {
    this.store = store;
    this.sorters = [];
  }

  StoreSorters.prototype.clear = function() {
    this.sorters.empty();
    return this;
  };

  StoreSorters.prototype.has = function() {
    return this.sorters.length > 0;
  };

  StoreSorters.prototype.set = function(name, dir) {
    var d, n;
    if (Type.isObject(name)) {
      for (n in name) {
        d = name[n];
        this.sorters.push(new Sorter({
          name: n,
          dir: d
        }));
      }
    } else {
      this.sorters.push(new Sorter({
        name: name,
        dir: dir
      }));
    }
    return this;
  };

  StoreSorters.prototype.sort = function(name, dir) {
    this.clear();
    if (name) {
      this.set(name, dir);
    }
    this.apply();
    return this;
  };

  StoreSorters.prototype.apply = function(silent) {
    var comparator;
    if (this.store.remoteSort) {
      this.store.load();
    } else {
      comparator = this.createSortComparator();
      this.store.sorted = this.sorters.length > 0;
      this.store.data.sort(comparator);
      if (this.store.filteredData) {
        this.store.filteredData.sort(comparator);
      }
      if (!silent) {
        this.store.emit("refresh", this.store);
      }
    }
    this.store.emit("sort", this.store, this.sorters);
    return this;
  };

  StoreSorters.prototype.createSortComparator = function() {
    return (function(_this) {
      return function(a, b) {
        var ret, sorter, _i, _len, _ref;
        if (!_this.sorters) {
          return;
        }
        _ref = _this.sorters;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sorter = _ref[_i];
          ret = sorter.compare(a, b);
          if (ret === -1 || ret === 1) {
            return ret;
          }
        }
      };
    })(this);
  };

  StoreSorters.prototype.getInsertionIndex = function(record, compare) {
    var index, rec, _i, _len, _ref;
    index = 0;
    _ref = this.data;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      rec = _ref[index];
      if (compare(rec, record) > 0) {
        return index;
      }
    }
    return index;
  };

  StoreSorters.prototype.getIndex = function(rec) {
    return this.getInsertionIndex(rec, this.createSortComparator());
  };

  return StoreSorters;

})();

module.exports = StoreSorters;


},{"./Sorter":33}],38:[function(require,module,exports){
var Types;

Types = {
  stripRe: /[\$,%]/g,
  string: {
    type: "string",
    convert: function(v) {
      var defaultValue;
      defaultValue = (this.nullable ? null : "");
      return (v === undefined || v === null ? defaultValue : String(v));
    }
  },
  int: {
    type: "int",
    convert: function(v) {
      return (v !== undefined && v !== null && v !== "" ? parseInt(String(v).replace(Types.stripRe, ""), 10) : (this.nullable ? null : 0));
    }
  },
  float: {
    type: "float",
    convert: function(v) {
      return (v !== undefined && v !== null && v !== "" ? parseFloat(String(v).replace(Types.stripRe, ""), 10) : (this.nullable ? null : 0));
    }
  },
  boolean: {
    type: "boolean",
    convert: function(v) {
      if (this.nullable && (v === undefined || v === null || v === "")) {
        return null;
      }
      return v === true || v === "true" || v === 1;
    }
  },
  date: {
    type: "date",
    convert: function(v) {
      var parsed;
      parsed = void 0;
      if (!v) {
        return null;
      }
      if (Type.isDate(v)) {
        return v;
      }
      parsed = Date.parse(v);
      return (parsed ? new Date(parsed) : null);
    }
  },
  json: {
    type: "json",
    convert: function(v) {
      if (!v) {
        return {};
      } else if (Type.isString(v)) {
        return JSON.decode(v);
      } else {
        return v;
      }
    }
  },
  array: {
    type: "array",
    convert: function(v) {
      if (!v) {
        return null;
      } else if (Type.isArray(v)) {
        return v;
      } else if (Type.isString(v)) {
        return v.split(";");
      } else {
        return Array.from(v);
      }
    }
  }
};

module.exports = Types;


},{}],39:[function(require,module,exports){
module.exports = {
  Record: require('./Record'),
  Entity: require('./Entity'),
  Proxy: require('./Proxy'),
  Store: require('./Store'),
  Types: require('./Types'),
  Filter: require('./Filter'),
  Sorter: require('./Sorter')
};


},{"./Entity":26,"./Filter":28,"./Proxy":30,"./Record":32,"./Sorter":33,"./Store":34,"./Types":38}],40:[function(require,module,exports){
var DiHelper;

DiHelper = (function() {
  function DiHelper() {}

  DiHelper.prototype.expandRe = /^<%([\S]+)%>$/;

  DiHelper.prototype.expandStringRe = /<%([\S]+)%>/g;

  DiHelper.prototype.serviceRe = /^@([^:]+)(:([^\(]+)(\((.*)\))?)?$/;

  DiHelper.prototype.codeRe = /^(\$)?([^\(]+)\((.*)\)$/;

  DiHelper.prototype.expand = function(param, injector) {
    var match, matches, name, value, _i, _len;
    if (Type.isString(param)) {
      if ((matches = param.match(this.expandRe))) {
        param = this.expand(this.getSection(injector.params, matches[1]), injector);
      } else if ((matches = param.match(this.expandStringRe))) {
        for (_i = 0, _len = matches.length; _i < _len; _i++) {
          match = matches[_i];
          param = param.replace(match, this.expand(match, injector));
        }
      }
    } else if (Type.isObject(param)) {
      for (name in param) {
        value = param[name];
        param[name] = this.expand(value, injector);
      }
    }
    return param;
  };

  DiHelper.prototype.evaluateCode = function(service, code, injector) {
    var arg, args, evalArgs, extraArgs, index, isProperty, matches, operation, values, _i, _len;
    if (Type.isArray(code)) {
      values = code;
      code = values.shift();
      extraArgs = this.evaluateArgs(values, injector);
    }
    if ((matches = code.match(this.codeRe))) {
      isProperty = matches[1];
      operation = matches[2];
      args = matches[3];
      evalArgs = args ? this.evaluateArgs(args, injector) : [];
      for (index = _i = 0, _len = evalArgs.length; _i < _len; index = ++_i) {
        arg = evalArgs[index];
        if (arg === '?' && extraArgs.length > 0) {
          evalArgs[index] = extraArgs.shift();
        }
      }
      if (isProperty) {
        service[operation] = evalArgs[0];
      } else {
        if (!service[operation]) {
          throw new Error("Cant call method '" + operation + "' in service '" + service.constructor.name + "'. Method is not defined");
        }
        service[operation].apply(service, evalArgs);
      }
    }
  };

  DiHelper.prototype.evaluateArgs = function(args, injector) {
    var arg, instance, matches, name, op, opArgs, opCall, result, value, _i, _len;
    result = [];
    if (Type.isString(args)) {
      args = args.split(',');
    }
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      if (!Type.isString(arg)) {
        result.push(arg);
        continue;
      }
      value = this.expand(arg, injector);
      if (!Type.isString(value)) {
        result.push(value);
        continue;
      }
      matches = value.match(this.serviceRe);
      if (!matches) {
        result.push(value);
        continue;
      }
      name = matches[1];
      op = matches[3] || null;
      opCall = matches[4] || null;
      opArgs = matches[5] || null;
      instance = injector.get(name);
      if (!op) {
        result.push(instance);
      } else {
        if (!instance[op]) {
          throw new Error("Cant call method " + op + " in service " + name + " of " + instance.constructor.name + ". Method is not defined");
        }
        if (!opCall) {
          result.push(instance[op]);
        } else if (!args) {
          result.push(instance[op]());
        } else {
          result.push(instance[op].apply(instance, this.evaluateArgs(opArgs, injector)));
        }
      }
    }
    return result;
  };

  DiHelper.prototype.getSection = function(config, section) {
    var pos;
    pos = section.indexOf('.');
    if (pos > 0) {
      section = this.getSection(config[section.substr(0, pos)], section.substr(pos + 1));
    } else if (config && config[section] !== void 0) {
      section = config[section];
    } else {
      section = null;
    }
    return section;
  };

  return DiHelper;

})();

module.exports = new DiHelper;


},{}],41:[function(require,module,exports){
var DiHelper, Injector, Service;

Service = require('./Service');

DiHelper = require('./DiHelper');

Injector = (function() {
  Injector.prototype.params = null;

  Injector.prototype.defines = null;

  Injector.prototype.services = null;

  Injector.prototype.globals = null;

  function Injector(params) {
    this.params = params != null ? params : {};
    this.defines = {};
    this.services = {};
    this.globals = {};
    this.set('injector', this);
  }

  Injector.prototype.define = function(name, klass, cb) {
    var service;
    if (cb == null) {
      cb = null;
    }
    if (this.services[name] || this.defines[name]) {
      throw new Error("Service " + name + " already exists");
    }
    service = new Service(this, name, klass, cb);
    this.defines[name] = service;
    return this.defines[name];
  };

  Injector.prototype.get = function(name) {
    if (!this.services[name] && !this.defines[name]) {
      throw new Error("Service with name " + name + " not found");
    }
    if (!this.services[name]) {
      this.services[name] = this.defines[name].create();
    }
    return this.services[name];
  };

  Injector.prototype.update = function(name) {
    if (!this.defines[name]) {
      throw new Error("Service with name " + name + " not found");
    }
    return this.defines[name];
  };

  Injector.prototype.set = function(name, service) {
    if (this.services[name] || this.defines[name]) {
      throw new Error("Service " + name + " already exists");
    }
    this.services[name] = service;
    return this;
  };

  Injector.prototype.has = function(name) {
    return this.services[name] || this.defines[name];
  };

  Injector.prototype.setGlobal = function(name, service) {
    this.globals[name] = service;
    return this;
  };

  Injector.prototype.isDefined = function(name) {
    return this.defines[name] !== void 0;
  };

  Injector.prototype.create = function(name) {
    if (!this.defines[name]) {
      throw new Error("Service with name " + name + " not defined");
    }
    return this.defines[name].create();
  };

  Injector.prototype.createInstance = function(klass, options, factory) {
    var instance, name, setter, value, _i, _len, _ref;
    if (options == null) {
      options = {};
    }
    if (factory == null) {
      factory = null;
    }
    for (name in options) {
      value = options[name];
      options[name] = DiHelper.evaluateArgs(value, this)[0];
    }
    if (factory) {
      if (Type.isString(factory)) {
        factory = DiHelper.evaluateArgs(factory, this)[0];
      }
      if (Type.isFunction(factory)) {
        instance = factory(options);
      }
    } else {
      instance = new klass(options);
    }
    if (!(instance instanceof klass)) {
      throw new Error("Created service is not instance of desired type " + klass.name + ", but instance of " + instance.constructor.name);
    }
    if (klass.inject) {
      _ref = klass.inject;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        setter = 'set' + name.capitalize();
        if (instance[setter]) {
          instance[setter](this.get(name));
        } else {
          instance[name] = this.get(instance[name] || name);
        }
      }
    }
    return instance;
  };

  return Injector;

})();

module.exports = Injector;


},{"./DiHelper":40,"./Service":44}],42:[function(require,module,exports){
var DiHelper, InjectorExtension;

DiHelper = require('./DiHelper');

InjectorExtension = (function() {
  InjectorExtension.prototype.config = null;

  InjectorExtension.prototype.injector = null;

  function InjectorExtension() {
    this.config = {};
  }

  InjectorExtension.prototype.init = function() {};

  InjectorExtension.prototype.setConfig = function(config) {
    Object.merge(this.config, DiHelper.expand(config, this.injector));
  };

  return InjectorExtension;

})();

module.exports = InjectorExtension;


},{"./DiHelper":40}],43:[function(require,module,exports){
var DiHelper, Injector, InjectorFactory;

Injector = require('./Injector');

DiHelper = require('./DiHelper');

InjectorFactory = (function() {
  InjectorFactory.prototype.config = null;

  InjectorFactory.prototype.extensions = null;

  function InjectorFactory() {
    this.config = {
      params: {
        baseUrl: ''
      }
    };
    this.extensions = {};
  }

  InjectorFactory.prototype.setExtension = function(name, extension) {
    this.extensions[name] = extension;
  };

  InjectorFactory.prototype.setConfig = function(config) {
    Object.merge(this.config, config);
  };

  InjectorFactory.prototype.createInjector = function() {
    var definition, ext, extension, injector, name, service, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    injector = new Injector(this.config.params);
    DiHelper.expand(injector.params, injector);
    _ref = this.config.extensions;
    for (name in _ref) {
      extension = _ref[name];
      this.setExtension(name, new extension());
    }
    _ref1 = this.extensions;
    for (name in _ref1) {
      ext = _ref1[name];
      ext.injector = injector;
      ext.init();
    }
    _ref2 = this.extensions;
    for (name in _ref2) {
      ext = _ref2[name];
      if (this.config[name]) {
        ext.setConfig(this.config[name], injector);
      }
    }
    _ref3 = this.extensions;
    for (name in _ref3) {
      ext = _ref3[name];
      if (ext.build) {
        ext.build(injector);
      }
    }
    if (this.config.services) {
      _ref4 = this.config.services;
      for (name in _ref4) {
        service = _ref4[name];
        if (!injector.isDefined(name)) {
          definition = injector.define(name, service.type);
        } else {
          definition = injector.update(name);
        }
        if (service.factory) {
          definition.setFactory(service.factory);
        }
        if (service.setup) {
          definition.setup(service.setup);
        }
        if (service.options) {
          definition.option(service.options);
        }
      }
    }
    _ref5 = this.extensions;
    for (name in _ref5) {
      ext = _ref5[name];
      if (ext.update) {
        ext.update(injector);
      }
    }
    return injector;
  };

  return InjectorFactory;

})();

module.exports = InjectorFactory;


},{"./DiHelper":40,"./Injector":41}],44:[function(require,module,exports){
var DiHelper, Service;

DiHelper = require('./DiHelper');

Service = (function() {
  Service.prototype.injector = null;

  Service.prototype.name = null;

  Service.prototype.klass = null;

  Service.prototype.setups = null;

  Service.prototype.options = null;

  Service.prototype.factory = null;

  Service.prototype.global = false;

  function Service(injector, name, klass, onCreate) {
    this.injector = injector;
    this.name = name;
    this.klass = klass;
    if (onCreate == null) {
      onCreate = null;
    }
    this.setups = [];
    this.options = {};
    if (onCreate) {
      this.setups.push(onCreate);
    }
  }

  Service.prototype.create = function() {
    var instance, setup, _i, _len, _ref;
    instance = this.injector.createInstance(this.klass, this.options, this.factory);
    _ref = this.setups;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      setup = _ref[_i];
      setup(instance, this.injector);
    }
    return instance;
  };

  Service.prototype.setClass = function(klass) {
    this.klass = klass;
    return this;
  };

  Service.prototype.setFactory = function(factory) {
    this.factory = factory;
    return this;
  };

  Service.prototype.setGlobal = function(name) {
    this.injector.setGlobal(name || this.name, this.name);
    return this;
  };

  Service.prototype.setup = function(config) {
    if (Type.isFunction(config)) {
      this.setups.push(config);
    } else if (Type.isArray(config)) {
      this.setups.push(this.createSetup(config));
    } else {
      this.setups.push(this.createSetup(Array.from(arguments)));
    }
    return this;
  };

  Service.prototype.option = function(name, value) {
    var k, v;
    if (Type.isString(name)) {
      if (value !== void 0) {
        this.options[name] = value;
      } else {
        delete this.options[name];
      }
    } else if (Type.isObject(name)) {
      for (k in name) {
        v = name[k];
        this.option(k, v);
      }
    }
    return this;
  };

  Service.prototype.createSetup = function(config) {
    return (function(_this) {
      return function(service, injector) {
        var value, _i, _len;
        for (_i = 0, _len = config.length; _i < _len; _i++) {
          value = config[_i];
          DiHelper.evaluateCode(service, value, injector);
        }
      };
    })(this);
  };

  return Service;

})();

module.exports = Service;


},{"./DiHelper":40}],45:[function(require,module,exports){
module.exports = {
  Injector: require('./Injector'),
  InjectorFactory: require('./InjectorFactory'),
  InjectorExtension: require('./InjectorExtension')
};


},{"./Injector":41,"./InjectorExtension":42,"./InjectorFactory":43}],46:[function(require,module,exports){
var CookieManager, CookieSection;

CookieSection = require('./CookieSection');

CookieManager = (function() {
  CookieManager.prototype.document = null;

  CookieManager.prototype.options = null;

  function CookieManager(options) {
    if (options == null) {
      options = {};
    }
    this.document = document;
    this.options = options;
    return;
  }

  CookieManager.prototype.set = function(key, value, options) {
    this.create(key, options).write(value);
    return this;
  };

  CookieManager.prototype.get = function(key, def) {
    return this.create(key).read() || def;
  };

  CookieManager.prototype.remove = function(key, options) {
    this.set(key, null, Object.merge({
      duration: -1
    }, options));
    return this;
  };

  CookieManager.prototype.create = function(key, options) {
    var cookie;
    cookie = new Cookie(key, Object.merge({}, this.options, options));
    cookie.options.document = this.document;
    return cookie;
  };

  CookieManager.prototype.section = function(name, options) {
    return new CookieSection(this, name, options);
  };

  return CookieManager;

})();

module.exports = CookieManager;


},{"./CookieSection":47}],47:[function(require,module,exports){
var CookieSection;

CookieSection = (function() {
  CookieSection.prototype.cookie = null;

  CookieSection.prototype.name = null;

  CookieSection.prototype.options = null;

  CookieSection.prototype.items = null;

  function CookieSection(cookie, name, options) {
    this.cookie = cookie;
    this.name = name;
    this.options = options;
    this.items = JSON.decode(cookie.get(name) || "{}", true);
    return;
  }

  CookieSection.prototype.save = function() {
    var value;
    value = JSON.encode(this.items);
    if (!value || value.length > 4096) {
      return false;
    } else {
      if (value === "{}") {
        this.cookie.remove(this.name);
      } else {
        this.cookie.set(this.name, value, this.options);
      }
      return true;
    }
  };

  CookieSection.prototype.set = function(name, value) {
    if (value === null) {
      delete this.items[name];
    } else {
      this.items[name] = value;
    }
    return this;
  };

  CookieSection.prototype.get = function(name, def) {
    return (this.items[name] !== void 0 ? this.items[name] : def);
  };

  CookieSection.prototype.has = function(name) {
    return this.items[name] !== void 0;
  };

  CookieSection.prototype.each = function(callback) {
    Object.each(this.items, callback);
  };

  return CookieSection;

})();

module.exports = CookieSection;


},{}],48:[function(require,module,exports){
var HttpRequest,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

HttpRequest = (function(_super) {
  __extends(HttpRequest, _super);

  HttpRequest.prototype.manager = null;

  function HttpRequest(options) {
    if (options == null) {
      options = {};
    }
    HttpRequest.__super__.constructor.call(this, Object.merge(options, {
      data: {}
    }));
    this.initRequest();
  }

  HttpRequest.prototype.initRequest = function() {
    this.setHeader("Accept", "application/json");
    this.setHeader("X-Request", "JSON");
  };

  HttpRequest.prototype.success = function(text) {
    var json;
    json = this.processJson(text);
    if (!json) {
      this.onFailure(null, text);
    } else {
      this.onSuccess(json, text);
    }
  };

  HttpRequest.prototype.failure = function() {
    var json;
    json = this.processJson(this.response.text);
    this.onFailure(json, this.response.text);
  };

  HttpRequest.prototype.processJson = function(text) {
    var error, json;
    try {
      json = JSON.decode(text, this.options.secure);
      this.response.json = json;
      return json;
    } catch (_error) {
      error = _error;
      this.emit("error", text, error);
    }
  };

  HttpRequest.prototype.send = function(options) {
    if (options == null) {
      options = {};
    }
    if (this.manager) {
      options.data = Object.merge({}, this.manager.params, options.data || this.options.data);
      HttpRequest.__super__.send.call(this, options);
    } else {
      options.data = Object.merge({}, options.data || this.options.data);
      HttpRequest.__super__.send.call(this, options);
    }
  };

  return HttpRequest;

})(Request);

module.exports = HttpRequest;


},{}],49:[function(require,module,exports){
var HttpRequest, MiwoObject, RequestManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

HttpRequest = require('./HttpRequest');

RequestManager = (function(_super) {
  __extends(RequestManager, _super);

  function RequestManager() {
    return RequestManager.__super__.constructor.apply(this, arguments);
  }

  RequestManager.prototype.params = {};

  RequestManager.prototype.plugins = {};

  RequestManager.prototype.createRequest = function(options) {
    var request;
    request = new HttpRequest(options);
    this.manage(request);
    return request;
  };

  RequestManager.prototype.get = function(options) {
    var request;
    request = this.createRequest(options);
    request.get();
    return request;
  };

  RequestManager.prototype.post = function(options) {
    var request;
    request = this.createRequest(options);
    request.post();
    return request;
  };

  RequestManager.prototype.read = function(url) {
    var data, request;
    data = null;
    request = new Request({
      url: url,
      async: false,
      onSuccess: function(response) {
        return data = response;
      },
      onFailure: function() {
        throw new Error("Can't load data from url " + url);
      }
    });
    request.send();
    return data;
  };

  RequestManager.prototype.manage = function(request) {
    if (request.manager) {
      return;
    }
    request.manager = this;
    request.on("success", (function(_this) {
      return function(json) {
        _this.emit("success", request, json);
      };
    })(this));
    request.on("failure", (function(_this) {
      return function() {
        _this.emit("failure", request);
      };
    })(this));
    request.on("error", (function(_this) {
      return function(text, error) {
        _this.emit("error", request, text, error);
      };
    })(this));
  };

  RequestManager.prototype.register = function(name, plugin) {
    if (this.plugins[name]) {
      throw new Error("Plugin with name " + name + " already registered");
    }
    this.plugins[name] = plugin;
    plugin.setManager(this);
  };

  return RequestManager;

})(MiwoObject);

module.exports = RequestManager;


},{"../core/Object":22,"./HttpRequest":48}],50:[function(require,module,exports){
module.exports = {
  HttpRequest: require('./HttpRequest'),
  RequestManager: require('./RequestManager')
};


},{"./HttpRequest":48,"./RequestManager":49}],51:[function(require,module,exports){
var ErrorPlugin, FailurePlugin, RedirectPlugin;

RedirectPlugin = (function() {
  function RedirectPlugin() {}

  RedirectPlugin.prototype.setManager = function(manager) {
    manager.on('success', function(request, response) {
      if (response.redirect) {
        return document.location = response.redirect;
      }
    });
  };

  return RedirectPlugin;

})();

FailurePlugin = (function() {
  function FailurePlugin() {}

  FailurePlugin.prototype.setManager = function(manager) {
    manager.on('failure', function(request) {
      return miwo.flash.error(request.xhr.statusText + ": " + request.xhr.responseText.replace(/(<([^>]+)>)/g, ""));
    });
  };

  return FailurePlugin;

})();

ErrorPlugin = (function() {
  function ErrorPlugin() {}

  ErrorPlugin.prototype.setManager = function(manager) {
    manager.on('error', function(request, text, error) {
      return console.error("Error in ajax request", request);
    });
  };

  return ErrorPlugin;

})();

module.exports = {
  RedirectPlugin: RedirectPlugin,
  FailurePlugin: FailurePlugin,
  ErrorPlugin: ErrorPlugin
};


},{}],52:[function(require,module,exports){
(function (global){
var Miwo, miwo;

require('./core/Types');

require('./core/Element');

miwo = require('./bootstrap/Miwo');

global.miwo = miwo;

miwo.registerExtension('miwo', require('./MiwoExtension'));

Miwo = {};

global.Miwo = Miwo;

Miwo.core = require('./core');

Miwo.Object = Miwo.core.Object;

Miwo.Events = Miwo.core.Events;

Miwo.component = require('./component');

Miwo.Component = Miwo.component.Component;

Miwo.Container = Miwo.component.Container;

Miwo.app = require('./app');

Miwo.Controller = Miwo.app.Controller;

Miwo.di = require('./di');

Miwo.InjectorExtension = Miwo.di.InjectorExtension;

Miwo.data = require('./data');

Miwo.Store = Miwo.data.Store;

Miwo.Record = Miwo.data.Record;

Miwo.Entity = Miwo.data.Entity;

Miwo.Proxy = Miwo.data.Proxy;

Miwo.http = require('./http');

Miwo.locale = require('./locale');

Miwo.utils = require('./utils');


}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./MiwoExtension":2,"./app":11,"./bootstrap/Miwo":13,"./component":19,"./core":24,"./core/Element":20,"./core/Types":23,"./data":39,"./di":45,"./http":50,"./locale":66,"./utils":73}],53:[function(require,module,exports){
var ComponentMacroSet, MacroSet,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MacroSet = require('./MacroSet');

ComponentMacroSet = (function(_super) {
  __extends(ComponentMacroSet, _super);

  function ComponentMacroSet() {
    return ComponentMacroSet.__super__.constructor.apply(this, arguments);
  }

  ComponentMacroSet.prototype.install = function(compiler) {
    ComponentMacroSet.__super__.install.call(this, compiler);
    this.addMacro("reference", this.macroReference);
    this.addMacro("events", this.macroEvents);
    this.addMacro("component", this.macroComponent);
    this.addMacro("baseCls", this.macroBaseCls);
  };

  ComponentMacroSet.prototype.macroReference = function(content) {
    return "html:miwo-reference=\"" + content + "\"";
  };

  ComponentMacroSet.prototype.macroEvents = function(content) {
    content = content.replace(/([a-zA-Z0-9]+):'?([a-zA-Z0-9]+)'?/g, "$1:\\'$2\\'");
    return "html:miwo-events=\"{" + content + "}\"";
  };

  ComponentMacroSet.prototype.macroComponent = function(content) {
    return "html:<div miwo-component=\"'+ (typeof " + content + "!=\"undefined\" && Type.isObject(" + content + ") ? " + content + ".name : \"" + content + "\") +'\"></div>";
  };

  ComponentMacroSet.prototype.macroBaseCls = function(content) {
    return "string:me.getBaseCls(\"" + content + "\")";
  };

  return ComponentMacroSet;

})(MacroSet);

module.exports = ComponentMacroSet;


},{"./MacroSet":58}],54:[function(require,module,exports){
var CoreMacroSet, MacroSet,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MacroSet = require('./MacroSet');

CoreMacroSet = (function(_super) {
  __extends(CoreMacroSet, _super);

  function CoreMacroSet() {
    return CoreMacroSet.__super__.constructor.apply(this, arguments);
  }

  CoreMacroSet.prototype.install = function(compiler) {
    CoreMacroSet.__super__.install.call(this, compiler);
    this.addMacro("if", this.macroIf, this.macroEnd);
    this.addMacro("elseif", this.macroElseIf);
    this.addMacro("else", this.macroElse);
    this.addMacro("ifset", this.macroIfSet);
    this.addMacro("elseifset", this.macroElseIfSet);
    this.addMacro("for", this.macroFor, this.macroEnd);
    this.addMacro("js", this.macroJs);
    this.addMacro("log", this.macroLog);
    this.addMacro("=", this.macroWrite);
    this.addMacro("_", this.macroTranslate);
  };

  CoreMacroSet.prototype.macroEnd = function(content) {
    return "}";
  };

  CoreMacroSet.prototype.macroIf = function(content) {
    return "if(" + content + ") {";
  };

  CoreMacroSet.prototype.macroElseIf = function(content) {
    return "} else if(" + content + ") {";
  };

  CoreMacroSet.prototype.macroElse = function(content) {
    return "} else {";
  };

  CoreMacroSet.prototype.macroIfSet = function(content) {
    return this.macroIf("(" + content + ") !== undefined && (" + content + ") !== null)");
  };

  CoreMacroSet.prototype.macroElseIfSet = function(content) {
    return this.macroElseIf("(" + content + ") !== undefined && (" + content + ") !== null)");
  };

  CoreMacroSet.prototype.macroFor = function(content) {
    var index, matches, name, property, value;
    if ((matches = content.match(/([\S]+)\s+in\s+([\S]+)/))) {
      name = matches[1];
      property = matches[2];
      return "for(var _i=0,_l=" + property + ".length; _i<_l; _i++) { var " + name + " = " + property + "[_i];";
    } else if ((matches = content.match(/([\S]+),\s*([\S]+)\s+in\s+([\S]+)/))) {
      name = matches[1];
      index = matches[2];
      property = matches[3];
      return "for(var " + index + "=0," + index + "_l=" + property + ".length; " + index + "<" + index + "_l; " + index + "++) { var " + name + " = " + property + "[" + index + "];";
    } else if ((matches = content.match(/([\S]+),\s*([\S]+)\s+of\s+([\S]+)/))) {
      name = matches[1];
      value = matches[2];
      property = matches[3];
      return "for(var " + name + " in " + property + ") { var " + value + " = " + property + "[" + name + "];";
    } else {
      return "for(" + content + ") {";
    }
  };

  CoreMacroSet.prototype.macroWrite = function(content) {
    return "string:" + content;
  };

  CoreMacroSet.prototype.macroJs = function(content) {
    return content + ";";
  };

  CoreMacroSet.prototype.macroLog = function(content) {
    return 'console.log(' + content + ');';
  };

  CoreMacroSet.prototype.macroTranslate = function(content) {
    var matches, out;
    matches = content.match(/([\S]+)(\s+(.*))?/);
    out = "";
    if (!matches) {
      return out;
    }
    if (matches[1].charAt(0) === "\"") {
      out = "string:Locale.get(" + matches[1] + ")";
    } else {
      out = "string:Locale.get(\"" + matches[1] + "\")";
    }
    if (matches[3]) {
      out += ".substitute({" + matches[3].replace("\\", "").replace("\\", "") + "})";
    }
    return out;
  };

  return CoreMacroSet;

})(MacroSet);

module.exports = CoreMacroSet;


},{"./MacroSet":58}],55:[function(require,module,exports){
var Latte;

Latte = (function() {
  Latte.prototype.source = null;

  Latte.prototype.compiled = null;

  Latte.prototype.filters = null;

  Latte.prototype.compiler = null;

  function Latte(compiler) {
    this.compiler = compiler;
    this.filters = {};
  }

  Latte.prototype.setFilter = function(name, filter) {
    this.filters[name] = filter;
  };

  Latte.prototype.setSource = function(source) {
    this.source = source;
  };

  Latte.prototype.render = function(params) {
    var e;
    if (!this.compiled) {
      try {
        this.compiled = this.compiler.compile(this, this.source);
      } catch (_error) {
        e = _error;
        console.error("Latte compile error:", e.stack, " in compiling template:\n\n", this.source);
        this.compiled = null;
      }
    }
    if (this.compiled) {
      return this.evaluate(this.compiled, params);
    } else {
      return 'LATTE_ERROR';
    }
  };

  Latte.prototype.evaluate = function(string, params) {
    var e, filters, name, template, _tpl;
    try {
      _tpl = '';
      filters = this.filters;
      template = this;
      for (name in params) {
        eval('var ' + name + ' = params["' + name + '"];');
      }
      return eval(string) || _tpl;
    } catch (_error) {
      e = _error;
      console.error("Latte render error:", e.stack, " in template:\n\n", string);
      return '';
    }
  };

  return Latte;

})();

module.exports = Latte;


},{}],56:[function(require,module,exports){
var LatteCompiler;

LatteCompiler = (function() {
  function LatteCompiler() {}

  LatteCompiler.prototype.macros = {};

  LatteCompiler.prototype.addMacro = function(name, macro) {
    this.macros[name] = macro;
    return this;
  };

  LatteCompiler.prototype.addMacros = function(macros) {
    var macro, name;
    for (name in macros) {
      macro = macros[name];
      this.addMacro(name, macro);
    }
    return this;
  };

  LatteCompiler.prototype.compile = function(latte, source) {
    var result, string;
    result = "";
    string = this.beforeCompile(source);
    result += this.start();
    result += string.replace(/\{([^\}]+)\}/g, (function(_this) {
      return function(match, content) {
        result = _this.compileCode(content);
        return (result !== false ? result : content);
      };
    })(this));
    result += this.end();
    result = this.afterCompile(result);
    return result;
  };

  LatteCompiler.prototype.start = function() {
    return "var _tpl = '";
  };

  LatteCompiler.prototype.end = function() {
    return "';";
  };

  LatteCompiler.prototype.compileCode = function(string) {
    var content, isClosing, matches, name;
    matches = string.match(/^(\/)?(\S+)\s?(.*)$/);
    isClosing = matches[1];
    name = matches[2];
    content = matches[3];
    content = content.replace("&gt;", ">");
    content = content.replace("&lt;", ">");
    if (content) {
      content = content.replace(/([^\|]+)\|(.+)/g, (function(_this) {
        return function(match, data, filtersString) {
          var compiled, filter, _i, _len, _ref;
          compiled = data;
          _ref = filtersString.split("|");
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            filter = _ref[_i];
            matches = filter.match(/([^:]+)(:(.*))?/);
            compiled = "filters." + matches[1] + "(" + compiled + (matches[3] ? "," + matches[3] : "") + ")";
          }
          return compiled;
        };
      })(this));
    }
    return this.writeMacro(name, content, isClosing);
  };

  LatteCompiler.prototype.beforeCompile = function(source) {
    source = source.replace(/'/g, "\\'");
    source = source.replace(/\n/g, "");
    source = source.replace(/\r/g, "");
    source = source.replace(/\{\*.*\*\}/g, "");
    return source;
  };

  LatteCompiler.prototype.afterCompile = function(result) {
    result = result.replace(/>\s+</g, "> <");
    result = result.replace(/>\s+\';/g, ">';");
    result = result.replace(/(_tpl\+?=')\s+/g, "$1");
    result = result.replace(/_tpl\+=\'\s*\';/g, "");
    return result;
  };

  LatteCompiler.prototype.writeMacro = function(name, content, isClosing) {
    var code, macro;
    if (!this.macros[name]) {
      throw new Error("Undefined macro " + name);
    }
    macro = this.macros[name];
    code = "";
    if (isClosing) {
      code = macro.nodeClosed(name, content);
    } else {
      code = macro.nodeOpened(name, content);
    }
    return this.writeCode(code);
  };

  LatteCompiler.prototype.writeCode = function(code) {
    var content, matches, type;
    if ((matches = code.match(/(string|js|html):(.*)/))) {
      type = matches[1];
      content = matches[2];
    } else {
      type = "js";
      content = code;
    }
    return this.write(type, content);
  };

  LatteCompiler.prototype.write = function(type, content) {
    var code;
    if (!content) {
      return "";
    }
    switch (type) {
      case "string":
        code = "'+" + content + "+'";
        break;
      case "js":
        code = "'; " + content + " _tpl+='";
        break;
      case "html":
        code = content;
    }
    return code;
  };

  return LatteCompiler;

})();

module.exports = LatteCompiler;


},{}],57:[function(require,module,exports){
var Latte, LatteFactory;

Latte = require('./Latte');

LatteFactory = (function() {
  function LatteFactory() {}

  LatteFactory.inject = ['latteCompiler'];

  LatteFactory.prototype.latteCompiler = null;

  LatteFactory.prototype.createLatte = function() {
    return new Latte(this.latteCompiler);
  };

  return LatteFactory;

})();

module.exports = LatteFactory;


},{"./Latte":55}],58:[function(require,module,exports){
var MacroSet;

MacroSet = (function() {
  function MacroSet() {}

  MacroSet.prototype.macros = {};

  MacroSet.prototype.compiler = null;

  MacroSet.prototype.install = function(compiler) {
    this.compiler = compiler;
  };

  MacroSet.prototype.addMacro = function(name, begin, end) {
    this.macros[name] = [begin, end];
    this.compiler.addMacro(name, this);
  };

  MacroSet.prototype.start = function() {};

  MacroSet.prototype.end = function() {};

  MacroSet.prototype.nodeOpened = function(name, content) {
    return this.macros[name][0](content);
  };

  MacroSet.prototype.nodeClosed = function(name, content) {
    return this.macros[name][1](content);
  };

  return MacroSet;

})();

module.exports = MacroSet;


},{}],59:[function(require,module,exports){
var AbsoluteLayout, Layout,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Layout = require('./Layout');

AbsoluteLayout = (function(_super) {
  __extends(AbsoluteLayout, _super);

  function AbsoluteLayout(config) {
    AbsoluteLayout.__super__.constructor.call(this, config);
    this.type = 'absolute';
    this.targetCls = 'miwo-layout-absolute';
    this.itemCls = 'miwo-layout-item';
  }

  AbsoluteLayout.prototype.configureComponent = function(component) {
    AbsoluteLayout.__super__.configureComponent.call(this, component);
    component.el.setStyles({
      top: component.top,
      bottom: component.bottom,
      left: component.left,
      right: component.right
    });
  };

  AbsoluteLayout.prototype.unconfigureComponent = function(component) {
    AbsoluteLayout.__super__.unconfigureComponent.call(this, component);
    component.el.setStyles({
      top: null,
      bottom: null,
      left: null,
      right: null
    });
  };

  return AbsoluteLayout;

})(Layout);

module.exports = AbsoluteLayout;


},{"./Layout":63}],60:[function(require,module,exports){
var AutoLayout, Layout,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Layout = require('./Layout');

AutoLayout = (function(_super) {
  __extends(AutoLayout, _super);

  function AutoLayout(config) {
    AutoLayout.__super__.constructor.call(this, config);
    this.type = 'auto';
    this.targetCls = '';
    this.itemCls = '';
  }

  return AutoLayout;

})(Layout);

module.exports = AutoLayout;


},{"./Layout":63}],61:[function(require,module,exports){
var FitLayout, Layout,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Layout = require('./Layout');

FitLayout = (function(_super) {
  __extends(FitLayout, _super);

  function FitLayout(config) {
    FitLayout.__super__.constructor.call(this, config);
    this.type = 'fit';
    this.targetCls = 'miwo-layout-fit';
    this.itemCls = 'miwo-layout-item';
  }

  return FitLayout;

})(Layout);

module.exports = FitLayout;


},{"./Layout":63}],62:[function(require,module,exports){
var FormLayout, Layout,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Layout = require('./Layout');

FormLayout = (function(_super) {
  __extends(FormLayout, _super);

  function FormLayout(config) {
    FormLayout.__super__.constructor.call(this, config);
    this.type = 'form';
    this.targetCls = 'miwo-layout-form';
    this.itemCls = '';
  }

  return FormLayout;

})(Layout);

module.exports = FormLayout;


},{"./Layout":63}],63:[function(require,module,exports){
var Laoyut, MiwoObject,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

Laoyut = (function(_super) {
  __extends(Laoyut, _super);

  function Laoyut() {
    return Laoyut.__super__.constructor.apply(this, arguments);
  }

  Laoyut.prototype.isLayout = true;

  Laoyut.prototype.targetCls = "miwo-layout";

  Laoyut.prototype.itemCls = "miwo-layout-item";

  Laoyut.prototype.container = null;

  Laoyut.prototype.initialized = false;

  Laoyut.prototype.running = false;

  Laoyut.prototype.ownerLayout = null;

  Laoyut.prototype.enabled = true;

  Laoyut.prototype.setContainer = function(container) {
    this.munon(this.container, container, 'added', this.bound("onAdded"));
    this.munon(this.container, container, 'removed', this.bound("onRemoved"));
    this.container = container;
  };

  Laoyut.prototype.getLayoutComponents = function() {
    return this.container.getComponents();
  };

  Laoyut.prototype.getRenderTarget = function() {
    return this.container.getContentEl();
  };

  Laoyut.prototype.initLayout = function() {
    this.initialized = true;
  };

  Laoyut.prototype.setOwnerLayout = function(layout) {
    this.ownerLayout = layout;
  };

  Laoyut.prototype.render = function() {
    if (this.targetCls) {
      this.getRenderTarget().addClass(this.targetCls);
    }
    this.update();
  };

  Laoyut.prototype.update = function() {
    this.renderComponents(this.getLayoutComponents(), this.getRenderTarget());
  };

  Laoyut.prototype.onAdded = function(container, component, position) {
    if (container.rendered) {
      this.renderComponent(component, this.getRenderTarget(), position);
    }
  };

  Laoyut.prototype.onRemoved = function(container, component) {
    if (container.rendered) {
      this.removeComponent(component);
    }
  };

  Laoyut.prototype.renderComponents = function(components, target) {
    if (!this.enabled) {
      return;
    }
    components.each((function(_this) {
      return function(component, index) {
        if (!component.rendered) {
          return _this.renderComponent(component, target, index);
        } else {
          return _this.updateComponent(component);
        }
      };
    })(this));
  };

  Laoyut.prototype.renderComponent = function(component, target, position) {
    if (!this.enabled) {
      return;
    }
    if (!component.rendered) {
      this.configureComponent(component);
      component.render(target);
      this.afterRenderComponent(component);
    }
  };

  Laoyut.prototype.updateComponent = function(component) {
    this.configureComponent(component);
    component.update();
  };

  Laoyut.prototype.configureComponent = function(component) {
    if (component.isContainer && component.hasLayout()) {
      component.getLayout().setOwnerLayout(this);
    }
    if (this.itemCls) {
      component.el.addClass(this.itemCls);
    }
    if (component.width) {
      component.el.setStyle('width', component.width);
    }
    if (component.height) {
      component.el.setStyle('height', component.height);
    }
  };

  Laoyut.prototype.afterRenderComponent = function(component) {};

  Laoyut.prototype.removeComponent = function(component) {
    if (component.rendered) {
      this.unconfigureComponent(component);
      component.el.dispose();
      this.afterRemoveComponent(component);
    }
  };

  Laoyut.prototype.unconfigureComponent = function(component) {
    if (component.isContainer && component.hasLayout()) {
      component.getLayout().setOwnerLayout(null);
    }
    if (this.itemCls) {
      component.el.removeClass(this.itemCls);
    }
    if (component.width) {
      component.el.setStyle('width', null);
    }
    if (component.height) {
      component.el.setStyle('height', null);
    }
  };

  Laoyut.prototype.afterRemoveComponent = function(component) {};

  Laoyut.prototype.doDestroy = function() {
    if (this.targetCls) {
      this.getRenderTarget().removeClass(this.targetCls);
    }
    this.setContainer(null);
    Laoyut.__super__.doDestroy.call(this);
  };

  return Laoyut;

})(MiwoObject);

module.exports = Laoyut;


},{"../core/Object":22}],64:[function(require,module,exports){
module.exports = {
  Absolute: require('./Absolute'),
  Form: require('./Form'),
  Fit: require('./Fit'),
  Auto: require('./Auto'),
  Layout: require('./Layout'),
  createLayout: function(type) {
    return new this[type.capitalize()]();
  }
};


},{"./Absolute":59,"./Auto":60,"./Fit":61,"./Form":62,"./Layout":63}],65:[function(require,module,exports){
var Translator;

Translator = (function() {
  Translator.prototype.translates = null;

  function Translator() {
    this.translates = {};
    return;
  }

  Translator.prototype.setTranslates = function(name, translates) {
    if (!this.translates[name]) {
      this.translates[name] = translates;
    } else {
      Object.merge(this.translates[name], translates);
    }
  };

  Translator.prototype.get = function(key) {
    var group, part, _i, _len, _ref;
    group = this.translates;
    _ref = key.split('.');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      part = _ref[_i];
      group = group[part];
      if (group === void 0) {
        return null;
      }
      if (!group) {
        break;
      }
    }
    return group;
  };

  return Translator;

})();

module.exports = Translator;


},{}],66:[function(require,module,exports){
module.exports = {
  Translator: require('./Translator')
};


},{"./Translator":65}],67:[function(require,module,exports){
var Template;

Template = (function() {
  Template.prototype.loader = null;

  Template.prototype.renderer = null;

  Template.prototype.params = null;

  Template.prototype.target = null;

  function Template(renderer) {
    this.renderer = renderer;
    this.params = {};
  }

  Template.prototype.setTarget = function(target) {
    this.target = target;
  };

  Template.prototype.set = function(key, value) {
    var k, v;
    if (Type.isObject(key)) {
      for (k in key) {
        v = key[k];
        this.params[k] = v;
      }
    } else {
      this.params[key] = value;
    }
    return this;
  };

  Template.prototype.get = function(key) {
    return this.params[key];
  };

  Template.prototype.setLoader = function(loader) {
    this.loader = loader;
  };

  Template.prototype.setFilter = function(name, filter) {
    this.renderer.setFilter(name, filter);
    return this;
  };

  Template.prototype.setFilters = function(filters) {
    var filter, name;
    for (name in filters) {
      filter = filters[name];
      this.renderer.setFilter(name, filter);
    }
    return this;
  };

  Template.prototype.setSource = function(config) {
    this.renderer.setSource(this.loader.load(config));
    return this;
  };

  Template.prototype.render = function(params) {
    var data, name, value, _ref;
    data = {};
    _ref = this.params;
    for (name in _ref) {
      value = _ref[name];
      data[name] = value;
    }
    for (name in params) {
      value = params[name];
      data[name] = value;
    }
    this.target.set('html', this.renderer.render(data));
  };

  return Template;

})();

module.exports = Template;


},{}],68:[function(require,module,exports){
var Template, TemplateFactory;

Template = require('./Template');

TemplateFactory = (function() {
  function TemplateFactory() {}

  TemplateFactory.inject = ['latteFactory', 'templateLoader'];

  TemplateFactory.prototype.latteFactory = null;

  TemplateFactory.prototype.templateLoader = null;

  TemplateFactory.prototype.createTemplate = function() {
    var template;
    template = new Template(this.latteFactory.createLatte());
    template.setLoader(this.templateLoader);
    return template;
  };

  return TemplateFactory;

})();

module.exports = TemplateFactory;


},{"./Template":67}],69:[function(require,module,exports){
var TemplateLoader;

TemplateLoader = (function() {
  function TemplateLoader() {}

  TemplateLoader.prototype.baseUrl = null;

  TemplateLoader.prototype.templatesDir = null;

  TemplateLoader.prototype.templatesExt = 'latte';

  TemplateLoader.prototype.load = function(source) {
    if (source.indexOf('#') === 0) {
      return $(source.replace(/^\#/, '')).get('html');
    } else if (source.indexOf('path:') === 0) {
      return this.loadFromPath(source.replace(/^path:/, ''));
    } else if (source.indexOf('//') === 0) {
      return this.loadFromPath(source.replace(/^\/\//, ''));
    } else {
      return source;
    }
  };

  TemplateLoader.prototype.loadFromPath = function(path) {
    var url;
    url = this.baseUrl + this.templatesDir + '/' + path + '.' + this.templatesExt + '?t=' + (new Date().getTime());
    return miwo.http.read(url);
  };

  return TemplateLoader;

})();

module.exports = TemplateLoader;


},{}],70:[function(require,module,exports){
var Collection;

Collection = (function() {
  function Collection(object) {
    var key;
    if (object == null) {
      object = null;
    }
    this.items = {};
    this.length = 0;
    if (object) {
      if (object instanceof Collection) {
        for (key in object.items) {
          this.items[key] = object.items[key];
        }
      } else {
        for (key in object) {
          this.items[key] = object[key];
        }
      }
    }
  }

  Collection.prototype.each = function(cb) {
    Object.each(this.items, cb);
  };

  Collection.prototype.filter = function(cb) {
    return Object.filter(this.items, cb);
  };

  Collection.prototype.find = function(cb) {
    return Object.some(this.items, cb);
  };

  Collection.prototype.set = function(name, value) {
    if (!this.has(name)) {
      this.length++;
    }
    this.items[name] = value;
  };

  Collection.prototype.get = function(name, def) {
    if (def == null) {
      def = null;
    }
    if (this.has(name)) {
      return this.items[name];
    } else {
      return def;
    }
  };

  Collection.prototype.getBy = function(name, value) {
    var item, _i, _len, _ref;
    _ref = this.items;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      if (item[name] === value) {
        return item;
      }
    }
    return null;
  };

  Collection.prototype.has = function(name) {
    return this.items[name] !== void 0;
  };

  Collection.prototype.remove = function(name) {
    if (this.items[name]) {
      delete this.items[name];
      this.length--;
    }
  };

  Collection.prototype.empty = function() {
    this.items = {};
    this.length = 0;
  };

  Collection.prototype.getFirst = function() {
    var item, key, _ref;
    _ref = this.items;
    for (key in _ref) {
      item = _ref[key];
      return item;
    }
    return null;
  };

  Collection.prototype.getLast = function() {
    var item, key, last, _ref;
    last = null;
    _ref = this.items;
    for (key in _ref) {
      item = _ref[key];
      last = item;
      continue;
    }
    return last;
  };

  Collection.prototype.keyOf = function(value) {
    return Object.keyOf(this.items, value);
  };

  Collection.prototype.indexOf = function(find) {
    var index, item, key, _ref;
    index = 0;
    _ref = this.items;
    for (key in _ref) {
      item = _ref[key];
      if (item === find) {
        return index;
      }
      index++;
    }
    return -1;
  };

  Collection.prototype.getAt = function(at) {
    var index, item, key, _ref;
    index = 0;
    _ref = this.items;
    for (key in _ref) {
      item = _ref[key];
      if (index === at) {
        return item;
      }
      index++;
    }
    return null;
  };

  Collection.prototype.getKeys = function() {
    return Object.keys(this.items);
  };

  Collection.prototype.getValues = function() {
    return Object.values(this.items);
  };

  Collection.prototype.toArray = function() {
    var array, item, key, _ref;
    array = [];
    _ref = this.items;
    for (key in _ref) {
      item = _ref[key];
      array.push(item);
    }
    return array;
  };

  Collection.prototype.destroy = function() {
    var item, key, _ref;
    _ref = this.items;
    for (key in _ref) {
      item = _ref[key];
      if (item.destroy) {
        item.destroy();
      }
      delete this.items[key];
    }
  };

  return Collection;

})();

module.exports = Collection;


},{}],71:[function(require,module,exports){
var KeyListener;

KeyListener = (function() {
  KeyListener.prototype.target = null;

  KeyListener.prototype.event = 'keyup';

  KeyListener.prototype.handlers = null;

  KeyListener.prototype.handleEvent = null;

  KeyListener.prototype.paused = true;

  function KeyListener(target, event) {
    this.target = target;
    if (event) {
      this.event = event;
    }
    this.handlers = {};
    this.handleEvent = (function(_this) {
      return function(e) {
        if (_this.handlers[e.key]) {
          return _this.handlers[e.key](e);
        }
      };
    })(this);
    this.resume();
  }

  KeyListener.prototype.on = function(name, handler) {
    this.handlers[name] = handler;
  };

  KeyListener.prototype.resume = function() {
    if (!this.paused) {
      return;
    }
    this.paused = false;
    this.target.on(this.event, this.handleEvent);
  };

  KeyListener.prototype.pause = function() {
    if (this.paused) {
      return;
    }
    this.paused = true;
    this.target.un(this.event, this.handleEvent);
  };

  KeyListener.prototype.destroy = function() {
    this.pause();
  };

  return KeyListener;

})();

module.exports = KeyListener;


},{}],72:[function(require,module,exports){
var MiwoObject, Overlay,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MiwoObject = require('../core/Object');

Overlay = (function(_super) {
  __extends(Overlay, _super);

  Overlay.prototype.color = "#000";

  Overlay.prototype.opacity = 0.5;

  Overlay.prototype.zIndex = 5000;

  Overlay.prototype.target = null;

  Overlay.prototype.overlay = null;

  function Overlay(target, config) {
    this.target = target;
    Overlay.__super__.constructor.call(this, config);
    this.overlay = new Element("div", {
      parent: this.target,
      cls: "miwo-overlay",
      styles: {
        position: "absolute",
        background: this.color,
        "z-index": this.zIndex
      }
    });
    this.overlay.on('click', (function(_this) {
      return function() {
        return _this.emit('click');
      };
    })(this));
    return;
  }

  Overlay.prototype.setZIndex = function(zIndex) {
    this.overlay.setStyle("z-index", zIndex);
  };

  Overlay.prototype.open = function() {
    this.emit("open");
    this.target.addClass("miwo-overlayed");
    this.overlay.setStyle("display", "block");
    ((function(_this) {
      return function() {
        return _this.overlay.setStyle("opacity", _this.opacity);
      };
    })(this)).delay(1);
    this.emit("show");
  };

  Overlay.prototype.close = function() {
    this.emit("close");
    this.target.removeClass("miwo-overlayed");
    this.overlay.setStyle("opacity", 0.0);
    ((function(_this) {
      return function() {
        return _this.overlay.setStyle("display", "none");
      };
    })(this)).delay(300);
    this.emit("hide");
  };

  Overlay.prototype.doDestroy = function() {
    this.overlay.destroy();
    Overlay.__super__.doDestroy.call(this);
  };

  return Overlay;

})(MiwoObject);

module.exports = Overlay;


},{"../core/Object":22}],73:[function(require,module,exports){
module.exports = {
  Overlay: require('./Overlay'),
  Collection: require('./Collection'),
  KeyListener: require('./KeyListener')
};


},{"./Collection":70,"./KeyListener":71,"./Overlay":72}]},{},[52])