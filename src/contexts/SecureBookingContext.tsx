import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// 1. SECURE BOOKING CONTEXT (NO SENSITIVE PII STORAGE)
// =============================================================================

export type BookingType = 'hotel' | 'flight' | 'tour';

export interface TripSelection {
  startDate: Date | undefined;
  endDate?: Date | undefined;
  guestsCount: number;
  flightClass?: 'economy' | 'business';
}

// Non-sensitive booking data only
export interface SecureBookingData {
  type: BookingType;
  itemId: string;
  itemName: string;
  basePrice: number;
  tripSelection: TripSelection;
  addOns: {
    travelInsurance: boolean;
    mealPlan?: 'breakfast' | 'half-board' | 'full-board';
    specialRequests: string;
  };
  termsAccepted: boolean;
  // Remove sensitive fields - these will be stored server-side only
  // guestDetails: GuestDetail[]; // Moved to server-side storage
}

interface BookingContextType {
  bookingData: SecureBookingData | null;
  currentStep: number;
  totalSteps: number;
  updateBookingData: (data: Partial<SecureBookingData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  resetBooking: () => void;
  // Server-side guest data management
  saveGuestData: (guestData: any) => Promise<boolean>;
  loadGuestData: () => Promise<any>;
  clearGuestData: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// =============================================================================
// 2. SECURE BOOKING PROVIDER
// =============================================================================

export const SecureBookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookingData, setBookingData] = useState<SecureBookingData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Load non-sensitive booking data from sessionStorage
  useEffect(() => {
    const savedData = sessionStorage.getItem('secureBookingData');
    const savedStep = sessionStorage.getItem('bookingCurrentStep');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setBookingData(parsedData);
      } catch (error) {
        console.error('Failed to parse saved booking data:', error);
        sessionStorage.removeItem('secureBookingData');
      }
    }
    
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
  }, []);

  // Save non-sensitive booking data to sessionStorage
  useEffect(() => {
    if (bookingData) {
      sessionStorage.setItem('secureBookingData', JSON.stringify(bookingData));
    }
  }, [bookingData]);

  useEffect(() => {
    sessionStorage.setItem('bookingCurrentStep', currentStep.toString());
  }, [currentStep]);

  const updateBookingData = (data: Partial<SecureBookingData>) => {
    setBookingData(prev => prev ? { ...prev, ...data } : data as SecureBookingData);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const resetBooking = () => {
    setBookingData(null);
    setCurrentStep(1);
    sessionStorage.removeItem('secureBookingData');
    sessionStorage.removeItem('bookingCurrentStep');
    // Clear server-side guest data
    clearGuestData();
  };

  // =============================================================================
  // 3. SERVER-SIDE GUEST DATA MANAGEMENT
  // =============================================================================

  const saveGuestData = async (guestData: any): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Encrypt sensitive data before storing
      const encryptedData = await encryptSensitiveData(guestData);

      const { error } = await supabase
        .from('secure_guest_data')
        .upsert({
          user_id: user.id,
          booking_id: bookingData?.itemId,
          encrypted_data: encryptedData,
          data_hash: await generateDataHash(guestData)
        });

      if (error) {
        console.error('Failed to save guest data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving guest data:', error);
      return false;
    }
  };

  const loadGuestData = async (): Promise<any> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('secure_guest_data')
        .select('encrypted_data')
        .eq('user_id', user.id)
        .eq('booking_id', bookingData?.itemId)
        .single();

      if (error || !data) {
        return null;
      }

      // Decrypt sensitive data
      return await decryptSensitiveData(data.encrypted_data);
    } catch (error) {
      console.error('Error loading guest data:', error);
      return null;
    }
  };

  const clearGuestData = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      await supabase
        .from('secure_guest_data')
        .delete()
        .eq('user_id', user.id)
        .eq('booking_id', bookingData?.itemId);
    } catch (error) {
      console.error('Error clearing guest data:', error);
    }
  };

  // =============================================================================
  // 4. CLIENT-SIDE ENCRYPTION UTILITIES
  // =============================================================================

  const encryptSensitiveData = async (data: any): Promise<string> => {
    try {
      // Use Web Crypto API for client-side encryption
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(JSON.stringify(data));

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  };

  const decryptSensitiveData = async (encryptedData: string): Promise<any> => {
    try {
      // Decode base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // For decryption, we'd need to store the key securely
      // This is a simplified implementation - in production, use proper key management
      throw new Error('Decryption not implemented - use server-side decryption');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  };

  const generateDataHash = async (data: any): Promise<string> => {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const value: BookingContextType = {
    bookingData,
    currentStep,
    totalSteps,
    updateBookingData,
    nextStep,
    previousStep,
    goToStep,
    resetBooking,
    saveGuestData,
    loadGuestData,
    clearGuestData
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

// =============================================================================
// 5. SECURE BOOKING HOOK
// =============================================================================

export const useSecureBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useSecureBooking must be used within a SecureBookingProvider');
  }
  return context;
};

// =============================================================================
// 6. SECURE GUEST DATA COMPONENT
// =============================================================================

interface SecureGuestDataProps {
  onDataChange: (data: any) => void;
  initialData?: any;
}

export const SecureGuestDataForm = ({ onDataChange, initialData }: SecureGuestDataProps) => {
  const { saveGuestData, loadGuestData } = useSecureBooking();
  const [guestData, setGuestData] = useState<any>(initialData || {});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load guest data from server on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await loadGuestData();
        if (data) {
          setGuestData(data);
          onDataChange(data);
        }
      } catch (error) {
        console.error('Failed to load guest data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadGuestData, onDataChange]);

  // Auto-save guest data changes
  useEffect(() => {
    if (Object.keys(guestData).length > 0) {
      const saveData = async () => {
        setIsSaving(true);
        try {
          await saveGuestData(guestData);
        } catch (error) {
          console.error('Failed to save guest data:', error);
        } finally {
          setIsSaving(false);
        }
      };

      const timeoutId = setTimeout(saveData, 1000); // Debounce saves
      return () => clearTimeout(timeoutId);
    }
  }, [guestData, saveGuestData]);

  const handleDataChange = (field: string, value: any) => {
    const newData = { ...guestData, [field]: value };
    setGuestData(newData);
    onDataChange(newData);
  };

  if (isLoading) {
    return <div>Loading guest data...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">First Name</label>
        <input
          type="text"
          value={guestData.firstName || ''}
          onChange={(e) => handleDataChange('firstName', e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter first name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Last Name</label>
        <input
          type="text"
          value={guestData.lastName || ''}
          onChange={(e) => handleDataChange('lastName', e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter last name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={guestData.email || ''}
          onChange={(e) => handleDataChange('email', e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter email"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Phone</label>
        <input
          type="tel"
          value={guestData.phone || ''}
          onChange={(e) => handleDataChange('phone', e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter phone number"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">ID Type</label>
        <select
          value={guestData.idType || ''}
          onChange={(e) => handleDataChange('idType', e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select ID Type</option>
          <option value="passport">Passport</option>
          <option value="aadhar">Aadhaar</option>
          <option value="license">Driving License</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">ID Number</label>
        <input
          type="text"
          value={guestData.idNumber || ''}
          onChange={(e) => handleDataChange('idNumber', e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter ID number"
        />
      </div>

      {isSaving && (
        <div className="text-sm text-blue-600">
          Saving guest data...
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 7. SECURE SESSION STORAGE UTILITIES
// =============================================================================

export class SecureSessionStorage {
  // Store only non-sensitive data
  static setItem(key: string, value: any): void {
    try {
      const nonSensitiveData = this.filterSensitiveData(value);
      sessionStorage.setItem(key, JSON.stringify(nonSensitiveData));
    } catch (error) {
      console.error('Failed to store data in session storage:', error);
    }
  }

  static getItem(key: string): any {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve data from session storage:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  static clear(): void {
    sessionStorage.clear();
  }

  // Filter out sensitive data before storing
  private static filterSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = [
      'password', 'ssn', 'creditCard', 'bankAccount', 'passport',
      'aadhaar', 'idNumber', 'phone', 'email', 'address',
      'firstName', 'lastName', 'fullName', 'dateOfBirth'
    ];

    if (Array.isArray(data)) {
      return data.map(item => this.filterSensitiveData(item));
    }

    const filtered: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (!sensitiveFields.includes(key.toLowerCase())) {
        filtered[key] = this.filterSensitiveData(value);
      } else {
        // Replace sensitive data with placeholder
        filtered[key] = '[PROTECTED]';
      }
    }

    return filtered;
  }
}

export default {
  SecureBookingProvider,
  useSecureBooking,
  SecureGuestDataForm,
  SecureSessionStorage
};
