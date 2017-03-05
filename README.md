# light-ng
A light framework that uses the same injector sintax as Angular.js (or Require.js). It was inspired by Angular, and uses the same sintax mostly.

## Getting Started

Similar to Angular, first you need to create a module 

```
var myApp = new lightNg();
```

Then add a provider, let's say a conosle.log shortcut, but remember some IE browsers throw errors on console.log

```
myApp.provider('logger',function(){
    var logger;
    if (console) {
        logger = console.log || lightNg.noop;
    }
    return logger;
});
```

create a service

```
myApp.service('user', [function(){
    this.firstName = 'John';
    this.lastName = 'Franklin';
    logger('User Ready');
}]);
```

when the app is ready, greet the user

```
myApp.run(['user',function(user){
    var h1 = document.createElement('h1');
    h1.innerHTML = 'hello '+user.firstName+' '+user.lastName;
    document.body.append(h1);
}]);
```

start the app!
```
myApp.build();

```



