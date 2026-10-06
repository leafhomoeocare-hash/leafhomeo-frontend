import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary to-brand-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-10 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl">
              <img
                src="/logo.png"
                alt="Leaf Homeo Care"
                className="w-20 h-20 object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Leaf Homeo Care</h1>
            <p className="text-brand-light text-lg font-medium">Natural Healing, Modern Care</p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="p-10 text-center space-y-6">
          <div className="inline-block bg-brand-light/50 border-2 border-brand-primary rounded-2xl px-6 py-3 mb-4">
            <h2 className="text-2xl font-bold text-brand-secondary">Coming Soon</h2>
          </div>

          {/* Login/Register Buttons */}
          <div className="flex gap-3">
            <Link 
              to="/login" 
              className="flex-1 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="flex-1 bg-white border-2 border-brand-primary text-brand-primary font-semibold py-3 px-6 rounded-xl hover:bg-brand-light transition-all duration-300"
            >
              Register
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-gray-500 text-xs">
            <p>© 2024 Leaf Homeo Care. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
