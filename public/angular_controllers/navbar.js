
app.controller('navbarController', function($scope) {
    $scope.onlineCount = 0;

    $scope.user = null;

    $scope.setOnlineCount = function(count) {
        $scope.onlineCount = count;
    };

    //console.log($scope.$parent.getUserInfo);

    $scope.$parent.getUserInfo(function(response){
        $scope.user = response.result.user;
        $scope.$apply();
    });
});