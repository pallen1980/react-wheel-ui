using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using MockApiService.Exceptions;
using MockApiService.Middleware;
using MockApiService.Models;
using Moq;
using Xunit;

namespace MockApiService.Tests;

public class GlobalExceptionHandlingMiddlewareTests
{
    private readonly Mock<ILogger<GlobalExceptionHandlingMiddleware>> _mockLogger;
    private readonly GlobalExceptionHandlingMiddleware _middleware;

    public GlobalExceptionHandlingMiddlewareTests()
    {
        _mockLogger = new Mock<ILogger<GlobalExceptionHandlingMiddleware>>();
        _middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new NotImplementedException("Test exception"),
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task InvokeAsync_WithAuthenticationException_ReturnsUnauthorized()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new AuthenticationException("Invalid credentials"),
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(401, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("AUTHENTICATION_ERROR", errorResponse.Error);
        Assert.Equal("Invalid credentials", errorResponse.Message);
    }

    [Fact]
    public async Task InvokeAsync_WithAuthorizationException_ReturnsForbidden()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new AuthorizationException("Access denied"),
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(403, context.Response.StatusCode);
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("AUTHORIZATION_ERROR", errorResponse.Error);
        Assert.Equal("Access denied", errorResponse.Message);
    }

    [Fact]
    public async Task InvokeAsync_WithValidationException_ReturnsBadRequest()
    {
        // Arrange
        var context = CreateHttpContext();
        var validationDetails = new { field = "email", message = "Invalid format" };
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new ValidationException("Validation failed", validationDetails),
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(400, context.Response.StatusCode);
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("VALIDATION_ERROR", errorResponse.Error);
        Assert.Equal("Validation failed", errorResponse.Message);
        Assert.NotNull(errorResponse.Details);
    }

    [Fact]
    public async Task InvokeAsync_WithResourceNotFoundException_ReturnsNotFound()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new ResourceNotFoundException("User not found"),
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(404, context.Response.StatusCode);
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("NOT_FOUND", errorResponse.Error);
        Assert.Equal("User not found", errorResponse.Message);
    }

    [Fact]
    public async Task InvokeAsync_WithResourceConflictException_ReturnsConflict()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new ResourceConflictException("Email already exists"),
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(409, context.Response.StatusCode);
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("CONFLICT", errorResponse.Error);
        Assert.Equal("Email already exists", errorResponse.Message);
    }

    [Fact]
    public async Task InvokeAsync_WithRateLimitException_ReturnsTooManyRequests()
    {
        // Arrange
        var context = CreateHttpContext();
        var retryAfter = TimeSpan.FromMinutes(5);
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new RateLimitException("Rate limit exceeded", retryAfter),
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(429, context.Response.StatusCode);
        Assert.True(context.Response.Headers.ContainsKey("Retry-After"));
        Assert.Equal("300", context.Response.Headers["Retry-After"].ToString());
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("RATE_LIMIT_EXCEEDED", errorResponse.Error);
        Assert.Equal("Rate limit exceeded", errorResponse.Message);
    }

    [Fact]
    public async Task InvokeAsync_WithServiceUnavailableException_ReturnsServiceUnavailable()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new ServiceUnavailableException("Service temporarily unavailable"),
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(503, context.Response.StatusCode);
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("SERVICE_UNAVAILABLE", errorResponse.Error);
        Assert.Equal("Service temporarily unavailable", errorResponse.Message);
    }

    [Fact]
    public async Task InvokeAsync_WithArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new ArgumentException("Invalid parameter", "userId"),
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(400, context.Response.StatusCode);
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("VALIDATION_ERROR", errorResponse.Error);
        Assert.Contains("Invalid parameter", errorResponse.Message);
    }

    [Fact]
    public async Task InvokeAsync_WithTimeoutException_ReturnsRequestTimeout()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => throw new TimeoutException("Operation timed out"),
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(408, context.Response.StatusCode);
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("TIMEOUT", errorResponse.Error);
        Assert.Equal("The operation timed out", errorResponse.Message);
    }

    [Fact]
    public async Task InvokeAsync_WithUnhandledException_ReturnsInternalServerError()
    {
        // Arrange
        var context = CreateHttpContext();

        // Act
        await _middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(500, context.Response.StatusCode);
        
        var responseBody = GetResponseBody(context);
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Assert.NotNull(errorResponse);
        Assert.Equal("INTERNAL_SERVER_ERROR", errorResponse.Error);
        Assert.Equal("An unexpected error occurred", errorResponse.Message);
    }

    [Fact]
    public async Task InvokeAsync_WithSuccessfulRequest_DoesNotModifyResponse()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new GlobalExceptionHandlingMiddleware(
            next: (context) => {
                context.Response.StatusCode = 200;
                return Task.CompletedTask;
            },
            _mockLogger.Object
        );

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(200, context.Response.StatusCode);
    }

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static string GetResponseBody(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        return reader.ReadToEnd();
    }
}