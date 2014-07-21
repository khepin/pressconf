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
