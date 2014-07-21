describe('The User Service', function(){
    var User;

    beforeEach(module('pressconf'));

    beforeEach(inject(function(_User_){
        User = _User_;
    }));

    it('can login and logout', function(){
        User.login('bob');
        expect(User.username).toBe('bob');

        User.logout();
        expect(User.username).toBeUndefined();
    });
});