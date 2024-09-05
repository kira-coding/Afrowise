 auth_teacher is a middleware function s using JWT-based authentication.

# Purpose:

- This middleware verifies if a valid JWT (JSON Web Token) is present in the request to ensure a teacher is logged in before accessing specific routes.
# How it works:

###  Retrieving JWT:

- It attempts to access the "teacher" cookie from the incoming request (req.cookies.teacher).
### JWT Verification:

- It uses jwt.decode to decode the JWT from the cookie using the secret key retrieved from the configuration (config.get("JWT-secret-key")).
###  Authorization Check:

- If the jwt.decode successfully retrieves the teacher information, it means a valid JWT was present.
- If no JWT is found or the decoding fails, it sends a 403 Forbidden response with a message indicating unauthorized access.
### Attaching Teacher Data:

- If the JWT is valid, it attaches the decoded teacher information (likely containing user ID, username, etc.) to the request object as req.teacher. This makes the teacher data accessible in the route handlers that use this middleware.
###  Next Function:

- If the JWT is valid, the middleware calls the next() function, allowing the request to proceed to the intended route handler.
#  Overall:

This middleware acts as a gatekeeper, ensuring only authorized teachers (with valid JWTs) can access protected routes in the application. It promotes secure access control based on user authentication.
