# Web Application Project

## Author
Utkarsh Gautam

## Setup Instructions

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/webapp.git
    ```
2. Environment Setup:
    - Create a `.env` file in the root directory
    - Add the following variables:
    ```
    PORT=3000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    ```

3. Install dependencies:
    ```bash
    cd webapp
    npm install
    ```

4. Database Setup:
    - Ensure MongoDB is installed and running
    - Run database migrations:
    ```bash
    npm run migrate
    ```

5. Start the application:
    ```bash
    # Development mode
    npm run dev
    
    # Production mode
    npm start
    ```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
- Creates a new user account
- Request Body:
    ```json
    {
        "username": "string",
        "email": "string",
        "password": "string"
    }
    ```
- Response: JWT token

#### POST /api/auth/login
- Authenticates existing user
- Request Body:
    ```json
    {
        "email": "string",
        "password": "string"
    }
    ```
- Response: JWT token

### Resource Endpoints

#### GET /api/posts
- Fetches all posts
- Headers Required: Authorization Bearer token
- Query Parameters: 
  - page (default: 1)
  - limit (default: 10)

#### POST /api/posts
- Creates new post
- Headers Required: Authorization Bearer token
- Request Body:
    ```json
    {
        "title": "string",
        "content": "string",
        "tags": ["string"]
    }
    ```

### Notes Endpoints

#### GET /api/notes
- Fetches all notes for the authenticated user
- Headers Required: Authorization Bearer token
- Query Parameters: 
  - page (default: 1)
  - limit (default: 10)
- Response:
    ```json
    {
        "notes": [
            {
                "id": "string",
                "title": "string",
                "content": "string",
                "createdAt": "timestamp",
                "updatedAt": "timestamp"
            }
        ],
        "totalCount": "number"
    }
    ```

#### GET /api/notes/:id
- Fetches a specific note
- Headers Required: Authorization Bearer token
- Response: Note object

#### POST /api/notes
- Creates a new note
- Headers Required: Authorization Bearer token
- Request Body:
    ```json
    {
        "title": "string",
        "content": "string"
    }
    ```
- Response: Created note object

#### PUT /api/notes/:id
- Updates an existing note
- Headers Required: Authorization Bearer token
- Request Body:
    ```json
    {
        "title": "string",
        "content": "string"
    }
    ```
- Response: Updated note object

#### DELETE /api/notes/:id
- Deletes a note
- Headers Required: Authorization Bearer token
- Response: Success message

## Security Measures

1. **Authentication & Authorization**
   - JWT-based authentication
   - Password hashing using bcrypt (10 rounds)
   - Token expiration after 24 hours

2. **Data Protection**
   - Input sanitization using express-validator
   - XSS protection with helmet middleware
   - CSRF protection enabled
   - Rate limiting (100 requests per 15 minutes)

3. **Database Security**
   - MongoDB injection prevention
   - Encrypted sensitive data using AES-256
   - Secure connection string handling

4. **API Security**
   - CORS configured for allowed origins only
   - Request size limits
   - HTTP-only cookies
   - Secure headers implementation

## Error Handling

- Standardized error responses
- Custom error middleware
- Detailed logging (production/development modes)
