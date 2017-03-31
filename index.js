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
        for (var i=0; i<injector.length; i++) {
            
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
    lightNgModuleConstructor.prototype._initiateService = function(serviceConstructor) {
        var _self = this;
        var name = serviceConstructor.name;
        var injectables = _self._getInjectables(serviceConstructor.dependencies);
        var operation = serviceConstructor.operation;

        var ServiceInstance = function(args){
            operation.apply(this, args);
            return this;
        }

        _self.store[name] = new ServiceInstance(injectables);
    }

    //initiates a factory instance
    lightNgModuleConstructor.prototype._initiateFactory = function (factoryConstructor) {
        var _self = this;
        var name = factoryConstructor.name;
        var injectables = _self._getInjectables(factoryConstructor.dependencies);
        var operation = factoryConstructor.operation;

        _self.store[name] = operation.apply(this, injectables);
    }

    lightNgModuleConstructor.prototype._initiateController = function(controllerConstructor) {
        var _self = this;
        var name = controllerConstructor.name;
        var injectables = _self._getInjectables(controllerConstructor.dependencies);
        var operation = controllerConstructor.operation;

        _self.store[name] = function(){
            operation.apply(this,injectables);
            operation = function(){
                throw "Controller "+ name+ " cannot be initiated more than once";
            }
        }
    }

    //initiates a run instance
    lightNgModuleConstructor.prototype._initiateRunner = function(runnerConstructor) {
        var _self = this;
        var injectables = _self._getInjectables(runnerConstructor.dependencies);
        var operation = runnerConstructor.operation;
        operation.apply(this,injectables);
    }

    /**
     * PUBLIC 
     */

    lightNgModuleConstructor.prototype.provider = function(name, constructor) {
        var _self = this;
        if (typeof constructor !== "function") {
            throw 'Provider constructor for "'+name+'" is not a function';
        }
        _self.store[name] = constructor();
        return _self;
    }

    lightNgModuleConstructor.prototype.service = function(name, injector) {
        var _self = this;

        var serviceConstructor = {
            constructor : _self._initiateService,
            name : name,
            operation : injector.pop(),
            dependencies : injector
        }

        if (!_self.running) {
            _self.pending.push(serviceConstructor);
        } else {
            _.self._initiateService(serviceConstructor);
        }

        return _self;
    }

    lightNgModuleConstructor.prototype.factory = function(name, injector) {
        var _self = this;

        var factoryConstructor = {
            constructor : _self._initiateFactory,
            name : name,
            operation : injector.pop(),
            dependencies : injector
        }

        if (!_self.running) {
            _self.pending.push(factoryConstructor)
        } else {
            _self._initiateFactory(factoryConstructor);
        }
        return _self;
    }

    lightNgModuleConstructor.prototype.controller = function(name, injector) {
        var _self = this;

        var controllerConstructor = {
            constructor : _self._initiateController,
            name : name,
            operation : injector.pop(),
            dependencies : injector   
        }

        if (!_self.running) {
            _self.pending.push(controllerConstructor);
        } else {
            _self._initiateController(controllerConstructor);
        }
        return _self;
    }

    lightNgModuleConstructor.prototype.run = function(injector) {
        var _self = this;

        var runnerConstructor = {
            constructor : _self._initiateRunner,
            operation : injector.pop(),
            dependencies : injector
        }

        if (!_self.running) {
            _self.pending.push(runnerConstructor);
        } else {
            _self._initiateRunner(runnerConstructor);
        }
        return _self;
    }

    lightNgModuleConstructor.prototype.build = function(){
        var _self = this;
        if(_self.running) return;
        _self.running = true;
        var component, isReady;
        var itemsOnStart;

        /**
         * Dependency Resolver
         */

        while (_self.pending.length>0) {
            
             itemsOnStart = _self.pending.length;

            //find components that have dependencies loaded
            for ( var i=0; i<_self.pending.length; i++) {
                
                component = _self.pending[i];
                isReady = true;

                //component has no dependencies, can be loaded
                if ( !component.dependencies.length ) {
                    isReady = true;
                } else {
                    //check if dependencies are ready
                    for (var j=0; j<component.dependencies.length; j++) {
                        if (!_self.store.hasOwnProperty( component.dependencies[j] )) {
                            isReady = false;
                            break;
                        }
                    }
                }

                if (isReady) {
                    if (typeof component.constructor !== 'function') {
                        throw 'Unknown constructor for "'+component.name+'"';
                    }
                    component.constructor.call(_self,component);
                    _self.pending.splice(i, 1);
                    i = i-1;
                }
            }

            if (itemsOnStart === _self.pending.length) {
               var componentsLeft = [];
               for (var k=0; k<_self.pending.length; k++) {
                    componentsLeft.push(_self.pending[k].name);
               }
               var error = "Circular Dependency Detected somewhere in "+componentsLeft.join(',');
               throw error;
            }

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