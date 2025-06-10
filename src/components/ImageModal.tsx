"use client"

import type React from "react"

import { useState } from "react"
import { X, ZoomIn, Download } from "lucide-react"

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  alt: string
  title?: string
}

const ImageModal = ({ isOpen, onClose, imageUrl, alt, title }: ImageModalProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (!isOpen) return null

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `maintenance-image-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-t-lg">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{title || "Request Image"}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Download image"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Close">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 bg-white rounded-b-lg overflow-hidden flex items-center justify-center">
          {isLoading && !hasError && (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading image...</p>
            </div>
          )}

          {hasError && (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <ZoomIn className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">Failed to load image</p>
              <p className="text-sm">The image could not be displayed</p>
            </div>
          )}

          <img
            src={imageUrl || "/placeholder.svg"}
            alt={alt}
            className={`max-w-full max-h-full object-contain ${isLoading ? "hidden" : "block"}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
          />
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          Click outside to close
        </div>
      </div>
    </div>
  )
}

export default ImageModal
