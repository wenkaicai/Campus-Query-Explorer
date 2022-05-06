Please edit this template and commit to the master branch for your user stories submission.   
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-21w2-intro-to-se/project/checkpoint-3).

## User Story 1
As a computer science student, I want to check all the courses that my favorite CPSC instructor XX used to teach so that I know which courses to register for. 


#### Definitions of Done(s)
Scenario 1: CPSC Instructor Name in Correct Format, CPSC Department in Correct Format 
Given: The student is on the search page
When: The student enters "cpsc" in the department field and enters an existing CPSC instructor name in "last name, first name" format (all in lowercase).
Then: The application displays the uuids, titles, and years of the courses that the instructor taught. The list is in descending order based on the year.

Scenario 2: CPSC Department in Wrong Format
Given: The student is on the search page
When: The student enters something with the meaning similar such as ("CPSC" or "Department of Computer Science")) to "cpsc" but doesn't follow the correct format.
Then: The search page shows an error message telling the student that the department format is wrong.

Scenario 3: Instructor Name in Wrong Format
Given: The student is on the search page
When: The student enters an existing name in the wrong format (i.e., different than "last name, first name" format (all in lowercase)).
Then: The search page shows an error message telling the student that the name format is wrong.

Scenario 4: Non-CPSC Instructor Name
Given: The student is on the search page
When: The student enters "cpsc" and a name that is not a CPSC instructor.
Then: The search page shows an error message telling the student that there doesn't exist such an instructor in the department.

## User Story 2
As a computer science student, I want to know which instructor of CPSC 110 in one specific year(for example 2016) gave the highest average for the class, so that I know which instructor to register for my CPSC 110 course.

input: dept, id, year
#### Definitions of Done(s)
Scenario 1: Correct Input for Department, Course Id, and Year
Given: The student is on the search page
When: The student enters "cpsc" for the department, "110" for the course ID, and an existing year in our database.
Then: The application displays the instructor name and course average for CPSC 110 in that specific year. The list is in descending order based on the course average.

Scenario 2: Department Name in Wrong Format
Given: The student is on the search page
When: The student enters something with the meaning similar(such as "CPSC" or "Department of Computer Science") to "cpsc" but doesn't follow the correct format.
Then: The search page shows an error message telling the student that the department format is wrong.

Scenario 3: Non-existing Course
Given: The student is on the search page
When: The student enters the department name, course id and year in the correct format, but there is no match in the database.
Then: The search page shows an error message telling the student that there is no match in the database.

Scenario 4: Invalid Year
Given: The student is on the search page
When: The student enters a year that doesn't exist in the database.
Then: The search page shows an error message telling the student that the year is invalid.

## Others
You may provide any additional user stories + DoDs in this section for general TA feedback.  
Note: These will not be graded.
