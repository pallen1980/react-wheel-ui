using System.Security.Claims;
using MockApiService.Models;
using MockApiService.Services;

namespace MockApiService.Middleware;

public class MockFirebaseAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<MockFirebaseAuthMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public MockFirebaseAuthMiddleware(RequestDelegate next, ILogger<MockFirebaseAuthMiddleware> logger, IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context, ITokenService tokenService)
    {
        // Skip authentication for certain endpoints
        if (ShouldSkipAuthentication(context.Request.Path, _environment))
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

    private static bool ShouldSkipAuthentication(PathString path, IWebHostEnvironment environment)
    {
        // Skip authentication for these endpoints
        var skipPaths = new[]
        {
            "/health",
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/error-simulation",
            "/swagger",
            "/favicon.ico"
        };

        // Only skip impersonate endpoint in development
        var developmentOnlySkipPaths = new[]
        {
            "/api/auth/impersonate"
        };

        // Check exact matches first
        if (skipPaths.Any(skipPath => 
            path.StartsWithSegments(skipPath, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        // Check development-only skip paths
        if (string.Equals(environment.EnvironmentName, "Development", StringComparison.OrdinalIgnoreCase) && 
            developmentOnlySkipPaths.Any(skipPath => 
                path.StartsWithSegments(skipPath, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        // Special handling for user management endpoints (but not user options)
        // Skip authentication for direct user management operations like:
        // GET /api/users, POST /api/users, GET /api/users/{id}, PUT /api/users/{id}, DELETE /api/users/{id}
        // But NOT for /api/users/{userId}/options which requires authentication
        if (path.StartsWithSegments("/api/users", StringComparison.OrdinalIgnoreCase))
        {
            var pathValue = path.Value?.ToLowerInvariant();
            if (pathValue != null)
            {
                // If it contains "/options", it's an options endpoint that needs authentication
                if (pathValue.Contains("/options"))
                {
                    return false;
                }
                
                // Check if it's a direct user management endpoint
                var segments = pathValue.Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (segments.Length == 2 && segments[0] == "api" && segments[1] == "users")
                {
                    // GET /api/users or POST /api/users
                    return true;
                }
                else if (segments.Length == 3 && segments[0] == "api" && segments[1] == "users")
                {
                    // GET /api/users/{id}, PUT /api/users/{id}, DELETE /api/users/{id}
                    return true;
                }
            }
        }

        return false;
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