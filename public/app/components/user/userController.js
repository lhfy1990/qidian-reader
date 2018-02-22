angular.module('user')
    .controller('userController', ['$window', '$timeout', '$http', '$cookies', function($window, $timeout, $http, $cookies) {
        this.cookies = '';
        this.book = {
            type: 'push'
        };
        this.books = [];
        this.user = null;
        this.credential = {};
        this.signIn = (credential) => {
            if (typeof credential.username !== 'undefined' && typeof credential.password !== 'undefined' && credential.username !== '' && credential.password !== '') {
                $http({
                    method: 'POST',
                    url: `/api/users/${credential.username}`,
                    data: {
                        password: credential.password
                    }
                }).then(
                    (success) => {
                        this.user = success.data;
                        this.cookies = this.user.cookies;
                        this.credential = {};
                        this.setUser(this.user);
                        this.setCookies(this.user.cookies);
                    }, (error) => {
                        this.credential = {};
                    });
            }
        };
        this.signUp = (credential) => {
            if (typeof credential.username !== 'undefined' && typeof credential.password !== 'undefined' && credential.username !== '' && credential.password !== '') {
                $http({
                    method: 'POST',
                    url: `/api/users/`,
                    data: {
                        username: credential.username,
                        password: credential.password
                    }
                }).then(
                    (success) => {
                        this.user = success.data;
                        this.cookies = this.user.cookies;
                        this.credential = {};
                        this.setUser(this.user);
                        this.setCookies(this.user.cookies?this.user.cookies:'');
                    }, (error) => {
                        this.credential = {};
                    });
            }
        };
        this.signOut = () => {
            this.user = null;
            this.cookies = '';
            this.book = { type: 'push' };
            this.clearCookies();
            this.setUser(this.user);
        };
        // Cookies
        this.setCookies = (str_cookies) => {
            $http({
                method: 'PUT',
                url: `/api/users/${this.user._id}`,
                data: {
                    '$set': { cookies: str_cookies }
                }
            }).then((success) => {
                this.user.cookies = this.cookies;
                this.clearCookies();
                str_cookies.split(/; */).forEach((e, i, a) => {
                    let keyValue = e.split('=');
                    if (keyValue.length === 2) {
                        $cookies.put(keyValue[0], keyValue[1]);
                    }
                });
            }, (error) => {
                this.cookies = '';
            });
        };
        this.getCookies = () => {
            let cookies = $cookies.getAll();
            return Object.keys(cookies).map((e, i, a) => {
                return e + '=' + cookies[e];
            }).join(';');
        };
        this.clearCookies = () => {
            let cookies = $cookies.getAll();
            Object.keys(cookies).forEach((e, i, a) => {
                $cookies.remove(e);
            });
        };
        // User
        this.setUser = (user) => {
            $window.localStorage.setItem('user', JSON.stringify(user));
        };
        this.getUser = () => {
            return JSON.parse($window.localStorage.getItem('user')) || null;
        };
        this.init = () => {
            this.user = this.getUser();
            this.book = { type: 'push' };
            this.cookies = this.getCookies();
        };
        $timeout(this.init, 100);
    }]);