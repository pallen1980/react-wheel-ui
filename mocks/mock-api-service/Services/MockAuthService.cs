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

    // User Management Operations
    public Task<IEnumerable<MockUser>> GetAllUsersAsync()
    {
        return Task.FromResult<IEnumerable<MockUser>>(_mockUsers);
    }

    public Task<MockUser?> GetUserByIdAsync(string userId)
    {
        var user = _mockUsers.FirstOrDefault(u => u.Uid == userId);
        return Task.FromResult(user);
    }

    public Task<MockUser?> CreateUserAsync(CreateUserRequest request)
    {
        if (_mockUsers.Any(u => u.Email == request.Email))
            return Task.FromResult<MockUser?>(null);

        var newUser = new MockUser
        {
            Uid = Guid.NewGuid().ToString(),
            Email = request.Email,
            DisplayName = request.DisplayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow,
            EmailVerified = true,
            IsTestUser = true
        };

        _mockUsers.Add(newUser);
        return Task.FromResult<MockUser?>(newUser);
    }

    public Task<MockUser?> UpdateUserAsync(string userId, UpdateUserRequest request)
    {
        var user = _mockUsers.FirstOrDefault(u => u.Uid == userId);
        if (user == null)
            return Task.FromResult<MockUser?>(null);

        // Check if email is being changed and if it already exists
        if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
        {
            if (_mockUsers.Any(u => u.Email == request.Email && u.Uid != userId))
                return Task.FromResult<MockUser?>(null);
            user.Email = request.Email;
        }

        if (!string.IsNullOrEmpty(request.DisplayName))
            user.DisplayName = request.DisplayName;

        if (!string.IsNullOrEmpty(request.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        return Task.FromResult<MockUser?>(user);
    }

    public Task<bool> DeleteUserAsync(string userId)
    {
        var user = _mockUsers.FirstOrDefault(u => u.Uid == userId);
        if (user == null)
            return Task.FromResult(false);

        _mockUsers.Remove(user);
        return Task.FromResult(true);
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
                    EmailVerified = true,
                    IsTestUser = true
                });
            }
        }

        return users;
    }
}