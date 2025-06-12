import React from 'react';
import Header from '../Components/UI/Header';
import '../Components/CSS/Home.css'; // Reuse global styles or create Profile.css if needed

function Profile() {
  // You can replace this mock data with real user data from state or props
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Music lover, React developer, and podcast host.',
    joined: 'January 2024'
  };

  return (
    <div className="App">
      <Header />
      <main>
        <h1>User Profile</h1>
        <div className="response-area">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Bio:</strong> {user.bio}</p>
          <p><strong>Member Since:</strong> {user.joined}</p>
        </div>
      </main>
      <footer>
        <p>&copy; The Music Corner</p>
      </footer>
    </div>
  );
}

export default Profile;
