using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MockApiService.Controllers;
using MockApiService.Models;
using MockApiService.Services;
using Moq;
using Xunit;

namespace MockApiService.Tests;

public class ErrorSimulationControllerTests
{
    private readonly Mock<IErrorSimulationService> _mockErrorSimulationService;
    private readonly Mock<ILogger<ErrorSimulationController>> _mockLogger;
    private readonly ErrorSimulationController _controller;

    public ErrorSimulationControllerTests()
    {
        _mockErrorSimulationService = new Mock<IErrorSimulationService>();
        _mockLogger = new Mock<ILogger<ErrorSimulationController>>();
        _controller = new ErrorSimulationController(_mockErrorSimulationService.Object, _mockLogger.Object);
    }

    [Fact]
    public void EnableErrorSimulation_Success_ReturnsOk()
    {
        // Act
        var result = _controller.EnableErrorSimulation();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = okResult.Value;
        Assert.NotNull(response);
        
        _mockErrorSimulationService.Verify(x => x.SetErrorSimulationEnabled(true), Times.Once);
    }

    [Fact]
    public void EnableErrorSimulation_ServiceThrows_ReturnsInternalServerError()
    {
        // Arrange
        _mockErrorSimulationService.Setup(x => x.SetErrorSimulationEnabled(true))
            .Throws(new InvalidOperationException("Service error"));

        // Act
        var result = _controller.EnableErrorSimulation();

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
        
        var errorResponse = Assert.IsType<ErrorResponse>(statusResult.Value);
        Assert.Equal("INTERNAL_SERVER_ERROR", errorResponse.Error);
        Assert.Equal("Failed to enable error simulation", errorResponse.Message);
    }

    [Fact]
    public void DisableErrorSimulation_Success_ReturnsOk()
    {
        // Act
        var result = _controller.DisableErrorSimulation();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = okResult.Value;
        Assert.NotNull(response);
        
        _mockErrorSimulationService.Verify(x => x.SetErrorSimulationEnabled(false), Times.Once);
    }

    [Fact]
    public void DisableErrorSimulation_ServiceThrows_ReturnsInternalServerError()
    {
        // Arrange
        _mockErrorSimulationService.Setup(x => x.SetErrorSimulationEnabled(false))
            .Throws(new InvalidOperationException("Service error"));

        // Act
        var result = _controller.DisableErrorSimulation();

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
        
        var errorResponse = Assert.IsType<ErrorResponse>(statusResult.Value);
        Assert.Equal("INTERNAL_SERVER_ERROR", errorResponse.Error);
        Assert.Equal("Failed to disable error simulation", errorResponse.Message);
    }

    [Fact]
    public void ConfigureError_ValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new ConfigureErrorRequest
        {
            Endpoint = "/api/test",
            ErrorType = "TIMEOUT",
            DelayMs = 1000
        };

        // Act
        var result = _controller.ConfigureError(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = okResult.Value;
        Assert.NotNull(response);
        
        _mockErrorSimulationService.Verify(x => x.ConfigureError("/api/test", "TIMEOUT", 1000), Times.Once);
    }

    [Fact]
    public void ConfigureError_ServiceThrows_ReturnsInternalServerError()
    {
        // Arrange
        var request = new ConfigureErrorRequest
        {
            Endpoint = "/api/test",
            ErrorType = "TIMEOUT"
        };
        
        _mockErrorSimulationService.Setup(x => x.ConfigureError(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>()))
            .Throws(new InvalidOperationException("Service error"));

        // Act
        var result = _controller.ConfigureError(request);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
        
        var errorResponse = Assert.IsType<ErrorResponse>(statusResult.Value);
        Assert.Equal("INTERNAL_SERVER_ERROR", errorResponse.Error);
        Assert.Equal("Failed to configure error simulation", errorResponse.Message);
    }

    [Fact]
    public void ClearAllErrors_Success_ReturnsOk()
    {
        // Act
        var result = _controller.ClearAllErrors();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = okResult.Value;
        Assert.NotNull(response);
        
        _mockErrorSimulationService.Verify(x => x.ClearAllErrors(), Times.Once);
    }

    [Fact]
    public void ClearAllErrors_ServiceThrows_ReturnsInternalServerError()
    {
        // Arrange
        _mockErrorSimulationService.Setup(x => x.ClearAllErrors())
            .Throws(new InvalidOperationException("Service error"));

        // Act
        var result = _controller.ClearAllErrors();

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
        
        var errorResponse = Assert.IsType<ErrorResponse>(statusResult.Value);
        Assert.Equal("INTERNAL_SERVER_ERROR", errorResponse.Error);
        Assert.Equal("Failed to clear error configurations", errorResponse.Message);
    }

    [Theory]
    [InlineData("TIMEOUT")]
    [InlineData("AUTHENTICATION_ERROR")]
    [InlineData("VALIDATION_ERROR")]
    [InlineData("NOT_FOUND")]
    public void TriggerError_ValidErrorType_ThrowsException(string errorType)
    {
        // Act & Assert
        Assert.ThrowsAny<Exception>(() => _controller.TriggerError(errorType));
    }

    [Fact]
    public void TriggerError_InvalidErrorType_ReturnsBadRequest()
    {
        // Act
        var result = _controller.TriggerError("INVALID_TYPE");

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var errorResponse = Assert.IsType<ErrorResponse>(badRequestResult.Value);
        Assert.Equal("INVALID_ERROR_TYPE", errorResponse.Error);
        Assert.Contains("Unknown error type", errorResponse.Message);
    }
}