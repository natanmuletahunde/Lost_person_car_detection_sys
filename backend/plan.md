Act as a senior backend architect and teach me how to fully set up Swagger (OpenAPI) ONLY in the backend for my Lost Person Car Detection system using Node.js, Express, and MongoDB.

I want a COMPLETE backend-only implementation guide, nothing skipped.

Cover all of these:

1. Explain the purpose of Swagger in the backend and where it fits in my architecture.

2. Show how to install and configure:
- swagger-jsdoc
- swagger-ui-express

3. Show complete setup in server.js:
- imports
- swagger configuration
- OpenAPI definition
- mounting /api-docs route
- separating swagger config into its own file (best practice)

4. Show how to document all major backend endpoints for my system:
- Authentication routes
- User management routes
- Lost person report routes
- Car detection routes
- Image upload routes
- Search routes
- Admin approval routes
- JWT protected routes

5. Show how to document:
- request body schemas
- response schemas
- path parameters
- query parameters
- multipart/form-data file uploads
- bearer JWT authentication

6. Show how to add Swagger annotations inside Express route files and controllers.

7. Show best production folder structure for organizing Swagger in a large backend project.

8. Show how to test Swagger in browser:
http://localhost:5000/api-docs

9. Show security best practices:
- protect or disable docs in production
- restrict Swagger to admin access if needed
- avoid exposing sensitive internal endpoints

10. Show common errors and fixes:
- Cannot find module errors
- Swagger routes not loading
- Endpoints not appearing
- Annotation syntax mistakes
- Empty Swagger UI problems

11. Generate a sample OpenAPI spec specifically for my Lost Person Car Detection backend.

12. Explain how professionals maintain Swagger as APIs grow.

Give full code snippets, folder structure, explanations, and production-grade backend setup only.
