let bookModel = function(connection) {
     let mongoose = require('mongoose'); 
     /* TODO: this is the schema from QiDian
     let chpaterSchema = mongoose.Schema({
          uuid: { type: Number, required: true }, // chapter incremental id within this book
          cN: { type: String }, // chapter name; required unknown
          uT: { type: Date }, // upload time; required unknown
          cnt: { type: Number }, // words count; required unknown
          cU: { type: String }, // chapter url; required, validator unknown
          id: { type: Number, required: true }, // chapter _id
          sS: { type: Number, enum: [0, 1] } // subscription status; required, enum unknown
     }, { _id: false });
     let volumeSchema = mongoose.Schema({
          vId: { type: Number, required: true },
          cCnt: { type: Number }, // chapter count; required, range unknown
          vS: { type: Number, required: true, enum: [0, 1] }, // vip status; required, enum unknown
          isD: { type: Number, enum: [0] }, // unknown, did not see value other than 0
          vN: { type: String }, // volume name; required unknown
          wC: { type: Number }, // words count; required unknown
          hS: { type: Boolean }, // unkown, looks to be true on vip volumes
          cs: { type: [chpaterSchema] } // chapters; required unknown
     }, { _id: false });
     let bookSchema = mongoose.Schema({
          _id: { type: Number, required: true },
          bN: { type: String, required: false },
          isPublication: { type: Number, enum: [0] }, // required, enum unknown
          salesMode: { type: Number }, // required, enum unknown
          chapterTotalCnt: { type: Number }, // required, range unknown
          firstChapterJumpurl: { type: String }, // required, validator unknown
          loginStatus: { type: Number, enum: [1] }, // required, enum unknown
          hasRead: { type: Number, enum: [0, 1] }, // required unknown
          readProgress: { type: String, required: false }, // last read chapter title, required when hasRead is 1
          readChapterId: { type: Number, required: false }, // last read chapter _id, required when hasRead is 1
          readChapterUrl: { type: String, required: false }, // last read chapter url, required when hasRead is 1
          vs: { type: [volumeSchema] } // volumes; required unknown
     });
     */
     let bookSchema = mongoose.Schema({
          bId: { type: Number, required: true, unique: true },
          name: { type: String, required: false, trim: true },
          author: { type: String, required: false, trim: true },
          abstract: { type: String, required: false, trim: true }
     }, { collection: 'books' });

     return connection.model('Book', bookSchema);
};
module.exports = bookModel;