angular.module('home')
    .controller('homeController', ['$window', '$http', '$timeout', function($window, $http, $timeout) {
        this.user = null;
        this.bookcase = {};
        this.book = {};
        this.toBookcase = null;
        this.setUser = (user) => {
            $window.localStorage.setItem('user', JSON.stringify(user));
        };
        this.getUser = () => {
            return JSON.parse($window.localStorage.getItem('user')) || null;
        };
        this.enableEditBookcase = (bookcase) => {
            this.user.bookcases.forEach((elb, ib, ab) => { elb.isEditMode = false });
            bookcase.isEditMode = true;
            this.bookcase = JSON.parse(JSON.stringify(bookcase));
        }
        this.addBookcase = () => {
            let bookcase_added = {};
            $http({
                method: 'POST',
                url: `/api/bookcases`,
                data: {}
            }).then((success) => {
                bookcase_added = success.data;
                return $http({
                    method: 'PUT',
                    url: `/api/users/${this.user._id}`,
                    data: {
                        '$push': {
                            'bookcases': bookcase_added._id
                        }
                    }
                });
            }).then((success) => {
                this.user.bookcases.push(bookcase_added);
                this.setUser(this.user);
            }).catch((error) => { console.log(error); });
        };
        this.updateBookcase = (bookcase) => {
            let updated_bookcase = {
                name: this.bookcase.name
            };
            $http({
                method: 'PUT',
                url: `/api/bookcases/${bookcase._id}`,
                data: {
                    '$set': updated_bookcase
                }
            }).then((success) => {
                let index_bookcase = this.user.bookcases.findIndex((elb, ib, ab) => { return elb._id === this.bookcase._id; });
                if (index_bookcase !== -1) {
                    this.user.bookcases[index_bookcase].name = this.bookcase.name;
                } else {
                    // TODO: error message here
                    this.user.bookcases.push(this.bookcase);
                }
                this.bookcase = {};
                this.book = {};
                this.toBookcase = null;
                bookcase.isEditMode = false;
                this.setUser(this.user);
            }, (error) => {});
        };
        this.removeBookcase = (bookcase) => {
            $http({
                method: 'DELETE',
                url: `/api/bookcases/${bookcase._id}`
            }).then((success) => {
                return $http({
                    method: 'PUT',
                    url: `/api/users/`,
                    data: {
                        query: {},
                        update: { $pull: { 'bookcases': bookcase._id } },
                        options: { multi: true, upsert: false }
                    }
                });
            }).then((success) => {
                let index_bookcase = this.user.bookcases.indexOf(bookcase);
                if (index_bookcase !== -1) {
                    this.user.bookcases.splice(index_bookcase, 1);
                }
                this.setUser(this.user);
            }).catch((error) => {});
        };
        this.enableEditBook = (book, bookcase) => {
            bookcase.books.forEach((elb, ib, ab) => { elb.isEditMode = false });
            book.isEditMode = true;
            this.book = JSON.parse(JSON.stringify(book));
        };
        this.moveBook = (book, fromBookcase, toBookcase) => {
            let book_c = JSON.parse(JSON.stringify(book));
            let toBookcase_c = JSON.parse(JSON.stringify(toBookcase));
            $http({
                method: 'PUT',
                url: `/api/bookcases/${toBookcase._id}`,
                data: {
                    '$push': { books: book_c._id }
                }
            }).then((success) => {
                let index_bookcase = this.user.bookcases.findIndex((elbc, ibc, abc) => { return elbc._id === toBookcase_c._id });
                if (index_bookcase !== -1) {
                    this.user.bookcases[index_bookcase].books.push(book_c);
                }
                this.setUser(this.user);
            }, (error) => {});
            $http({
                method: 'PUT',
                url: `/api/bookcases/${fromBookcase._id}`,
                data: {
                    '$pull': { books: book_c._id }
                }
            }).then((success) => {
                let index_book = fromBookcase.books.findIndex((elb, ib, ab) => { return elb._id === book_c._id });
                if (index_book !== -1) {
                    fromBookcase.books.splice(index_book, 1);
                }
                this.setUser(this.user);
            }, (error) => {});
            this.book = {};
            this.toBookcase = null;
        };
        this.addBook = (book, bookcase) => {
            let book_c = JSON.parse(JSON.stringify(book));
            if (!book_c._id) {
                console
                $http({
                    method: 'POST',
                    url: `/api/books/`,
                    data: book
                }).then((success) => {
                    book_c = success.data;
                    return $http({
                        method: 'PUT',
                        url: `/api/bookcases/${bookcase._id}`,
                        data: {
                            '$push': { books: book_c._id }
                        }
                    });
                }).then((success) => {
                    bookcase.books.push(book_c);
                    this.book = {};
                    this.toBookcase = null;
                    this.setUser(this.user);
                }).catch((error) => {});
            } else {
                $http({
                    method: 'PUT',
                    url: `/api/bookcases/${bookcase._id}`,
                    data: {
                        '$push': { books: book_c._id }
                    }
                }).then((success) => {
                    bookcase.books.push(book_c);
                    this.book = {};
                    this.setUser(this.user);
                }, (error) => {});
            }
        };
        this.removeBook = (book, bookcase) => {
            $http({
                method: 'PUT',
                url: `/api/bookcases/${bookcase._id}`,
                data: {
                    '$pull': { books: book._id }
                }
            }).then((success) => {
                let index_book = bookcase.books.findIndex((elb, ib, ab) => { return elb._id === book._id });
                if (index_book !== -1) {
                    bookcase.books.splice(index_book, 1);
                }
                this.book = {};
                this.toBookcase = null;
                this.setUser(this.user);
            }, (error) => {});
        };
        this.updateBook = (book) => {
            if (book._id) {
                let updated_book = JSON.parse(JSON.stringify(book));
                delete updated_book._id;
                $http({
                    method: 'PUT',
                    url: `/api/books/${book._id}`,
                    data: {
                        '$set': updated_book
                    }
                }).then((success) => {
                    this.user.bookcases.forEach((elbc, ibc, abc) => {
                        let index_book = elbc.books.findIndex((elb, ib, ab) => { return elb._id === book._id });
                        if (index_book !== -1) {
                            elbc.books[index_book] = book;
                        }
                    });
                    this.book = {};
                    this.toBookcase = null;
                    this.setUser(this.user);
                }, (error) => {});
            }
        };
        this.getBooks = (type, keyword) => {
            let params = {};
            switch (type) {
                case 'name':
                    params.name = keyword;
                    break;
                case 'author':
                    params.author = keyword;
                    break;
                case 'bId':
                    params.bId = keyword;
                    break;
                default:
                    break;
            };
            return $http({
                method: 'GET',
                url: `/api/books`,
                params: params
            }).then((success) => {
                let books_added = [];
                this.user.bookcases.forEach((elbc, ibc, abc) => { books_added = books_added.concat(elbc.books.map((elb, ib, ab) => elb._id)); });
                return success.data.filter((elb, ib, ab) => { return books_added.indexOf(elb._id) === -1; });
            }, (error) => {});
        };
        this.applyTypeahead = ($item, $model, $label, $event) => {
            this.book = $item;
        };
        this.init = () => {
            this.user = this.getUser();
        };
        $timeout(this.init, 100);
    }]);