/*

THE APP IS RUNNING AT http://flip3.engr.oregonstate.edu:19853/

*/

var express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var morgan = require('morgan');
var bodyParser = require('body-parser');
var moment = require('moment');
var fs = require('fs');

var port = process.env.PORT || 19469;

var mysql = require('promise-mysql');
var pool = mysql.createPool({
  host  : 'classmysql.engr.oregonstate.edu',
  user  : 'cs340_torrespp',
  password: '0950',
  database: 'cs340_torrespp',
  multipleStatements: true
});

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', port);

app.get('/', function(req,res){
  selectAll(res, function(context) {
    res.render('app', context);
  });
});

app.get('/lab/:id', function(req,res){
  var context = {};
  pool.query('SELECT name FROM `lab` WHERE id=?', [req.params.id]).then(function (results, fields) {
    context.name = results[0];
    context.projects = [];
  }).then(function () {
    return pool.query('SELECT * FROM `employee` WHERE lab_id=? ORDER BY id',[req.params.id]);
  }).then(function (results, fields) {
    context.employees = results;
  })
  // .then(function() {
  //   return pool.query('SELECT  FROM `project` INNER JOIN `employee_project` ON project.id = employee_project.project_id INNER JOIN `employee` ON employee_project.employee_id = employee.id WHERE employee.lab_id=? ORDER BY id',[req.params.id]);
  // }).then(function (results, fields) {
  //   context.projects = results;
  // })
  .then(function() {
    return pool.query('SELECT * FROM `equipment` WHERE lab_id=? ORDER BY id',[req.params.id]);
  }).then(function (results, fields) {
    context.equipment = results;
  }).then(function () {
    res.render('lab', context);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
});

function selectAll(res, callback){
  pool.query('SELECT * FROM `lab` ORDER BY id').then(function (results, fields) {
    var context = {};
    context.labs = results;
    callback(context);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
};

app.post('/lab', function (req, res, next) {
  pool.query("INSERT INTO lab (`name`, `ext`) VALUES (?,?)", [req.body.name, req.body.ext], function (err, result) {
    if(err){
      next(err);
      return;
    }
    selectAll(res, function() {
      res.sendStatus(200);
    });
  });
});

app.delete('/lab', function (req, res, next) {
  pool.query("DELETE FROM lab WHERE id=?", [req.body.id], function (err, result) {
    if(err){
      next(err);
      return;
    }
    res.sendStatus(200);
  });
});

app.post('/reset-tables',function (req,res,next){

  fs.readFile(__dirname + '/public/sql/data_definition.sql', 'utf8', function (err, data) {
    if (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
    } else {
      pool.query(data, function (err, result) {
        if (err) {
          console.error(err.stack);
          res.type('plain/text');
          res.status(500);
          res.render('500', { title: '500: SERVER ERROR' });
        } else {
          res.sendStatus(200);
        }
      });
    }
  });

});

app.use(morgan('dev'));

app.use(function(req,res){
  res.status(404);
  res.render('404', { title: '404: NOT FOUND' });
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500', { title: '500: SERVER ERROR' });
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://flip3.engr.oregonstate.edu:' + app.get('port') + '; press Ctrl-C to terminate.');
});


// app.put('/workouts', function(req, res, next) {
//   console.log(req.body);
//   pool.query("SELECT * FROM workouts WHERE id=?", [req.body.id], function(err, result){
//     if(err){
//       next(err);
//       return;
//     }
//     if(result.length){
//       var current = result[0];
//       console.log(current);
//       pool.query("UPDATE workouts SET name=?, reps=?, weight=?, date=?, lbs=? WHERE id=?",
//         [req.body.name || current.name, req.body.reps || current.reps, req.body.weight || current.weight, req.body.date || current.date, req.body.lbs || current.lbs, req.body.id],
//         function (err, result){
//         if(err){
//           next(err);
//           return;
//         }
//         res.status(200).send("Updated " + result.changedRows + " rows.");
//       });
//     }
//   });
// });