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
  sendResults(res, function(context) {
    res.render('app', context);
  });
});

function sendResults(res, callback){
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
    sendResults(res, function() {
      res.sendStatus(200);
    });
  });
});

app.put('/workouts', function(req, res, next) {
  console.log(req.body);
  pool.query("SELECT * FROM workouts WHERE id=?", [req.body.id], function(err, result){
    if(err){
      next(err);
      return;
    }
    if(result.length){
      var current = result[0];
      console.log(current);
      pool.query("UPDATE workouts SET name=?, reps=?, weight=?, date=?, lbs=? WHERE id=?",
        [req.body.name || current.name, req.body.reps || current.reps, req.body.weight || current.weight, req.body.date || current.date, req.body.lbs || current.lbs, req.body.id],
        function (err, result){
        if(err){
          next(err);
          return;
        }
        res.status(200).send("Updated " + result.changedRows + " rows.");
      });
    }
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

  // var queryStr = "CREATE TABLE `lab` ("+
  //   "`id` int(11) NOT NULL AUTO_INCREMENT,"+
  //   "`name` varchar(255) DEFAULT NULL,"+
  //   "`ext` int(11) DEFAULT NULL,"+
  //   "PRIMARY KEY (`id`)"+
  // ") ENGINE=InnoDB;";
  //
  // pool.query(queryStr).then(function(){
  //   queryStr = "CREATE TABLE `employee` ("+
  //     "`id` int(11) NOT NULL AUTO_INCREMENT,"+
  //     "`first_name` varchar(255) NOT NULL,"+
  //     "`last_name` varchar(255) DEFAULT NULL,"+
  //     "`ext` int(11) DEFAULT NULL,"+
  //     "`lab_id` int(11) DEFAULT NULL,"+
  //     "`manager_id` int(11) DEFAULT NULL,"+
  //     "PRIMARY KEY (`id`),"+
  //     "CONSTRAINT `fk_employee_lab`"+
  //     "  FOREIGN KEY (`lab_id`)"+
  //     "  REFERENCES `lab` (`id`)"+
  //     "  ON DELETE SET NULL"+
  //     "  ON UPDATE CASCADE,"+
  //     "CONSTRAINT `fk_employee_manager`"+
  //     "  FOREIGN KEY (`manager_id`)"+
  //     "  REFERENCES `employee` (`id`)"+
  //     "  ON DELETE SET NULL"+
  //     "  ON UPDATE CASCADE"+
  //   ") ENGINE=InnoDB;";
  //   return pool.query(queryStr);
  // }).then(function () {
  //   queryStr = "CREATE TABLE `equipment` ("+
  //     "`id` int(11) NOT NULL AUTO_INCREMENT,"+
  //     "`maintainer_id` int(11) DEFAULT NULL,"+
  //     "`calibration_date` date,"+
  //     "`purchase date` date,"+
  //     "`lab_id` int(11) DEFAULT NULL,"+
  //     "PRIMARY KEY (`id`),"+
  //     "CONSTRAINT `fk_equipment_lab`"+
  //     "  FOREIGN KEY (`lab_id`)"+
  //     "  REFERENCES `lab` (`id`)"+
  //     "  ON DELETE SET NULL"+
  //     "  ON UPDATE CASCADE,"+
  //     "CONSTRAINT `fk_equipment_employee`"+
  //     "  FOREIGN KEY (`maintainer_id`)"+
  //     "  REFERENCES `employee` (`id`)"+
  //     "  ON DELETE SET NULL"+
  //     "  ON UPDATE CASCADE"+
  //   ") ENGINE=InnoDB;";
  //   return pool.query(queryStr);
  // }).then(function () {
  //   queryStr = "CREATE TABLE `project` ("+
  //     "`id` int(11) NOT NULL AUTO_INCREMENT,"+
  //     "`request_date` date,"+
  //     "`due_date` date,"+
  //     "`objective` text,"+
  //     "PRIMARY KEY (`id`)"+
  //   ") ENGINE=InnoDB;";
  //   return pool.query(queryStr);
  // }).then(function () {
  //   queryStr = "CREATE TABLE `project_equipment` ("+
  //     "`project_id` int(11) NOT NULL,"+
  //     "`equipment_id` int(11) NOT NULL,"+
  //     "PRIMARY KEY (`project_id`,`equipment_id`),"+
  //     "CONSTRAINT `fk_projeq_project`"+
  //     "  FOREIGN KEY (`project_id`)"+
  //     "  REFERENCES `project` (`id`)"+
  //     "  ON DELETE CASCADE"+
  //     "  ON UPDATE CASCADE,"+
  //     "CONSTRAINT `fk_projeq_equipment`"+
  //     "  FOREIGN KEY (`equipment_id`)"+
  //     "  REFERENCES `equipment` (`id`)"+
  //     "  ON DELETE CASCADE"+
  //     "  ON UPDATE CASCADE"+
  //   ") ENGINE=InnoDB;";
  //   return pool.query(queryStr);
  // }).then(function () {
  //   queryStr = "CREATE TABLE `employee_project` ("+
  //     "`employee_id` int(11) NOT NULL,"+
  //     "`project_id` int(11) NOT NULL,"+
  //     "PRIMARY KEY (`employee_id`,`project_id`),"+
  //     "CONSTRAINT `fk_emplproj_employee`"+
  //     "  FOREIGN KEY (`employee_id`)"+
  //     "  REFERENCES `employee` (`id`)"+
  //     "  ON DELETE CASCADE"+
  //     "  ON UPDATE CASCADE,"+
  //     "CONSTRAINT `fk_emplproj_project`"+
  //     "  FOREIGN KEY (`project_id`)"+
  //     "  REFERENCES `project` (`id`)"+
  //     "  ON DELETE CASCADE"+
  //     "  ON UPDATE CASCADE"+
  //   ") ENGINE=InnoDB;";
  //   return pool.query(queryStr);
  // }).then(function() {
  //   res.status(200).send();
  // }).catch(function (err) {
  //   console.error(err.stack);
  //   res.type('plain/text');
  //   res.status(500);
  //   res.render('500', { title: '500: SERVER ERROR' });
  // });

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
