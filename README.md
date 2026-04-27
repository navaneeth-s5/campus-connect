# Campus Connect - Facility Management System

A modern, user-friendly web application for managing college facility bookings, built with React, TypeScript, and Vite.

## Features

- **User Authentication**: Secure login/signup for students, faculty, and admins with dynamic course selection
- **Facility Booking**: Reserve labs, seminar halls, and principal appointments
- **LMS Portal**: Built-in Learning Management System for tracking student attendance, task submissions, and module progress
- **Role-Based Access**: Different dashboards for students, faculty, and administrators
- **Real-Time Updates**: Live booking status and availability
- **Analytics Engine**: Real-time performance and attendance tracking for students with instructor inputs
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean interface with dark/light theme support and glassmorphism elements

## How It Works

The application uses a client-side React app with local storage for data persistence (demo mode). Users can:

1. **Sign Up/Login**: Create accounts using dynamic drop-downs mapping valid departments and courses
2. **Browse Facilities**: View available labs, halls, and meeting slots
3. **Book Facilities**: Select dates, times, and purposes for bookings
4. **Learning Management**: Access active courses, view assignments, and track attendance percentage
5. **Manage Bookings**: View, edit, or cancel personal bookings
6. **Admin Panel**: Admins can view usage stats, configure global courses, and manage the system

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd campus-connect
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:8080`

## Running the Server

### Development Mode
```bash
npm run dev
```
- Runs on `http://localhost:8080`
- Hot reload enabled
- For local development only

### Network Access (for testing on other devices)
```bash
npm run dev -- --host 0.0.0.0 --port 8080
```
- Accessible from other devices on the same network
- Use the displayed network URL (e.g., `http://192.168.1.100:8080`)

### Production Build
```bash
npm run build
```
- Creates optimized files in the `dist` folder
- Ready for deployment

## Setting Up for Full-Time Live Server

### Option 1: Deploy to a Web Server (Recommended for Production)

1. Build the application:
   ```bash
   npm run build
   ```

2. Serve the `dist` folder using a web server:

   **Using Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/campus-connect/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

   **Using Apache:**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       DocumentRoot /path/to/campus-connect/dist

       <Directory /path/to/campus-connect/dist>
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

3. For HTTPS, configure SSL certificates (e.g., using Let's Encrypt).

### Option 2: Deploy to Hosting Platforms

- **Vercel/Netlify**: Connect your Git repository for automatic deployments
- **AWS S3 + CloudFront**: Host static files with CDN
- **Heroku**: Use buildpacks for Node.js deployment

### Option 3: Run as a Node.js Server

For more advanced setups with backend API:

1. Use a production server like Express.js
2. Add a database (e.g., PostgreSQL, MongoDB)
3. Implement proper authentication (e.g., JWT, OAuth)
4. Set up environment variables for configuration

## User-Friendly Features

- **Intuitive Navigation**: Clear menu structure with role-based access
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: Keyboard navigation and screen reader support
- **Error Handling**: User-friendly error messages and loading states
- **Offline Support**: Service worker for basic offline functionality
- **Theme Support**: Light/dark mode toggle
- **Mobile Optimized**: Touch-friendly interface for mobile users

## Usage

1. **For Students/Faculty:**
   - Sign up or log in
   - Browse available facilities
   - Book slots for labs or halls
   - View and manage your bookings

2. **For Admins:**
   - Log in with admin credentials (demo: admin/admin123)
   - Access admin panel for system overview
   - View usage statistics

## Development

- **Linting**: `npm run lint`
- **Testing**: `npm run test`
- **Type Checking**: TypeScript is configured for strict type checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue in the repository or contact the development team.

---

**KMCT IETM CAMPUS** - Empowering facility management with modern technology.
