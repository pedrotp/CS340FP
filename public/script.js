var path = 'http://flip3.engr.oregonstate.edu:19552/';

var autocompleteResults = {};
var employeeNames = {};
var equipmentTypes = {};

$.ajax({
  method: 'GET',
  url: path + 'employees',
  success: function (results) {
    for (var i = 0; i < results.length; i++) {
      employeeNames[results[i].first_name + " " + results[i].last_name] = results[i].id;
    }
  }
});

$.ajax({
  method: 'GET',
  url: path + 'equipment-type',
  success: function (results) {
    for (var i = 0; i < results.length; i++) {
      equipmentTypes[results[i].name] = results[i].id;
    }
    $('p.type-id').each(function () {
      $this = $(this);
      var text = _.findKey(equipmentTypes, function (id) { return id == $this.attr('data-type-id'); });
      $(this).text(text);
    });
  }
});

/* Submit the 'add lab form' in the modal */
$('#createLab').click(function(event) {
  var fdata = {};
  fdata.name = $('[name="labName"]').val();
  fdata.ext = $('[name="labExt"]').val();
  $.ajax({
    method: 'POST',
    url: path + 'lab',
    data: fdata,
    success: function (id) {
      var newThumb = $('<div class="col-sm-6 col-md-4"><div data-id="' + id[0] + '" class="thumbnail"><img height="50px" width="50px" src="/img/bond.png" alt="Bond"><div class="caption"><h4 class="text-center">'
      + fdata.name + '</h4><p class="text-center">( ext: ' + fdata.ext + ' )</p></div></div></div>');
      $('#maindiv div.row').append(newThumb);
      $('#labModal').modal('hide');
    }
  });
  event.preventDefault();
});

/* Click any of the add buttons inside the modals */
$('div.container').on('click', '.add-button', function (event) {
  var fdata = {};
  var $form = $($($(this).closest('div.modal-content')).find('form')[0]);
  var farr = $form.serializeArray();
  for (var i = 0; i < farr.length; i++) {
    fdata[farr[i].name] = farr[i].value;
  }
  if (fdata.manager && employeeNames[fdata.manager]) {
    fdata.manager_id = employeeNames[fdata.manager];
  }
  if (fdata.maintainer && employeeNames[fdata.maintainer]) {
    fdata.maintainer_id = employeeNames[fdata.maintainer];
  }
  if (fdata.equipment_type && equipmentTypes[fdata.equipment_type]) {
      fdata.type_id = equipmentTypes[fdata.equipment_type];
  }
  fdata.lab_id = $form.attr('data-lab-id');
  $.ajax({
    method: 'POST',
    url: path + $form.attr('data-type'),
    data: fdata,
    success: function () {
      $form.closest('.modal').modal('hide');
      location.reload();
    }
  });
});

/* Click on the Add New Employee Button */
$('#employee').on('click', 'button.btn-success', function (event) {

  var strings = Object.keys(employeeNames);

  var employees = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: strings
  });

  $('#empModal').find('input[name="manager"]').typeahead({
    minLength: 2,
    highlight: true
  },
  {
    name: 'employees',
    source: employees
  });

});

/* Click on the Add New Equipment Button */
$('#equipment').on('click', 'button.btn-success', function (event) {

  var empstr = Object.keys(employeeNames);

  var employees = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: empstr
  });

  var eqstr = Object.keys(equipmentTypes);

  var equipment = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: eqstr
  });

  $('#eqModal').find('input[name="maintainer"]').typeahead({
    minLength: 2,
    highlight: true
  },
  {
    name: 'employees',
    source: employees
  });

  $('#eqModal').find('input[name="equipment_type"]').typeahead({
    minLength: 2,
    highlight: true
  },
  {
    name: 'equipment',
    source: equipment,
    templates: {
      empty: '<div class="tt-suggestion tt-selectable new-type"><a href="#"><strong>Add New Type</strong></a></div>'
    }
  });

});

/* Click on the new type link in the Type autocorrect menu */
$('#eqModal').on('click','div.new-type', function (event) {

  var eqName = $('#eqModal').find('input[name="equipment_type"]').typeahead('val');
  $.ajax({
    method: 'POST',
    url: path + 'equipment-type',
    data: { name: eqName },
    success: function (id) {
      $('#eqModal').find('input[name="equipment_type"]').typeahead('destroy');
      equipmentTypes[eqName] = id[0];
    }
  });

});

/* Click on any of the Lab cards */
$('#maindiv').on('click', 'div.thumbnail', function(event) {
  window.location.href = "/lab/" + $(this).attr('data-id');
  event.preventDefault();
});

/* Click on the delete lab button */
$('#delete-lab-button').click(function (event) {
  var fdata = {};
  fdata.id = $(this).attr('data-lab-id');
  $this = $(this);
  $.ajax({
    method: 'DELETE',
    url: path + 'lab',
    data: fdata,
    success: function () {
      window.location.href = path;
    }
  });
});

/* Press any of the delete buttons */
$('.container').on('click', 'input[type="button"][value="Remove"]', function (event) {
  var $tr = $(this).closest('tr');
  var id = $tr.find('input[type="hidden"][name="id"]').val();

  $.ajax({
    method: 'DELETE',
    url: path + $tr.attr("data-type"),
    data: { id: id }
  })
  .done(function () {
    $tr.remove();
  });
  event.preventDefault();
});

