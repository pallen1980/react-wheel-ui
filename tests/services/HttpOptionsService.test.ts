import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpOptionsService } from '../../src/services/HttpOptionsService';
import { OptionsServiceError, OptionsErrorType } from '../../src/services/OptionsService';
import { Option } from '../../src/Areas/Main/Options/models';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock setTimeout and clearTimeout for timeout tests
vi.mock('timers', () => ({
  setTimeout: vi.fn((fn, delay) => {
    // For testing, we'll call the function immediately if delay is our test timeout
    if (delay === 5000) { // Test timeout
      fn();
    }
    return 123; // Mock timer ID
  }),
  clearTimeout: vi.fn()
}));

describe('HttpOptionsService', () => {
  let service: HttpOptionsService;
  let mockGetAuthToken: ReturnType<typeof vi.fn>;

  const mockUserId = 'test-user-123';
  const mockAuthToken = 'mock-auth-token';
  const mockOptions: Option[] = [
    { key: 'option-1', value: 'Option 1', sequence: 1 },
    { key: 'option-2', value: 'Option 2', sequence: 2 }
  ];

  beforeEach(() => {
    mockGetAuthToken = vi.fn().mockResolvedValue(mockAuthToken);
    // Use default configuration to match test expectations
    service = new HttpOptionsService(mockGetAuthToken, '/v1');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should use default configuration when no parameters provided', () => {
      const defaultService = new HttpOptionsService(mockGetAuthToken);
      expect(defaultService).toBeInstanceOf(HttpOptionsService);
    });

    it('should use custom baseUrl and timeout when provided', () => {
      const customService = new HttpOptionsService(
        mockGetAuthToken,
        'https://custom-api.com',
        5000
      );
      expect(customService).toBeInstanceOf(HttpOptionsService);
    });
  });

  describe('loadUserOptions', () => {
    it('should successfully load user options', async () => {
      const mockResponse = {
        options: mockOptions,
        lastModified: '2024-01-01T00:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.loadUserOptions(mockUserId);

      expect(result).toEqual(mockOptions);
      expect(mockFetch).toHaveBeenCalledWith(
        '/v1/users/test-user-123/options',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should return empty array when user has no options (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await service.loadUserOptions(mockUserId);

      expect(result).toEqual([]);
    });

    it('should throw auth error when no token available', async () => {
      mockGetAuthToken.mockResolvedValueOnce(null);

      const error = await service.loadUserOptions(mockUserId).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.AUTH);
      expect(error.retryable).toBe(false);
    });

    it('should throw auth error on 401 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const error = await service.loadUserOptions(mockUserId).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.AUTH);
      expect(error.retryable).toBe(false);
    });

    it('should throw permission error on 403 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      const error = await service.loadUserOptions(mockUserId).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.PERMISSION);
      expect(error.retryable).toBe(false);
    });

    it('should throw retryable network error on 500 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const error = await service.loadUserOptions(mockUserId).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.NETWORK);
      expect(error.retryable).toBe(true);
    });

    it('should throw non-retryable network error on 400 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const error = await service.loadUserOptions(mockUserId).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.NETWORK);
      expect(error.retryable).toBe(false);
    });

    it('should throw data error when response format is invalid', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ options: 'not-an-array' })
      });

      const error = await service.loadUserOptions(mockUserId).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.DATA);
      expect(error.retryable).toBe(false);
    });

    it('should throw data error when option format is invalid', async () => {
      const invalidOptions = [
        { key: 'option-1', value: 'Option 1' }, // missing sequence
        { key: 'option-2', value: 'Option 2', sequence: 2 }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ options: invalidOptions })
      });

      const error = await service.loadUserOptions(mockUserId).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.DATA);
      expect(error.retryable).toBe(false);
    });

    it('should throw network error on fetch failure', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const error = await service.loadUserOptions(mockUserId).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.NETWORK);
      expect(error.retryable).toBe(true);
    });
  });

  describe('saveUserOptions', () => {
    it('should successfully save user options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      await expect(service.saveUserOptions(mockUserId, mockOptions))
        .resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        '/v1/users/test-user-123/options',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ options: mockOptions })
        })
      );
    });

    it('should throw auth error when no token available', async () => {
      mockGetAuthToken.mockResolvedValue(null);

      const error = await service.saveUserOptions(mockUserId, mockOptions).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.AUTH);
      expect(error.retryable).toBe(false);
    });

    it('should throw data error when options format is invalid', async () => {
      const invalidOptions = [
        { key: 'option-1', value: 'Option 1' } // missing sequence
      ] as Option[];

      const error = await service.saveUserOptions(mockUserId, invalidOptions).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.DATA);
      expect(error.retryable).toBe(false);
    });

    it('should throw auth error on 401 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const error = await service.saveUserOptions(mockUserId, mockOptions).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.AUTH);
      expect(error.retryable).toBe(false);
    });

    it('should throw permission error on 403 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      const error = await service.saveUserOptions(mockUserId, mockOptions).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.PERMISSION);
      expect(error.retryable).toBe(false);
    });

    it('should throw retryable network error on 500 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const error = await service.saveUserOptions(mockUserId, mockOptions).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.NETWORK);
      expect(error.retryable).toBe(true);
    });

    it('should throw network error on fetch failure', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const error = await service.saveUserOptions(mockUserId, mockOptions).catch(e => e);
      expect(error).toBeInstanceOf(OptionsServiceError);
      expect(error.type).toBe(OptionsErrorType.NETWORK);
      expect(error.retryable).toBe(true);
    });
  });

  describe('timeout handling', () => {
    it('should handle timeout during load operation', async () => {
      // Create a service with short timeout for testing
      const shortTimeoutService = new HttpOptionsService(mockGetAuthToken, '/v1', 100);

      // Mock a slow response
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(shortTimeoutService.loadUserOptions(mockUserId))
        .rejects.toThrow(OptionsServiceError);
    });

    it('should handle timeout during save operation', async () => {
      // Create a service with short timeout for testing
      const shortTimeoutService = new HttpOptionsService(mockGetAuthToken, '/v1', 100);

      // Mock a slow response
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(shortTimeoutService.saveUserOptions(mockUserId, mockOptions))
        .rejects.toThrow(OptionsServiceError);
    });
  });

  describe('custom configuration', () => {
    it('should use custom base URL', async () => {
      const customService = new HttpOptionsService(
        mockGetAuthToken,
        'https://custom-api.com/v1'
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ options: [] })
      });

      await customService.loadUserOptions(mockUserId);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.com/v1/users/test-user-123/options',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });
});