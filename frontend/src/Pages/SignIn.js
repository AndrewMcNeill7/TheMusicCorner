import React from 'react';
import Login from '../Components/UI/Login';
import '../Components/CSS/SignIn.css'; // Corrected to include .css

function SignIn() {
  return (
    <div className="signin-page">
      <main className="signin-main">
        <section className="signin-box">
          <h1>Sign In</h1>
          <Login />
        </section>
      </main>
      <footer>
        &copy; {new Date().getFullYear()} Your Company. All rights reserved.
      </footer>
    </div>
  );
}

export default SignIn;