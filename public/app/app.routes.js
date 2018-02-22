'use strict';

let app = angular.module('restApp', ['ngRoute', 'modules']);

app.config(($routeProvider) => {
  $routeProvider
    .when('/home', {
      templateUrl: 'app/components/home/homeView.html'
    })
    .when('/user', {
      templateUrl: 'app/components/user/userView.html'
    })
    .when('/books/:bookId', {
      templateUrl: 'app/components/book/bookView.html',
      controller: 'bookController as book'
    })
    .otherwise({
      redirectTo: '/home'
    });
});