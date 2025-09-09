using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using MockApiService.Controllers;
using MockApiService.Models;
using MockApiService.Services;
using System.Security.Claims;
using Xunit;

namespace MockApiService.Tests;

public class OptionsControllerTests
{
    private readonly Mock<IStorageService> _mockStorageService;
    private readonly Mock<IValidationService> _mockValidationService;
    private readonly Mock<IErrorSimulationService> _mockErrorSimulationService;
    private readonly Mock<ILogger<OptionsController>> _mockLogger;
    private readonly OptionsController _controller;

    public OptionsControllerTests()
    {
        _mockStorageService = new Mock<IStorageService>();
        _mockValidationService = new Mock<IValidationService>();
        _mockErrorSimulationService = new Mock<IErrorSimulationService>();
        _mockLogger = new Mock<ILogger<OptionsController>>();
        _controller = new OptionsController(_mockStorageService.Object, _mockValidationService.Object, _mockErrorSimulationService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetUserOptions_WithValidUserAndOptions_ReturnsOkWithOptions()
    {
        // Arrange
        var userId = "test-user-id";
        var options = new Option[]
        {
            new() { Key = "option1", Value = "Option 1", Sequence = 1 },
            new() { Key = "option2", Value = "Option 2", Sequence = 2 }
        };

        SetupAuthenticatedUser(userId);
        _mockStorageService.Setup(x => x.GetUserOptionsAsync(userId))
            .ReturnsAsync(options);

        // Act
        var result = await _controller.GetUserOptions(userId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<LoadOptionsResponse>(okResult.Value);
        Assert.Equal(2, response.Options.Length);
        Assert.Equal("option1", response.Options[0].Key);
        Assert.NotEmpty(response.LastModified);
    }

    [Fact]
    public async Task GetUserOptions_WithNoOptions_ReturnsNotFound()
    {
        // Arrange
        var userId = "test-user-id";

        SetupAuthenticatedUser(userId);
        _mockStorageService.Setup(x => x.GetUserOptionsAsync(userId))
            .ReturnsAsync((Option[]?)null);

        // Act
        var result = await _controller.GetUserOptions(userId);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(notFoundResult.Value);
        Assert.Equal("NOT_FOUND", errorResponse.Error);
        Assert.Contains("No options found", errorResponse.Message);
    }

    [Fact]
    public async Task GetUserOptions_WithUnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var requestedUserId = "other-user-id";
        var authenticatedUserId = "test-user-id";

        SetupAuthenticatedUser(authenticatedUserId);

        // Act
        var result = await _controller.GetUserOptions(requestedUserId);

        // Assert
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task SaveUserOptions_WithValidData_ReturnsOk()
    {
        // Arrange
        var userId = "test-user-id";
        var request = new SaveOptionsRequest
        {
            Options = new Option[]
            {
                new() { Key = "option1", Value = "Option 1", Sequence = 1 },
                new() { Key = "option2", Value = "Option 2", Sequence = 2 }
            }
        };

        SetupAuthenticatedUser(userId);
        _mockValidationService.Setup(x => x.ValidateOptions(request.Options))
            .Returns(new ValidationResult { IsValid = true });
        _mockStorageService.Setup(x => x.SaveUserOptionsAsync(userId, request.Options))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.SaveUserOptions(userId, request);

        // Assert
        Assert.IsType<OkResult>(result);
        _mockStorageService.Verify(x => x.SaveUserOptionsAsync(userId, request.Options), Times.Once);
    }

    [Fact]
    public async Task SaveUserOptions_WithUnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var requestedUserId = "other-user-id";
        var authenticatedUserId = "test-user-id";
        var request = new SaveOptionsRequest
        {
            Options = new Option[]
            {
                new() { Key = "option1", Value = "Option 1", Sequence = 1 }
            }
        };

        SetupAuthenticatedUser(authenticatedUserId);

        // Act
        var result = await _controller.SaveUserOptions(requestedUserId, request);

        // Assert
        Assert.IsType<ForbidResult>(result);
        _mockStorageService.Verify(x => x.SaveUserOptionsAsync(It.IsAny<string>(), It.IsAny<Option[]>()), Times.Never);
        _mockValidationService.Verify(x => x.ValidateOptions(It.IsAny<Option[]>()), Times.Never);
    }

    [Fact]
    public async Task SaveUserOptions_WithValidationError_ReturnsBadRequest()
    {
        // Arrange
        var userId = "test-user-id";
        var request = new SaveOptionsRequest
        {
            Options = new Option[]
            {
                new() { Key = "option1", Value = "Option 1", Sequence = 1 }
            }
        };

        SetupAuthenticatedUser(userId);
        _mockValidationService.Setup(x => x.ValidateOptions(request.Options))
            .Returns(new ValidationResult 
            { 
                IsValid = false, 
                ErrorMessage = "Duplicate key found",
                ErrorDetails = new { DuplicateKeys = new[] { "option1" } }
            });

        // Act
        var result = await _controller.SaveUserOptions(userId, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var errorResponse = Assert.IsType<ErrorResponse>(badRequestResult.Value);
        Assert.Equal("VALIDATION_ERROR", errorResponse.Error);
        Assert.Contains("Duplicate key found", errorResponse.Message);
        _mockStorageService.Verify(x => x.SaveUserOptionsAsync(It.IsAny<string>(), It.IsAny<Option[]>()), Times.Never);
    }

    [Fact]
    public async Task SaveUserOptions_WithEmptyOptions_ReturnsOk()
    {
        // Arrange
        var userId = "test-user-id";
        var request = new SaveOptionsRequest
        {
            Options = Array.Empty<Option>()
        };

        SetupAuthenticatedUser(userId);
        _mockValidationService.Setup(x => x.ValidateOptions(request.Options))
            .Returns(new ValidationResult { IsValid = true });
        _mockStorageService.Setup(x => x.SaveUserOptionsAsync(userId, request.Options))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.SaveUserOptions(userId, request);

        // Assert
        Assert.IsType<OkResult>(result);
        _mockStorageService.Verify(x => x.SaveUserOptionsAsync(userId, request.Options), Times.Once);
    }

    [Fact]
    public async Task SaveUserOptions_WithInvalidOptionData_ReturnsBadRequest()
    {
        // Arrange
        var userId = "test-user-id";
        var request = new SaveOptionsRequest
        {
            Options = new Option[]
            {
                new() { Key = "", Value = "Option 1", Sequence = 1 } // Invalid empty key
            }
        };

        SetupAuthenticatedUser(userId);
        _mockValidationService.Setup(x => x.ValidateOptions(request.Options))
            .Returns(new ValidationResult 
            { 
                IsValid = false, 
                ErrorMessage = "Option key is required and cannot be empty",
                ErrorDetails = new { Index = 0, Field = "key", Value = "" }
            });

        // Act
        var result = await _controller.SaveUserOptions(userId, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var errorResponse = Assert.IsType<ErrorResponse>(badRequestResult.Value);
        Assert.Equal("VALIDATION_ERROR", errorResponse.Error);
        Assert.Equal("Option key is required and cannot be empty", errorResponse.Message);
        Assert.NotNull(errorResponse.Details);
        _mockStorageService.Verify(x => x.SaveUserOptionsAsync(It.IsAny<string>(), It.IsAny<Option[]>()), Times.Never);
    }

    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new("user_id", userId)
        };

        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal,
                Items = { ["UserId"] = userId }
            }
        };
    }
}