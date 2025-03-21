'use client';

import { FaPlus } from 'react-icons/fa';

interface DogService {
  ServiceId: string;
  Price: number;
}

interface Dog {
  Id: number;
  Name?: string;
  CustomerId?: number;
  DogId?: number;
  DogName?: string;
  customerId?: number;
  id?: number;
  name?: string;
  services?: DogService[];
}

interface Service {
  Id: string;
  Name: string;
  StandardPrice: number;
  IsPriceAllowed: boolean;
  StandardDuration: number;
}

interface ServiceStat {
  ServiceId: string;
  count: number;
  prices: {
    price: number;
    date: string;
  }[];
  durations: {
    duration: number;
    date: string;
  }[];
  percentage: number;
}

interface DogServiceSelectionProps {
  selectedCustomerId: number | null;
  customerDogs: Dog[];
  selectedDogIds: number[];
  setSelectedDogIds: React.Dispatch<React.SetStateAction<number[]>>;
  dogServices: Record<number, DogService[]>;
  setDogServices: React.Dispatch<React.SetStateAction<Record<number, DogService[]>>>;
  dogNotes: Record<number, string>;
  setDogNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  dogServiceStats: Record<number, ServiceStat[]>;
  services: Service[];
  setShowDogModal: (show: boolean) => void;
  onDogSelectionChanged?: () => void;
}

