import React from 'react';
import '../CSS/Header.css';

function Header() {
  return (
    <header className="header">
      <div className="logo">The Music Corner</div>
      <nav>
        <a href="#">Profile</a>
        <a href="#">Sign-In</a>
      </nav>
    </header>
  );
}

export default Header;
