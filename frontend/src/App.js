import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignIn from './Pages/SignIn';
import Home from './Pages/Home';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Simulate checking for authentication
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
        <Router>
            <Routes>
                <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
                <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/signin" />} />
                <Route path="/" element={<Navigate to="/signin" />} />
            </Routes>
        </Router>
    );
};

export default App;