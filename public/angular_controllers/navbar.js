
app.controller('navbarController', function($scope) {
    $scope.onlineCount = 0;

    $scope.setOnlineCount = function(count) {
        $scope.onlineCount = count;
    };
});