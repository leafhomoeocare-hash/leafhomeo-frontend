import React from "react";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import {
  Mail,
  Phone,
  MessageSquare,
  HelpCircle,
  ArrowRight
} from "lucide-react";

export default function HelpAndSupport() {
  const navigate = useNavigate();

  const handleChatClick = () => {
    navigate("/patient/chat", { state: { selectUserId: "admin" } });
  };

  const faqs = [
    {
      question: "How do I book an appointment?",
      answer: "Navigate to the 'Book Appointment' section from the dashboard, select your preferred doctor, choose a suitable time slot, and confirm your booking."
    },
    {
      question: "How can I cancel or reschedule my appointment?",
      answer: "Go to 'My Appointments', select the appointment you wish to modify, and choose the cancel or reschedule option. Please do this at least 24 hours before your scheduled time."
    },
    {
      question: "How do I chat with support?",
      answer: "Click on the 'Chat' option in the Help & Support section to start a conversation with our support team. We're here to help you!"
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major credit cards, debit cards, and online payment methods. Payment is required at the time of booking."
    },
    {
      question: "How do I change my password?",
      answer: "Go to your Profile page and click on 'Change Password'. You'll need to enter your current password and then set a new one."
    }
  ];

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Help & Support</h1>
          <p className="text-gray-500">We're here to help you with any questions or concerns</p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Email Us */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-brand-primary transition-all cursor-pointer hover:shadow-lg">
            <div className="w-14 h-14 bg-brand-light rounded-xl flex items-center justify-center mb-4">
              <Mail className="h-7 w-7 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Email Us</h3>
            <p className="text-sm text-gray-600 mb-4">Get in touch via email for detailed queries</p>
            <a href="mailto:support@leafhomeo.com" className="text-brand-primary font-semibold text-sm flex items-center gap-1 hover:underline">
              support@leafhomeo.com
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Call Us */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-brand-primary transition-all cursor-pointer hover:shadow-lg">
            <div className="w-14 h-14 bg-brand-light rounded-xl flex items-center justify-center mb-4">
              <Phone className="h-7 w-7 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Call Us</h3>
            <p className="text-sm text-gray-600 mb-4">Speak directly with our support team</p>
            <a href="tel:+911800123456" className="text-brand-primary font-semibold text-sm flex items-center gap-1 hover:underline">
              +91 1800 123 456
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Chat */}
          <div
            onClick={handleChatClick}
            className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-brand-primary transition-all cursor-pointer hover:shadow-lg"
          >
            <div className="w-14 h-14 bg-brand-light rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="h-7 w-7 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chat</h3>
            <p className="text-sm text-gray-600 mb-4">Start a live chat with our support team</p>
            <span className="text-brand-primary font-semibold text-sm flex items-center gap-1 hover:underline">
              Start Chat
              <ArrowRight size={14} />
            </span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-xl p-5 hover:border-brand-primary/30 transition-all"
              >
                <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
