var bookcaseModel = function(connection) {
    var mongoose = require('mongoose');
    var bookModel = mongoose.model('Book');

    var bookcaseSchema = mongoose.Schema({
        name: { type: String, required: true, trim: true, default: '新书架' },
        books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]
    }, { collection: 'bookcases' });

    return connection.model('Bookcase', bookcaseSchema);
};

module.exports = bookcaseModel;