using Microsoft.Extensions.Logging;
using MockApiService.Exceptions;
using MockApiService.Services;
using Moq;
using Xunit;

namespace MockApiService.Tests;

public class ErrorSimulationServiceTests
{
    private readonly Mock<ILogger<ErrorSimulationService>> _mockLogger;
    private readonly ErrorSimulationService _service;

    public ErrorSimulationServiceTests()
    {
        _mockLogger = new Mock<ILogger<ErrorSimulationService>>();
        _service = new ErrorSimulationService(_mockLogger.Object);
    }

    [Fact]
    public async Task ShouldSimulateErrorAsync_WhenDisabled_ReturnsFalse()
    {
        // Arrange
        _service.SetErrorSimulationEnabled(false);
        _service.ConfigureError("/test", "TIMEOUT");

        // Act
        var result = await _service.ShouldSimulateErrorAsync("/test");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task ShouldSimulateErrorAsync_WhenEnabledAndConfigured_ReturnsTrue()
    {
        // Arrange
        _service.SetErrorSimulationEnabled(true);
        _service.ConfigureError("/test", "TIMEOUT");

        // Act
        var result = await _service.ShouldSimulateErrorAsync("/test");

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task ShouldSimulateErrorAsync_WhenEnabledButNotConfigured_ReturnsFalse()
    {
        // Arrange
        _service.SetErrorSimulationEnabled(true);

        // Act
        var result = await _service.ShouldSimulateErrorAsync("/test");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task GetConfiguredErrorAsync_WhenConfigured_ReturnsErrorDetails()
    {
        // Arrange
        _service.SetErrorSimulationEnabled(true);
        _service.ConfigureError("/test", "TIMEOUT", 1000);

        // Act
        var (errorType, delayMs) = await _service.GetConfiguredErrorAsync("/test");

        // Assert
        Assert.Equal("TIMEOUT", errorType);
        Assert.Equal(1000, delayMs);
    }

    [Fact]
    public async Task GetConfiguredErrorAsync_WhenNotConfigured_ReturnsNull()
    {
        // Arrange
        _service.SetErrorSimulationEnabled(true);

        // Act
        var (errorType, delayMs) = await _service.GetConfiguredErrorAsync("/test");

        // Assert
        Assert.Null(errorType);
        Assert.Null(delayMs);
    }

    [Fact]
    public async Task ClearAllErrors_RemovesAllConfigurations()
    {
        // Arrange
        _service.SetErrorSimulationEnabled(true);
        _service.ConfigureError("/test1", "TIMEOUT");
        _service.ConfigureError("/test2", "VALIDATION_ERROR");

        // Act
        _service.ClearAllErrors();

        // Assert
        Assert.False(await _service.ShouldSimulateErrorAsync("/test1"));
        Assert.False(await _service.ShouldSimulateErrorAsync("/test2"));
    }

    [Fact]
    public async Task SimulateNetworkDelayAsync_WithPositiveDelay_CompletesAfterDelay()
    {
        // Arrange
        var delayMs = 100;
        var startTime = DateTime.UtcNow;

        // Act
        await _service.SimulateNetworkDelayAsync(delayMs);

        // Assert
        var elapsed = DateTime.UtcNow - startTime;
        Assert.True(elapsed.TotalMilliseconds >= delayMs - 50); // Allow some tolerance
    }

    [Fact]
    public async Task SimulateNetworkDelayAsync_WithZeroDelay_CompletesImmediately()
    {
        // Arrange
        var startTime = DateTime.UtcNow;

        // Act
        await _service.SimulateNetworkDelayAsync(0);

        // Assert
        var elapsed = DateTime.UtcNow - startTime;
        Assert.True(elapsed.TotalMilliseconds < 50); // Should complete very quickly
    }

    [Theory]
    [InlineData("TIMEOUT", typeof(TimeoutException))]
    [InlineData("AUTHENTICATION_ERROR", typeof(AuthenticationException))]
    [InlineData("AUTHORIZATION_ERROR", typeof(AuthorizationException))]
    [InlineData("VALIDATION_ERROR", typeof(ValidationException))]
    [InlineData("NOT_FOUND", typeof(ResourceNotFoundException))]
    [InlineData("CONFLICT", typeof(ResourceConflictException))]
    [InlineData("RATE_LIMIT", typeof(RateLimitException))]
    [InlineData("SERVICE_UNAVAILABLE", typeof(ServiceUnavailableException))]
    [InlineData("INTERNAL_SERVER_ERROR", typeof(InvalidOperationException))]
    public void CreateExceptionForErrorType_WithValidErrorType_ReturnsCorrectException(string errorType, Type expectedExceptionType)
    {
        // Act
        var exception = ErrorSimulationService.CreateExceptionForErrorType(errorType);

        // Assert
        Assert.IsType(expectedExceptionType, exception);
    }

    [Fact]
    public void CreateExceptionForErrorType_WithInvalidErrorType_ReturnsInvalidOperationException()
    {
        // Act
        var exception = ErrorSimulationService.CreateExceptionForErrorType("INVALID_TYPE");
        
        // Assert
        Assert.IsType<InvalidOperationException>(exception);
        Assert.Contains("Unknown error type", exception.Message);
    }

    [Fact]
    public void CreateExceptionForErrorType_WithRateLimit_ReturnsRateLimitExceptionWithRetryAfter()
    {
        // Act
        var exception = ErrorSimulationService.CreateExceptionForErrorType("RATE_LIMIT");

        // Assert
        var rateLimitException = Assert.IsType<RateLimitException>(exception);
        Assert.Equal(TimeSpan.FromMinutes(1), rateLimitException.RetryAfter);
    }

    [Fact]
    public void SetErrorSimulationEnabled_LogsCorrectMessage()
    {
        // Act
        _service.SetErrorSimulationEnabled(true);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error simulation enabled")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ConfigureError_LogsCorrectMessage()
    {
        // Act
        _service.ConfigureError("/test", "TIMEOUT", 1000);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Configured error TIMEOUT for endpoint /test")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}