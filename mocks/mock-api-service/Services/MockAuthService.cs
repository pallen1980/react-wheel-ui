using MockApiService.Models;

namespace MockApiService.Services;

public class MockAuthService : IAuthService
{
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly List<MockUser> _mockUsers;

    public MockAuthService(ITokenService tokenService, IConfiguration configuration)
    {
        _tokenService = tokenService;
        _configuration = configuration;
        _mockUsers = LoadMockUsers();
    }

    public async Task<MockUser?> ValidateTokenAsync(string token)
    {
        var result = await _tokenService.ValidateTokenAsync(token);
        if (!result.IsValid || string.IsNullOrEmpty(result.UserId))
            return null;

        return _mockUsers.FirstOrDefault(u => u.Uid == result.UserId);
    }

    public async Task<bool> IsTokenValidForUserAsync(string token, string userId)
    {
        var result = await _tokenService.ValidateTokenAsync(token);
        return result.IsValid && result.UserId == userId;
    }

    public Task<string> CreateTokenAsync(string userId, string email)
    {
        return Task.FromResult(_tokenService.GenerateToken(userId, email));
    }

    public Task<MockUser?> AuthenticateUserAsync(string email, string password)
    {
        var user = _mockUsers.FirstOrDefault(u => u.Email == email);
        if (user != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return Task.FromResult<MockUser?>(user);
        }
        return Task.FromResult<MockUser?>(null);
    }

    public Task<MockUser?> RegisterUserAsync(string email, string password, string displayName)
    {
        if (_mockUsers.Any(u => u.Email == email))
            return Task.FromResult<MockUser?>(null);

        var newUser = new MockUser
        {
            Uid = Guid.NewGuid().ToString(),
            Email = email,
            DisplayName = displayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            CreatedAt = DateTime.UtcNow,
            EmailVerified = true
        };

        _mockUsers.Add(newUser);
        return Task.FromResult<MockUser?>(newUser);
    }

    private List<MockUser> LoadMockUsers()
    {
        var users = new List<MockUser>();
        var mockUsersConfig = _configuration.GetSection("MockUsers").Get<MockUserConfig[]>();
        
        if (mockUsersConfig != null)
        {
            foreach (var config in mockUsersConfig)
            {
                users.Add(new MockUser
                {
                    Uid = config.Uid,
                    Email = config.Email,
                    DisplayName = config.DisplayName,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(config.Password),
                    CreatedAt = DateTime.UtcNow,
                    EmailVerified = true
                });
            }
        }

        return users;
    }
}