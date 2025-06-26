import React, { useState, useRef, useEffect } from 'react';
import Header from '../Components/UI/Header';
import Footer from '../Components/UI/Footer';
import '../Components/CSS/Profile.css'; // Create this CSS file for styling

const Profile = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser({
        email: storedUser?.payload?.email || 'Unknown Email',
        name: storedUser?.payload?.name || 'Anonymous',
      });
    }

    const storedHistory = JSON.parse(localStorage.getItem('aiHistory')) || [];
    setHistory(storedHistory);
  }, []);

  return (
    <div className="App">
      <Header />
      <main>
        <h1>User Profile</h1>

        {user ? (
          <div className="profile-section">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        ) : (
          <p className="loader">No user data found.</p>
        )}

        <div className="history-section">
          <h2>Past Searches</h2>
          {history.length > 0 ? (
            <ul className="history-list">
              {history.map((item, index) => (
                <li key={index} className="history-item">
                  <p><strong>Prompt:</strong> {item.prompt}</p>
                  <p><strong>Response:</strong> {item.response}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="loader">No previous prompts found.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
