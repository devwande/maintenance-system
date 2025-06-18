"use client";

import { useState } from "react";
import { ZoomIn } from "lucide-react";
import ImageModal from "./ImageModal";

interface RequestImageProps {
  requestId: string;
  requestTitle?: string;
  className?: string;
  showZoomIcon?: boolean;
}

const RequestImage = ({
  requestId,
  requestTitle,
  className = "",
  showZoomIcon = true,
}: RequestImageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = `http://localhost:3001/api/requests/image/${requestId}`;

  const handleImageClick = () => {
    if (!hasError) {
      setIsModalOpen(true);
    }
  };

  if (hasError) {
    return null; // Don't render anything if image failed to load
  }

  return (
    <>
      <div
        className={`relative group cursor-pointer ${className}`}
        onClick={handleImageClick}
      >
        {isLoading && (
          <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <img
          src={imageUrl || "/placeholder.svg"}
          alt="Request"
          className={`max-h-40 w-auto rounded-md object-cover shadow-sm border border-gray-200 transition-transform group-hover:scale-105 ${
            isLoading ? "hidden" : "block"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          crossOrigin="anonymous"
        />

        {/* Zoom overlay */}
        {showZoomIcon && !isLoading && !hasError && (
          <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-md flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        )}
      </div>

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={imageUrl}
        alt={`Request image for: ${requestTitle || "Maintenance Request"}`}
        title={requestTitle}
      />
    </>
  );
};

export default RequestImage;
