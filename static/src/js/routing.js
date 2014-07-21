angular.module('pressconf').config(
	['$routeProvider',
	function($routeProvider){
		$routeProvider
			.when('/', {
				templateUrl: 'templates/home.html'
			})
			.when('/new', {
				templateUrl: 'templates/create.html'
			})
			.when('/join', {
				templateUrl: 'templates/list.html'
			})
			.when('/conferences/:confName', {
				templateUrl: 'templates/conference.html'
			})
			.otherwise({
				redirectTo: '/'
			})
	}
	]
);