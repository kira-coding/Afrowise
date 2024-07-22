# Teacher:

# Create teacher (POST /teacher)
Requires first_name, middle_name, last_name, user_name, and password in request body.
Creates a new Teacher document with the provided user information.
Returns the saved teacher object.
# Login teacher (POST /teacher/login)
Requires username and password in request body.
Finds a teacher with matching credentials.
Generates a JSON Web Token (JWT) if login is successful.
Sets a cookie named "teacher" with the JWT (with optional "remember me" functionality based on request body).
Redirects to a teacher dashboard upon successful login.
# Update a teacher (PUT /teacher/:id)
Requires first_name, middle_name, last_name, user_name, and password in request body.
Updates an existing teacher document with the provided details.
Returns the updated teacher object.
# Delete a teacher (DELETE /teacher/:id)
Deletes a teacher document based on the ID in the URL path.
Returns the deleted teacher object.
# Login form (GET /teacher/login)
Checks for a JWT in the "teacher" cookie.
Renders the teacher login form if no JWT is found.
Redirects to the teacher dashboard if a valid JWT is found.
# Logout (GET /teacher/logout)
Clears the "teacher" cookie, effectively logging out the teacher.
Redirects to the teacher login form.
# Teacher Dashboard:

# Teacher dashboard (GET /teacher/dashboard)
Requires teacher authentication via auth_teacher middleware.
Renders the teacher dashboard view.
# Teacher courses (GET /teacher/courses)
Requires teacher authentication via auth_teacher middleware.
Retrieves courses associated with the logged-in teacher.
Renders the teacher courses view with the list of courses.
# Create course (GET /teacher/course/create)
Requires teacher authentication via auth_teacher middleware.
Retrieves the logged-in teacher's information.
Renders the course creation view with the teacher's ID for association.
