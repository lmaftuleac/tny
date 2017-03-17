'use strict';

(function(){

    //modules collector        
    var Modules = {};

    function lightNgModuleConstructor() {
        this.__lightNgModule = true;
        this.store = {};
        this.pending = [];
        this.running = false;
    }

    //resolves injector
    lightNgModuleConstructor.prototype._getInjectables = function(injector) {
        var _self = this;
        var injectables = [];
        for (var i=0; i<injector.length-1; i++) {
            if (typeof injector[i] === 'string') {
                if (_self.store[injector[i]]) {
                    injectables.push(_self.store[injector[i]]);
                } else {
                    throw "Unknown provider : '"+ injector[i] +"'"
                }

            } else {
                throw "Unknown type in injector: "+injector[i];
            }
        }
        return injectables;
    }

    //initiates a service instance
    lightNgModuleConstructor.prototype._initiateService = function(name, injector) {
        var _self = this;
        var injectables = _self._getInjectables(injector),
            constructorFn = injector.pop();

        var ServiceInstance = function(args){
            constructorFn.apply(this, args);
            return this;
        }

        _self.store[name] = new ServiceInstance(injectables);
    }

    //initiates a factory instance
    lightNgModuleConstructor.prototype._initiateFactory = function(name, injector) {
        var _self = this;
        var injectables = _self._getInjectables(injector);
        var operation;
        if (typeof injector === 'function') {
            operation = injector;
        } else {
            operation = injector.pop();
        }

        _self.store[name] = operation.apply(this, injectables);
    }

    //initiates a run instance
    lightNgModuleConstructor.prototype._initiateRunner = function(injector) {
        var _self = this;
        var injectables = _self._getInjectables(injector);
        var operation = injector.pop();
        operation.apply(this,injectables);
    }

    /**
     * PUBLIC 
     */

    lightNgModuleConstructor.prototype.service = function(name, injector) {
        var _self = this;
        if (!_self.running) {
            _self.pending.push({
                constructor : _self._initiateService,
                arguments : [name,injector]
            });
        } else {
            _.self._initiateService(name, injector);
        }

        return _self;
    }

    lightNgModuleConstructor.prototype.factory = function(name, injector) {
        var _self = this;
        if (!_self.running) {
            _self.pending.push({
                constructor : _self._initiateFactory,
                arguments : [name,injector]
            })
        } else {
            _self._initiateFactory(name, injector);
        }
        return _self;
    }

    lightNgModuleConstructor.prototype.provider = function(name, constructor) {
        var _self = this;
        if (typeof constructor !== "function") {
            throw 'Provider constructor for "'+name+'" is not a function';
        }
        _self.store[name] = constructor();
        return _self;
    }

    lightNgModuleConstructor.prototype.run = function(injector) {
        var _self = this;
        if (!_self.running) {
            _self.pending.push({
                constructor : _self._initiateRunner,
                arguments : [injector]
            });
        } else {
            _self._initiateRunner(injector);
        }
        return _self;
    }

    lightNgModuleConstructor.prototype.build = function(){
        var _self = this;
        if(_self.running) return;
        _self.running = true;
        var component;
        while (_self.pending.length>0) {
            component = _self.pending.shift();
            if (typeof component.constructor !== 'function') {
                throw 'Unknown constructor for "'+component.name+'"';
            }
            component.constructor.apply(_self,component.arguments);
        }
        return _self;
    };

    lightNgModuleConstructor.prototype.extend = function(name, exp){
        var _self = this;
        _self[name] = exp;
        return _self;
    }

    lightNgModuleConstructor.prototype.include = function(moduleName) {
        var _self = this;
        
        if (_self.running) {
            throw 'Cannot load modules after .build()';
        }

        var module = Modules[moduleName];

        if (typeof module !== 'object') {
            throw 'Faild Loading module, unknow data type';
        }

        //include incoming module

        var moduleStore = module.store;

        for (var key in moduleStore) { 
            if (moduleStore.hasOwnProperty(key)) {
                if (_self.store[key]) {
                    throw "'"+key+"' already exists, check namings and try again";
                } else {
                    _self.store[key] = moduleStore[key];
                }
            }
        }

        var modulePending = module.pending;

        for (var i=0; i<modulePending.length; i++) {
            _self.pending.push(modulePending[i]);
        }

        return _self;
    }

    //initiator
    function lightNg(moduleName) {
        if (!moduleName) {
             throw 'lightNg moduleName Required';
        }

        var module = Modules[moduleName];

        if (module) {
            //return existing module
            return module;
        } else {
            //create new module
            module = new lightNgModuleConstructor();
            Modules[moduleName] = module;
            return module;
        }
    }

    lightNg.noop = function(){}

        //check if browser or node
    if (typeof module !== 'undefined' && module.exports) {
        //node
        module.exports = lightNg;
    } else {
        //browser
        window.lightNg = lightNg;
    }

})();