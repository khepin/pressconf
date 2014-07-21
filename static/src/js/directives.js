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