# light-ng
A light framework that uses the same injector sintax as Angular.js (or Require.js). It was inspired by Angular, and uses the same sintax mostly.

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

a `run` function will get executed when the app is ready

```
lightNg('myApp').run(['user',function(user){
    var h1 = document.createElement('h1');
    h1.innerHTML = 'hello '+user.firstName+' '+user.lastName;
    document.body.append(h1);
}]);
```

all setup, let's start the app!
```
lightNg('myApp').build();

```

## Loading Modules

It's always a good Idea to keep reusable modules, below is the same example, only this time I will separate my logger function in a separated module

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
NOTE : use `include()` BEFORE the `.build()` call

```
lightNg('myApp')
    .include('logger')
    
    .service('user', ['logger', 'sayYeah', function(logger, sayYeah){
        this.firstName = 'John';
        this.lastName = 'Franklin';
        logger('User Ready');
    }])

    .run(['user','sayYeah',function(user, sayYeah){
        var h1 = document.createElement('h1');
        h1.innerHTML = 'hello '+user.firstName+' '+user.lastName;
        document.body.append(h1);
        sayYeah();
    }])

    .build();
```
