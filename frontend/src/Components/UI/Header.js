import React from 'react';
import { Link } from 'react-router-dom';
import '../CSS/Header.css';

function Header() {
  return (
    <header className="header">
      <Link to="/home" className="logo">
        The Music Corner
      </Link>
      <nav>
        <Link to="/profile">Profile</Link>
        <Link to="/signin">Sign-In</Link>
      </nav>
    </header>
  );
}

export default Header;
