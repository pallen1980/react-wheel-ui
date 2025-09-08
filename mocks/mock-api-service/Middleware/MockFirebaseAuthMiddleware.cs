using System.Security.Claims;
using MockApiService.Models;
using MockApiService.Services;

namespace MockApiService.Middleware;

public class MockFirebaseAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<MockFirebaseAuthMiddleware> _logger;

    public MockFirebaseAuthMiddleware(RequestDelegate next, ILogger<MockFirebaseAuthMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITokenService tokenService)
    {
        // Skip authentication for certain endpoints
        if (ShouldSkipAuthentication(context.Request.Path))
        {
            await _next(context);
            return;
        }

        try
        {
            // Extract Bearer token from Authorization header
            var token = ExtractBearerToken(context.Request);
            
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("No Bearer token found in Authorization header for path: {Path}", context.Request.Path);
                await WriteUnauthorizedResponse(context, "Missing or invalid Authorization header");
                return;
            }

            // Validate token using MockTokenService
            var validationResult = await tokenService.ValidateTokenAsync(token);
            
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("Token validation failed: {ErrorMessage}", validationResult.ErrorMessage);
                await WriteUnauthorizedResponse(context, validationResult.ErrorMessage ?? "Invalid token");
                return;
            }

            // Set user context for authenticated requests
            SetUserContext(context, validationResult);
            
            _logger.LogDebug("Successfully authenticated user: {UserId}", validationResult.UserId);
            
            // Continue to next middleware
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during authentication middleware processing");
            await WriteInternalServerErrorResponse(context, "Authentication processing error");
        }
    }

    private static string? ExtractBearerToken(HttpRequest request)
    {
        var authHeader = request.Headers.Authorization.FirstOrDefault();
        
        if (string.IsNullOrEmpty(authHeader))
            return null;

        // Check if header starts with "Bearer "
        const string bearerPrefix = "Bearer ";
        if (!authHeader.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
            return null;

        // Extract token part after "Bearer "
        return authHeader[bearerPrefix.Length..].Trim();
    }

    private static void SetUserContext(HttpContext context, TokenValidationResult validationResult)
    {
        // Create claims for the authenticated user
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, validationResult.UserId!),
            new("user_id", validationResult.UserId!)
        };

        if (!string.IsNullOrEmpty(validationResult.Email))
        {
            claims.Add(new Claim(ClaimTypes.Email, validationResult.Email));
        }

        // Create identity and principal
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        
        // Set user context
        context.User = principal;
        
        // Also store user info in HttpContext.Items for easy access
        context.Items["UserId"] = validationResult.UserId;
        context.Items["UserEmail"] = validationResult.Email;
    }

    private static bool ShouldSkipAuthentication(PathString path)
    {
        // Skip authentication for these endpoints
        var skipPaths = new[]
        {
            "/health",
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/swagger",
            "/favicon.ico"
        };

        return skipPaths.Any(skipPath => 
            path.StartsWithSegments(skipPath, StringComparison.OrdinalIgnoreCase));
    }

    private static async Task WriteUnauthorizedResponse(HttpContext context, string message)
    {
        context.Response.StatusCode = 401;
        context.Response.ContentType = "application/json";
        
        var errorResponse = new ErrorResponse
        {
            Error = "UNAUTHORIZED",
            Message = message
        };

        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(errorResponse));
    }

    private static async Task WriteInternalServerErrorResponse(HttpContext context, string message)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        
        var errorResponse = new ErrorResponse
        {
            Error = "INTERNAL_SERVER_ERROR",
            Message = message
        };

        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(errorResponse));
    }
}