import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  siteKey?: string;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  className?: string;
}

interface CaptchaState {
  isLoaded: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  error: string | null;
  token: string | null;
}

const CaptchaComponent: React.FC<CaptchaProps> = ({
  onVerify,
  onError,
  siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  theme = 'light',
  size = 'normal',
  className = ''
}) => {
  const [state, setState] = useState<CaptchaState>({
    isLoaded: false,
    isVerifying: false,
    isVerified: false,
    error: null,
    token: null
  });

  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!siteKey) {
      setState(prev => ({ ...prev, error: 'reCAPTCHA site key not configured' }));
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setState(prev => ({ ...prev, isLoaded: true }));
    };
    
    script.onerror = () => {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load reCAPTCHA script',
        isLoaded: false 
      }));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [siteKey]);

  const executeCaptcha = () => {
    if (!window.grecaptcha || !siteKey) {
      setState(prev => ({ ...prev, error: 'reCAPTCHA not available' }));
      return;
    }

    setState(prev => ({ ...prev, isVerifying: true, error: null }));

    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(siteKey, { action: 'submit' })
        .then((token: string) => {
          setState(prev => ({
            ...prev,
            isVerifying: false,
            isVerified: true,
            token,
            error: null
          }));
          onVerify(token);
        })
        .catch((error: any) => {
          const errorMessage = 'reCAPTCHA verification failed';
          setState(prev => ({
            ...prev,
            isVerifying: false,
            isVerified: false,
            error: errorMessage
          }));
          onError?.(errorMessage);
          toast.error(errorMessage);
        });
    });
  };

  const resetCaptcha = () => {
    setState({
      isLoaded: false,
      isVerifying: false,
      isVerified: false,
      error: null,
      token: null
    });
    
    // Reload the script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setState(prev => ({ ...prev, isLoaded: true }));
    };
    
    document.head.appendChild(script);
  };

  const renderCaptchaV2 = () => {
    if (!window.grecaptcha || !siteKey) return null;

    return (
      <div
        ref={captchaRef}
        className="captcha-container"
        data-sitekey={siteKey}
        data-theme={theme}
        data-size={size}
      />
    );
  };

  const renderCaptchaV3 = () => {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-blue-600 mb-2" />
          <p className="text-sm text-gray-600">
            Click the button below to verify you're human
          </p>
        </div>
        
        <Button
          onClick={executeCaptcha}
          disabled={!state.isLoaded || state.isVerifying}
          className="w-full"
          variant={state.isVerified ? "default" : "outline"}
        >
          {state.isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : state.isVerified ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Verified
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Verify I'm Human
            </>
          )}
        </Button>

        {state.isVerified && (
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">
              ✓ Verification successful
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetCaptcha}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Verify Again
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
          Security Verification
        </CardTitle>
        <CardDescription>
          Complete the verification to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {state.error}
            </AlertDescription>
          </Alert>
        )}

        {!state.isLoaded && !state.error && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Loading security verification...</p>
          </div>
        )}

        {state.isLoaded && (
          <>
            {/* Use reCAPTCHA v3 by default, fallback to v2 if needed */}
            {import.meta.env.VITE_RECAPTCHA_VERSION === 'v2' ? renderCaptchaV2() : renderCaptchaV3()}
          </>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          This site is protected by reCAPTCHA and the Google{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          apply.
        </div>
      </CardContent>
    </Card>
  );
};

// Invisible CAPTCHA for forms
export const InvisibleCaptcha: React.FC<{
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  siteKey?: string;
}> = ({ onVerify, onError, siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!siteKey) return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Auto-verify on load for invisible CAPTCHA
      executeInvisibleCaptcha();
    };
    
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [siteKey]);

  const executeInvisibleCaptcha = () => {
    if (!window.grecaptcha || !siteKey) return;

    setIsLoading(true);
    
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(siteKey, { action: 'invisible' })
        .then((token: string) => {
          setIsVerified(true);
          setIsLoading(false);
          onVerify(token);
        })
        .catch((error: any) => {
          setIsLoading(false);
          onError?.('Invisible CAPTCHA verification failed');
        });
    });
  };

  return (
    <div className="invisible-captcha">
      {isLoading && (
        <div className="text-xs text-gray-500 text-center">
          <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
          Verifying...
        </div>
      )}
      {isVerified && (
        <div className="text-xs text-green-600 text-center">
          <CheckCircle className="w-3 h-3 inline mr-1" />
          Verified
        </div>
      )}
    </div>
  );
};

// Fraud detection component
export const FraudDetectionAlert: React.FC<{
  riskScore: number;
  reasons: string[];
  onDismiss?: () => void;
}> = ({ riskScore, reasons, onDismiss }) => {
  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (score < 70) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  const risk = getRiskLevel(riskScore);

  if (riskScore < 30) return null; // Don't show low-risk alerts

  return (
    <Alert className={`${risk.bgColor} ${risk.borderColor} border-l-4`}>
      <AlertCircle className={`h-4 w-4 ${risk.color}`} />
      <AlertDescription className={risk.color}>
        <div className="font-semibold mb-2">
          Security Alert: {risk.level} Risk Detected (Score: {riskScore})
        </div>
        <div className="text-sm">
          <div className="font-medium mb-1">Detected Issues:</div>
          <ul className="list-disc list-inside space-y-1">
            {reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="mt-2 text-xs"
          >
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Declare global grecaptcha for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (container: HTMLElement, options: any) => number;
      reset: (widgetId: number) => void;
    };
  }
}

export default CaptchaComponent;
