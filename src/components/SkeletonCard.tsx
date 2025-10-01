export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="w-full h-48 bg-gray-300"></div>
      
      <div className="p-6">
        {/* Badge skeleton */}
        <div className="w-20 h-6 bg-gray-300 rounded-full mb-3"></div>
        
        {/* Title skeleton */}
        <div className="h-6 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
        
        {/* Metadata skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
        </div>
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="mt-4 h-10 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}
