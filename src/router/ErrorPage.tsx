export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-error-warning-line text-3xl text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Available</h2>
        <p className="text-gray-600 mb-6">We're having trouble loading this page. Please try refreshing or going back.</p>
        <div className="space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
