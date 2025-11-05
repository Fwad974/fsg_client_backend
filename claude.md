# Claude Code Guidelines for FSG Client Backend

## Code Style

### Comments
- **Do not add comments unless absolutely necessary**
- Code should be self-explanatory
- Only add comments for complex business logic or non-obvious implementations

## Database Schema

### Foreign Keys
- **No CASCADE on update or delete** unless explicitly requested
- Default database referential integrity behavior (typically RESTRICT)

### Indexes
- **Do not add indexes** unless explicitly requested

## Architecture

### Current Structure
- Using **Class Table Inheritance (CTI)** pattern
- Base `users` table for authentication and common fields
- Extension tables: `individuals`, `corporates`, `doctors`, `payments`
- Junction tables for many-to-many relationships without relationship type fields

### Relationships
- Individual ↔ Doctor (many-to-many)
- Individual ↔ Corporate (many-to-many)
- Corporate ↔ Doctor (many-to-many)
- Corporate → Payment (one-to-one)
- Test Results → Individual (required), Corporate (optional), Doctor (optional)

## Best Practices

### DO:
- Use `Logger` for all logging with proper context objects
- Import `Op` from sequelize directly for queries in repositories
- Follow existing patterns for consistency across the codebase
- Use `findAndCountAll()` for paginated endpoints
- Include `limit`, `offset`, `searchTerm` parameters in query endpoints
- Define complete validation schemas (querySchema, bodySchema, responseSchema) for all routes
- Use transactions for data modifications
- Return `{ count, rows }` format for list endpoints
- Calculate offset as `Math.max(0, offset - 1)` (convert 1-indexed to 0-indexed)
- Use `Op.iLike` for case-insensitive search queries
- Add new endpoints to permission system (`PERMISSION_TYPE.aliases` and `PERMISSIONS`)
- Use `ServiceBase.execute(args, context)` pattern for services
- Use `sendResponse()` helper in controllers
- Organize services by domain: `/src/services/{domain}/{action}.service.js`
- Use middleware chain: `contextMiddleware() → requestValidationMiddleware() → authenticationMiddleWare → checkPermission → Controller.method → responseValidationMiddleware()`

### DON'T:
- Add comments unless absolutely necessary
- Use `console.log()` for logging - always use Logger
- Add CASCADE constraints unless explicitly requested
- Add database indexes unless explicitly requested
- Use `models.Sequelize.Op` - import `Op` directly from sequelize
- Skip validation schemas in routes
- Forget to add endpoints to permission system
- Use relative offsets without converting from 1-indexed to 0-indexed
