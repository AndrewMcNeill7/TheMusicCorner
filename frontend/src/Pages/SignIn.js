import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import '../Components/CSS/SignIn.css';
import Footer from '../Components/UI/Footer';

const SignIn = ({ onLogin }) => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [signupData, setSignupData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        email: '',
    });

    const handleSuccess = (credentialResponse) => {
        localStorage.setItem('user', JSON.stringify(credentialResponse));
        onLogin();
        navigate('/home');
    };

    const handleError = () => {
        setError('Google sign-in failed. Please try again.');
        console.log('Login Failed');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSignupData({ ...signupData, [name]: value });
    };

    const handleSignup = (e) => {
        e.preventDefault();
        // Add sign-up logic here
        console.log('Sign Up Data:', signupData);
    };

    return (
        <div className="signin-container">
            <p className="signin-welcome">Welcome to the Music Corner</p>
            <h2 className="signin-heading">Sign Up</h2>

            <div className="signin-flex-row">
                <img
                    src="/favicon.png"
                    alt="Music Corner Logo"
                    className="signin-logo"
                />
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
                </form>
            </div>

            {error && <p className="signin-error">{error}</p>}
            <Footer />
        </div>
    );
};

export default SignIn;