import { useState } from 'react';
import { useBooking, GuestDetail } from '@/contexts/BookingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export const GuestDetailsStep = () => {
  const { bookingData, updateGuestDetails, nextStep, prevStep } = useBooking();
  
  const [guests, setGuests] = useState<GuestDetail[]>(
    bookingData?.guestDetails?.length
      ? bookingData.guestDetails
      : Array.from({ length: bookingData?.tripSelection.guestsCount || 1 }, (_, i) => ({
          id: `guest-${i}`,
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          idType: 'aadhar' as const,
          idNumber: '',
        }))
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateGuest = (index: number, field: keyof GuestDetail, value: string) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [field]: value };
    setGuests(updated);
    
    // Clear error for this field
    const errorKey = `${index}-${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    guests.forEach((guest, index) => {
      if (!guest.firstName.trim()) {
        newErrors[`${index}-firstName`] = 'First name is required';
      }
      if (!guest.lastName.trim()) {
        newErrors[`${index}-lastName`] = 'Last name is required';
      }
      if (index === 0) {
        if (!guest.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
          newErrors[`${index}-email`] = 'Valid email is required';
        }
        if (!guest.phone.trim() || !/^\d{10}$/.test(guest.phone)) {
          newErrors[`${index}-phone`] = 'Valid 10-digit phone is required';
        }
      }
      if (!guest.idNumber.trim()) {
        newErrors[`${index}-idNumber`] = 'ID number is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateGuestDetails(guests);
      nextStep();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Guest Details</h2>
        <p className="text-muted-foreground">
          Enter information for all travelers
        </p>
      </div>

      <div className="space-y-6">
        {guests.map((guest, index) => (
          <Card key={guest.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                {index === 0 ? 'Primary Guest' : `Guest ${index + 1}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`first-name-${index}`}>First Name*</Label>
                  <Input
                    id={`first-name-${index}`}
                    value={guest.firstName}
                    onChange={(e) => updateGuest(index, 'firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                  {errors[`${index}-firstName`] && (
                    <p className="text-sm text-destructive">{errors[`${index}-firstName`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`last-name-${index}`}>Last Name*</Label>
                  <Input
                    id={`last-name-${index}`}
                    value={guest.lastName}
                    onChange={(e) => updateGuest(index, 'lastName', e.target.value)}
                    placeholder="Enter last name"
                  />
                  {errors[`${index}-lastName`] && (
                    <p className="text-sm text-destructive">{errors[`${index}-lastName`]}</p>
                  )}
                </div>
              </div>

              {index === 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`email-${index}`}>Email*</Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      value={guest.email}
                      onChange={(e) => updateGuest(index, 'email', e.target.value)}
                      placeholder="email@example.com"
                    />
                    {errors[`${index}-email`] && (
                      <p className="text-sm text-destructive">{errors[`${index}-email`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`phone-${index}`}>Phone*</Label>
                    <Input
                      id={`phone-${index}`}
                      type="tel"
                      value={guest.phone}
                      onChange={(e) => updateGuest(index, 'phone', e.target.value)}
                      placeholder="10-digit mobile number"
                    />
                    {errors[`${index}-phone`] && (
                      <p className="text-sm text-destructive">{errors[`${index}-phone`]}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`id-type-${index}`}>ID Type*</Label>
                  <Select
                    value={guest.idType}
                    onValueChange={(value: 'passport' | 'aadhar' | 'license') =>
                      updateGuest(index, 'idType', value)
                    }
                  >
                    <SelectTrigger id={`id-type-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="aadhar">Aadhar Card</SelectItem>
                      <SelectItem value="license">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`id-number-${index}`}>ID Number*</Label>
                  <Input
                    id={`id-number-${index}`}
                    value={guest.idNumber}
                    onChange={(e) => updateGuest(index, 'idNumber', e.target.value)}
                    placeholder="Enter ID number"
                  />
                  {errors[`${index}-idNumber`] && (
                    <p className="text-sm text-destructive">{errors[`${index}-idNumber`]}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={handleNext} size="lg">
          Next: Add-ons
        </Button>
      </div>
    </div>
  );
};