/* Click on an employee id  */
$('.container').on('click', 'a.employee-id', function (event) {
  $.ajax({
    method: 'GET',
    url: path + 'employee/' + $(this).attr('data-employee-id')
  }).done(function (result) {
    result = result[0];
    $('#loadingModal').find('h4').text(result.first_name + " " + result.last_name);
    $('#loadingModal').find('div.modal-body').html('<table class="table table-bordered table-condensed table-striped table-responsive"><tr><th class="text-center">First Name</th><th class="text-center">Last Name</th><th class="text-center">Extension</th></tr><tr><td><p class="text-center">' + result.first_name + '</p></td><td><p class="text-center">' + result.last_name + '</p></td><td><p class="text-center">' + result.ext + '</p></td></tr></table>');
  });
  event.preventDefault();
});

/* Click on a See More link  */
$('.container').on('click', '.show-more', function (event) {
  $this = $(this);
  if ($this.attr('data-query') == 'employee-equipment') {
    $.ajax({
      method: 'GET',
      url: path + 'employee-equipment/' + $this.attr('data-employee-id')
    }).done(function (results) {
      $('#loadingModal').find('h4').text('Equipment');
      $('#loadingModal').find('div.modal-body').html('<table class="table table-bordered table-condensed table-striped table-responsive"><tr><th class="text-center">Type</th><th class="text-center">Calibration Date</th><th class="text-center">Purchase Date</th></tr></table>');
      for (var i = 0; i < results.length; i++) {
        $('#loadingModal').find('table.table').append($('<tr class="reg-row" data-type="equipment"><td><p class="text-center type-id">' + results[i].name + '</p></td><td><p class="text-center">' + results[i].calibration_date + '</p></td><td><p class="text-center">' + results[i].purchase_date + '</p></td></tr>'));
      }
    });
  } else if ($this.attr('data-query') == 'employee-project') {
    $.ajax({
      method: 'GET',
      url: path + 'employee-project/' + $this.attr('data-employee-id')
    }).done(function (results) {
      $('#loadingModal').find('h4').text('Project');
      $('#loadingModal').find('div.modal-body').html('<table class="table table-bordered table-condensed table-striped table-responsive"><tr><th class="text-center">Name</th><th class="text-center">Start Date</th><th class="text-center">Due Date</th></tr>');
      for (var i = 0; i < results.length; i++) {
        $('#loadingModal').find('table.table').append($('<tr class="reg-row" data-type="project"><td><p class="text-center type-id">' + results[i].name + '</p></td><td><p class="text-center">' + results[i].start_date + '</p></td><td><p class="text-center">' + results[i].due_date + '</p></td></tr>'));
      }
    });
  }
  event.preventDefault();
});

/* Click on a link in a project row */
$('div#project').on('click', 'a', function (event) {
  $this = $(this);
  if ($this.attr('data-query') == 'objective') {
    $('#emptyModal').find('h4').text('Objective');
    $('#emptyModal').find('div.modal-body').html('<p>' + $('p.objective').text() + '</p>');
  } else if ($this.attr('data-query') == 'equipment') {
    $.ajax({
      method: 'GET',
      url: path + 'project-equipment/' + $this.attr('data-id')
    }).done(function (results) {
      $('#loadingModal').find('h4').text('Equipment');
      $('#loadingModal').find('div.modal-body').html('<table class="table table-bordered table-condensed table-striped table-responsive"><tr><th class="text-center">Type</th><th class="text-center">Calibration Date</th><th class="text-center">Purchase Date</th></tr></table>');
      for (var i = 0; i < results.length; i++) {
        $('#loadingModal').find('table.table').append($('<tr class="reg-row" data-type="equipment"><td><p class="text-center type-id">' + results[i].name + '</p></td><td><p class="text-center">' + results[i].calibration_date + '</p></td><td><p class="text-center">' + results[i].purchase_date + '</p></td></tr>'));
      }
    });
  } else if ($this.attr('data-query') == 'employees') {
    $.ajax({
      method: 'GET',
      url: path + 'project-employee/' + $this.attr('data-id')
    }).done(function (results) {
      $('#loadingModal').find('h4').text('Employees');
      $('#loadingModal').find('div.modal-body').html('<table class="table table-bordered table-condensed table-striped table-responsive"><tr><th class="text-center">First Name</th><th class="text-center">Last Name</th><th class="text-center">Extension</th></tr></table>');
      for (var i = 0; i < results.length; i++) {
        $('#loadingModal').find('table.table').append($('<tr><td><p class="text-center">' + result.first_name + '</p></td><td><p class="text-center">' + result.last_name + '</p></td><td><p class="text-center">' + result.ext + '</p></td></tr></table>'));
      }
    }).fail(function (err) {
      console.log(err);
      $('#loadingModal').find('h4').text('Employees');
      $('#loadingModal').find('div.modal-body').html('<p>No employees are working on this project yet.</p>');
    });
  }
  event.preventDefault();
});
