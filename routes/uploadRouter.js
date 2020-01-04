const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const multer = require('multer');
const cors = require('./cors');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    }, 

    filename: (req, file, cb) => {
        cb(null, file.originalname); //originalus pavadinimas koks yra pas klienta
    }
});

const imageFileFilter = (req, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {//regular expression
        return cb(new Error('\nJus galite uploadinti tik image failus!\n'), false);
    }
    cb(null, true); 
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter })

const uploadRouter = express.Router();

uploadRouter.use(bodyParser.json());

uploadRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get((req,res,next) => {
    res.statusCode = 403;
    res.end('GET nepalaikoma ties /imageUpload'); 
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(req.file);
})
.put((req,res,next) => {
    res.statusCode = 403;
    res.end('PUT nepalaikoma ties /imageUpload'); 
})
.delete((req,res,next) => {
    res.statusCode = 403;
    res.end('DELETE nepalaikoma ties /imageUpload'); 
});

module.exports = uploadRouter;