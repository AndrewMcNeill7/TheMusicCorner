import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import '../Components/CSS/SignIn.css';
import Footer from '../Components/UI/Footer';
import { jwtDecode } from 'jwt-decode'; // Correct named import

const SignIn = ({ onLogin }) => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [signupData, setSignupData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        email: '',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSignupData(prev => ({ ...prev, [name]: value }));
    };

    // Manual Sign-Up
    const handleSignup = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const user = {
                user_id: `manual_${Date.now()}`,
                name: `${signupData.firstName} ${signupData.lastName}`,
                email: signupData.email,
                dob: signupData.dob,
            };

            const response = await fetch('http://localhost:3001/api/log-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });

            if (!response.ok) throw new Error('Failed to sign up');

            localStorage.setItem('user', JSON.stringify({
                payload: {
                    sub: user.user_id,
                    name: user.name,
                    email: user.email,
                },
            }));

            onLogin();
            navigate('/home');
        } catch (error) {
            console.error('Signup error:', error);
            setError('Sign up failed. Please try again.');
        }
    };

    // Google OAuth Handler
    const handleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);
            const user = {
                user_id: decoded.sub,
                name: `${signupData.firstName || decoded.given_name} ${signupData.lastName || decoded.family_name}`,
                email: decoded.email || signupData.email,
                dob: signupData.dob || null,
            };

            localStorage.setItem('user', JSON.stringify({ payload: decoded }));

            const response = await fetch('http://localhost:3001/api/log-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });

            if (!response.ok) throw new Error('Failed to log user');

            onLogin();
            navigate('/home');
        } catch (err) {
            console.error('Login error:', err);
            setError('Google sign-in failed. Please try again.');
        }
    };

    const handleError = () => {
        setError('Google sign-in failed. Please try again.');
        console.log('Google sign-in failed');
    };

    // Existing User Sign-In by Email
    const handleExistingUserSignIn = async () => {
        if (!signupData.email) {
            setError('Please enter your email to sign in.');
            return;
        }

        try {
            const email = signupData.email.trim().toLowerCase();
            const response = await fetch(`http://localhost:3001/api/check-user?email=${encodeURIComponent(email)}`);
            if (!response.ok) throw new Error('Failed to check user');

            const data = await response.json();
            if (!data.exists) throw new Error('No account');

            localStorage.setItem('user', JSON.stringify({
                payload: {
                    sub: data.user_id,
                    name: data.name,
                    email: data.email,
                },
            }));

            onLogin();
            navigate('/home');
        } catch (err) {
            console.error('Email sign-in error:', err);
            setError('No account found with this email. Please sign up.');
        }
    };

    return (
        <div className="signin-container">
            <p className="signin-welcome">Welcome to the Music Corner</p>
            <h2 className="signin-heading">Sign Up</h2>

            <div className="signin-flex-row">
                <img src="/favicon.png" alt="Music Corner Logo" className="signin-logo" />
                <form className="signup-form" onSubmit={handleSignup}>
                    <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={signupData.firstName}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                    />
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={signupData.lastName}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                    />
                    <input
                        type="date"
                        name="dob"
                        value={signupData.dob}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={signupData.email}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                    />
                    <div className="button-group">
                        <button type="submit" className="submit-button">Sign Up</button>
                        <GoogleLogin onSuccess={handleSuccess} onError={handleError} className="google-button" />
                    </div>

                    <div className="existing-account" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <p>Already have an account?</p>
                        <button
                            type="button"
                            className="submit-button"
                            onClick={handleExistingUserSignIn}
                        >
                            Sign In with Email
                        </button>
                    </div>
                </form>
            </div>

            {error && <p className="signin-error">{error}</p>}
            <Footer />
        </div>
    );
};

export default SignIn;
