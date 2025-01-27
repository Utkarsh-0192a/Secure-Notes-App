import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Add this import
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import api, { getCsrfToken } from '../services/api';

function LoginPage() {  // Changed to function declaration
  const { login } = useAuth(); // This will now work with the proper import
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        // This ensures the server sets the XSRF-TOKEN cookie and returns the CSRF token
        const res = await api.get('/auth/csrf-token');
        api.defaults.headers['X-CSRF-Token'] = res.data.csrfToken;
        // console.log('CSRF token:', res.data.csrfToken);



        
        const url = isLogin ? '/auth/login' : '/auth/signup';
        const data = isLogin ? { username, password } : { name, username, email, password };
        const response = await api.post(url, data);
        
        if (response.data.token) {
            login(response.data.user, response.data.token);
            navigate('/dashboard');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.response?.status === 429) {
            setMessage('Account temporarily locked. Please try again later.');
            // Disable the form submission button for the retry-after period
            const retryAfter = error.response.headers['retry-after'] || 900; // 15 minutes in seconds
            setIsSubmitDisabled(true);
            setTimeout(() => setIsSubmitDisabled(false), retryAfter * 1000);
        } else {
            setMessage(error.response?.data?.message || error.message || 'An error occurred');
        }
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        background: 'linear-gradient(135deg, #ff7eb3, #ff758c)',
        animation: 'gradient 6s ease infinite',
        color: '#fff',
      }}
    >
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .gradient-bg {
            background-size: 200% 200%;
          }
          .btn-custom {
            background: linear-gradient(135deg, #ff758c, #ff7eb3);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .btn-custom:hover {
            transform: scale(1.05);
            box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2);
          }
        `}
      </style>
      <div
        className="card p-4 shadow-lg gradient-bg"
        style={{
          width: '400px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          color: '#333',
        }}
      >
        <h2
          className="text-center mb-4"
          style={{
            fontWeight: 'bold',
            color: '#ff758c',
          }}
        >
          {isLogin ? 'Welcome Back!' : 'Join Us!'}
        </h2>
        {message && <p className="text-center">{message}</p>}
        <form onSubmit={handleSubmit}>
        <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your username"
              style={{ borderRadius: '10px' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {!isLogin && (
            <>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your name"
                  style={{ borderRadius: '10px' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  style={{ borderRadius: '10px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              style={{ borderRadius: '10px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-custom w-100"
            style={{
              borderRadius: '10px',
              border: 'none',
              color: '#fff',
            }}
            disabled={isSubmitDisabled}
          >
            {isLogin ? 'Login' : 'Signup'}
          </button>
        </form>
        <button
          className="btn btn-link mt-3 w-100 text-center"
          style={{
            textDecoration: 'none',
            fontWeight: 'bold',
            color: '#ff758c',
          }}
          onClick={toggleForm}
        >
          {isLogin ? 'Create an account' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
