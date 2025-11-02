# E-commerce API

A RESTful API for e-commerce application built with Node.js, Express, and MongoDB.

## Features

- 🔐 **User Authentication** - JWT-based authentication
- 👥 **User Management** - Register, login, update, delete users
- 🛡️ **Role-based Access Control** - Admin and user roles
- 📧 **Password Reset** - Email-based password reset functionality
- 📦 **Product Management** - CRUD operations for products
- 🔍 **Search & Filter** - Product search and category filtering
- 📄 **Pagination** - Paginated product listings
- 🚀 **Security** - Rate limiting, CORS, Helmet protection

## API Endpoints

### Authentication

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/forgot-password` - Request password reset
- `POST /api/users/verify-reset-code` - Verify reset code
- `POST /api/users/reset-password` - Reset password

### Users (Admin only)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products

- `GET /api/products` - Get all products (with pagination & search)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd ecommerce-main
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file

```bash
cp .env.example .env
```

4. Configure environment variables in `.env`

```
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET_KEY=your-super-secret-jwt-key-here
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALLOWED_ORIGINS=http://localhost:3000
```

5. Start the server

```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable          | Description               | Default                             |
| ----------------- | ------------------------- | ----------------------------------- |
| `PORT`            | Server port               | 4000                                |
| `NODE_ENV`        | Environment mode          | development                         |
| `MONGO_URI`       | MongoDB connection string | mongodb://localhost:27017/ecommerce |
| `JWT_SECRET_KEY`  | JWT secret key            | -                                   |
| `SMTP_USER`       | Email username            | -                                   |
| `SMTP_PASS`       | Email password            | -                                   |
| `ALLOWED_ORIGINS` | CORS allowed origins      | http://localhost:3000               |

## Security Features

- ✅ JWT Authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Role-based access control

## Database Schema

### User Schema

```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, min 6 chars),
  role: String (enum: ["user", "admin"]),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Schema

```javascript
{
  name: String (required),
  description: String,
  price: Number (required, min 0),
  category: String (required),
  stock: Number (default 0, min 0),
  image: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

All API responses follow a consistent format:

**Success Response:**

```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {...}
}
```

**Error Response:**

```json
{
  "status": "error",
  "message": "Error description"
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
