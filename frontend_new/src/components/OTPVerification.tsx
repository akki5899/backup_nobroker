'use client';

import { useState } from 'react';
import api from '@/utils/api_client';
import { useModalDismiss } from '@/hooks/useModalDismiss';

interface OTPVerificationProps {
  email?: string;
  phone?: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function OTPVerification({ email, phone, onVerified, onCancel }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useModalDismiss(true, onCancel);

  const sendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      await api.post('/auth/send-otp', {
        email: email || undefined,
        phone: phone || undefined
      });
      
      setOtpSent(true);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      await api.post('/auth/verify-otp', {
        email: email || undefined,
        phone: phone || undefined,
        otp
      });
      
      onVerified();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal p-4" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="bg-card p-6 rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">
          Verify {email ? 'Email' : 'Phone Number'}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {email ? `We'll send a verification code to ${email}` : `We'll send a verification code to ${phone}`}
        </p>

        {!otpSent ? (
          <div className="space-y-4">
            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            
            <button
              onClick={verifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            
            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full text-blue-600 hover:text-blue-700"
            >
              Resend OTP
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}