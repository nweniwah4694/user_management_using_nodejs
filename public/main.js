var addSkill = document.getElementById('add-skill');
var skills = [];

if(document.getElementById('skill-list').value != "") {
  skills = document.getElementById('skill-list').value.split(',');
  document.getElementById('tage_list').value = skills; 
}

//event listener for add skill
addSkill.addEventListener('click', function () {

  if( document.getElementById('skill').value == '') {
    document.getElementById('skill-error').innerHTML = 'skill is required';
    return;
  }
  document.getElementById('skill-error').innerHTML = '';
  var skill = document.getElementById('skill').value;
  var html = '';            
  html += '<div id="skill_'+ skill +'" onclick="removeAt(\'' + skill + '\')"><span>✖</span>' + skill + '</div>';
  document.getElementById('skill-group').innerHTML = document.getElementById('skill-group').innerHTML + html;
  //push skill to array
  skills.push(document.getElementById('skill').value);
  //set to tags list
  document.getElementById('tage_list').value = skills; 
  //clear skill value
  document.getElementById('skill').value = ""; 
});


//remove at element and remove from array
function removeAt(value) {

  var index = skills.indexOf(value);
    if (index > -1) {
      //splice element at index of array
      skills.splice(index, 1);
      //update skill array after removing element
      document.getElementById('tage_list').value = skills;
      //remove element tag
      document.getElementById('skill_'+value).remove();
    }
}

