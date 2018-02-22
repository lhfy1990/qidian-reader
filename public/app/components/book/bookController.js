angular.module('book')
    .controller('bookController', ['$http', '$routeParams', '$timeout', function($http, $routeParams, $timeout) {
        this.bookId = $routeParams.bookId;
        this.book = {
            _id: this.bookId,
            isNotFound: false
        };
        this.last_id_volume = null;
        this.last_id_chapter = null;
        this.page_volume = 1;
        this.page_size_volume = 10;
        this.page_chapter = 1;
        this.page_size_chapter = 10;
        this.page_content = 1;
        this.page_size_content = 1;
        this.getBook = (bookId) => {
            this.book.isNotFound = false;
            $http({
                method: 'GET',
                url: `/api/books/${bookId}`
            }).then(
                (success) => {
                    this.book = success.data;
                    let last_volume_index = -1;
                    let last_chapter_index = -1;
                    this.book.vs.forEach((elv, iv, av) => {
                        elv.cs.forEach((elc, ic, ac) => {
                            if (elc.id === this.book.readChapterId) {
                                last_volume_index = iv;
                                last_chapter_index = ic;
                            }
                        });
                    });
                    if (last_volume_index !== -1 && last_chapter_index !== -1) {
                        this.last_id_volume = this.book.vs[last_volume_index].vId;
                        this.last_id_chapter = this.book.readChapterId;
                        this.page_volume = parseInt(last_volume_index / this.page_size_volume) + 1;
                        this.page_chapter = parseInt(last_chapter_index / this.page_size_chapter) + 1;
                        this.initVolume(this.book.vs[last_volume_index]);
                    }
                    this.book.isNotFound = false;
                },
                (error) => {
                    this.book.isNotFound = true;
                }
            );
        };
        this.getChapter = (book, chapter) => {
            this.last_id_chapter = chapter.id;
            this.chapter = chapter;
            this.chapter._id = chapter.id;
            this.chapter.isNotFound = false;
            $http({
                method: 'GET',
                url: `/api/books/${book._id}/${chapter.id}`
            }).then(
                (success) => {
                    let chapter = success.data;
                    chapter.cN = this.chapter.cN;
                    chapter.isNotFound = false;
                    this.chapter = chapter;
                },
                (error) => {
                    this.chapter.isNotFound = true;
                }
            );
        };
        this.init = () => {
            this.initChapter();
            this.initVolume();
            this.getBook(this.bookId);
        };
        this.initChapter = () => {
            this.chapter = {
                _id: null,
                isNotFound: false
            };
        }
        this.initVolume = (volume = null) => {
            if (volume === null) {
                this.volume = {};
            } else {
                this.last_id_volume = volume.vId;
                this.volume = volume;
            }
        };
        this.init();
    }]);