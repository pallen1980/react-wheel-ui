using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using MockApiService.Controllers;
using MockApiService.Models;
using MockApiService.Services;
using Xunit;

namespace MockApiService.Tests;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _mockAuthService;
    private readonly Mock<ITokenService> _mockTokenService;
    private readonly Mock<IErrorSimulationService> _mockErrorSimulationService;
    private readonly Mock<ILogger<AuthController>> _mockLogger;
    private readonly Mock<IWebHostEnvironment> _mockEnvironment;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockAuthService = new Mock<IAuthService>();
        _mockTokenService = new Mock<ITokenService>();
        _mockErrorSimulationService = new Mock<IErrorSimulationService>();
        _mockLogger = new Mock<ILogger<AuthController>>();
        _mockEnvironment = new Mock<IWebHostEnvironment>();
        
        // Default to development environment for tests
        _mockEnvironment.Setup(x => x.EnvironmentName).Returns("Development");
        
        _controller = new AuthController(_mockAuthService.Object, _mockTokenService.Object, _mockErrorSimulationService.Object, _mockLogger.Object, _mockEnvironment.Object);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkWithToken()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "test@example.com",
            Password = "password123"
        };

        var mockUser = new MockUser
        {
            Uid = "test-user-id",
            Email = "test@example.com",
            DisplayName = "Test User"
        };

        _mockAuthService.Setup(x => x.AuthenticateUserAsync(loginRequest.Email, loginRequest.Password))
            .ReturnsAsync(mockUser);
        _mockAuthService.Setup(x => x.CreateTokenAsync(mockUser.Uid, mockUser.Email))
            .ReturnsAsync("mock-access-token");
        _mockTokenService.Setup(x => x.GenerateRefreshToken(mockUser.Uid))
            .Returns("mock-refresh-token");

        // Act
        var result = await _controller.Login(loginRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<LoginResponse>(okResult.Value);
        
        Assert.Equal("mock-access-token", response.IdToken);
        Assert.Equal("mock-refresh-token", response.RefreshToken);
        Assert.Equal("test-user-id", response.LocalId);
        Assert.Equal("test@example.com", response.Email);
        Assert.Equal(3600, response.ExpiresIn);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "test@example.com",
            Password = "wrong-password"
        };

        _mockAuthService.Setup(x => x.AuthenticateUserAsync(loginRequest.Email, loginRequest.Password))
            .ReturnsAsync((MockUser?)null);

        // Act
        var result = await _controller.Login(loginRequest);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(unauthorizedResult.Value);
        
        Assert.Equal("INVALID_CREDENTIALS", errorResponse.Error);
        Assert.Equal("Invalid email or password", errorResponse.Message);
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsOkWithToken()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "newuser@example.com",
            Password = "password123",
            DisplayName = "New User"
        };

        var mockUser = new MockUser
        {
            Uid = "new-user-id",
            Email = "newuser@example.com",
            DisplayName = "New User"
        };

        _mockAuthService.Setup(x => x.RegisterUserAsync(registerRequest.Email, registerRequest.Password, registerRequest.DisplayName))
            .ReturnsAsync(mockUser);
        _mockAuthService.Setup(x => x.CreateTokenAsync(mockUser.Uid, mockUser.Email))
            .ReturnsAsync("mock-access-token");
        _mockTokenService.Setup(x => x.GenerateRefreshToken(mockUser.Uid))
            .Returns("mock-refresh-token");

        // Act
        var result = await _controller.Register(registerRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<LoginResponse>(okResult.Value);
        
        Assert.Equal("mock-access-token", response.IdToken);
        Assert.Equal("mock-refresh-token", response.RefreshToken);
        Assert.Equal("new-user-id", response.LocalId);
        Assert.Equal("newuser@example.com", response.Email);
        Assert.Equal(3600, response.ExpiresIn);
    }

    [Fact]
    public async Task Register_WithExistingEmail_ReturnsConflict()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "existing@example.com",
            Password = "password123",
            DisplayName = "Existing User"
        };

        _mockAuthService.Setup(x => x.RegisterUserAsync(registerRequest.Email, registerRequest.Password, registerRequest.DisplayName))
            .ReturnsAsync((MockUser?)null);

        // Act
        var result = await _controller.Register(registerRequest);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(conflictResult.Value);
        
        Assert.Equal("EMAIL_EXISTS", errorResponse.Error);
        Assert.Equal("An account with this email already exists", errorResponse.Message);
    }

    [Fact]
    public async Task RefreshToken_WithValidToken_ReturnsOkWithNewToken()
    {
        // Arrange
        var refreshRequest = new RefreshTokenRequest
        {
            RefreshToken = "valid-refresh-token"
        };

        var mockUser = new MockUser
        {
            Uid = "test-user-id",
            Email = "test@example.com",
            DisplayName = "Test User"
        };

        // Set up the Authorization header to simulate a current access token
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext()
        };
        _controller.Request.Headers.Authorization = "Bearer current-access-token";

        _mockTokenService.Setup(x => x.ExtractUserIdFromToken("current-access-token"))
            .Returns("test-user-id");
        _mockAuthService.Setup(x => x.ValidateTokenAsync("current-access-token"))
            .ReturnsAsync(mockUser);
        _mockTokenService.Setup(x => x.RefreshTokenAsync(refreshRequest.RefreshToken, mockUser.Uid, mockUser.Email))
            .ReturnsAsync((true, "new-access-token"));
        _mockTokenService.Setup(x => x.GenerateRefreshToken(mockUser.Uid))
            .Returns("new-refresh-token");

        // Act
        var result = await _controller.RefreshToken(refreshRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<LoginResponse>(okResult.Value);
        
        Assert.Equal("new-access-token", response.IdToken);
        Assert.Equal("new-refresh-token", response.RefreshToken);
        Assert.Equal("test-user-id", response.LocalId);
        Assert.Equal("test@example.com", response.Email);
        Assert.Equal(3600, response.ExpiresIn);
    }

    [Fact]
    public async Task RefreshToken_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var refreshRequest = new RefreshTokenRequest
        {
            RefreshToken = "invalid-refresh-token"
        };

        var mockUser = new MockUser
        {
            Uid = "test-user-id",
            Email = "test@example.com",
            DisplayName = "Test User"
        };

        // Set up the Authorization header to simulate a current access token
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext()
        };
        _controller.Request.Headers.Authorization = "Bearer current-access-token";

        _mockTokenService.Setup(x => x.ExtractUserIdFromToken("current-access-token"))
            .Returns("test-user-id");
        _mockAuthService.Setup(x => x.ValidateTokenAsync("current-access-token"))
            .ReturnsAsync(mockUser);
        _mockTokenService.Setup(x => x.RefreshTokenAsync(refreshRequest.RefreshToken, mockUser.Uid, mockUser.Email))
            .ReturnsAsync((false, null));

        // Act
        var result = await _controller.RefreshToken(refreshRequest);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(unauthorizedResult.Value);
        
        Assert.Equal("INVALID_REFRESH_TOKEN", errorResponse.Error);
        Assert.Equal("The refresh token is invalid or expired", errorResponse.Message);
    }

    [Fact]
    public async Task RefreshToken_WithMissingAccessToken_ReturnsBadRequest()
    {
        // Arrange
        var refreshRequest = new RefreshTokenRequest
        {
            RefreshToken = "valid-refresh-token"
        };

        // Set up the controller context without Authorization header
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext()
        };

        // Act
        var result = await _controller.RefreshToken(refreshRequest);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(badRequestResult.Value);
        
        Assert.Equal("MISSING_ACCESS_TOKEN", errorResponse.Error);
        Assert.Equal("Current access token is required for refresh", errorResponse.Message);
    }

    [Fact]
    public async Task ImpersonateUser_WithValidUserId_ReturnsOkWithToken()
    {
        // Arrange
        var impersonateRequest = new ImpersonateRequest
        {
            UserId = "target-user-id"
        };

        var mockUser = new MockUser
        {
            Uid = "target-user-id",
            Email = "target@example.com",
            DisplayName = "Target User"
        };

        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.GetUserByIdAsync("target-user-id"))
            .ReturnsAsync(mockUser);
        _mockAuthService.Setup(x => x.CreateTokenAsync(mockUser.Uid, mockUser.Email))
            .ReturnsAsync("impersonation-access-token");
        _mockTokenService.Setup(x => x.GenerateRefreshToken(mockUser.Uid))
            .Returns("impersonation-refresh-token");

        // Act
        var result = await _controller.ImpersonateUser(impersonateRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<LoginResponse>(okResult.Value);
        
        Assert.Equal("impersonation-access-token", response.IdToken);
        Assert.Equal("impersonation-refresh-token", response.RefreshToken);
        Assert.Equal("target-user-id", response.LocalId);
        Assert.Equal("target@example.com", response.Email);
        Assert.Equal(3600, response.ExpiresIn);
    }

    [Fact]
    public async Task ImpersonateUser_WithInvalidUserId_ReturnsNotFound()
    {
        // Arrange
        var impersonateRequest = new ImpersonateRequest
        {
            UserId = "invalid-user-id"
        };

        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.GetUserByIdAsync("invalid-user-id"))
            .ReturnsAsync((MockUser?)null);

        // Act
        var result = await _controller.ImpersonateUser(impersonateRequest);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(notFoundResult.Value);
        
        Assert.Equal("USER_NOT_FOUND", errorResponse.Error);
        Assert.Equal("User not found", errorResponse.Message);
    }

    [Fact]
    public async Task ImpersonateUser_WithEmptyUserId_ReturnsBadRequest()
    {
        // Arrange
        var impersonateRequest = new ImpersonateRequest
        {
            UserId = ""
        };

        _mockErrorSimulationService.Setup(x => x.ShouldSimulateErrorAsync(It.IsAny<string>()))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.ImpersonateUser(impersonateRequest);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(badRequestResult.Value);
        
        Assert.Equal("INVALID_USER_ID", errorResponse.Error);
        Assert.Equal("User ID is required for impersonation", errorResponse.Message);
    }

    [Fact]
    public async Task ImpersonateUser_InProductionEnvironment_ReturnsNotFound()
    {
        // Arrange
        var impersonateRequest = new ImpersonateRequest
        {
            UserId = "target-user-id"
        };

        // Set up production environment
        _mockEnvironment.Setup(x => x.EnvironmentName).Returns("Production");

        // Act
        var result = await _controller.ImpersonateUser(impersonateRequest);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(notFoundResult.Value);
        
        Assert.Equal("ENDPOINT_NOT_FOUND", errorResponse.Error);
        Assert.Equal("This endpoint is only available in development mode", errorResponse.Message);
    }
}