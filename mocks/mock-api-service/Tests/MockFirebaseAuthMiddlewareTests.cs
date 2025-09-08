using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using MockApiService.Middleware;
using MockApiService.Models;
using MockApiService.Services;
using Xunit;

namespace MockApiService.Tests;

public class MockFirebaseAuthMiddlewareTests
{
    private readonly Mock<ITokenService> _mockTokenService;
    private readonly Mock<ILogger<MockFirebaseAuthMiddleware>> _mockLogger;
    private readonly Mock<RequestDelegate> _mockNext;
    private readonly MockFirebaseAuthMiddleware _middleware;

    public MockFirebaseAuthMiddlewareTests()
    {
        _mockTokenService = new Mock<ITokenService>();
        _mockLogger = new Mock<ILogger<MockFirebaseAuthMiddleware>>();
        _mockNext = new Mock<RequestDelegate>();
        _middleware = new MockFirebaseAuthMiddleware(_mockNext.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task InvokeAsync_WithValidToken_SetsUserContextAndCallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/users/test-user/options";
        context.Request.Headers.Authorization = "Bearer valid-token";

        var validationResult = new TokenValidationResult
        {
            IsValid = true,
            UserId = "test-user",
            Email = "test@example.com"
        };

        _mockTokenService.Setup(x => x.ValidateTokenAsync("valid-token"))
            .ReturnsAsync(validationResult);

        // Act
        await _middleware.InvokeAsync(context, _mockTokenService.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        Assert.Equal("test-user", context.Items["UserId"]);
        Assert.Equal("test@example.com", context.Items["UserEmail"]);
        Assert.True(context.User.Identity?.IsAuthenticated);
        Assert.Equal("test-user", context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
    }

    [Fact]
    public async Task InvokeAsync_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/users/test-user/options";
        context.Request.Headers.Authorization = "Bearer invalid-token";
        context.Response.Body = new MemoryStream();

        var validationResult = new TokenValidationResult
        {
            IsValid = false,
            ErrorMessage = "Token is invalid"
        };

        _mockTokenService.Setup(x => x.ValidateTokenAsync("invalid-token"))
            .ReturnsAsync(validationResult);

        // Act
        await _middleware.InvokeAsync(context, _mockTokenService.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Never);
        Assert.Equal(401, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WithMissingToken_ReturnsUnauthorized()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/users/test-user/options";
        context.Response.Body = new MemoryStream();

        // Act
        await _middleware.InvokeAsync(context, _mockTokenService.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Never);
        Assert.Equal(401, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WithSkippedPath_CallsNextWithoutAuthentication()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/health";

        // Act
        await _middleware.InvokeAsync(context, _mockTokenService.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockTokenService.Verify(x => x.ValidateTokenAsync(It.IsAny<string>()), Times.Never);
    }

    [Theory]
    [InlineData("/health")]
    [InlineData("/api/auth/login")]
    [InlineData("/api/auth/register")]
    [InlineData("/api/auth/refresh")]
    [InlineData("/swagger")]
    [InlineData("/favicon.ico")]
    public async Task InvokeAsync_WithSkippedPaths_CallsNextWithoutAuthentication(string path)
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = path;

        // Act
        await _middleware.InvokeAsync(context, _mockTokenService.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockTokenService.Verify(x => x.ValidateTokenAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_WithMalformedAuthHeader_ReturnsUnauthorized()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/users/test-user/options";
        context.Request.Headers.Authorization = "Basic invalid-header";
        context.Response.Body = new MemoryStream();

        // Act
        await _middleware.InvokeAsync(context, _mockTokenService.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Never);
        Assert.Equal(401, context.Response.StatusCode);
        _mockTokenService.Verify(x => x.ValidateTokenAsync(It.IsAny<string>()), Times.Never);
    }
}