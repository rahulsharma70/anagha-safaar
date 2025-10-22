import { useBooking } from '@/contexts/BookingContext';
import { BookingProgress } from './BookingProgress';
import { TripSelectionStep } from './steps/TripSelectionStep';
import { GuestDetailsStep } from './steps/GuestDetailsStep';
import { AddOnsStep } from './steps/AddOnsStep';
import { ReviewStep } from './steps/ReviewStep';
import { TermsStep } from './steps/TermsStep';
import { PaymentStep } from './steps/PaymentStep';

const STEPS = [
  'Trip Details',
  'Guest Info',
  'Add-ons',
  'Review',
  'Terms',
  'Payment',
];

export const BookingFlow = () => {
  const { currentStep } = useBooking();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <TripSelectionStep />;
      case 2:
        return <GuestDetailsStep />;
      case 3:
        return <AddOnsStep />;
      case 4:
        return <ReviewStep />;
      case 5:
        return <TermsStep />;
      case 6:
        return <PaymentStep />;
      default:
        return <TripSelectionStep />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BookingProgress currentStep={currentStep} steps={STEPS} />
        <div className="max-w-5xl mx-auto mt-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};
