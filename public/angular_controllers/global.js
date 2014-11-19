var app = angular.module('karabamba', ['ngCookies', 'ui.bootstrap']);

var registerGlobalWSSocketMethods = function(socket, $scope) {

    if (!socket) return false;

    socket.on('connect', function(){
        //todo: прикрутить/написать обертку клиенского вызова json rpc api
        var session = /s:(.*)\./ig.exec($scope.cookies['connect.sid'])[1];
        var query = [{"jsonrpc":"2.0","method":"setSessionToSocket","params":{"session":session},"id":1}];
        socket.emit('jsonRPC', JSON.stringify(query));
    });


    socket.on('jsonRPCResponse', function(resp){
        console.log('jsonRPCResponse::', resp);
    });

    socket.on('connect_error', function(err){

    });

    socket.on('runScopeMethod', function (wsData) {
        var controller = angular.element('[ng-controller='+wsData.controllerName+']');
        if (!controller.length) return false;
        var scope = controller.scope();
        scope[wsData.methodName](wsData.argument);
        scope.$apply();
    });

};

app.controller('ModalInstanceCtrl', function ($scope, $modalInstance, content) {

    $scope.content = content;

    $scope.ok = function () {
        $modalInstance.close();
    };
});


var globalControllerScope = null;

/* Посути фронтенд апи вызываемое с бекенда */
app.controller('globalController', function($scope, $cookieStore, $modal, $cookies) {

    /* чтобы в консоле браузера можно было тестировать, например: globalControllerScope.modal("foo bar") */
    globalControllerScope = $scope;

    registerGlobalWSSocketMethods(socket, $scope);

    $scope.cookies = $cookies;

    /* присвоить куку */
    $scope.setCookies = function(obj) {
        $cookieStore.put(obj.name,obj.value);
    };

    /* перезагрузить страничку */
    $scope.reload = function() {
        location.reload();
    };

    /* можно выполнить произвольный код */
    $scope.eval = function(codeString) {
        eval(codeString);
    };

    /* модальное окно с произвольным содержимым */
    $scope.modal = function(content) {
        $modal.open({
            templateUrl: 'modal.html',
            controller: 'ModalInstanceCtrl',
            resolve: {
                content: function () {
                    return content;
                }
            }
        });
    };

    $scope.addToSession = function(data) {
        var query = {"jsonrpc":"2.0","method":"addToSession","params":data,"id":1};
        $.ajax({
            url: '/api',
            data: JSON.stringify(query),
            type: 'POST',
            cache: false,
            dataType : "json",
            success: function (response) {
                console.log('jsonRPCResponse post ajax::',response);
            }
        });
    };

    $scope.getSession = function() {
        var query = {"jsonrpc":"2.0","method":"getSession","params":{},"id":1};
        $.ajax({
            url: '/api',
            data: JSON.stringify(query),
            type: 'POST',
            cache: false,
            dataType : "json",
            success: function (response) {
                console.log('jsonRPCResponse post ajax::',response);
            }
        });
    };


    $scope.getUserInfo = function(cb) {
        var cb = cb || function(){},
            query = {"jsonrpc":"2.0","method":"getUserInfo","params":{},"id":1};
        $.ajax({
            url: '/api',
            data: JSON.stringify(query),
            type: 'POST',
            cache: false,
            dataType : "json",
            success: function (response) {
                cb(response);
            }
        });
    };


    //setTimeout(function() {
    //    $scope.getSession();
    //}, 1000);


});