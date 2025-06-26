import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import SignIn from './Pages/SignIn';
import Home from './Pages/Home';
import Profile from './Pages/Profile'; // ✅ Import the new Profile page

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const user = localStorage.getItem('user');
            if (user) {
                setIsAuthenticated(true);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    return (
        <GoogleOAuthProvider clientId="306349675912-sj289qifcqovpnmu4knp2ljp2bmua8sa.apps.googleusercontent.com">
            <Router>
                <Routes>
                    <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
                    <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/signin" />} />
                    <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/signin" />} />
                    <Route path="/" element={<Navigate to="/signin" />} />
                </Routes>
            </Router>
        </GoogleOAuthProvider>
    );
};

export default App;
