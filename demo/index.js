const Tynee = require('../src/index');

Tynee('logger')

    .provider('logger',function(){
        var logger;
        if (console) {
            logger = console.log || Tynee.noop;
        }
        return logger;
    })

    .factory('sayYeah',['logger',function(logger){
        
        return function(){
            logger('yeaaaah!!!');
        }

    }])

Tynee('myApp')
    .include('logger')

    .service('user', ['logger', 'sayYeah', function(logger, sayYeah) {
        this.firstName = 'John';
        this.lastName = 'Franklin';
        logger('User Ready');
        sayYeah();
    }])

    .controller('userController',['user', function(user){

        console.log('hello '+user.firstName+' '+user.lastName)
        
    }])

    .run(['userController','logger',function(userController, logger) {
        //start user controller
        logger('Start User Controller');
        userController();
    }])

    .build();