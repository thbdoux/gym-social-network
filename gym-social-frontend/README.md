# GymSocial Frontend

A React-based frontend for the GymSocial platform - a social network for gym enthusiasts. This application allows users to share workouts, track progress, and connect with other fitness enthusiasts.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- Backend server running (see backend repository)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/gym-social-frontend.git
cd gym-social-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── api/
│   └── api.js           # API configuration and endpoints
├── components/
│   ├── Auth/            # Authentication components
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Layout/          # Layout components
│   │   └── Navbar.jsx
│   ├── Posts/           # Post-related components
│   │   ├── CreatePost.jsx
│   │   ├── Post.jsx
│   │   └── Feed.jsx
│   └── Workouts/        # Workout-related components
│       ├── CreateWorkout.jsx
│       └── WorkoutList.jsx
├── contexts/
│   └── AuthContext.jsx  # Authentication context
├── App.jsx             # Main application component
└── main.jsx           # Application entry point
```

## 🔧 Development

### Key Components

#### Authentication
- `Login.jsx`: Handles user login
- `Register.jsx`: Handles new user registration
- `AuthContext.jsx`: Manages authentication state

#### Posts
- `Feed.jsx`: Displays posts from users
- `CreatePost.jsx`: Form for creating new posts
- `Post.jsx`: Individual post display

#### Workouts
- `WorkoutList.jsx`: Displays workout history
- `CreateWorkout.jsx`: Form for logging new workouts

### Adding New Features

1. **Create a new component**:
```jsx
// src/components/YourFeature/YourComponent.jsx
import React from 'react';

export default function YourComponent() {
  return (
    <div>
      // Your component content
    </div>
  );
}
```

2. **Add API endpoints**:
```javascript
// src/api/api.js
export const yourNewEndpoint = async (data) => {
  const response = await api.post('/your-endpoint/', data);
  return response.data;
};
```

3. **Add routes** in `App.jsx`:
```jsx
<Route
  path="/your-path"
  element={
    <ProtectedRoute>
      <Layout>
        <YourComponent />
      </Layout>
    </ProtectedRoute>
  }
/>
```

### Authentication

The application uses JWT tokens for authentication. To access protected endpoints:

```javascript
// Making authenticated requests
const response = await api.get('/protected-endpoint/');
// Token is automatically included in headers
```

### Styling

The project uses Tailwind CSS for styling:

1. **Adding new styles**:
```jsx
// Using Tailwind classes
<div className="bg-white rounded-lg shadow p-4">
  // Your content
</div>
```

2. **Custom styles** can be added to `index.css`:
```css
@layer components {
  .your-custom-class {
    @apply bg-white rounded-lg shadow p-4;
  }
}
```

## 🔍 Testing

Run the test suite:
```bash
npm test
```

## 📦 Building for Production

Build the application:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch:
```bash
git checkout -b feature/amazing-feature
```
3. Commit your changes:
```bash
git commit -m 'Add amazing feature'
```
4. Push to the branch:
```bash
git push origin feature/amazing-feature
```
5. Open a Pull Request

## 🐛 Common Issues

1. **White screen after login**:
   - Check if the token is properly stored in localStorage
   - Verify API endpoint URLs in `.env`

2. **Component not updating**:
   - Check React state management
   - Verify API calls in browser devtools

3. **Styling issues**:
   - Run `npm run build` to regenerate Tailwind styles
   - Check for Tailwind class conflicts

## 📫 Support

For support, email support@gymsocial.com or create an issue in the repository.

## 📝 License

This project is licensed under the MIT License - see the LICENSE.md file for details.