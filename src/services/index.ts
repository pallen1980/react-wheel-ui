export { 
  OptionsService, 
  OptionsServiceError, 
  OptionsErrorType,
  LoadOptionsResponse,
  SaveOptionsRequest,
  API_CONFIG,
  API_ENDPOINTS
} from './OptionsService';

export { HttpOptionsService } from './HttpOptionsService';

import { HttpOptionsService } from './HttpOptionsService';
import { auth } from '../Auth/Firebase/Config/Firebase';

/**
 * Factory function to create an OptionsService instance with Firebase auth integration
 */
export const createOptionsService = (): HttpOptionsService => {
  const getAuthToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  };

  return new HttpOptionsService(getAuthToken);
};