let home = angular.module('home', ['ui.bootstrap']);
let user = angular.module('user', ['ui.bootstrap', 'ngCookies']);
let book = angular.module('book', ['ui.bootstrap']);
let module = angular.module('modules', ['home', 'user', 'book']);