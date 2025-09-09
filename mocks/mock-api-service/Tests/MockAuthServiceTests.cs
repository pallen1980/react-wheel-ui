using Microsoft.Extensions.Configuration;
using MockApiService.Models;
using MockApiService.Services;
using Moq;
using Xunit;

namespace MockApiService.Tests;

public class MockAuthServiceTests
{
    private readonly Mock<ITokenService> _mockTokenService;
    private readonly IConfiguration _configuration;
    private readonly MockAuthService _authService;

    public MockAuthServiceTests()
    {
        _mockTokenService = new Mock<ITokenService>();
        
        var configData = new Dictionary<string, string?>
        {
            ["MockUsers:0:Uid"] = "test-user-1",
            ["MockUsers:0:Email"] = "test@example.com",
            ["MockUsers:0:DisplayName"] = "Test User",
            ["MockUsers:0:Password"] = "password123",
            ["MockUsers:1:Uid"] = "test-user-2",
            ["MockUsers:1:Email"] = "demo@example.com",
            ["MockUsers:1:DisplayName"] = "Demo User",
            ["MockUsers:1:Password"] = "demo123"
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        _authService = new MockAuthService(_mockTokenService.Object, _configuration);
    }

    [Fact]
    public async Task ValidateTokenAsync_WithValidToken_ReturnsUser()
    {
        // Arrange
        var token = "valid-token";
        var userId = "test-user-1";
        var validationResult = new TokenValidationResult
        {
            IsValid = true,
            UserId = userId,
            Email = "test@example.com"
        };

        _mockTokenService.Setup(x => x.ValidateTokenAsync(token))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _authService.ValidateTokenAsync(token);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Uid);
        Assert.Equal("test@example.com", result.Email);
        Assert.Equal("Test User", result.DisplayName);
    }

