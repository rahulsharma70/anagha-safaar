// Jest setup file for API tests

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.RAZORPAY_KEY_ID = 'test-razorpay-key';
process.env.RAZORPAY_KEY_SECRET = 'test-razorpay-secret';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.REDIS_URL = 'redis://localhost:6379';

// Global test setup
beforeAll(() => {
  // Setup test database connection
  console.log('Setting up test environment...');
});

afterAll(() => {
  // Cleanup test database
  console.log('Cleaning up test environment...');
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock external services
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn()
  }))
}));

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }])
}));

jest.mock('twilio', () => ({
  twilio: jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'test-message-sid' })
    }
  }))
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Test Itinerary',
                days: [{
                  day: 1,
                  title: 'Test Day',
                  activities: [],
                  meals: [],
                  estimatedCost: 1000
                }],
                summary: {
                  totalActivities: 1,
                  totalMeals: 1,
                  totalCost: 1000
                }
              })
            }
          }]
        })
      }
    }
  }))
}));

jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          text: JSON.stringify({
            title: 'Test Itinerary',
            days: [{
              day: 1,
              title: 'Test Day',
              activities: [],
              meals: [],
              estimatedCost: 1000
            }],
            summary: {
              totalActivities: 1,
              totalMeals: 1,
              totalCost: 1000
            }
          })
        }]
      })
    }
  }))
}));

// Mock Razorpay
jest.mock('razorpay', () => {
  return jest.fn(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 10000,
        currency: 'INR',
        status: 'created'
      })
    },
    payments: {
      capture: jest.fn().mockResolvedValue({
        id: 'pay_test123',
        status: 'captured'
      }),
      refund: jest.fn().mockResolvedValue({
        id: 'rfnd_test123',
        status: 'processed'
      })
    }
  }));
});

// Mock multer for file uploads
jest.mock('multer', () => {
  const multer = jest.fn(() => ({
    array: jest.fn(() => (req, res, next) => {
      req.files = [
        {
          fieldname: 'images',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test-image-data'),
          size: 1024
        }
      ];
      next();
    }),
    single: jest.fn(() => (req, res, next) => {
      req.file = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test-image-data'),
        size: 1024
      };
      next();
    })
  }));
  
  multer.memoryStorage = jest.fn(() => ({}));
  return multer;
});

// Mock Supabase client
jest.mock('../src/app', () => ({
  app: require('express')(),
  supabase: {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test/path/image.jpg' },
          error: null
        }),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test/path/image.jpg' }
        })),
        remove: jest.fn().mockResolvedValue({ error: null })
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              limit: jest.fn()
            }))
          }))
        })),
        ilike: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              limit: jest.fn()
            }))
          }))
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({
                limit: jest.fn()
              }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn()
        }))
      }))
    }))
  }
}));

// Test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
    ...overrides
  }),
  
  createMockAdmin: (overrides = {}) => ({
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: 'admin',
    ...overrides
  }),
  
  createMockHotel: (overrides = {}) => ({
    id: 'hotel-123',
    name: 'Test Hotel',
    slug: 'test-hotel',
    description: 'A beautiful test hotel',
    location_city: 'Mumbai',
    location_state: 'Maharashtra',
    price_per_night: 5000,
    available_rooms: 10,
    total_rooms: 20,
    is_featured: true,
    is_active: true,
    ...overrides
  }),
  
  createMockBooking: (overrides = {}) => ({
    id: 'booking-123',
    user_id: 'test-user-id',
    item_type: 'hotel',
    item_id: 'hotel-123',
    check_in_date: '2024-12-20',
    check_out_date: '2024-12-22',
    guests: 2,
    total_amount: 10000,
    status: 'pending',
    ...overrides
  })
};
