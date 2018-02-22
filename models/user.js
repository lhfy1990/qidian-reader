var userModel = function(connection) {
    var mongoose = require('mongoose');
    var bookcaseModel = mongoose.model('Bookcase');

    var userSchema = mongoose.Schema({
        username: { type: String, required: true, trim: true, unique: true },
        password: { type: String, required: true, trim: true },
        cookies: { type: String, required: false },
        bookcases: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bookcase' }],
            required: false
        }
    }, { collection: 'users' });

    return connection.model('User', userSchema);
};
module.exports = userModel;