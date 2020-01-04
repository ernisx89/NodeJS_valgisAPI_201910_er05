const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-currency').loadType(mongoose); 
const Currency = mongoose.Types.Currency;

const commentSchema = new Schema({ /* creating subdocument */
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId, //reference to user document
        ref: 'User'
    }
}, {
    timestamps: true
});

const valgisSchema = new Schema({
    name: {
        type: String,
        required: true, 
        unique: true, /* meaning that no two documents should have the same name field in there. */ 
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: ''
    },
    label: {
        type: String,
        required: true
    },
    price: {
        type: Currency,
        required: true,
        min: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    comments: [ commentSchema ] /*every dish object, dish document can have multiple comments stored within an array inside the dish document.*/
}, {
    timestamps: true /* So, this will automatically add the created at and updated at,
     two timestamps into each document that is stored in our application and it'll automatically update these values. */
});

var Valgiai = mongoose.model('Valgis', valgisSchema);

module.exports = Valgiai;