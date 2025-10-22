import React, { createContext, useContext, useState, useEffect } from 'react';

export type BookingType = 'hotel' | 'flight' | 'tour';

export interface TripSelection {
  startDate: Date | undefined;
  endDate?: Date | undefined;
  guestsCount: number;
  flightClass?: 'economy' | 'business';
}

export interface GuestDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idType: 'passport' | 'aadhar' | 'license';
  idNumber: string;
}

export interface AddOns {
  travelInsurance: boolean;
  mealPlan?: 'breakfast' | 'half-board' | 'full-board';
  specialRequests: string;
}

export interface BookingData {
  type: BookingType;
  itemId: string;
  itemName: string;
  basePrice: number;
  tripSelection: TripSelection;
  guestDetails: GuestDetail[];
  addOns: AddOns;
  termsAccepted: boolean;
}

interface BookingContextType {
  bookingData: BookingData | null;
  currentStep: number;
  initBooking: (type: BookingType, itemId: string, itemName: string, basePrice: number) => void;
  updateTripSelection: (data: TripSelection) => void;
  updateGuestDetails: (data: GuestDetail[]) => void;
  updateAddOns: (data: AddOns) => void;
  updateTermsAccepted: (accepted: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  clearBooking: () => void;
  getTotalPrice: () => number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const STORAGE_KEY = 'booking_draft';

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Load from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (parsed.tripSelection?.startDate) {
          parsed.tripSelection.startDate = new Date(parsed.tripSelection.startDate);
        }
        if (parsed.tripSelection?.endDate) {
          parsed.tripSelection.endDate = new Date(parsed.tripSelection.endDate);
        }
        setBookingData(parsed);
      } catch (e) {
        console.error('Failed to parse stored booking data', e);
      }
    }
  }, []);

  // Save to session storage whenever booking data changes
  useEffect(() => {
    if (bookingData) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookingData));
    }
  }, [bookingData]);

  const initBooking = (type: BookingType, itemId: string, itemName: string, basePrice: number) => {
    setBookingData({
      type,
      itemId,
      itemName,
      basePrice,
      tripSelection: {
        startDate: undefined,
        endDate: undefined,
        guestsCount: 1,
      },
      guestDetails: [],
      addOns: {
        travelInsurance: false,
        specialRequests: '',
      },
      termsAccepted: false,
    });
    setCurrentStep(1);
  };

  const updateTripSelection = (data: TripSelection) => {
    setBookingData(prev => prev ? { ...prev, tripSelection: data } : null);
  };

  const updateGuestDetails = (data: GuestDetail[]) => {
    setBookingData(prev => prev ? { ...prev, guestDetails: data } : null);
  };

  const updateAddOns = (data: AddOns) => {
    setBookingData(prev => prev ? { ...prev, addOns: data } : null);
  };

  const updateTermsAccepted = (accepted: boolean) => {
    setBookingData(prev => prev ? { ...prev, termsAccepted: accepted } : null);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const goToStep = (step: number) => setCurrentStep(step);

  const clearBooking = () => {
    setBookingData(null);
    setCurrentStep(1);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const getTotalPrice = () => {
    if (!bookingData) return 0;
    
    let total = bookingData.basePrice * bookingData.tripSelection.guestsCount;
    
    // Calculate nights for hotels
    if (bookingData.type === 'hotel' && bookingData.tripSelection.startDate && bookingData.tripSelection.endDate) {
      const nights = Math.ceil(
        (bookingData.tripSelection.endDate.getTime() - bookingData.tripSelection.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      total = bookingData.basePrice * nights * bookingData.tripSelection.guestsCount;
    }
    
    // Calculate days for tours
    if (bookingData.type === 'tour') {
      total = bookingData.basePrice * bookingData.tripSelection.guestsCount;
    }
    
    // Add insurance
    if (bookingData.addOns.travelInsurance) {
      total += 500 * bookingData.tripSelection.guestsCount;
    }
    
    // Add meal plan
    if (bookingData.addOns.mealPlan === 'breakfast') {
      total += 500;
    } else if (bookingData.addOns.mealPlan === 'half-board') {
      total += 1200;
    } else if (bookingData.addOns.mealPlan === 'full-board') {
      total += 2000;
    }
    
    return total;
  };

  return (
    <BookingContext.Provider
      value={{
        bookingData,
        currentStep,
        initBooking,
        updateTripSelection,
        updateGuestDetails,
        updateAddOns,
        updateTermsAccepted,
        nextStep,
        prevStep,
        goToStep,
        clearBooking,
        getTotalPrice,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};
