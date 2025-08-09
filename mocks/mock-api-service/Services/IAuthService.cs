using MockApiService.Models;

namespace MockApiService.Services;

public interface IAuthService
{
    Task<MockUser?> ValidateTokenAsync(string token);
    Task<bool> IsTokenValidForUserAsync(string token, string userId);
    Task<string> CreateTokenAsync(string userId, string email);
    Task<MockUser?> AuthenticateUserAsync(string email, string password);
    Task<MockUser?> RegisterUserAsync(string email, string password, string displayName);
}