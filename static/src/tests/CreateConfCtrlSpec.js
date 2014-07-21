describe('CreateConfCtrl', function(){
    var $controller, $httpBackend;

    beforeEach(module('pressconf'));

    beforeEach(inject(function(_$controller_, _$httpBackend_){
        $controller = _$controller_;
        $httpBackend = _$httpBackend_;
    }));

    it('sends a conf object to the server', function(){
        var $scope = {};
        var ctrl = $controller('CreateConfCtrl', {$scope: $scope});

        $httpBackend.expectPOST('api/conferences', {name: 'myConf'}).respond({name: 'myConf'});

        $scope.createConf('myConf');

        $httpBackend.flush();
    });
});