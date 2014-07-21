angular.module('pressconf', ['ngRoute', 'restangular']).config(['RestangularProvider', function(RAProvider){
	RAProvider.setBaseUrl('api');
}]);

angular.module('pressconf')
/**
 * MainCtrl
 *
 * Puts the session user on the scope, allows login and logout
 */
.controller('MainCtrl',
	['User', '$scope', function(User, $scope){
		$scope.user = User;

		$scope.login = User.login;
		$scope.logout = User.logout;
	}]
)
/**
 * CreateConfCtrl
 *
 * Allows a user to create a new press conference
 */
.controller('CreateConfCtrl',
	['$scope', 'Restangular', '$location', 'User', function($scope, RA, $location, User){

		$scope.createConf = function(name) {
			var conf = {
				name: name,
				author: User.username
			};

			RA.all('conferences').post(conf).then(function(conference){
				$location.path('/conferences/' + conference.name);
			});
		}
	}]
)
/**
 * ConfListCtrl
 *
 * Lists all currently available conferences
 */
.controller('ConfListCtrl',
	['$scope', 'Restangular', function($scope, RA){
		RA.all('conferences').getList().then(function(conferences){
			$scope.conferences = conferences;
		});
	}]
)
/**
 * ConfCtrl
 *
 * Manages a conference, asking questions, allowing participants to take the
 * mic and ask things.
 */
.controller('ConfCtrl',
	['$scope', 'Restangular', '$routeParams', 'User', 'OtSession',
	function($scope, RA, $routeParams, User, OtSession) {
		$scope.OtSession = OtSession;
		$scope.user = User;
		var session;

		/**
		 * Request the right to ask a question from the conference organizer
		 */
		$scope.ask = function() {
			session.signal({
				type: 'ask'
			});
		};

		/**
		 * As the organizer, allow a given participant to ask a question and start
		 * their stream.
		 */
		$scope.allowQuestion = function(participant) {
			// Stop the stream from other participants first
			var talker = _.find($scope.participants, {talking: true})
			if (talker) {
				OtSession.silence(talker);
			}
			// Let this participant talk
			var client = participant.connection;
			participant.talking = true;
			participant.hasQuestion = false;

			session.signal({
				to: client,
				type: 'okquestion'
			});
		};

		/**
		 * As the organizer, shut off another participant's stream.
		 */
		$scope.stopQuestion = function(participant) {
			OtSession.silence(participant);
		};

		RA.one('conferences', $routeParams.confName).get().then(function(conf){
			$scope.conf = conf;


			RA.one('conferences', conf.name).all('participants').post({name: User.username}).then(function(user){
				User.role = user.role;
				User.token = user.token;
				session = OtSession.getSession(conf.sessionId);
				$scope.participants = OtSession.participants;

				OtSession.connect();
			});
		});
	}]
);


angular.module('pressconf')
/**
 * Directive for the person holding the press conference. Shown over the whole screen.
 */
.directive('pcMainVideo',
	['User', function(User){
		return {
			restrict: 'AE',
			scope: {
				session: '='
			},
			link: function(scope, attrs, el){
				var element = el.$$element[0];
				scope.$on('otsession:connected', function(){
					if (User.role === 'moderator') {
						var publisher = OT.initPublisher(element, {width: '100%', height: $('body').height() - $('nav.top-bar').height()});
						scope.session.getSession().publish(publisher);
					}
				});

				scope.$on('stream:main', function(ngEvt, event) {
					scope.session.getSession().subscribe(event.stream, element, {width: '100%', height: $('body').height() - $('nav.top-bar').height()});
				});
			}
		}
	}]
)
/**
 * Video for the person currently asking a question.
 */
