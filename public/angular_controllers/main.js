/**
 * Example angular controller
 */

app.directive('spendingDatepickerList', function($compile) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        templateUrl: '/spending-template-datepicker.html',
        compile: function(element, attrs, transclude) {
            return function(scope) {
                transclude(scope.$parent, function(clone) {
                    scope.spendingDatepickerList = JSON.parse( clone.html() );
                });
            }
        }
    };
});

app.filter('sortByName', function() {
    return function(array, name) {
        var sortArray = _.sortBy(array, function(item){
            return item[name];
        });
        if (JSON.stringify(sortArray) == JSON.stringify(array)) {
            sortArray.reverse();
        }
        return sortArray;
    };
});

app.filter('sortByNum', function() {
    return function(array, num) {
        var sortArray = _.sortBy(array, function(item){
            return item[num];
        });
        if (JSON.stringify(sortArray) == JSON.stringify(array)) {
            sortArray.reverse();
        }
        return sortArray;
    };
});

app.controller('mainController', function($scope, $filter, $cookies) {

    //console.log( $cookies['SESSION-GUID'] );

    $scope.spendingDatepickerList = [];

    $scope.alerts = [{msg: 'Example alert', type: 'success'}];

    $scope.addAlert = function(msg) {
        $scope.alerts.push({msg: msg});
    };

    $scope.link = function(link) {
        window.location.assign(link);
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.sortByName = function(name) {
        $scope.spendingDatepickerList = $filter('sortByName')($scope.spendingDatepickerList, name);
    };

    $scope.sortByNum = function(num) {
        $scope.spendingDatepickerList = $filter('sortByNum')($scope.spendingDatepickerList, num);
    };


});



