var path = 'http://flip3.engr.oregonstate.edu:19469/';

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
    console.log('results\n', results);
    for (var i = 0; i < results.length; i++) {
      equipmentTypes[results[i].name] = results[i].id;
    }
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
  if (fdata.mantainer && employeeNames[fdata.mantainer]) {
    fdata.mantainer_id = employeeNames[fdata.mantainer];
  }
  if (fdata.equipment_type && equipmentTypes[fdata.equipment_type]) {
      fdata.equipment_id = equipmentTypes[fdata.equipment_type];
  }

  fdata.lab_id = $form.attr('data-lab-id');
  $.ajax({
    method: 'POST',
    url: path + $form.attr('data-type'),
    data: fdata,
    success: function () {
      $form.closest('.modal').modal('hide');
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
    local: eqstr,
    templates: {
      empty: '<a href="#"><strong>Add New Type</strong></a>'
    }
  });

  $('#eqModal').find('input[name="mantainer"]').typeahead({
    minLength: 2,
    highlight: true
  },
  {
    name: 'employees',
    source: employees
  });

  $('#eqModal').find('input[name="equipment-type"]').typeahead({
    minLength: 2,
    highlight: true
  },
  {
    name: 'equipment',
    source: equipment
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