.directive('pcAskerVideo',
	[function(){
		return {
			restrict: 'AE',
			scope: {
				session: '='
			},
			link: function(scope, attrs, el) {
				scope.$on('icantalk', function(){
					var element = $(el.$$element[0]).find('div')[0];
					$(element).after('<div></div>');
					var publisher = OT.initPublisher(element);
					scope.session.getSession().publish(publisher);
				});

				scope.$on('stream:secondary', function(ngEvt, event){
					var element = $(el.$$element[0]).find('div')[0];
					$(element).after('<div></div>');
					scope.session.getSession().subscribe(event.stream, element);
				});
			}
		}
	}]
);

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

console.log('yohhoo')

angular.module('pressconf')
/**
 * User
 *
 * The session user
 */
.factory('User', function(){
	var user = {
		login: function(name) {
			user.username = name;
			localStorage.setItem('username', name);
		},
		logout: function() {
			localStorage.removeItem('username');
			user.username = null;
			delete user.username;
		}
	};

	if (localStorage.getItem('username')) {
		user.username = localStorage.getItem('username');
	}
	return user;
})
/**
 * OtSession
 *
 * OpenTok session
 */
.factory('OtSession',
	['User', '$rootScope', function(User, $rootScope){
	var session, participants = [];

	var OtSession = {
		getSession: getSession,
		connect: connect,
		participants: participants,
		silence: silence
	}

	/**
	 * Shut off the stream of another participant and mark that user
	 * as not talking anymore.
	 */
	function silence(participant) {
		participant.talking = false;
		var found = session.streams.find(function(stream){
			return stream.connection.id === participant.connection.id;
		});

		session.forceUnpublish(found);
	}

	/**
	 * Adds a participant to the list, or if this is a known participant,
	 * update their connection information.
	 */
	function addParticipant(signalEvent) {
		var existing = _.find(participants, function(participant) {
			return participant.name === signalEvent.data.username;
		});
		if (existing) {
			// Update existing participant
			existing.connection = signalEvent.from;
			existing.id = signalEvent.from.id;
			return existing;
		}
		var p = {
			name: signalEvent.data.username,
			connection: signalEvent.from,
			id: signalEvent.from.id
		};
		participants.push(p);

		return p;
	}

	/**
	 * Register event handlers on the session
	 */
	function registerListeners() {
		// On new connection, add participant and say hello
		session.on('signal:connection', function(event){
			var participant = addParticipant(event);

			session.signal({
				type: 'hello',
				data: {
					username: User.username
				}
			});

			$rootScope.$digest();
		});

		// On hello, add participants to the list
		session.on('signal:hello', function(event){
			addParticipant(event);
			$rootScope.$digest();
		});

		// Trigger internal event that we have the right to ask a
		// question now
		session.on('signal:okquestion', function(){
			$rootScope.$broadcast('icantalk');
		});

		var streams = 0;
		session.on('streamCreated', function(event){
			// The first stream created is the one of the conference creator
			if (streams === 0 && User.role !== 'moderator') {
				$rootScope.$broadcast('stream:main', event);
			} else {
				// Others come from people asking questions
				$rootScope.$broadcast('stream:secondary', event);
			}
			streams++;
		});

		// Mark participant as not talking if their stream has gone away
		session.on('streamDestroyed', function(event){
			// Find if this is a participant's stream. If yes, mark him as not talking anymore
			var participant = _.find(participants, function(p){
				return p.connection.id === event.stream.connection.id;
			});
			participant.talking = false;
			$rootScope.$digest();
		});
	}

	function getSession(sessId) {
		if (sessId) {
			session = OT.initSession('44902802', sessId);
			registerListeners();
		}
		return session;
	}

	function connect() {
		session.connect(User.token, function(error) {
			$rootScope.$broadcast('otsession:connected');
			if (User.role === 'moderator') {
			    session.on('signal:ask', function(event){
		    		var asker = _.find(participants, {connection: event.from});
		    		asker.hasQuestion = true;
		    		$rootScope.$digest();
			    });
			} else {
				session.signal({
					type: 'connection',
					data: {
						username: User.username
					}
				});
			}
		});
	}

	return OtSession;
}]);

//# sourceMappingURL=build.js.map