export default function DogServiceSelection({
  selectedCustomerId,
  customerDogs,
  selectedDogIds,
  setSelectedDogIds,
  dogServices,
  setDogServices,
  dogNotes,
  setDogNotes,
  dogServiceStats,
  services,
  setShowDogModal,
  onDogSelectionChanged
}: DogServiceSelectionProps) {
  
  const handleDogSelection = (dogId: number, isSelected: boolean) => {
    let newSelectedDogIds;
    if (isSelected) {
      // Add dog ID if it's not already in the array
      newSelectedDogIds = [...selectedDogIds, dogId];
    } else {
      // Remove dog ID
      newSelectedDogIds = selectedDogIds.filter((id) => id !== dogId);
      
      // Also remove services for this dog
      const newDogServices = { ...dogServices };
      delete newDogServices[dogId];
      setDogServices(newDogServices);
      
      // Remove notes for this dog
      const newDogNotes = { ...dogNotes };
      delete newDogNotes[dogId];
      setDogNotes(newDogNotes);
    }
    
    // Set the new selected dog IDs
    setSelectedDogIds(newSelectedDogIds);
    
    // Call the callback if it exists
    if (onDogSelectionChanged) {
      onDogSelectionChanged();
    }
  };

  const handleDogNoteChange = (dogId: number, note: string) => {
    setDogNotes(current => ({
      ...current,
      [dogId]: note
    }));
  };

  const handleServiceSelection = (dogId: number, serviceId: string, isSelected: boolean) => {
    if (isSelected) {
      // Find the service to get its standard price
      const serviceInfo = services.find(s => s.Id === serviceId);
      if (!serviceInfo) return;
      
      // Add service with standard price
      const newService = {
        ServiceId: serviceId,
        Price: Number(serviceInfo.StandardPrice)
      };
      
      setDogServices(current => ({
        ...current,
        [dogId]: [...(current[dogId] || []), newService]
      }));
      
      console.log(`Added service ${serviceId} with price ${serviceInfo.StandardPrice}`);
    } else {
      // Remove service
      setDogServices(current => {
        const dogServicesCopy = [...(current[dogId] || [])];
        const index = dogServicesCopy.findIndex(s => s.ServiceId === serviceId);
        if (index !== -1) {
          dogServicesCopy.splice(index, 1);
        }
        return {
          ...current,
          [dogId]: dogServicesCopy
        };
      });
    }
  };

  const handleServicePriceChange = (dogId: number, serviceId: string, price: number) => {
    console.log(`Updating price for dog ${dogId}, service ${serviceId} to ${price}`);
    
    setDogServices(current => {
      const dogServicesCopy = [...(current[dogId] || [])];
      const index = dogServicesCopy.findIndex(s => s.ServiceId === serviceId);
      
      if (index !== -1) {
        console.log(`Found service at index ${index}, current price: ${dogServicesCopy[index].Price}`);
        dogServicesCopy[index] = {
          ...dogServicesCopy[index],
          Price: Number(price)
        };
        console.log(`Updated price to: ${dogServicesCopy[index].Price}`);
      } else {
        console.log(`Service not found in dog's services`);
      }
      
      return {
        ...current,
        [dogId]: dogServicesCopy
      };
    });
  };

  // Render service selection for a specific dog
  const renderServiceSelection = (dogId: number, service: Service) => {
    const isServiceSelected = dogServices[dogId]?.some(s => s.ServiceId === service.Id) || false;
    const servicePrice = dogServices[dogId]?.find(s => s.ServiceId === service.Id)?.Price || service.StandardPrice;
    
    // Get service statistics
    const stats = dogServiceStats[dogId]?.find(s => s.ServiceId === service.Id);
    const usagePercentage = stats ? Math.round(stats.percentage) : 0;
    const priceHistory = stats?.prices || [];
    const hasPriceHistory = priceHistory.length > 0;
    const averagePrice = hasPriceHistory 
      ? (priceHistory.reduce((sum, entry) => sum + entry.price, 0) / priceHistory.length).toFixed(2)
      : null;
    
    // The most recent price is the first in the sorted array
    const mostRecentPrice = hasPriceHistory ? priceHistory[0].price : null;
    const mostRecentDate = hasPriceHistory ? new Date(priceHistory[0].date).toLocaleDateString() : null;
    
    // Duration history
    const durationHistory = stats?.durations || [];
    const hasDurationHistory = durationHistory.length > 0;
    const averageDuration = hasDurationHistory 
      ? Math.round(durationHistory.reduce((sum, entry) => sum + entry.duration, 0) / durationHistory.length)
      : null;
    
    // The most recent duration is the first in the sorted array
    const mostRecentDuration = hasDurationHistory ? durationHistory[0].duration : null;
    
    return (
      <div key={service.Id} className="flex flex-col sm:flex-row sm:items-center mb-3">
        <div className="flex items-center mb-2 sm:mb-0 sm:flex-1">
          <input
            type="checkbox"
            id={`service-${dogId}-${service.Id}`}
            checked={isServiceSelected}
            onChange={(e) => handleServiceSelection(dogId, service.Id, e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor={`service-${dogId}-${service.Id}`} className="ml-2 text-gray-700 flex items-center">
            {service.Name}
            {usagePercentage > 0 && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                usagePercentage >= 75 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {usagePercentage}%
              </span>
            )}
          </label>
        </div>
        
        {isServiceSelected && (
          <div className="sm:w-40 flex items-center relative group">
            <span className="text-gray-500 mr-2">€</span>
            <div className="relative flex-grow">
              <input
                type="number"
                value={isNaN(Number(servicePrice)) ? 0 : Number(servicePrice)}
                onChange={(e) => {
                  const newPrice = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  handleServicePriceChange(dogId, service.Id, newPrice);
                }}
                className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                  hasPriceHistory || hasDurationHistory ? 'pr-7' : ''
                }`}
                step="0.01"
                min="0"
              />
              {(hasPriceHistory || hasDurationHistory) && (
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            
            {(hasPriceHistory || hasDurationHistory) && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white shadow-md border border-gray-200 rounded-md p-2 text-xs z-10 hidden group-hover:block">
                {hasPriceHistory && (
                  <div>
                    <div className="font-medium mb-1 text-sm border-b pb-1">Price History</div>
                    <div className="mb-1">
                      <span className="font-medium">Most recent:</span> €{mostRecentPrice !== null ? mostRecentPrice.toFixed(2) : '0.00'}
                      {mostRecentDate && <span className="text-gray-500 ml-1">({mostRecentDate})</span>}
                    </div>
                    {averagePrice && (
                      <div>
                        <span className="font-medium">Average:</span> €{averagePrice}
                      </div>
                    )}
                    {priceHistory.length > 1 && (
                      <div className="mt-1">
                        <span className="font-medium">Range:</span> €
                        {Math.min(...priceHistory.map(p => p.price)).toFixed(2)} - €
                        {Math.max(...priceHistory.map(p => p.price)).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
                
                {hasDurationHistory && (
                  <div className={hasPriceHistory ? "mt-3" : ""}>
                    <div className="font-medium mb-1 text-sm border-b pb-1">Duration History</div>
                    <div className="mb-1">
                      <span className="font-medium">Most recent:</span> {mostRecentDuration !== null ? 
                        `${Math.floor(mostRecentDuration / 60)}h ${mostRecentDuration % 60}m` : 
                        'Not available'}
                    </div>
                    {averageDuration && (
                      <div>
                        <span className="font-medium">Average:</span> {Math.floor(averageDuration / 60)}h {averageDuration % 60}m
                      </div>
                    )}
                    {durationHistory.length > 1 && (
                      <div className="mt-1">
                        <span className="font-medium">Range:</span> {Math.floor(Math.min(...durationHistory.map(d => d.duration)) / 60)}h {Math.min(...durationHistory.map(d => d.duration)) % 60}m - 
                        {Math.floor(Math.max(...durationHistory.map(d => d.duration)) / 60)}h {Math.max(...durationHistory.map(d => d.duration)) % 60}m
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Dogs *
        </label>
        {selectedCustomerId && (
          <button
            type="button"
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
            onClick={() => setShowDogModal(true)}
          >
            <FaPlus className="mr-1" size={12} /> Add New Dog
          </button>
        )}
      </div>
      {customerDogs.length === 0 ? (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-center">
          <p className="text-gray-500 text-sm mb-2">
            {selectedCustomerId 
              ? "No dogs found for this customer." 
              : "Please select a customer to see their dogs."}
          </p>
          {selectedCustomerId && (
            <button
              type="button"
              className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm inline-flex items-center"
              onClick={() => setShowDogModal(true)}
            >
              <FaPlus className="mr-1" size={12} /> Add First Dog
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {customerDogs.map((dog: Dog) => {
            const dogId = dog.Id || dog.id || 0;
            const isSelected = selectedDogIds.includes(dogId);
            const dogStats = dogServiceStats[dogId];
            const hasAutoSelectedServices = dogStats && dogStats.some(stat => stat.percentage >= 75);
            
            return (
              <div 
                key={dogId} 
                className={`border rounded-md p-4 ${
                  isSelected 
                    ? 'border-primary-500' 
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleDogSelection(dogId, e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    id={`dog-${dogId}`}
                  />
                  <label htmlFor={`dog-${dogId}`} className="ml-2 text-lg font-medium text-gray-900">
                    {dog.Name || dog.name || dog.DogName || 'Unnamed Dog'}
                    {dogStats && dogStats.length > 0 && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        {hasAutoSelectedServices 
                          ? '(Has common services)' 
                          : '(Service history available)'}
                      </span>
                    )}
                  </label>
                </div>
                
                {isSelected && (
                  <div className="mt-3 pl-6">
                    <h4 className="font-medium text-gray-700 mb-2">Services</h4>
                    <div className="space-y-3">
                      {services.map(service => renderServiceSelection(dogId, service))}
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor={`dog-note-${dogId}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Notes for this dog
                      </label>
                      <textarea
                        id={`dog-note-${dogId}`}
                        value={dogNotes[dogId] || ""}
                        onChange={(e) => handleDogNoteChange(dogId, e.target.value)}
                        rows={2}
                        placeholder="E.g., Prefers gentle brushing"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 