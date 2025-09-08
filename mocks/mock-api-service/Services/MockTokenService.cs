using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using MockApiService.Models;
using TokenValidationResult = MockApiService.Models.TokenValidationResult;

namespace MockApiService.Services;

public class MockTokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expirationMinutes;
    private readonly string _firebaseProjectId;

    public MockTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
        _secretKey = configuration["JwtSettings:SecretKey"] ?? "default-secret-key-for-development-only";
        _issuer = configuration["JwtSettings:Issuer"] ?? "mock-api-service";
        _audience = configuration["JwtSettings:Audience"] ?? "the-wheel-app";
        _expirationMinutes = configuration.GetValue<int>("JwtSettings:ExpirationMinutes", 60);
        _firebaseProjectId = configuration["Firebase:ProjectId"] ?? "myauth-1569840907611";
    }

    public string GenerateToken(string userId, string email, TimeSpan? expiry = null)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_secretKey);
        
        var now = DateTime.UtcNow;
        var expires = now.Add(expiry ?? TimeSpan.FromMinutes(_expirationMinutes));
        
        // Create Firebase-compatible claims structure
        var firebaseData = new
        {
            identities = new
            {
                email = new[] { email }
            },
            sign_in_provider = "password"
        };
        
        var claims = new List<Claim>
        {
            // Standard JWT claims
            new(JwtRegisteredClaimNames.Sub, userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new(JwtRegisteredClaimNames.Exp, new DateTimeOffset(expires).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new(JwtRegisteredClaimNames.Aud, _firebaseProjectId),
            new(JwtRegisteredClaimNames.Iss, $"https://securetoken.google.com/{_firebaseProjectId}"),
            
            // Firebase-specific claims
            new("user_id", userId),
            new("email_verified", "true"),
            new("firebase", JsonSerializer.Serialize(firebaseData)),
            new("auth_time", new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            IssuedAt = now,
            NotBefore = now,
            Issuer = $"https://securetoken.google.com/{_firebaseProjectId}",
            Audience = _firebaseProjectId,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public Task<TokenValidationResult> ValidateTokenAsync(string token)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return Task.FromResult(new TokenValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Token is null or empty"
                });
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secretKey);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = $"https://securetoken.google.com/{_firebaseProjectId}",
                ValidateAudience = true,
                ValidAudience = _firebaseProjectId,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(5), // Allow 5 minutes clock skew
                RequireExpirationTime = true,
                RequireSignedTokens = true
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            
            // Extract user information from Firebase-compatible claims
            var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                        ?? principal.FindFirst("user_id")?.Value;
            var email = principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Task.FromResult(new TokenValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Token does not contain valid user ID"
                });
            }

            return Task.FromResult(new TokenValidationResult
            {
                IsValid = true,
                UserId = userId,
                Email = email
            });
        }
        catch (SecurityTokenExpiredException)
        {
            return Task.FromResult(new TokenValidationResult
            {
                IsValid = false,
                ErrorMessage = "Token has expired"
            });
        }
        catch (SecurityTokenInvalidSignatureException)
        {
            return Task.FromResult(new TokenValidationResult
            {
                IsValid = false,
                ErrorMessage = "Token signature is invalid"
            });
        }
        catch (SecurityTokenValidationException ex)
        {
            return Task.FromResult(new TokenValidationResult
            {
                IsValid = false,
                ErrorMessage = $"Token validation failed: {ex.Message}"
            });
        }
        catch (Exception ex)
        {
            return Task.FromResult(new TokenValidationResult
            {
                IsValid = false,
                ErrorMessage = $"Token validation error: {ex.Message}"
            });
        }
    }

    public string ExtractUserIdFromToken(string token)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token))
                return string.Empty;

            var tokenHandler = new JwtSecurityTokenHandler();
            var jsonToken = tokenHandler.ReadJwtToken(token);
            
            // Try Firebase-compatible claims first, then fallback to standard claims
            return jsonToken.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.Sub)?.Value
                   ?? jsonToken.Claims.FirstOrDefault(x => x.Type == "user_id")?.Value
                   ?? jsonToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value
                   ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    /// <summary>
    /// Generates a refresh token for the given user
    /// </summary>
    public string GenerateRefreshToken(string userId)
    {
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        
        var refreshToken = Convert.ToBase64String(randomBytes);
        
        // In a real implementation, you would store this in a database with expiration
        // For this mock, we'll just return the token
        return refreshToken;
    }

    /// <summary>
    /// Validates a refresh token and returns a new access token if valid
    /// </summary>
    public Task<(bool IsValid, string? NewAccessToken)> RefreshTokenAsync(string refreshToken, string userId, string email)
    {
        try
        {
            // In a real implementation, you would validate the refresh token against stored values
            // For this mock, we'll accept any non-empty refresh token and generate a new access token
            if (string.IsNullOrWhiteSpace(refreshToken))
                return Task.FromResult<(bool IsValid, string? NewAccessToken)>((false, null));

            // Generate new access token
            var newAccessToken = GenerateToken(userId, email);
            return Task.FromResult<(bool IsValid, string? NewAccessToken)>((true, newAccessToken));
        }
        catch
        {
            return Task.FromResult<(bool IsValid, string? NewAccessToken)>((false, null));
        }
    }

    /// <summary>
    /// Checks if a token is expired without full validation
    /// </summary>
    public bool IsTokenExpired(string token)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token))
                return true;

            var tokenHandler = new JwtSecurityTokenHandler();
            var jsonToken = tokenHandler.ReadJwtToken(token);
            
            return jsonToken.ValidTo <= DateTime.UtcNow;
        }
        catch
        {
            return true;
        }
    }
}