using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using MockApiService.Controllers;
using MockApiService.Models;
using MockApiService.Services;
using Xunit;

namespace MockApiService.Tests;

public class UserManagementControllerTests
{
    private readonly Mock<IAuthService> _mockAuthService;
    private readonly Mock<IErrorSimulationService> _mockErrorSimulationService;
    private readonly Mock<ILogger<UserManagementController>> _mockLogger;
    private readonly UserManagementController _controller;

    public UserManagementControllerTests()
    {
        _mockAuthService = new Mock<IAuthService>();
        _mockErrorSimulationService = new Mock<IErrorSimulationService>();
        _mockLogger = new Mock<ILogger<UserManagementController>>();
        _controller = new UserManagementController(_mockAuthService.Object, _mockErrorSimulationService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetAllUsers_ReturnsOkWithUsers()
    {
        // Arrange
        var users = new List<MockUser>
        {
            new MockUser { Uid = "1", Email = "test1@example.com", DisplayName = "Test User 1" },
            new MockUser { Uid = "2", Email = "test2@example.com", DisplayName = "Test User 2" }
        };
        
        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.GetAllUsersAsync())
            .ReturnsAsync(users);

        // Act
        var result = await _controller.GetAllUsers();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedUsers = Assert.IsAssignableFrom<IEnumerable<MockUser>>(okResult.Value);
        Assert.Equal(2, returnedUsers.Count());
    }

    [Fact]
    public async Task GetUserById_WithValidId_ReturnsOkWithUser()
    {
        // Arrange
        var user = new MockUser { Uid = "1", Email = "test@example.com", DisplayName = "Test User" };
        
        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.GetUserByIdAsync("1"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.GetUserById("1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedUser = Assert.IsType<MockUser>(okResult.Value);
        Assert.Equal("1", returnedUser.Uid);
        Assert.Equal("test@example.com", returnedUser.Email);
    }

    [Fact]
    public async Task GetUserById_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.GetUserByIdAsync("invalid"))
            .ReturnsAsync((MockUser?)null);

        // Act
        var result = await _controller.GetUserById("invalid");

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(notFoundResult.Value);
        Assert.Equal("USER_NOT_FOUND", errorResponse.Error);
    }

    [Fact]
    public async Task CreateUser_WithValidRequest_ReturnsCreatedUser()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "newuser@example.com",
            Password = "password123",
            DisplayName = "New User"
        };
        
        var createdUser = new MockUser
        {
            Uid = "new-user-id",
            Email = request.Email,
            DisplayName = request.DisplayName,
            CreatedAt = DateTime.UtcNow,
            EmailVerified = true,
            IsTestUser = true
        };

        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.CreateUserAsync(request))
            .ReturnsAsync(createdUser);

        // Act
        var result = await _controller.CreateUser(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returnedUser = Assert.IsType<MockUser>(createdResult.Value);
        Assert.Equal("new-user-id", returnedUser.Uid);
        Assert.Equal("newuser@example.com", returnedUser.Email);
    }

    [Fact]
    public async Task CreateUser_WithExistingEmail_ReturnsConflict()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "existing@example.com",
            Password = "password123",
            DisplayName = "Existing User"
        };

        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.CreateUserAsync(request))
            .ReturnsAsync((MockUser?)null);

        // Act
        var result = await _controller.CreateUser(request);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(conflictResult.Value);
        Assert.Equal("EMAIL_EXISTS", errorResponse.Error);
    }

    [Fact]
    public async Task UpdateUser_WithValidRequest_ReturnsUpdatedUser()
    {
        // Arrange
        var request = new UpdateUserRequest
        {
            DisplayName = "Updated Name"
        };
        
        var updatedUser = new MockUser
        {
            Uid = "1",
            Email = "test@example.com",
            DisplayName = "Updated Name",
            CreatedAt = DateTime.UtcNow,
            EmailVerified = true,
            IsTestUser = true
        };

        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.UpdateUserAsync("1", request))
            .ReturnsAsync(updatedUser);

        // Act
        var result = await _controller.UpdateUser("1", request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedUser = Assert.IsType<MockUser>(okResult.Value);
        Assert.Equal("Updated Name", returnedUser.DisplayName);
    }

    [Fact]
    public async Task DeleteUser_WithValidId_ReturnsNoContent()
    {
        // Arrange
        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.DeleteUserAsync("1"))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteUser("1");

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteUser_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.DeleteUserAsync("invalid"))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteUser("invalid");

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var errorResponse = Assert.IsType<ErrorResponse>(notFoundResult.Value);
        Assert.Equal("USER_NOT_FOUND", errorResponse.Error);
    }
}