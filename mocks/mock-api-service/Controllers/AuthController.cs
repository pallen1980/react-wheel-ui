using Microsoft.AspNetCore.Mvc;
using MockApiService.Models;
using MockApiService.Services;

namespace MockApiService.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITokenService _tokenService;
    private readonly IErrorSimulationService _errorSimulationService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ITokenService tokenService, IErrorSimulationService errorSimulationService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _tokenService = tokenService;
        _errorSimulationService = errorSimulationService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            // Check for error simulation
            var endpoint = "/api/auth/login";
            if (await _errorSimulationService.ShouldSimulateErrorAsync(endpoint))
            {
                var (errorType, delayMs) = await _errorSimulationService.GetConfiguredErrorAsync(endpoint);
                if (delayMs.HasValue)
                {
                    await _errorSimulationService.SimulateNetworkDelayAsync(delayMs.Value);
                }
                if (!string.IsNullOrEmpty(errorType))
                {
                    throw ErrorSimulationService.CreateExceptionForErrorType(errorType);
                }
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "VALIDATION_ERROR",
                    Message = "Invalid request data",
                    Details = ModelState
                });
            }

            var user = await _authService.AuthenticateUserAsync(request.Email, request.Password);
            if (user == null)
            {
                _logger.LogWarning("Login attempt failed for email: {Email}", request.Email);
                return Unauthorized(new ErrorResponse
                {
                    Error = "INVALID_CREDENTIALS",
                    Message = "Invalid email or password"
                });
            }

            var accessToken = await _authService.CreateTokenAsync(user.Uid, user.Email);
            var refreshToken = _tokenService.GenerateRefreshToken(user.Uid);

            _logger.LogInformation("User {UserId} logged in successfully", user.Uid);

            return Ok(new LoginResponse
            {
                IdToken = accessToken,
                RefreshToken = refreshToken,
                LocalId = user.Uid,
                Email = user.Email,
                ExpiresIn = 3600 // 1 hour in seconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_ERROR",
                Message = "An internal error occurred during login"
            });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Check for error simulation
            var endpoint = "/api/auth/register";
            if (await _errorSimulationService.ShouldSimulateErrorAsync(endpoint))
            {
                var (errorType, delayMs) = await _errorSimulationService.GetConfiguredErrorAsync(endpoint);
                if (delayMs.HasValue)
                {
                    await _errorSimulationService.SimulateNetworkDelayAsync(delayMs.Value);
                }
                if (!string.IsNullOrEmpty(errorType))
                {
                    throw ErrorSimulationService.CreateExceptionForErrorType(errorType);
                }
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "VALIDATION_ERROR",
                    Message = "Invalid request data",
                    Details = ModelState
                });
            }

            var existingUser = await _authService.RegisterUserAsync(request.Email, request.Password, request.DisplayName);
            if (existingUser == null)
            {
                _logger.LogWarning("Registration attempt failed - email already exists: {Email}", request.Email);
                return Conflict(new ErrorResponse
                {
                    Error = "EMAIL_EXISTS",
                    Message = "An account with this email already exists"
                });
            }

            var accessToken = await _authService.CreateTokenAsync(existingUser.Uid, existingUser.Email);
            var refreshToken = _tokenService.GenerateRefreshToken(existingUser.Uid);

            _logger.LogInformation("User {UserId} registered successfully", existingUser.Uid);

            return Ok(new LoginResponse
            {
                IdToken = accessToken,
                RefreshToken = refreshToken,
                LocalId = existingUser.Uid,
                Email = existingUser.Email,
                ExpiresIn = 3600 // 1 hour in seconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for email: {Email}", request.Email);
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_ERROR",
                Message = "An internal error occurred during registration"
            });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            // Check for error simulation
            var endpoint = "/api/auth/refresh";
            if (await _errorSimulationService.ShouldSimulateErrorAsync(endpoint))
            {
                var (errorType, delayMs) = await _errorSimulationService.GetConfiguredErrorAsync(endpoint);
                if (delayMs.HasValue)
                {
                    await _errorSimulationService.SimulateNetworkDelayAsync(delayMs.Value);
                }
                if (!string.IsNullOrEmpty(errorType))
                {
                    throw ErrorSimulationService.CreateExceptionForErrorType(errorType);
                }
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "VALIDATION_ERROR",
                    Message = "Invalid request data",
                    Details = ModelState
                });
            }

            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "INVALID_REFRESH_TOKEN",
                    Message = "Refresh token is required"
                });
            }

            // For this mock implementation, we'll extract user info from the refresh token
            // In a real implementation, you would validate the refresh token against stored values
            // and retrieve the associated user information
            
            // Since this is a mock, we'll decode any existing access token to get user info
            // This is not secure in a real implementation but works for testing
            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            string? currentAccessToken = null;
            
            if (authHeader != null && authHeader.StartsWith("Bearer "))
            {
                currentAccessToken = authHeader.Substring("Bearer ".Length).Trim();
            }

            if (string.IsNullOrEmpty(currentAccessToken))
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "MISSING_ACCESS_TOKEN",
                    Message = "Current access token is required for refresh"
                });
            }

            var userId = _tokenService.ExtractUserIdFromToken(currentAccessToken);
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "INVALID_ACCESS_TOKEN",
                    Message = "Cannot extract user information from access token"
                });
            }

            // Validate the user still exists
            var user = await _authService.ValidateTokenAsync(currentAccessToken);
            if (user == null)
            {
                return Unauthorized(new ErrorResponse
                {
                    Error = "USER_NOT_FOUND",
                    Message = "User associated with token not found"
                });
            }

            // Generate new tokens
            var (isValid, newAccessToken) = await _tokenService.RefreshTokenAsync(request.RefreshToken, user.Uid, user.Email);
            
            if (!isValid || string.IsNullOrEmpty(newAccessToken))
            {
                _logger.LogWarning("Refresh token validation failed for user: {UserId}", userId);
                return Unauthorized(new ErrorResponse
                {
                    Error = "INVALID_REFRESH_TOKEN",
                    Message = "The refresh token is invalid or expired"
                });
            }

            var newRefreshToken = _tokenService.GenerateRefreshToken(user.Uid);

            _logger.LogInformation("Token refreshed successfully for user: {UserId}", user.Uid);

            return Ok(new LoginResponse
            {
                IdToken = newAccessToken,
                RefreshToken = newRefreshToken,
                LocalId = user.Uid,
                Email = user.Email,
                ExpiresIn = 3600 // 1 hour in seconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_ERROR",
                Message = "An internal error occurred during token refresh"
            });
        }
    }
}