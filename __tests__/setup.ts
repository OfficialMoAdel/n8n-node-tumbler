// Jest setup file for Tumblr n8n node tests

// Set test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
    // Suppress console output during tests unless explicitly needed
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
});

afterAll(() => {
    // Restore original console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
});