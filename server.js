/*

THE APP IS RUNNING AT http://flip3.engr.oregonstate.edu:19552/

*/

var express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var morgan = require('morgan');
var bodyParser = require('body-parser');
var moment = require('moment');
var fs = require('fs');

var port = process.env.PORT || 19552;

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
    context.name = results[0].name;
    context.lab_id = req.params.id;
  }).then(function () {
    return pool.query('SELECT * FROM `employee` WHERE lab_id=? ORDER BY id',[req.params.id]);
  }).then(function (results, fields) {
    context.employees = results;
  }).then(function() {
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
  if (req.body.name) {
    pool.query("INSERT INTO lab (`name`, `ext`) VALUES (?,?)", [req.body.name, req.body.ext], function (err, result) {
      if(err){
        next(err);
        return;
      }
      selectAll(res, function() {
        res.status(200);
        res.send([result.insertId]);
      });
    });
  } else {
    res.sendStatus(400);
  }
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

app.get('/employees', function (req, res, next) {
  pool.query('SELECT * FROM `employee` ORDER BY id').then(function (results, fields) {
    res.status(200);
    res.json(results);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
});

app.get('/employee/:id', function (req, res, next) {
  pool.query('SELECT * FROM `employee` WHERE id = ?', [req.params.id]).then(function (results, fields) {
    res.status(200);
    res.json(results);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
});

app.post('/employee', function (req, res, next) {
  pool.query("INSERT INTO `employee` (`first_name`, `last_name`, `ext`, `lab_id`, `manager_id`) VALUES (?,?,?,?,?)", [req.body.first_name, req.body.last_name, req.body.ext, req.body.lab_id, req.body.manager_id || null], function (err, result) {
    if(err){
      next(err);
      return;
    }
    selectAll(res, function() {
      res.sendStatus(200);
    });
  });
});

app.delete('/employee', function (req, res, next) {
  pool.query("DELETE FROM `employee` WHERE id=?", [req.body.id], function (err, result) {
    if(err){
      next(err);
      return;
    }
    res.sendStatus(200);
  });
});

app.get('/equipment-type', function (req, res, next) {
  pool.query('SELECT * FROM `equipment_type` ORDER BY id').then(function (results, fields) {
    res.status(200);
    res.json(results);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
});

app.post('/equipment-type', function (req, res, next) {

  pool.query("INSERT INTO `equipment_type` (`name`) VALUES (?)", [req.body.name], function (err, result) {
    if(err){
      next(err);
      return;
    }
    res.status(200);
    res.send([result.insertId]);
  });
});

app.get('/employee-equipment/:employeeID', function (req, res, next) {
  pool.query('SELECT name, calibration_date, purchase_date FROM `equipment` INNER JOIN `equipment_type` ON equipment.type_id = equipment_type.id WHERE equipment.maintainer_id = ?',[req.params.employeeID]).then(function (results, fields) {
    res.status(200);
    res.json(results);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
});

app.get('/employee-project/:employeeID', function (req, res, next) {
  pool.query('SELECT name, start_date, due_date FROM `project` INNER JOIN `employee_project` ON employee_project.project_id = project.id WHERE employee_project.employee_id = ?',[req.params.id]).then(function (results, fields) {
    res.status(200);
    res.json(results);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
});

app.post('/employee-project', function (req, res, next) {
  pool.query("INSERT INTO `employee_project` (`employee_id`, `project_id`) VALUES (?,?)", [req.body.employee_id, req.body.project_id], function (err, result) {
    if(err){
      next(err);
      return;
    }
    res.sendStatus(200);
  });
});

app.post('/project-equipment', function (req, res, next) {
  pool.query("INSERT INTO `project_equipment` (`project_id`,`equipment_type_id`) VALUES (?,?)", [req.body.project_id, req.body.equipment_type_id], function (err, result) {
    if(err){
      next(err);
      return;
    }
    res.sendStatus(200);
  });
});

app.get('/project-equipment/:projectID', function (req, res, next) {
  pool.query('SELECT equipment_type.name FROM `equipment_type` INNER JOIN `project_equipment` ON project_equipment.equipment_type_id = equipment_type.id WHERE project_id = ?',[req.params.projectID]).then(function (results, fields) {
    res.status(200);
    res.json(results);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
});

app.get('/project-employee/:projectID', function (req, res, next) {
  pool.query('SELECT first_name, last_name, ext FROM `employee` INNER JOIN `employee_project` ON employee.id = employee_project.employee_id WHERE project_id = ?',[req.params.projectID]).then(function (results, fields) {
    res.status(200);
    res.json(results);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
});

app.put('/project', function(req, res, next) {
  pool.query("SELECT * FROM project WHERE id=?", [req.body.id], function(err, result){
    if(err){
      next(err);
      return;
    }
    if(result.length){
      var current = result[0];
      pool.query("UPDATE project SET name=?, start_date=?, due_date=?, objective=? WHERE id=?",
        [req.body.name || current.name, req.body.start_date || current.start_date, req.body.due_date || current.due_date, req.body.objective || current.objective, req.body.id],
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

app.post('/equipment', function (req, res, next) {
  pool.query("INSERT INTO `equipment` (`type_id`, `lab_id`, `maintainer_id`, `calibration_date`, `purchase_date`) VALUES (?,?,?,?,?)", [req.body.type_id, req.body.lab_id, req.body.maintainer_id, req.body.calibration_date, req.body.purchase_date], function (err, result) {
    if(err){
      next(err);
      return;
    }
    selectAll(res, function() {
      res.sendStatus(200);
    });
  });
});

app.delete('/equipment', function (req, res, next) {
  pool.query("DELETE FROM `equipment` WHERE id=?", [req.body.id], function (err, result) {
    if(err){
      next(err);
      return;
    }
    res.sendStatus(200);
  });
});

app.get('/projects', function (req, res, next) {
  pool.query('SELECT * FROM `project` ORDER BY id').then(function (results, fields) {
    var context = {};
    context.projects = results;
    res.render('projects', context);
  }).catch(function (err) {
      console.error(err.stack);
      res.type('plain/text');
      res.status(500);
      res.render('500', { title: '500: SERVER ERROR' });
  });
});

app.post('/project', function (req, res, next) {
  pool.query("INSERT INTO `project` (`name`, `start_date`, `due_date`, `objective`) VALUES (?,?,?,?)", [req.body.name, req.body.start_date, req.body.due_date, req.body.objective], function (err, result) {
    if(err){
      next(err);
      return;
    }
    selectAll(res, function() {
      res.sendStatus(200);
    });
  });
});

app.delete('/project', function (req, res, next) {
  pool.query("DELETE FROM `project` WHERE id=?", [req.body.id], function (err, result) {
    if(err){
      next(err);
      return;
    }
    res.sendStatus(200);
  });
});

app.get('/reset-tables',function (req,res,next){

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
          res.render('app', {});
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
