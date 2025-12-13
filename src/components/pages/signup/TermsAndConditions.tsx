import React from 'react'

interface TermsAndConditionsProps{
    setShowTermsModal: (value:boolean) => void;
}

function TermsAndConditions({setShowTermsModal}: TermsAndConditionsProps) {
  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Terms and Conditions</h2>
            <div className="mb-6">
              <p className="mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim.
              </p>
              <p className="mb-4">
                Phasellus ligula massa, congue ac vulputate non, dignissim at augue. Sed auctor fringilla quam quis porttitor. Praesent vitae diam in tortor porttitor auctor in nec erat. Aliquam eget odio sed justo iaculis laoreet at eu massa.
              </p>
              <p>
                Donec placerat, nulla sed suscipit aliquam, massa dui pharetra leo, ac dapibus augue lorem vitae est. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula.
              </p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="px-4 py-2 bg-primary-dull text-white rounded-md hover:bg-primary-medium"
            >
              Close
            </button>
          </div>
        </div>
  )
}
export default TermsAndConditions
