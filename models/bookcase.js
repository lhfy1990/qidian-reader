let bookcaseModel = function(connection) {
    let mongoose = require('mongoose');
    let bookModel = mongoose.model('Book');

    let bookcaseSchema = mongoose.Schema({
        name: { type: String, required: true, trim: true, default: 'New Bookcase' },
        books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]
    }, { collection: 'bookcases' });

    return connection.model('Bookcase', bookcaseSchema);
};

module.exports = bookcaseModel;