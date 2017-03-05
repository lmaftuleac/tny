(function(){
    

    function lightNg() {
        var store = {};
        var self = this;
        var pending = [];
        var running = false;

        //resolves injector
        function getInjectables (injector) {
            var injectables = [];
            for (var i=0; i<injector.length-1; i++) {
                if (typeof injector[i] === 'string') {
                    if (store[injector[i]]) {
                        injectables.push(store[injector[i]]);
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
        function initiateService(name, injector){
            var injectables = getInjectables(injector),
                constructorFn = injector.pop();

            var ServiceInstance = function(args){
                constructorFn.apply(this, args);
                return this;
            }

            store[name] = new ServiceInstance(injectables);
        }

        //initiates a factory instance
        function initiateFactory(name, injector) {
            var injectables = getInjectables(injector);
            var operation;
            if (typeof injector === 'function') {
                operation = injector;
            } else {
                operation = injector.pop();
            }

            store[name] = operation.apply(this, injectables);
        }

        //initiates a run instance
        function initiateRunner(injector){
            var injectables = getInjectables(injector);
            var operation = injector.pop();
            operation.apply(this,injectables);
        }

        /**
         * PUBLIC 
         */

        this.service = function(name, injector) {
            if (!running) {
                pending.push({
                    constructor : initiateService,
                    arguments : [name,injector]
                });
            } else {
                initiateService(name, injector);
            }

            return self;
        }

        this.factory = function(name, injector) {
            if (!running) {
                pending.push({
                    constructor : initiateFactory,
                    arguments : [name,injector]
                })
            } else {
                initiateFactory(name, injector);
            }
            return self;
        }

        this.provider = function(name, constructor) {
            if (typeof constructor !== "function") {
                throw 'Provider constructor for "'+name+'" is not a function';
            }
            store[name] = constructor();
            return self;
        }

        this.run = function(injector) {
            if (!running) {
                pending.push({
                    constructor : initiateRunner,
                    arguments : [injector]
                });
            } else {
                initiateRunner(injector);
            }
            return self;
        }

        this.build = function(){
            if(running) return;
            running = true;
            var component;
            while (pending.length>0) {
                component = pending.shift();
                if (typeof component.constructor !== 'function') {
                    throw 'Unknown constructor for "'+component.name+'"';
                }
                component.constructor.apply(self,component.arguments);
            }
        };

        this.extend = function(name, exp){
            self[name] = exp;
            return self;
        }
        
        this.noop = function(){}

    }

        //check if browser or node
    if (typeof module !== 'undefined' && module.exports) {
        //node
        module.exports = lightNg;
    } else {
        //browser
        window.lightNg = lightNg;
    }

})();