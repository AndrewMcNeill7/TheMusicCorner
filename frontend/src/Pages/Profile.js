import React, { useState, useEffect } from 'react';
import Header from '../Components/UI/Header';
import Footer from '../Components/UI/Footer';
import '../Components/CSS/Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return;

    const userData = {
      email: storedUser?.payload?.email || 'Unknown Email',
      name: storedUser?.payload?.name || (() => {
        const first = storedUser?.payload?.given_name || '';
        const last = storedUser?.payload?.family_name || '';
        return (first + ' ' + last).trim() || 'Anonymous';
      })(),
      userId: storedUser?.payload?.sub,
    };

    setUser(userData);

    if (userData.userId) {
      fetch(`http://localhost:3001/api/get-history?userId=${userData.userId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch history');
          return res.json();
        })
        .then((data) => setHistory(data))
        .catch((err) => console.error('Error loading history:', err.message));
    }
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
          <h2>Past AI Searches</h2>
          {history.length > 0 ? (
            <ul className="history-list">
              {history.map((item, index) => (
                <li key={index} className="history-item">
                  <p><strong>Prompt:</strong> {item.prompt}</p>
                  <p><strong>Response:</strong> {item.response}</p>
                  <p><small>{new Date(item.timestamp).toLocaleString()}</small></p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="loader">No previous searches found.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
