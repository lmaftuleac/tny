# light-ng (V.2.x.x)
A very light framework that uses the same injector sintax as Angular.js (or Require.js). It was inspired by Angular, and uses the same sintax mostly.
It can be used in browsers and node environment, it's really tiny (2.2kb). Uses ecma 5

## Why another framework?
It's usefull to create tiny encapsulated apps. While Angular React or other frameworks require heavy libraries, 
lightNg can keep a good, modular structure of the code and be almost invisible to other libraries

## Version update
This readme is for v.2.x.x for v.1 check [README-v.1.0.1](https://github.com/lmaftuleac/light-ng/blob/master/README-v1.0.1.md)

## Getting Started

Similar to Angular, first you need to create a module 

```
lightNg('myApp');
```

Then add a provider, let's say a conosle.log shortcut, but remember some IE browsers throw errors on console.log

```
lightNg('myApp').provider('logger',function(){
    var logger;
    if (console) {
        logger = console.log || lightNg.noop;
    }
    return logger;
});
```

create a service

```
lightNg('myApp').service('user', ['logger',function(logger){
    this.firstName = 'John';
    this.lastName = 'Franklin';
    logger('User Ready');
}]);
```

create a controller

```
lightNg('myApp').controller('userController',['user', function(user){
    var h1 = document.createElement('h1');
    h1.innerHTML = 'hello '+user.firstName+' '+user.lastName;
    document.body.append(h1);
}])
```

a `run` function will get executed when the app is ready

```
lightNg('myApp').run(['userController',function(userController){
    logger('Start User Controller');
    userController();
}]);
```

all setup, let's start the app!
```
lightNg('myApp').build();

```

## Loading Modules

It's always a good Idea to keep reusable modules, below is the same example, only this time I will keep my logger function in a separated module

```
lightNg('logger')

    .provider('logger',function(){
        var logger;
        if (console) {
            logger = console.log || lightNg.noop;
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
Then use the `.include()` method. 
*Note :* use `include()` BEFORE the `.build()` call

```
lightNg('myApp')
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

## Guide

Below will be the explenation of each component of the framework

### Provider
A Provider is a function that gets executed as it's declared, and doesn't wait for `build()` to be called. Unlike Angular, it doesn't have injectors, meaning that you can't incude a provider in another provider. It's used as a pre-configuration function. lightNg will keep the responce of the function as the injectable value

```
ligtNg('myApp')
    
    .provider('appConfig',function(){
        return {
            host : 'http://github.com',
            path : '/lmaftuleac/light-ng'
        }
    })
```
### Factory
A Factory is a function that gets executed after the `.build()` call. Similar to Angular's factory, the returned value serves as injectable value for other components.


*Note :* A factory must be declared with injector array `.factory('factoryName',[function(){}]` even if the function doesn't have any arguments.

```
ligtNg('myApp')
    
    .factory('appRoot',['appConfig'function(){
        return appConfig.host + appConfig.path;
    }])

//or

ligtNg('myApp')
    
    .factory('getAppRoot',['appConfig'function(){
        return function(){ 
            return appConfig.host + appConfig.path 
        };
    }])
```

### Service
A Service is a constructor function that gets executed after the `.build()` call. Similar to Angular's Service, it serves as a constructor for the output object 


*Note :* A Service must be declared with injector array `.service('factoryName',[function(){}]` even if the function doesn't have any arguments.

```
ligtNg('myApp')
    
    .service('user',[function(){
        
        this.firstName = 'John';
        this.lastName = 'Franklin';
        
        this.sayHi = function(){
            return 'Hi!, i'm '+ this.firstName + ' ' + this.lastName;
        }

    }])

```

### Controller

A Controller is a function that can be executed only once after the `build()` call. It can be injected, but can be called only once


*Note :* A Service must be declared with injector array `.service('factoryName',[function(){}]` even if the function doesn't have any arguments.

```
ligtNg('myApp')
    
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

Similar to Angular's `.run()` it's a function that get's executed immediately after the `.build()` call. There can be more than one `.run` functions, and will be 
executed in order of their declaration. 

```
ligtNg('myApp')

    .run([function(){
        console.log('I will be called first');
    }])    

    .run(['userController',function(){
        console.log('I will be called second');
        userController();
    }]);
```

### Build

This function is to be called once all the modules are loaded. It's similar to Angular's `.bootstrap()`, only it doesn't have any arguments or parameters.

```
ligtNg('myApp')

    .run([function(){
        console.log('I will be called first');
    }])    

    .run([function(){
        console.log('I will be called second');
    }]);

    .build();
```

### Include

lightNg can have a modular structure. In order to load a module, use `lightNg('myApp').include('preBuiltModule')`;
