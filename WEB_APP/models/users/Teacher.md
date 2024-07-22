This code defines a Mongoose Schema for a Teacher user in the course management application, including functionalities for generating JSON Web Tokens (JWT).

# Teacher:

- first_name (String, required): The teacher's first name.
- middle_name (String, required): The teacher's middle name.
- last_name (String, required): The teacher's last name.
- user_name (String, required, unique): The teacher's username for login (unique).
- password (String, required): The teacher's password for login.
- courses (Array of ObjectIds, ref:'Course'): An array of ObjectIds referencing courses associated with the teacher.
# Methods:

- generatejwt(): This method generates a JWT containing the teacher's ID, username, first name, and middle name. It uses the secret key stored in the - -
- config.get("JWT-secret-key") to sign the token.
# Relationships:

- A Teacher can have a many-to-many relationship with Course through the courses field (a teacher can have many courses, and a course can have many teachers).
Security:

- The schema enforces storing passwords securely by not defining a getter or setter for the password field. It's recommended to hash passwords before storing them in the database so in the future update we will use bcrypt.
- JWTs are used for authentication, providing a secure way to transmit user information between the client and server without exposing the password.
