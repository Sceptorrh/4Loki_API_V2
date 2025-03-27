'use client';

import { FaPlus } from 'react-icons/fa';
import { useState } from 'react';
import { endpoints } from '@/lib/api';

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
  ServiceNote?: string;
  serviceNote?: string;
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
  const [editingNoteDogId, setEditingNoteDogId] = useState<number | null>(null);
  const [editedNote, setEditedNote] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

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

  const handleEditNote = (dogId: number, currentNote: string) => {
    setEditingNoteDogId(dogId);
    setEditedNote(currentNote);
  };

  const handleSaveNote = async (dogId: number) => {
    try {
      setIsSavingNote(true);
      
      // Find the dog to get its required fields
      const dog = customerDogs.find(d => d.Id === dogId || d.id === dogId);
      if (!dog) {
        throw new Error('Dog not found');
      }

      // Make API call to update the dog's service note with all required fields
      const response = await endpoints.dogs.update(dogId, {
        CustomerId: dog.CustomerId || dog.customerId,
        Name: dog.Name || dog.name,
        ServiceNote: editedNote
      });
      
      // Update local state with the response data
      const updatedDog = response.data;
      const updatedDogs = customerDogs.map(dog => {
        if (dog.Id === dogId || dog.id === dogId) {
          return {
            ...dog,
            ServiceNote: updatedDog.ServiceNote,
            serviceNote: updatedDog.ServiceNote // Update both fields for compatibility
          };
        }
        return dog;
      });
      
      // Update the dog in the parent component
      if (onDogSelectionChanged) {
        onDogSelectionChanged();
      }
      
      setEditingNoteDogId(null);
    } catch (error) {
      console.error('Error saving service note:', error);
      // Show error message to user
      alert('Failed to save service note. Please try again.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteDogId(null);
    setEditedNote('');
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        {selectedCustomerId && (
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setShowDogModal(true)}
            title="Add New Dog"
          >
            <FaPlus size={14} />
          </button>
        )}
        <label className="block text-sm font-medium text-gray-700">
          Select Dogs *
        </label>
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
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setShowDogModal(true)}
              title="Add First Dog"
            >
              <FaPlus size={14} />
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
                className={`rounded-lg shadow-sm transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'ring-2 ring-primary-500 bg-white' 
                    : 'bg-gray-50 hover:bg-white hover:shadow-md'
                }`}
                onClick={() => handleDogSelection(dogId, !isSelected)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {(dog.Name || dog.name || dog.DogName || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {dog.Name || dog.name || dog.DogName || 'Unnamed Dog'}
                        </h3>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-500' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="border-t" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4">
                      <h4 className="font-medium text-gray-700 mb-3">Services</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.map(service => {
                          const isServiceSelected = dogServices[dogId]?.some(s => s.ServiceId === service.Id) || false;
                          const servicePrice = dogServices[dogId]?.find(s => s.ServiceId === service.Id)?.Price || service.StandardPrice;
                          const stats = dogServiceStats[dogId]?.find(s => s.ServiceId === service.Id);
                          const usagePercentage = stats ? Math.round(stats.percentage) : 0;
                          
                          return (
                            <div 
                              key={service.Id} 
                              className={`relative rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                                isServiceSelected 
                                  ? 'bg-primary-50 border-primary-200 shadow-sm' 
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServiceSelection(dogId, service.Id, !isServiceSelected);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-grow">
                                  <div className="flex items-center">
                                    <span className="font-medium text-gray-900">{service.Name}</span>
                                    {usagePercentage > 0 && (
                                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                        usagePercentage >= 75 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {usagePercentage}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                  isServiceSelected 
                                    ? 'border-primary-500 bg-primary-500' 
                                    : 'border-gray-300 bg-white'
                                }`}>
                                  {isServiceSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              
                              {isServiceSelected && (
                                <div className="mt-3">
                                  <div className="flex items-center">
                                    <span className="text-gray-600 mr-2">€</span>
                                    <div className="relative flex items-center">
                                      <button
                                        type="button"
                                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newPrice = Math.max(0, Number(servicePrice) - 2.5);
                                          handleServicePriceChange(dogId, service.Id, newPrice);
                                        }}
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                      </button>
                                      <input
                                        type="number"
                                        value={servicePrice}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          const newPrice = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                          handleServicePriceChange(dogId, service.Id, newPrice);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-20 mx-2 text-center border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        step="2.5"
                                      />
                                      <button
                                        type="button"
                                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newPrice = Number(servicePrice) + 2.5;
                                          handleServicePriceChange(dogId, service.Id, newPrice);
                                        }}
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Service Notes Section - Always show when dog is selected */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Service Notes
                          </label>
                          {editingNoteDogId === dogId ? (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-sm text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveNote(dogId)}
                                disabled={isSavingNote}
                                className="text-sm text-primary-600 hover:text-primary-900 disabled:opacity-50"
                              >
                                {isSavingNote ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEditNote(dogId, dog.ServiceNote || dog.serviceNote || '')}
                              className="text-sm text-primary-600 hover:text-primary-900"
                            >
                              {dog.ServiceNote || dog.serviceNote ? 'Edit' : 'Add Note'}
                            </button>
                          )}
                        </div>
                        {editingNoteDogId === dogId ? (
                          <textarea
                            value={editedNote}
                            onChange={(e) => setEditedNote(e.target.value)}
                            className="w-full text-sm text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            rows={3}
                            placeholder="Enter service notes..."
                          />
                        ) : (
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                            {dog.ServiceNote || dog.serviceNote || 'No service notes available'}
                          </div>
                        )}
                      </div>
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