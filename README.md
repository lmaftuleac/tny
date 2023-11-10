# Tny - A tiny framework for tiny apps

A tiny framework for tiny apps. It resembles Require.js and Angular.js - only it's much smaller and simpler.
The idea behind Tny is to have small apps that can be easily encapsulated and reused. It's not a replacement for Angular or React, but rather a framework that can run alongside them and not interfere with their functionality. Although it was created for Browser mostly, it can be used in Node.js as well.

## Getting Started

First you need to create a module 

```
Tny('demoApp');
```

A `provider` is a function that returns any data that can be injected in other components. It's executed as it's declared, and doesn't wait for `build()` to be called. It doesn't have injectors, meaning that you can't incude a provider in another provider. It's used as a pre-configuration function. Tny will keep the responce of the function as the injectable value

```
Tny('demoApp').provider('logger',function(){
    var logger;
    if (console) {
        logger = console.log || Tny.noop;
    }
    return logger;
});
```

A `service` is a constructor function that gets executed after the `.build()` call. Similar to Angular.js's Service, it serves as a constructor for the output object

```
Tny('demoApp').service('user', ['logger',function(logger){
    this.firstName = 'John';
    this.lastName = 'Franklin';
    logger('User Ready');
}]);
```

A `controller` is a function that can be executed only once after the `build()` call. It can be injected, but can be called only once.

```
Tny('demoApp').controller('userController',['user', function(user){
    var h1 = document.createElement('h1');
    h1.innerHTML = 'hello '+user.firstName+' '+user.lastName;
    document.body.append(h1);
}])
```

`run` functions will get executed when the app is ready. Think of it as the main starting poit of the app. Altho many `run` functions can be declared, they will be executed in order of their declaration.

```
Tny('demoApp').run(['userController',function(userController){
    logger('Start User Controller');
    userController();
}]);
```

All setup, let's start the app by calling `build()`. Once `build()` is called, no more components can be added to the module.
```
Tny('demoApp').build();

```

## Loading Modules

It's always a good Idea to keep reusable modules. Tny can load modules from other files. Let's say we have a module called `logger.js` which looks like this:

```
Tny('logger')

    .provider('logger',function(){
        var logger;
        if (console) {
            logger = console.log || Tny.noop;
        }
        return logger;
    })

    .factory('sayYeah',['logger',function(logger){
         return function(){
            logger('Ohhh Yeaaaah!!!');
        }
    }])
;
```
Use `include()` to load the module.
*Note :* use `include()` BEFORE the `.build()` call, this allows dependency injection to access the components from the included module.

```
Tny('demoApp')
    .include('logger')
    
    .service('user', ['logger', 'sayYeah', function(logger, sayYeah){
        this.firstName = 'John';
        this.lastName = 'Franklin';
        logger('User Ready');
    }])

    .controller('userController',['user', 'sayYeah' function(user, sayYeah){
        var h1 = document.createElement('h1');
        h1.innerHTML = 'hello '+user.firstName+' '+user.lastName;
        document.body.append(h1);
        sayYeah();
    }])

    .run([userController,function(userController){
        userController();
    }])

    .build();
```
___

## API Reference

### Provider
A Provider is a function that returns any data that can be injected in other components. It's executed as it's declared, and doesn't wait for `build()` to be called. It doesn't have injectors, meaning that you can't incude a provider in another provider. It's used as a pre-configuration function. Tny will keep the responce of the function as the injectable value. Providers are used mostly for configuration purposes.

```
Tny('demoApp')
    
    .provider('appConfig',function(){
        return {
            host : 'localhost',
            port : '8080'
        }
    })
```
### Factory

A Provider is a function that returns any data that can be injected in other components. It has dependency injectors, meaning that you can include other providers in it. Unlike Providers, Factories are executed only after the `build()` call.

```
Tny('demoApp')
    
    .factory('BaseUrl',[ 'appConfig', function(){
        return appConfig.host + appConfig.path;
    }])

//or

Tny('demoApp')
    
    .factory('getAppRoot',['appConfig', function(){
        return function(){ 
            return appConfig.host + appConfig.path 
        };
    }])
```

### Service
* DEPRECATED *

A Service is a constructor function that gets executed after the `.build()` call. Similar to Angular's Service, it serves as a constructor for the output object. It has dependency injectors, meaning that you can include other providers in it. Services are executed only after the `build()` call.


*Note :* As the arrow functions don't have their own `this` context, they can't be used as a service constructor. use a regular function instead of an arrow function.



```
Tny('demoApp')
    
    .service('user',[function() {
        
        this.firstName = 'John';
        this.lastName = 'Franklin';
        
        this.sayHi = function(){
            return 'Hi!, i'm '+ this.firstName + ' ' + this.lastName;
        }

    }])

```

### Controller

A Controller is a function that can be executed only once after the `build()` call. It can be injected, but can be called only once

```
Tny('demoApp')
    
    .controller('userController',['user',function(user){
        user.firstName = 'Johnny';
        user.lastName = 'B goode';
        user.sayHi();
    }])

    .run(['userController',function(){
        userController();
        userController(); // will throw an error
    }]);
```

### Run

`run` functions will get executed when the app is ready. Think of it as the main starting poit of the app. Altho many `run` functions can be declared, they will be executed in order of their declaration.

```
Tny('demoApp')

    .run([() => {
        console.log('I will be called first');
    }])    

    .run(['userController',() => {
        console.log('I will be called second');
        userController();
    }]);
```

### Build

This function is to be called once all the modules are loaded. It's similar to Angular's `.bootstrap()`, only it doesn't have any arguments or parameters.

```
Tny('demoApp')

    .run([function(){
        console.log('I will be called first');
    }])    

    .run([function(){
        console.log('I will be called second');
    }]);

    .build();
```

### Include

Tny can load modules. A module can be included using .include() method. Use `include()` BEFORE the `.build()` call, this allows dependency injection to access the components from the included module.

```
Tny('demoApp')

    .include('Logger')

    .run([function(){
        //I can inject here components from Logger module
    }])

    .build();
```
