# Swagger/OpenAPI Backend Implementation Guide

## 1. Why Swagger in this architecture
- Swagger gives your Express backend a live contract for request and response formats.
- It sits between route/controller code and frontend/integration consumers.
- In this project, annotations are defined close to routes/controllers and compiled into one OpenAPI spec.

## 2. Installed packages
```bash
npm install swagger-jsdoc swagger-ui-express
```

Plus `multer` for multipart upload endpoint examples:
```bash
npm install multer
```

## 3. Complete setup in `server.js`
- Imports added:
  - `swagger-ui-express`
  - `./config/swagger`
  - auth middleware for optional docs restriction in production.
- Config extracted into [`config/swagger.js`](../config/swagger.js).
- OpenAPI definition includes:
  - metadata (`info`)
  - `servers`
  - tags
  - component schemas
  - JWT bearer security scheme.
- Docs mounted at:
  - `GET /api-docs`
  - `GET /api-docs.json`

## 4. Documented endpoint groups
- Authentication: [`routes/auth.routes.js`](../routes/auth.routes.js)
- User management: [`routes/user.routes.js`](../routes/user.routes.js)
- Lost person report routes: [`routes/sighting.routes.js`](../routes/sighting.routes.js)
- Car detection routes: [`routes/detection.routes.js`](../routes/detection.routes.js)
- Image upload routes: [`routes/upload.routes.js`](../routes/upload.routes.js)
- Search routes: [`routes/search.routes.js`](../routes/search.routes.js)
- Admin approval routes: [`routes/admin.routes.js`](../routes/admin.routes.js)
- JWT protected routes: all secured operations include `security: - bearerAuth: []`.

## 5. What is documented
- Request body schemas: JSON and multipart examples.
- Response schemas: `ApiSuccess`, `ApiError`, entity schemas.
- Path parameters: `/{id}` endpoints.
- Query parameters: pagination, filters, geo coordinates.
- Multipart uploads: `/api/v1/uploads/image`.
- Bearer JWT authentication: `components.securitySchemes.bearerAuth`.

## 6. Annotations in routes and controllers
- Route-level annotations are in every route file under `routes/`.
- Controller-level annotation example is in [`controllers/upload.controller.js`](../controllers/upload.controller.js).

## 7. Production folder structure
```text
backend/
  config/
    swagger.js
  controllers/
    *.controller.js
  routes/
    *.routes.js
  middlewares/
    auth.js
    upload.js
  swagger/
    IMPLEMENTATION.md
    openapi.sample.yaml
  server.js
```

## 8. Browser test
1. Start backend:
```bash
npm run dev
```
2. Open:
- `http://localhost:5000/api-docs`

## 9. Security best practices implemented
- Docs auto-enabled for non-production, disabled in production unless `SWAGGER_ENABLED=true`.
- Optional admin-only docs access with `SWAGGER_ADMIN_ONLY=true`.
- Internal endpoints should be left undocumented if not intended for external consumers.

## 10. Common errors and fixes
- `Cannot find module 'swagger-jsdoc'`:
  - run `npm install swagger-jsdoc swagger-ui-express`.
- Swagger route not loading:
  - check `isSwaggerEnabled()` and environment variables.
- Endpoints not appearing:
  - verify annotation block starts with `@swagger`.
  - verify route/controller file path is included in `config/swagger.js` `apis` array.
- Empty Swagger UI:
  - check server logs for swagger-jsdoc parse errors (`failOnErrors: true` helps catch syntax issues).
- Annotation syntax mistakes:
  - keep YAML indentation strict.
  - avoid tabs inside JSDoc YAML.

## 11. Sample OpenAPI spec
- A project-specific sample is in [`swagger/openapi.sample.yaml`](./openapi.sample.yaml).

## 12. How to maintain as APIs grow
- Keep annotations in same file as route definition.
- Add reusable schemas under `components.schemas`.
- Use tags by domain (`Auth`, `Sightings`, `Alerts`, `Admin`).
- Add API doc review in PR checklist.
- Keep `/api-docs.json` as the source for contract tests and frontend type generation.
