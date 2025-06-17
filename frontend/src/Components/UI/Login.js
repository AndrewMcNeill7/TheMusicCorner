import React, { useRef, useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const handleSuccess = (credentialResponse) => {
    console.log('Login Success:', credentialResponse);
    // You can send `credentialResponse.credential` to your backend
  };

  const handleError = () => {
    console.log('Login Failed');
  };

  return (
    <div>
      <h2>Login</h2>
      <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
    </div>
  );
}

export default Login;