// load courses to the window when launching
window.onload = function() {
	let xml = new XMLHttpRequest();
	xml.open("PUT", '/dataset7890/courses/courses', false);
	xml.send();
	alert("Courses have been loaded！");
}

document.getElementById("U1button").addEventListener("click", U1query);
document.getElementById("U2button").addEventListener("click", U2query);
const departformat = new RegExp(/^[a-z]+$/);
const nameformat = new RegExp(/^[a-z]+[,][\s][a-z]+$/);

function U1query() {
	let querybasic = {
		"WHERE": {
			"AND": [
				{
					"IS": {
						"courses_instructor": ""
					}
				},
				{
					"IS": {
						"courses_dept": "cpsc"
					}
				}
			]
		},
		"OPTIONS": {
			"COLUMNS": [
				"courses_uuid",
				"courses_title",
				"courses_year"
			],
			"ORDER": "courses_year"
		}
	};

	let query = {
		"WHERE": {
			"AND": [
				{
					"IS": {
						"courses_instructor": ""
					}
				},
				{
					"IS": {
						"courses_dept": "cpsc"
					}
				}
			]
		},
		"OPTIONS": {
			"COLUMNS": [
				"courses_uuid",
				"courses_title",
				"courses_year"
			],
			"ORDER": "courses_year"
		}
	};

	var s = document.getElementById("outputfield");
	if (!departformat.test(document.getElementById("coursedept").value)) {
		return s.value = "Wrong format of the department input! Please use the department abbreviation in lowercase, for instance, cpsc.";
	} else if (!nameformat.test(document.getElementById("coursesinstructor").value)){
		return s.value = "Wrong format of the instructor name input! Please use [fist name, last name] format, all in lowercase.";
	}

	querybasic.WHERE.AND[0].IS.courses_instructor = document.getElementById("coursesinstructor").value;
	querybasic.WHERE.AND[1].IS.courses_dept = document.getElementById("coursedept").value;
	const resultbasic = getQueryResult(querybasic);
	if (Object(resultbasic).length === 2){
		return s.value = "There is no such instructor in the department. Please check your input.";
	}

	query.OPTIONS.COLUMNS[0]= document.getElementById("firstcol").value;
	query.OPTIONS.COLUMNS[1]= document.getElementById("seccol").value;
	query.OPTIONS.COLUMNS[2]= document.getElementById("thirdcol").value;
	query.OPTIONS.ORDER= document.getElementById("order").value;
	query.WHERE.AND[0].IS.courses_instructor = document.getElementById("coursesinstructor").value;
	query.WHERE.AND[1].IS.courses_dept = document.getElementById("coursedept").value;
	const result = getQueryResult(query);
	if (Object(result).length === 2){
		return s.value = "No match result in the database.";
	} else {
		return s.value = result;
	}
}

function U2query() {
	let query = {
		"WHERE": {
			"AND": [
				{
					"AND": [
						{
							"IS": {
								"courses_id": "110"
							}
						},
						{
							"IS": {
								"courses_dept": "cpsc"
							}
						}
					]
				},
				{
					"EQ": {
						"courses_year": 2015
					}
				}
			]
		},
		"OPTIONS": {
			"COLUMNS": [
				"courses_instructor",
				"courses_avg",
				"courses_year"
			],
			"ORDER": "courses_avg"
		}
	};

	var s = document.getElementById("outputfield");
	if (!departformat.test(document.getElementById("coursedept").value)) {
		return s.value = "Wrong format of the department input! Please use the department abbreviation in lowercase, for instance, cpsc.";
	} else if (!(Number(document.getElementById("coursesyear").value) > 2006
		&& Number(document.getElementById("coursesyear").value) < 2017
		&& Number(document.getElementById("coursesyear").value%1 === 0))) {
		return s.value = "Invalid year input. Please put an integer between 2007 and 2016 (inclusive).";
	}

	query.OPTIONS.COLUMNS[0]= document.getElementById("firstcol").value;
	query.OPTIONS.COLUMNS[1]= document.getElementById("seccol").value;
	query.OPTIONS.COLUMNS[2]= document.getElementById("thirdcol").value;
	query.OPTIONS.ORDER= document.getElementById("order").value;
	query.WHERE.AND[0].AND[0].IS.courses_id = document.getElementById("coursesid").value;
	query.WHERE.AND[0].AND[1].IS.courses_dept = document.getElementById("coursedept").value;
	query.WHERE.AND[1].EQ.courses_year = Number(document.getElementById("coursesyear").value);
	const result = getQueryResult(query);
	if (Object(result).length === 2){
		return s.value = "No match result in the database.";
	} else {
		return s.value = result;
	}
}

function getQueryResult(query) {
	let request = JSON.stringify(query);
	let result;
	let xml = new XMLHttpRequest();
	xml.open("POST", "/query", false);
	xml.setRequestHeader("Content-Type", "application/json");
	xml.onreadystatechange  = function(success) {
		if(xml.status === 200) {
			result = JSON.stringify(JSON.parse(this.responseText).result);
		}
	};
	xml.send(request);
	return result;
}
