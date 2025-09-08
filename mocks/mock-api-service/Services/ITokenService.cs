using MockApiService.Models;

namespace MockApiService.Services;

public interface ITokenService
{
    string GenerateToken(string userId, string email, TimeSpan? expiry = null);
    Task<TokenValidationResult> ValidateTokenAsync(string token);
    string ExtractUserIdFromToken(string token);
    string GenerateRefreshToken(string userId);
    Task<(bool IsValid, string? NewAccessToken)> RefreshTokenAsync(string refreshToken, string userId, string email);
    bool IsTokenExpired(string token);
}