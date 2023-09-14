'use strict';

(function(){

    //modules collector        
    const Modules = new Map();

    function TinyConstructor() {
        this.__tinyModule = true;
        this.store = new Map();
        this.componentNames = new Set();
        this.pending = [];
        this.running = false;
    }

    //resolves injector
    TinyConstructor.prototype._getInjectables = function(injector) {
        const _self = this;
        const injectables = [];
        for (let i=0; i<injector.length; i++) {
            const provider = injector[i];

            if (typeof provider === 'string') {

                if (_self.store.has(provider)) {
                    injectables.push(_self.store.get(provider));
                } else {
                    throw `Unknown provider: '${provider}'`
                }
            } else {
                throw `Strng type expected in injector. Got - "+${typeof provider}`;
            }
        }
        return injectables;
    }

    //initiates a service instance
    TinyConstructor.prototype._initiateService = function(serviceConstructor) {
        const _self = this;
        const name = serviceConstructor.name;
        const injectables = _self._getInjectables(serviceConstructor.dependencies);
        const operation = serviceConstructor.operation;

        const ServiceInstance = function(args) {
            operation.apply(this, args);
            return this;
        }

        _self.store.set(name, new ServiceInstance(injectables))
    }

    //initiates a factory instance
    TinyConstructor.prototype._initiateFactory = function (factoryConstructor) {
        const _self = this;
        const name = factoryConstructor.name;
        const injectables = _self._getInjectables(factoryConstructor.dependencies);
        const operation = factoryConstructor.operation;

        _self.store.set(name,operation.apply(this, injectables))
    }

    TinyConstructor.prototype._initiateController = function(controllerConstructor) {
        const _self = this;
        const name = controllerConstructor.name;
        const injectables = _self._getInjectables(controllerConstructor.dependencies);
        let operation = controllerConstructor.operation;

        _self.store.set(name, function(){
            operation.apply(this, injectables);
            operation = () => {
                throw `Controller '${name}' cannot be initiated more than onc`;
            }
        })
    }

    //initiates a run instance
    TinyConstructor.prototype._initiateRunner = function(runnerConstructor) {
        const _self = this;
        const injectables = _self._getInjectables(runnerConstructor.dependencies);
        const operation = runnerConstructor.operation;
        operation.apply(this, injectables);
    }

    /**
     * PUBLIC 
     */

    TinyConstructor.prototype.provider = function(name, constructor) {
        const _self = this;
        _self.componentNames.add(name);
        if (typeof constructor !== "function") {
            throw `Provider constructor for '${name}' is not a function`;
        }
        _self.store.set(name, constructor())
        return _self;
    }

    TinyConstructor.prototype.service = function(name, injector) {
        const _self = this;
        _self.componentNames.add(name);
        const serviceConstructor = {
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

    TinyConstructor.prototype.factory = function(name, injector) {
        const _self = this;
        _self.componentNames.add(name);
        const factoryConstructor = {
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

    TinyConstructor.prototype.controller = function(name, injector) {
        const _self = this;
        _self.componentNames.add(name);
        const controllerConstructor = {
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

    TinyConstructor.prototype.run = function(injector) {
        const _self = this;

        const runnerConstructor = {
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

    TinyConstructor.prototype.build = function() {
        const _self = this;
        if (_self.running) return;
        _self.running = true;
        let component, isReady;
        let itemsOnStart;

        /**
         * Dependency Validation
         */

        _self.pending.forEach((component) => {
            component.dependencies.forEach((dependency) => { 
                if (!_self.componentNames.has(dependency)) {
                    throw "Unknown dependency '"+dependency+"' in '"+component.name+"'";
                }
            });
        }); 

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
                        if (!_self.store.has( component.dependencies[j] )) {
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

    TinyConstructor.prototype.extend = function(name, exp){
        const _self = this;
        _self[name] = exp;
        return _self;
    }

    TinyConstructor.prototype.include = function(moduleName) {
        const _self = this;
        
        if (_self.running) {
            throw 'Cannot load modules after .build()';
        }

        const module = Modules.get(moduleName);

        if (typeof module !== 'object') {
            throw 'Faild Loading module, unknow data type';
        }

        //include incoming module

        const moduleStore = module.store;

        moduleStore.forEach((resource, key) => {
            if (_self.store.has(key)) {
                throw `Double resources identified under name '${key}' `;
            } else {
                _self.store.set(key, resource)
            }
        });

        // merge component names
        _self.componentNames = new Set([..._self.componentNames, ...module.componentNames]);

        const modulePending = module.pending;

        for (let i=0; i<modulePending.length; i++) {
            _self.pending.push(modulePending[i]);
        }

        return _self;
    }

    //initiator
    function Tny(moduleName) {
        if (!moduleName) {
             throw 'tiny: moduleName Required';
        }

        const module = Modules.get(moduleName);

        if (module) {
            //return existing module
            return module;
        } else {
            //create new module
            const blankModule = new TinyConstructor();
            Modules.set(moduleName, blankModule);
            return blankModule;
        }
    }

    Tny.noop = function(){}

        //check if browser or node
    if (typeof module !== 'undefined' && module.exports) {
        //node
        module.exports = Tynee;
    } else {
        //browser
        window.Tynee = Tynee;
    }

})();