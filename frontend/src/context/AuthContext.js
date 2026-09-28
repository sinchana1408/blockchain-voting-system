import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('voterToken');
    const voterHash = localStorage.getItem('voterHash');
    const voterId = localStorage.getItem('voterId');
    const hasVoted = localStorage.getItem('hasVoted') === 'true';
    return token ? { token, voterHash, voterId, hasVoted } : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const login = (token, voterHash, hasVoted = false, voterId = '') => {
    localStorage.setItem('voterToken', token);
    localStorage.setItem('voterHash', voterHash);
    localStorage.setItem('hasVoted', String(hasVoted));
    if (voterId) localStorage.setItem('voterId', voterId);
    setUser({ token, voterHash, hasVoted, voterId });
    setIsAuthModalOpen(false);
  };

  const markVoted = () => {
    localStorage.setItem('hasVoted', 'true');
    setUser(prev => (prev ? { ...prev, hasVoted: true } : null));
  };

  const logout = () => {
    localStorage.removeItem('voterToken');
    localStorage.removeItem('voterHash');
    localStorage.removeItem('voterId');
    localStorage.removeItem('hasVoted');
    setUser(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        markVoted,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};