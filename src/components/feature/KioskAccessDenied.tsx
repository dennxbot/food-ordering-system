import { useNavigate } from 'react-router-dom';

const KioskAccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            Kiosk accounts can only be accessed from the designated kiosk terminal at:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <code className="text-sm font-mono text-gray-800">
              http://localhost:3000/kiosk-login
            </code>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            Please use the kiosk terminal to access your account, or contact your administrator for assistance.
          </p>
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default KioskAccessDenied;