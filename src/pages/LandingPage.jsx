import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-dark p-8 text-center">
          <div className="w-48 h-48 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <img
              src="/logo.png"
              alt="Leaf Homeo Care"
              className="w-40 h-40 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Leaf Homeo Care</h1>
          <p className="text-brand-light text-lg">Natural Healing, Modern Care</p>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Homeopathy</h2>
            <p className="text-gray-600 leading-relaxed">
              Experience the power of natural healing with our expert homeopathic treatments. 
              Safe, effective, and personalized care for your health and wellness.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-brand-light rounded-xl">
              <div className="w-12 h-12 bg-brand-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">Natural Care</h3>
              <p className="text-sm text-gray-600 mt-1">100% Natural remedies</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">24/7 Support</h3>
              <p className="text-sm text-gray-600 mt-1">Always available</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">Safe & Effective</h3>
              <p className="text-sm text-gray-600 mt-1">Proven results</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-8 text-center">
            <button className="w-full bg-gradient-to-r from-brand-primary to-brand-dark text-white font-semibold py-4 px-8 rounded-xl hover:from-brand-hover hover:to-brand-dark transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Get Started
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm space-y-2">
            <p>© 2024 Leaf Homeo Care. All rights reserved.</p>
            <div className="flex justify-center space-x-4">
              <Link to="/terms" className="hover:text-brand-primary transition-colors">Terms & Conditions</Link>
              <span>|</span>
              <Link to="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
