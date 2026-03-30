# 📦 Warehouse Management System

A full-stack inventory management application with secure authentication, real-time stock tracking, dashboard analytics, and beautiful glassmorphism UI.

## ✨ Features

### 🔐 Security & Authentication
- **Password Hashing** — Secure bcrypt password storage
- **Session Management** — 30-minute auto-logout for security
- **Input Validation** — Server-side validation for all inputs
- **CORS Protection** — Secure API communication

### 📊 Dashboard Analytics
- **Real-time Stats** — Live inventory health metrics
- **Stock Management** — Add, edit, delete items with automatic status tracking
- **Animated Progress Bars** — Visual representation of stock levels
- **Category Analytics** — Doughnut chart showing items by category
- **Low Stock Alerts** — Pulsing notifications for critical inventory

### 🎨 User Experience
- **Search & Filter** — Quick item lookup by name or category
- **CSV Export** — Download inventory as spreadsheet
- **Print Reports** — Generate printable inventory reports
- **Responsive Design** — Optimized for desktop, tablet, and mobile
- **Smooth Animations** — Modern transitions and interactions

### 🎨 Design Highlights
- **Glassmorphism UI** — Frosted glass effect with backdrop blur
- **Animated Gradient Background** — Continuously shifting color palette
- **Staggered Animations** — Elements fade in with smooth timing
- **Modern Color Scheme** — Blues, teals, ambers, and reds

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Git**

### Backend Setup

1. **Clone and navigate to backend:**
```bash
cd warehouse-backend
npm install
```

2. **Database Setup:**
```bash
# Create database
createdb warehouse

# Run schema
psql -d warehouse -f ../warehouse/warehouse_schema.sql
```

3. **Environment Configuration:**
Create `.env` file in `warehouse-backend/`:
```env
# PostgreSQL connection settings
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=warehouse
PGPORT=5432
```

4. **Start Backend:**
```bash
npm start
# Server runs on http://localhost:4000
```

### Frontend Setup

1. **Serve static files:**
```bash
cd warehouse
python3 -m http.server 5500
# Or use VS Code Live Server extension
```

2. **Open in browser:**
```
http://localhost:5500
```

## 🔑 Demo Credentials

- **Username:** `Crownee`
- **Password:** `2005`

## 📁 Project Structure

```
warehouse/
├── index.html          # Main HTML structure
├── styles.css          # Modern CSS with animations
├── app.js             # Frontend JavaScript logic
├── warehouse_schema.sql # Database schema
├── README.md          # Documentation
└── debug.html         # Debug/development page

warehouse-backend/
├── index.js           # Express.js API server
├── package.json       # Node.js dependencies
├── .env              # Environment configuration
└── README.md         # Backend documentation
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login` — User authentication
- `POST /api/register` — User registration

### Items Management
- `GET /api/items?user_id=X` — Get user's items
- `POST /api/items` — Create new item
- `PUT /api/items/:id` — Update item
- `DELETE /api/items/:id` — Delete item

## 🌐 Deployment

### Frontend (GitHub Pages)
The frontend is deployed at: https://dd19uc.github.io/warehouse/

### Backend (Heroku/Railway/Vercel)
```bash
# Build for production
npm run build

# Deploy to your preferred platform
```

### Mobile Access
- **Same WiFi:** `http://YOUR_IP:5500`
- **Public internet:** Use ngrok or similar tunneling service

## 🛠️ Development

### Available Scripts
```bash
# Backend
npm start          # Start development server
npm run dev        # Start with nodemon

# Frontend
python3 -m http.server 5500  # Simple server
# Or use VS Code Live Server
```

### Database Management
```bash
# Connect to database
psql -d warehouse

# View tables
\dt

# View users
SELECT * FROM users;

# View items
SELECT * FROM items;
```

## 🔧 Recent Improvements

- ✅ **Security:** Password hashing with bcryptjs
- ✅ **Sessions:** 30-minute auto-logout
- ✅ **Validation:** Server-side input validation
- ✅ **Mobile:** Enhanced responsive design (<480px)
- ✅ **Bugs:** Fixed health percentage NaN and undefined minimum stock
- ✅ **Database:** Proper connection pooling and error handling

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify backend server is running on port 4000
3. Ensure PostgreSQL database is accessible
4. Check `.env` configuration in backend

---

**Built with ❤️ using HTML5, CSS3, JavaScript, Node.js, Express, and PostgreSQL**

## 📊 Data Storage
- Items are saved to browser's **localStorage**
- Data persists across browser sessions
- No backend server required

## 🎬 Animation Features
- Fade-in animations on page load
- Staggered table row animations
- Smooth button hover effects  
- Pulsing alerts for critical stock
- Form slide-in/out transitions
- Progress bar animations

## 🛠️ Technologies
- HTML5
- CSS3 (with animations & backdrop-filter)
- Vanilla JavaScript
- Chart.js (for analytics)

## 📱 Browser Support
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔒 Security Note
This is a client-side application. Credentials are stored in source code for demo purposes. For production use, implement proper backend authentication.

## 📄 License
MIT License - Free to use and modify

---


