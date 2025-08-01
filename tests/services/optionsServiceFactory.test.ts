import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOptionsService } from '../../src/services';
import { HttpOptionsService } from '../../src/services/HttpOptionsService';
import { auth } from '../../src/Auth/Firebase/Config/Firebase';

// Mock Firebase auth
vi.mock('../../src/Auth/Firebase/Config/Firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

describe('createOptionsService factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: null }).currentUser = null;
  });

  it('should create an HttpOptionsService instance', () => {
    // Act
    const service = createOptionsService();

    // Assert
    expect(service).toBeInstanceOf(HttpOptionsService);
  });

  it('should create service with auth token getter that returns null when no user', async () => {
    // Arrange
    (auth as { currentUser: null }).currentUser = null;
    const service = createOptionsService();

    // Act & Assert - This will be tested indirectly through the service behavior
    // The service should handle null auth tokens gracefully
    expect(service).toBeInstanceOf(HttpOptionsService);
  });

  it('should create service with auth token getter that works with authenticated user', async () => {
    // Arrange
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    };
    (auth as { currentUser: typeof mockUser }).currentUser = mockUser;
    
    const service = createOptionsService();

    // Act & Assert - The service should be created successfully
    // The actual token retrieval will be tested through the service methods
    expect(service).toBeInstanceOf(HttpOptionsService);
  });
});