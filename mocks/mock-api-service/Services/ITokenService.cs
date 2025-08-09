using MockApiService.Models;

namespace MockApiService.Services;

public interface ITokenService
{
    string GenerateToken(string userId, string email, TimeSpan? expiry = null);
    Task<TokenValidationResult> ValidateTokenAsync(string token);
    string ExtractUserIdFromToken(string token);
}