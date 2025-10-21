import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Sparkles, 
  Clock, 
  Utensils, 
  Camera,
  Plane,
  Car,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { aiService, ItineraryRequest, GeneratedItinerary } from '@/lib/api/ai';
import { monitoringService } from '@/lib/monitoring';

const itinerarySchema = z.object({
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budget: z.number().min(1000, 'Budget must be at least ₹1,000'),
  travelers: z.number().min(1, 'At least 1 traveler required'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  travelStyle: z.enum(['budget', 'mid-range', 'luxury']),
  accommodationType: z.enum(['hotel', 'hostel', 'resort', 'homestay']),
});

type ItineraryFormData = z.infer<typeof itinerarySchema>;

const ItineraryGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ItineraryFormData>({
    resolver: zodResolver(itinerarySchema),
    defaultValues: {
      travelers: 2,
      budget: 50000,
      interests: [],
      travelStyle: 'mid-range',
      accommodationType: 'hotel',
    },
  });

  const watchedInterests = watch('interests');

  const interestOptions = [
    { value: 'cultural', label: 'Cultural Sites', icon: '🏛️' },
    { value: 'adventure', label: 'Adventure', icon: '🏔️' },
    { value: 'spiritual', label: 'Spiritual', icon: '🕉️' },
    { value: 'nature', label: 'Nature', icon: '🌿' },
    { value: 'food', label: 'Food & Cuisine', icon: '🍽️' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'beaches', label: 'Beaches', icon: '🏖️' },
    { value: 'mountains', label: 'Mountains', icon: '⛰️' },
  ];

  const toggleInterest = (interest: string) => {
    const currentInterests = watchedInterests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    setValue('interests', newInterests);
  };

  const onSubmit = async (data: ItineraryFormData) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedItinerary(null);

    try {
      monitoringService.trackUserBehavior('itinerary_generation_started', 'ItineraryGenerator');

      const request: ItineraryRequest = {
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget,
        travelers: data.travelers,
        interests: data.interests,
        travelStyle: data.travelStyle,
        accommodationType: data.accommodationType,
      };

      const itinerary = await aiService.generateItinerary(request);
      setGeneratedItinerary(itinerary);

      monitoringService.trackUserBehavior('itinerary_generation_completed', 'ItineraryGenerator', {
        destination: data.destination,
        duration: itinerary.duration,
        budget: data.budget,
      });

      toast.success('Itinerary generated successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to generate itinerary');
      monitoringService.trackError(error as Error, {
        component: 'ItineraryGenerator',
        action: 'generate_itinerary',
      });
      toast.error('Failed to generate itinerary');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const downloadItinerary = () => {
    if (!generatedItinerary) return;

    const content = `
# ${generatedItinerary.destination} Itinerary

**Duration:** ${generatedItinerary.duration} days
**Total Budget:** ${formatAmount(generatedItinerary.totalCost)}

## Summary
${generatedItinerary.summary}

## Highlights
${generatedItinerary.highlights.map(h => `- ${h}`).join('\n')}

## Daily Itinerary
${generatedItinerary.days.map(day => `
### Day ${day.day} - ${new Date(day.date).toLocaleDateString()}

**Activities:**
${day.activities.map(activity => `- ${activity.time}: ${activity.name} (${activity.duration})`).join('\n')}

**Meals:**
${day.meals.map(meal => `- ${meal.time}: ${meal.name} (${meal.cuisine})`).join('\n')}

**Estimated Cost:** ${formatAmount(day.estimatedCost)}
`).join('\n')}

## Tips
${generatedItinerary.tips.map(tip => `- ${tip}`).join('\n')}

---
Generated by Anagha Safaar AI Travel Planner
    `;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedItinerary.destination}-itinerary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-accent" />
          <h1 className="text-4xl font-bold">AI Travel Planner</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get personalized itineraries powered by AI. Tell us your preferences and we'll create the perfect trip for you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Plan Your Trip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  {...register('destination')}
                  placeholder="e.g., Goa, Kerala, Rajasthan"
                />
                {errors.destination && (
                  <p className="text-sm text-red-500">{errors.destination.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelers">Number of Travelers *</Label>
                <Select
                  value={watch('travelers')?.toString()}
                  onValueChange={(value) => setValue('travelers', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select travelers" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {num} Traveler{num > 1 ? 's' : ''}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.travelers && (
                  <p className="text-sm text-red-500">{errors.travelers.message}</p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Budget and Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹) *</Label>
                <Input
                  id="budget"
                  type="number"
                  {...register('budget', { valueAsNumber: true })}
                  placeholder="50000"
                />
                {errors.budget && (
                  <p className="text-sm text-red-500">{errors.budget.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelStyle">Travel Style *</Label>
                <Select
                  value={watch('travelStyle')}
                  onValueChange={(value: any) => setValue('travelStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="mid-range">Mid-range</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
                {errors.travelStyle && (
                  <p className="text-sm text-red-500">{errors.travelStyle.message}</p>
                )}
              </div>
            </div>

            {/* Accommodation */}
            <div className="space-y-2">
              <Label htmlFor="accommodationType">Accommodation Type *</Label>
              <Select
                value={watch('accommodationType')}
                onValueChange={(value: any) => setValue('accommodationType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select accommodation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="hostel">Hostel</SelectItem>
                  <SelectItem value="resort">Resort</SelectItem>
                  <SelectItem value="homestay">Homestay</SelectItem>
                </SelectContent>
              </Select>
              {errors.accommodationType && (
                <p className="text-sm text-red-500">{errors.accommodationType.message}</p>
              )}
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <Label>Interests *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interestOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={watchedInterests?.includes(option.value) ? "default" : "outline"}
                    onClick={() => toggleInterest(option.value)}
                    className="h-auto p-3 flex flex-col items-center gap-2"
                  >
                    <span className="text-lg">{option.icon}</span>
                    <span className="text-xs">{option.label}</span>
                  </Button>
                ))}
              </div>
              {errors.interests && (
                <p className="text-sm text-red-500">{errors.interests.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating Itinerary...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Itinerary
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Itinerary */}
      {isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <h3 className="text-lg font-semibold">Generating your personalized itinerary...</h3>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {generatedItinerary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Your {generatedItinerary.destination} Itinerary
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadItinerary}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{generatedItinerary.duration} days</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatAmount(generatedItinerary.totalCost)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{watch('travelers')} travelers</span>
                </div>
              </div>
              <p className="text-sm">{generatedItinerary.summary}</p>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="font-semibold mb-3">Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {generatedItinerary.highlights.map((highlight, index) => (
                  <Badge key={index} variant="secondary">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Daily Itinerary */}
            <div className="space-y-4">
              <h3 className="font-semibold">Daily Itinerary</h3>
              {generatedItinerary.days.map((day, index) => (
                <Card key={index} className="border-l-4 border-l-accent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      Day {day.day} - {new Date(day.date).toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Activities */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Activities
                      </h4>
                      <div className="space-y-2">
                        {day.activities.map((activity, activityIndex) => (
                          <div key={activityIndex} className="flex items-start gap-3 p-2 bg-muted/30 rounded">
                            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{activity.name}</span>
                                <span className="text-sm text-muted-foreground">{activity.time}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {activity.duration}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {formatAmount(activity.cost)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {activity.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Meals */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Meals
                      </h4>
                      <div className="space-y-2">
                        {day.meals.map((meal, mealIndex) => (
                          <div key={mealIndex} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div>
                              <span className="font-medium">{meal.name}</span>
                              <p className="text-sm text-muted-foreground">{meal.cuisine}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-muted-foreground">{meal.time}</span>
                              <p className="text-sm font-medium">{formatAmount(meal.cost)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Daily Cost */}
                    <div className="flex items-center justify-between p-3 bg-accent/10 rounded">
                      <span className="font-medium">Daily Total</span>
                      <span className="font-bold text-accent">{formatAmount(day.estimatedCost)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tips */}
            <div>
              <h3 className="font-semibold mb-3">Travel Tips</h3>
              <div className="space-y-2">
                {generatedItinerary.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItineraryGenerator;
