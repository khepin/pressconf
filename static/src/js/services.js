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

	function silence(participant) {
		var found = session.streams.find(function(stream){
			return stream.connection.id === participant.connection.id;
		});

		session.forceUnpublish(found);
	}

	function init() {
		session.on('signal:connection', function(event){
			participants.push({
				name: event.data.username,
				connection: event.from,
				id: event.from.id,
				hasQuestion: false
			});
			$rootScope.$digest();
		});
	}

	function getSession(sessId) {
		if (sessId) {
			session = OT.initSession('44902802', sessId);
			init();
		}
		return session;
	}

	function connect() {
		session.on('signal:okquestion', function(){
			$rootScope.$broadcast('icantalk');
		});

		var streams = 0;
		session.on('streamCreated', function(event){
			if (streams === 0 && User.role !== 'moderator') {
				$rootScope.$broadcast('stream:main', event);
			} else {
				$rootScope.$broadcast('stream:secondary', event);
			}
			streams++;
		});

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