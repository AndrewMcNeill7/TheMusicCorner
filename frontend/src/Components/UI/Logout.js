import React, { useRef, useState, useEffect } from 'react';

function Logout() {
  const handleLogout = () => {
    // Clear any tokens or session state you store (e.g., in localStorage)
    localStorage.clear();
    console.log('User logged out.');
    window.location.reload();
  };

  return (
    <div>
      <h2>Logout</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Logout;
