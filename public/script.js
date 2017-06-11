var path = 'http://flip3.engr.oregonstate.edu:19469/';

/* Submit the 'add lab form' in the modal */
$('#createLab').click(function(event) {
  var fdata = {};
  fdata.name = $('[name="labName"]').val();
  fdata.ext = $('[name="labExt"]').val();
  $.ajax({
    method: 'POST',
    url: path + 'lab',
    data: fdata,
    success: function () {
      // location.reload();
      var newThumb = $('<div class="col-sm-6 col-md-4"><div data-id="{{this.id}}" class="thumbnail"><img height="50px" width="50px" src="/img/bond.png" alt="Bond"><div class="caption"><h4 class="text-center">'
      + fdata.name + '</h4><p class="text-center">( ext: ' + fdata.ext + ' )</p></div></div></div>');
      $('#maindiv div.row').append(newThumb);
      $('#labModal').modal('hide');
    }
  });
  event.preventDefault();
});

/* Click on any of the Lab cards */
$('#maindiv').on('click', 'div.thumbnasil', function(event) {
  window.location.href = "/lab/" + $(this).attr('data-id');
  event.preventDefault();
});

// delete lab:
// var fdata = {};
// fdata.id = $(this).attr('data-id');
// $this = $(this);
// $.ajax({
//   method: 'DELETE',
//   url: path + 'lab',
//   data: fdata,
//   success: function () {
//     $this.parent().remove();
//   }
// });

/* Press any of the delete buttons */
$('#maindiv').on('click', 'input[type="button"][value="Remove"]', function (event) {
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

/* Click on any table cell to edit */
$('#maindiv').on('click', 'p.editable', function (event) {
  $(this).hide();
  $(this).parent().find('.hidden').removeClass('hidden').addClass('editing').val($(this).text()).focus();
});

/* Press any of the update buttons */
$('#maindiv').on('click', 'input[type="button"][value="Update"]', function (event) {
  var $tr = $(this).closest('tr');
  var id = $tr.find('input[type="hidden"][name="id"]').val();
  var edits = $tr.find('.editing');
  var updateData = {};
  for (var i = 0; i < edits.length; i++) {
    var elem = $(edits[i]);
    if (elem.is('div')) {
      elem = elem.find('input[name="lbs"]:checked');
    }
    updateData[elem.attr('name')] = elem.val();
  }
  updateData.reps = parseInt(updateData.reps) || "";
  updateData.weight = parseInt(updateData.weight) || "";
  updateData.lbs = parseInt(updateData.lbs) == NaN ? "" : parseInt(updateData.lbs);
  updateData.id = id;
  console.log(updateData);
  $.ajax({
    method: 'PUT',
    url: path + 'workouts',
    data: updateData
  })
  .done(function () {
    $tr.find('.editing').removeClass('editing').addClass('hidden');
    $tr.find('p[style="display: none;"]').each(function (i, elem) {
      elem = $(elem);
      var val = elem.parent().find('input').val();
      if (elem.parent().find('input').attr('name') == 'lbs') {
        val = elem.parent().find('input[name="lbs"]:checked').val();
        val = parseInt(val) ? 'Lbs' : 'Kg';
      }
      $(elem).text(val).show();
    });
  });
});
