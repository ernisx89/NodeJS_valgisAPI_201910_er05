const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Valgiai = require('../models/valgiai');

const valgisRouter = express.Router();

valgisRouter.use(bodyParser.json());

valgisRouter.route('/') //mounting jei netycia nurodytum netoki endpoint in index.js, chaining
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Valgiai.find(req.query)
    .populate('comments.author')
    .then((valgiai) => { //grazina valgiu masyva
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(valgiai);
        console.log('Grazina valgiu masyva:\n', valgiai);
    }, (err) => next(err))
    .catch((err) => next(err)); //parodys klaida, kuri apibrezta app.js
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => { //authenticate kaip barjeras klientui
    Valgiai.create(req.body)
    .then((valgis) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(valgis);
        console.log('Valgis sukurtas:\n', valgis);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put((req,res,next) => {
    res.statusCode = 403;
    res.end('PUT nepalaikoma ties /valgiai'); //su atnaujinimu PUT nera prasmes 
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Valgiai.remove({})
    .then((resp) => {
        console.log('\nIstrinami Valgiai:\n', resp);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

//specialius valgis
valgisRouter.route('/:valgisId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Valgiai.findById(req.params.valgisId) //is mongoose params = property
    .populate('comments.author')
    .then((valgis) => {
        console.log('\nSpecialus Valgis:\n', valgis);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(valgis);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post((req,res,next) => {
    res.statusCode = 403;
    res.end('POST nepalaikoma ties /valgiai/' + req.params.valgisId); //post neturi prasmes siuo atveju
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Valgiai.findByIdAndUpdate(req.params.valgisId, {
        $set: req.body //retrieve (isgauna is body turinio) atnaujinta valgi
    }, { new: true })
    .then((valgis) => {
        console.log('\nSpecialus Atnaujintas Valgis:\n', valgis);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(valgis);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Valgiai.findByIdAndRemove(req.params.valgisId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
        console.log('Istrinamas valgis:\n' + req.params.valgisId + ' is meniu!'); 
    }, (err) => next(err))
    .catch((err) => next(err));
});

//Dirbant su subdokument comments
//specialaus valgio komentaras
valgisRouter.route('/:valgisId/comments')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); }) 
.get((req,res,next) => {
    Valgiai.findById(req.params.valgisId)
    .populate('comments.author')
    .then((valgis) => { 
        if (valgis != null) { //jei egzistuoja
            console.log('\nJusu valgio komentarai:\n', valgis.comments);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(valgis.comments);
        } 
        else {
            err = new Error('\nValgis ' + req.params.valgisId + ' nerastas\n');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err)); //parodys klaida, kuri apibrezta app.js
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Valgiai.findById(req.params.valgisId)
    .then((valgis) => {
        if (valgis != null) { //jei egzistuoja
            req.body.author = req.user._id; //deka authenticate.verifyUser
            valgis.comments.push(req.body);
            valgis.save()
            .then((valgis) => {
                Valgiai.findById(valgis._id)
                    .populate('comments.author')
                    .then((valgis) => {
                        console.log('\nJusu valgio komentaro atnaujinimas:\n' + valgis.comments);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(valgis);
                    })
            }, (err) => next(err)); 
        } 
        else {
            err = new Error('\nValgis ' + req.params.valgisId + ' nerastas\n');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put((req,res,next) => {
    res.statusCode = 403;
    res.end('PUT nepalaikoma ties /valgiai/' + req.params.valgisId + '/comments'); //su atnaujinimu PUT nera prasmes 
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Valgiai.findById(req.params.valgisId)
    .then((valgis) => {
        if (valgis != null) { //jei egzistuoja
            for (var i = (valgis.comments.length -1); i >= 0; i--) { //pradeda nuo paskutinio komentaro
                valgis.comments.id(valgis.comments[i]._id).remove(); //prieiga prie subdokumento
                console.log('\nIstrinami visi valgio komentarai...');
            }
            valgis.save()
            .then((valgis) => {
                console.log('\nJusu valgio komentaro atnaujinimas:\n' + valgis.comments);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(valgis);
            }, (err) => next(err)); 
        } 
        else {
            err = new Error('\nValgis ' + req.params.valgisId + ' nerastas\n');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

//specialaus valgio specialus komentaras
valgisRouter.route('/:valgisId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Valgiai.findById(req.params.valgisId) 
    .populate('comments.author')
    .then((valgis) => {
        if (valgis != null && valgis.comments.id(req.params.commentId) != null ) { //jei egzistuoja komentaras
            console.log('\nJusu valgio specialus komentaras:\n', valgis.comments.id(req.params.commentId));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(valgis.comments.id(req.params.commentId));
        } 
        else if (valgis == null) {
            err = new Error('\nValgis ' + req.params.valgisId + ' nerastas\n');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('\nValgio specialus komentaras ' + req.params.commentId + ' nerastas\n');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post((req,res,next) => {
    res.statusCode = 403;
    res.end('POST nepalaikoma ties /valgiai/' + req.params.valgisId + '/comments/' + req.params.commentId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Valgiai.findById(req.params.valgisId) 
    .then((valgis) => {
        if (valgis != null && valgis.comments.id(req.params.commentId) != null ) { 
            if (req.body.rating) {
                valgis.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.comment) {
                valgis.comments.id(req.params.commentId).comment = req.body.comment;
            }
            valgis.save()
            .then((valgis) => {
                Valgiai.findById(valgis._id)
                .populate('comments.author')
                .then((valgis) => {
                    console.log('\nJusu valgio specialaus komentaro atnaujinimas:\n' + valgis);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(valgis); //atnaujintas specialus valgio komentaras
                })
            }, (err) => next(err)); 
        } 
        else if (valgis == null) {
            err = new Error('\nValgis ' + req.params.valgisId + ' nerastas\n');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('\nValgio specialus komentaras ' + req.params.commentId + ' nerastas\n');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Valgiai.findById(req.params.valgisId)
    .then((valgis) => {
        if (valgis != null && valgis.comments.id(req.params.commentId) != null) { 
            valgis.comments.id(req.params.commentId).remove(); 
            console.log('\nIstrinami specialus valgio komentaras...');
            valgis.save()
            .then((valgis) => {
                Valgiai.findById(valgis._id)
                .populate('comments.author')
                .then((valgis) => {
                    console.log('\nJusu valgio specialaus komentaro atnaujinimas:\n' + valgis);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(valgis); //atnaujintas specialus valgio komentaras
                })
            }, (err) => next(err)); 
        } 
        else if (valgis == null) {
            err = new Error('\nValgis ' + req.params.valgisId + ' nerastas\n');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('\nValgio specialus komentaras ' + req.params.commentId + ' nerastas\n');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = valgisRouter;