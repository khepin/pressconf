angular.module('pressconf', ['ngRoute', 'restangular']).config(['RestangularProvider', function(RAProvider){
	RAProvider.setBaseUrl('api');
}]);