import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import { getTermsConditions } from '../api/legalApi';

const TermsAndConditions = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTermsConditions();
        if (response.status === 1) {
          setContent(response.data);
        } else {
          setContent(null);
        }
      } catch (err) {
        console.error('Error fetching terms:', err);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-light to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-light to-white flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600">{error}</p>
        <Link to="/" className="px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/"
          className="flex items-center text-gray-500 hover:text-gray-700 mb-6 font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Link>

        {/* Header Card */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl overflow-hidden shadow-lg mb-6">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-brand-primary to-brand-secondary-500 relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
          </div>

          {/* Content */}
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-white overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center">
                <FileText className="h-10 w-10 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Terms & Conditions</h1>
                <p className="text-gray-500 mt-1">Last updated: {content?.updatedAt || 'N/A'}</p>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {content?.text ? (
                <div
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: content.text }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No content available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-primary" />
            Contact Information
          </h3>
          <p className="text-gray-600">
            If you have any questions about these Terms & Conditions, please contact us at{' '}
            <a href="mailto:support@leafhomeocare.com" className="text-brand-primary font-medium hover:underline">
              support@leafhomeocare.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