    [Fact]
    public async Task ValidateTokenAsync_WithInvalidToken_ReturnsNull()
    {
        // Arrange
        var token = "invalid-token";
        var validationResult = new TokenValidationResult
        {
            IsValid = false,
            ErrorMessage = "Token is invalid"
        };

        _mockTokenService.Setup(x => x.ValidateTokenAsync(token))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _authService.ValidateTokenAsync(token);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateTokenAsync_WithValidTokenButNonExistentUser_ReturnsNull()
    {
        // Arrange
        var token = "valid-token";
        var validationResult = new TokenValidationResult
        {
            IsValid = true,
            UserId = "non-existent-user",
            Email = "nonexistent@example.com"
        };

        _mockTokenService.Setup(x => x.ValidateTokenAsync(token))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _authService.ValidateTokenAsync(token);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateTokenAsync_WithValidTokenButEmptyUserId_ReturnsNull()
    {
        // Arrange
        var token = "valid-token";
        var validationResult = new TokenValidationResult
        {
            IsValid = true,
            UserId = "",
            Email = "test@example.com"
        };

        _mockTokenService.Setup(x => x.ValidateTokenAsync(token))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _authService.ValidateTokenAsync(token);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task IsTokenValidForUserAsync_WithValidTokenAndMatchingUserId_ReturnsTrue()
    {
        // Arrange
        var token = "valid-token";
        var userId = "test-user-1";
        var validationResult = new TokenValidationResult
        {
            IsValid = true,
            UserId = userId,
            Email = "test@example.com"
        };

        _mockTokenService.Setup(x => x.ValidateTokenAsync(token))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _authService.IsTokenValidForUserAsync(token, userId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task IsTokenValidForUserAsync_WithValidTokenButDifferentUserId_ReturnsFalse()
    {
        // Arrange
        var token = "valid-token";
        var tokenUserId = "test-user-1";
        var requestedUserId = "test-user-2";
        var validationResult = new TokenValidationResult
        {
            IsValid = true,
            UserId = tokenUserId,
            Email = "test@example.com"
        };

        _mockTokenService.Setup(x => x.ValidateTokenAsync(token))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _authService.IsTokenValidForUserAsync(token, requestedUserId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsTokenValidForUserAsync_WithInvalidToken_ReturnsFalse()
    {
        // Arrange
        var token = "invalid-token";
        var userId = "test-user-1";
        var validationResult = new TokenValidationResult
        {
            IsValid = false,
            ErrorMessage = "Token is invalid"
        };

        _mockTokenService.Setup(x => x.ValidateTokenAsync(token))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _authService.IsTokenValidForUserAsync(token, userId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task CreateTokenAsync_WithValidParameters_ReturnsToken()
    {
        // Arrange
        var userId = "test-user-1";
        var email = "test@example.com";
        var expectedToken = "generated-token";

        _mockTokenService.Setup(x => x.GenerateToken(userId, email, null))
            .Returns(expectedToken);

        // Act
        var result = await _authService.CreateTokenAsync(userId, email);

        // Assert
        Assert.Equal(expectedToken, result);
        _mockTokenService.Verify(x => x.GenerateToken(userId, email, null), Times.Once);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithValidCredentials_ReturnsUser()
    {
        // Arrange
        var email = "test@example.com";
        var password = "password123";

        // Act
        var result = await _authService.AuthenticateUserAsync(email, password);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test-user-1", result.Uid);
        Assert.Equal(email, result.Email);
        Assert.Equal("Test User", result.DisplayName);
        Assert.True(result.EmailVerified);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithInvalidEmail_ReturnsNull()
    {
        // Arrange
        var email = "nonexistent@example.com";
        var password = "password123";

        // Act
        var result = await _authService.AuthenticateUserAsync(email, password);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithInvalidPassword_ReturnsNull()
    {
        // Arrange
        var email = "test@example.com";
        var password = "wrongpassword";

        // Act
        var result = await _authService.AuthenticateUserAsync(email, password);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithEmptyEmail_ReturnsNull()
    {
        // Arrange
        var email = "";
        var password = "password123";

        // Act
        var result = await _authService.AuthenticateUserAsync(email, password);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithEmptyPassword_ReturnsNull()
    {
        // Arrange
        var email = "test@example.com";
        var password = "";

        // Act
        var result = await _authService.AuthenticateUserAsync(email, password);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task RegisterUserAsync_WithValidData_ReturnsNewUser()
    {
        // Arrange
        var email = "newuser@example.com";
        var password = "newpassword123";
        var displayName = "New User";

        // Act
        var result = await _authService.RegisterUserAsync(email, password, displayName);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Uid);
        Assert.Equal(email, result.Email);
        Assert.Equal(displayName, result.DisplayName);
        Assert.True(result.EmailVerified);
        Assert.True(result.CreatedAt <= DateTime.UtcNow);
        Assert.NotEmpty(result.PasswordHash);
        
        // Verify password is hashed correctly
        Assert.True(BCrypt.Net.BCrypt.Verify(password, result.PasswordHash));
    }

    [Fact]
    public async Task RegisterUserAsync_WithExistingEmail_ReturnsNull()
    {
        // Arrange
        var email = "test@example.com"; // This email already exists in mock users
        var password = "newpassword123";
        var displayName = "New User";

        // Act
        var result = await _authService.RegisterUserAsync(email, password, displayName);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task RegisterUserAsync_ThenAuthenticate_ShouldWork()
    {
        // Arrange
        var email = "newuser@example.com";
        var password = "newpassword123";
        var displayName = "New User";

        // Act - Register user
        var registeredUser = await _authService.RegisterUserAsync(email, password, displayName);
        
        // Act - Authenticate with the same credentials
        var authenticatedUser = await _authService.AuthenticateUserAsync(email, password);

        // Assert
        Assert.NotNull(registeredUser);
        Assert.NotNull(authenticatedUser);
        Assert.Equal(registeredUser.Uid, authenticatedUser.Uid);
        Assert.Equal(registeredUser.Email, authenticatedUser.Email);
        Assert.Equal(registeredUser.DisplayName, authenticatedUser.DisplayName);
    }

    [Fact]
    public async Task RegisterUserAsync_MultipleUsers_ShouldHaveUniqueIds()
    {
        // Arrange
        var email1 = "user1@example.com";
        var email2 = "user2@example.com";
        var password = "password123";
        var displayName = "Test User";

        // Act
        var user1 = await _authService.RegisterUserAsync(email1, password, displayName);
        var user2 = await _authService.RegisterUserAsync(email2, password, displayName);

        // Assert
        Assert.NotNull(user1);
        Assert.NotNull(user2);
        Assert.NotEqual(user1.Uid, user2.Uid);
        Assert.NotEqual(user1.Email, user2.Email);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithSecondMockUser_ReturnsCorrectUser()
    {
        // Arrange
        var email = "demo@example.com";
        var password = "demo123";

        // Act
        var result = await _authService.AuthenticateUserAsync(email, password);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test-user-2", result.Uid);
        Assert.Equal(email, result.Email);
        Assert.Equal("Demo User", result.DisplayName);
        Assert.True(result.EmailVerified);
    }

    [Fact]
    public async Task AuthenticateUserAsync_CaseInsensitiveEmail_ReturnsNull()
    {
        // Arrange - Email case should be exact match
        var email = "TEST@EXAMPLE.COM";
        var password = "password123";

        // Act
        var result = await _authService.AuthenticateUserAsync(email, password);

        // Assert
        Assert.Null(result); // Should be null because email case doesn't match
    }
}